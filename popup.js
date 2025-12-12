document.getElementById('extract').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0].url.includes('facebook.com')) {
      // Get cookies for facebook.com
      chrome.cookies.getAll({domain: "facebook.com"}, function(cookies) {
        let cookieStr = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        // Execute script in the active tab to fetch and extract token
        chrome.tabs.executeScript(tabs[0].id, {code: `
          fetch('https://business.facebook.com/business_locations', {
            credentials: 'include',
            headers: {
              'user-agent': 'Mozilla/5.0 (Linux; Android 10; Wildfire E Lite Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/105.0.5195.136 Mobile Safari/537.36[FBAN/EMA;FBLC/en_US;FBAV/298.0.0.10.115;]',
              'referer': 'https://www.facebook.com/',
              'host': 'business.facebook.com',
              'origin': 'https://business.facebook.com',
              'upgrade-insecure-requests': '1',
              'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
              'cache-control': 'max-age=0',
              'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
              'content-type': 'text/html; charset=utf-8'
            }
          }).then(r => r.text()).then(text => {
            let match = text.match(/(EAAG\\w+)/);
            let token = match ? match[1] : 'Token not found';
            chrome.runtime.sendMessage({token: token, cookies: '${cookieStr.replace(/'/g, "\\'")}'});
          }).catch(e => {
            chrome.runtime.sendMessage({token: 'Error fetching token: ' + e, cookies: '${cookieStr.replace(/'/g, "\\'")}'});
          });
        `});
      });
    } else {
      document.getElementById('output').innerText = 'Please navigate to Facebook and log in first.';
    }
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  document.getElementById('output').innerHTML = `
    <p><strong>Cookies:</strong> ${request.cookies}</p>
    <p><strong>Token:</strong> ${request.token}</p>
    <p>Copy and paste into your Python script.</p>
  `;
});