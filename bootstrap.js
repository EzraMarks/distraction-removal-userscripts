// Paste this once into each Hermit Lite App's user script slot.
// It auto-loads the right CSS + JS for whichever site you're on from this repo.
// Edit the .css / .js files in the repo to change behavior; reload the page in Hermit to see updates.

(async () => {
  const SITES = {
    'linkedin.com': 'linkedin',
    'instagram.com': 'instagram',
  };

  const host = location.hostname.replace(/^(www|m)\./, '');
  const key = Object.keys(SITES).find(d => host === d || host.endsWith('.' + d));
  if (!key) return;
  const name = SITES[key];

  const BASE = `https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/${name}`;
  const bust = '?v=' + Date.now();

  try {
    const [css, js] = await Promise.all([
      fetch(BASE + '.css' + bust).then(r => r.ok ? r.text() : ''),
      fetch(BASE + '.js' + bust).then(r => r.ok ? r.text() : ''),
    ]);
    if (css) {
      const style = document.createElement('style');
      style.dataset.source = 'personal-app-tweaks';
      style.textContent = css;
      document.documentElement.appendChild(style);
    }
    if (js) new Function(js)();
  } catch (e) {
    console.error('[personal-app-tweaks] failed to load', e);
  }
})();
