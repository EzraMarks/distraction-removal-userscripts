// TEMPORARY DEBUG VERSION — keeps re-applying so it survives SPA renders.
// Replace your Hermit user script with this entire file's contents.

(() => {
  const BANNER_ID = '__tweaks_debug_banner';

  function apply() {
    // Force pink on every element that exists.
    if (document.documentElement) {
      document.documentElement.style.setProperty('background', 'hotpink', 'important');
    }
    if (document.body) {
      document.body.style.setProperty('background', 'hotpink', 'important');
    }

    // (Re-)attach banner if missing.
    if (document.body && !document.getElementById(BANNER_ID)) {
      const banner = document.createElement('div');
      banner.id = BANNER_ID;
      banner.textContent = '🟢 USER SCRIPT IS RUNNING — tick: ' + Date.now();
      banner.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0;
        z-index: 2147483647;
        background: black; color: lime;
        font: bold 20px monospace;
        padding: 16px; text-align: center;
        border-bottom: 4px solid lime;
        pointer-events: none;
      `;
      document.body.appendChild(banner);
    } else if (document.getElementById(BANNER_ID)) {
      document.getElementById(BANNER_ID).textContent =
        '🟢 USER SCRIPT IS RUNNING — tick: ' + Date.now();
    }
  }

  // Try immediately.
  apply();
  // Try when DOM is ready.
  document.addEventListener('DOMContentLoaded', apply);
  window.addEventListener('load', apply);
  // Keep trying — survives SPA rerenders. The ticking timestamp also proves
  // the script is *still* alive, not just a snapshot.
  setInterval(apply, 500);

  // Also log to console so we have a third signal.
  console.log('[tweaks-debug] script loaded at', new Date().toISOString());
})();
