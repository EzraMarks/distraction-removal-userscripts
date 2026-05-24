// ==UserScript==
// @name     bootstrap
// @version  1.0
// ==/UserScript==
(function() {

  // Version marker — bump this every commit so we can confirm the latest
  // version is actually loaded in Hermit when iterating.
  const VERSION = 'v2';

  alert(VERSION + ': script started, host=' + location.hostname);

  const host = location.hostname.replace(/^(www|m|mobile)\./, '');
  const parts = host.split('.');
  const name = parts.length >= 2 ? parts[parts.length - 2] : '';
  const BASE = 'https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/' + name;
  const bust = '?v=' + Date.now();

  fetch(BASE + '.css' + bust)
    .then(function(r) { return r.ok ? r.text() : ''; })
    .then(function(css) {
      alert(VERSION + ': css fetch returned length=' + css.length);
      if (css) {
        var style = document.createElement('style');
        style.textContent = css;
        document.documentElement.appendChild(style);
        alert(VERSION + ': css applied');
      }
    })
    .catch(function(e) { alert(VERSION + ': css fetch ERROR: ' + e.message); });

})();
