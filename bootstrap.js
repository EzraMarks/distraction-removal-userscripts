// TEMPORARY DEBUG VERSION — proves user scripts run at all.
// Copy this entire file into Hermit's user-script slot, replacing whatever's there.
// If user scripts work, you'll see: an alert popup, a hot-pink page, and a green banner.
// Once confirmed, we'll restore the real bootstrap.

(() => {
  document.documentElement.style.setProperty('background', 'hotpink', 'important');

  const banner = document.createElement('div');
  banner.textContent = '🟢 USER SCRIPT IS RUNNING 🟢';
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 2147483647;
    background: black; color: lime;
    font: bold 24px monospace;
    padding: 20px; text-align: center;
    border-bottom: 4px solid lime;
  `;
  const attach = () => (document.body || document.documentElement).appendChild(banner);
  if (document.body) attach();
  else document.addEventListener('DOMContentLoaded', attach);

  alert('User script ran ✓');
})();
