// ==UserScript==
// @name     bootstrap
// @version  1.0
// ==/UserScript==

// Paste this entire file (header included!) into each Hermit Lite App's user-script
// slot. The script's name in Hermit MUST end in `.user.js` — otherwise Hermit
// silently rejects it.
//
// This bootstrap derives the site name from the hostname and fetches matching
// CSS + JS from this repo on every page load. To add a new site, just add
// `<name>.css` and/or `<name>.js` to the repo — no bootstrap change needed.

(async () => {
  const host = location.hostname.replace(/^(www|m|mobile)\./, '');
  const parts = host.split('.');
  if (parts.length < 2) return;
  const name = parts[parts.length - 2];

  const BASE = `https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/${name}`;
  const bust = '?v=' + Date.now();

  const fetchText = (url) =>
    fetch(url).then(r => (r.ok ? r.text() : '')).catch(() => '');

  const [css, js] = await Promise.all([
    fetchText(BASE + '.css' + bust),
    fetchText(BASE + '.js' + bust),
  ]);

  if (css) {
    const style = document.createElement('style');
    style.dataset.source = 'personal-app-tweaks';
    style.textContent = css;
    document.documentElement.appendChild(style);
  }
  if (js) {
    try { new Function(js)(); }
    catch (e) { console.error('[personal-app-tweaks] js error', e); }
  }
})();
