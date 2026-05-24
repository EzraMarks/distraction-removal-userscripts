// ==UserScript==
// @name Personal App Tweaks
// ==/UserScript==

// Paste this entire file (including the header above!) into Hermit's user-script
// slot for each Lite App. Hermit silently ignores scripts without the
// ==UserScript== metadata header — that's a hard requirement.
//
// This bootstrap derives the site name from the hostname and loads matching
// CSS + JS from this repo on every page load.

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
