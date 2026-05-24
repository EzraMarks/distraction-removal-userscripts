// LinkedIn: allowlist-by-redirect.
// Anything outside messaging, search, and individual profile pages
// gets bounced back to messaging. The feed, jobs, notifications, and
// the post composer are unreachable by URL.

(() => {
  const ALLOWED = [
    /^\/messaging(\/|$)/,
    /^\/search\//,
    /^\/in\//,         // individual profiles (search results land here)
    /^\/login/,
    /^\/checkpoint/,   // auth flow
    /^\/uas\//,        // auth flow
  ];
  const HOME = 'https://www.linkedin.com/messaging/';

  function enforce() {
    const p = location.pathname;
    if (!ALLOWED.some(rx => rx.test(p))) {
      location.replace(HOME);
    }
  }

  enforce();

  // LinkedIn is a single-page app — catch client-side navigation.
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function () { _push.apply(this, arguments); enforce(); };
  history.replaceState = function () { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);

  // Belt and suspenders in case something bypasses the history hooks.
  setInterval(enforce, 1000);
})();
