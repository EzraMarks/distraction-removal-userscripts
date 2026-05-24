// ==UserScript==
// @name     bootstrap
// @version  1.0
// ==/UserScript==
(function() {

  const VERSION = 'v3';
  alert(VERSION + ': script started, host=' + location.hostname);

  const targets = [
    ['github-raw', 'https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/linkedin.css'],
    ['jsdelivr',   'https://cdn.jsdelivr.net/gh/EzraMarks/personal-app-tweaks@main/linkedin.css'],
    ['same-origin', location.origin + '/favicon.ico'],
  ];

  targets.forEach(function(t) {
    var label = t[0], url = t[1];
    fetch(url + '?bust=' + Date.now())
      .then(function(r) {
        alert(VERSION + ': ' + label + ' OK status=' + r.status);
      })
      .catch(function(e) {
        alert(VERSION + ': ' + label + ' FAIL: ' + e.message);
      });
  });

})();
