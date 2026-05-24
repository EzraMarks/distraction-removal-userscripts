// Paste this once into each Hermit Lite App's user script slot. Never edit again.
// It derives the site name from the hostname and loads the matching CSS + JS
// from this repo. To add a new site, just add `<name>.css` and/or `<name>.js`
// to the repo — no bootstrap change needed.
//
// Mapping rule: strip leading www./m., then take the second-level domain.
//   www.linkedin.com   -> linkedin
//   m.instagram.com    -> instagram
//   news.ycombinator.com -> ycombinator

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
