// ==UserScript==
// @name     facebook
// @version  1
// ==/UserScript==
(function() {

  const CSS = `
    /* Nav: hide home/watch/reels/gaming/dating/notifications/friends.
       Keep groups + marketplace + messages.
       Match by href fragment — class names are obfuscated and rotate. */
    a[href="/"],
    a[href^="/watch"],
    a[href^="/reel"],
    a[href^="/gaming"],
    a[href^="/dating"],
    a[href^="/notifications"],
    a[href^="/friends"],
    a[href^="/memories"],
    a[href^="/saved"],
    a[aria-label="Home" i],
    a[aria-label="Watch" i],
    a[aria-label="Reels" i],
    a[aria-label="Gaming" i],
    a[aria-label="Notifications" i],
    a[aria-label="Friends" i],
    div[aria-label*="Stories" i],
    div[aria-label*="Reels" i] {
      display: none !important;
    }

    /* Stories tray (appears at top of groups feed too). */
    div[data-pagelet^="Stories"] {
      display: none !important;
    }

    /* Sponsored. */
    div[aria-label="Sponsored" i],
    a[aria-label="Sponsored" i] {
      display: none !important;
    }

    /* Search tabs: hide "All" and "Reels" (search/videos) — they surface
       the post-feed slice and short-video content respectively. */
    a[href^="/search/top"],
    a[href^="/search/videos"] {
      display: none !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // Text-match fallback for elements without stable selectors: Sponsored posts,
  // Suggested for you, People you may know.
  const TEXT_HIDE = [
    /^Sponsored$/i,
    /^Suggested for you$/i,
    /^People you may know$/i,
    /^Reels and short videos$/i,
  ];
  function hideByText() {
    document.querySelectorAll('span, a, h2, h3').forEach(function(el) {
      const t = (el.textContent || '').trim();
      if (!t || t.length > 40) return;
      if (!TEXT_HIDE.some(r => r.test(t))) return;
      // Walk up to the nearest feed-card-ish container and hide it.
      let host = el;
      for (let i = 0; i < 8 && host.parentElement; i++) {
        host = host.parentElement;
        if (host.getAttribute('role') === 'article' ||
            host.getAttribute('data-pagelet') ||
            (host.tagName === 'DIV' && host.offsetHeight > 100)) {
          host.style.setProperty('display', 'none', 'important');
          return;
        }
      }
    });
  }
  hideByText();
  new MutationObserver(hideByText).observe(document.documentElement, { childList: true, subtree: true });

  // Redirect away from disallowed pages. Allowed (not in this list):
  //   /messages/        — messenger
  //   /search/          — search
  //   /groups/          — groups (Buy Nothing, etc.)
  //   /marketplace/     — marketplace
  //   /events/          — events
  //   /<profile>        — profile pages
  //   /login, /checkpoint, /privacy, /help — auth/system
  const BLOCKED = [
    /^\/$/,
    /^\/home(\.php)?(\/|$)/,
    /^\/watch(\/|$)/,
    /^\/reel(\/|$)/,
    /^\/reels(\/|$)/,
    /^\/gaming(\/|$)/,
    /^\/dating(\/|$)/,
    /^\/notifications(\/|$)/,
    /^\/friends(\/|$)/,
    /^\/memories(\/|$)/,
    /^\/saved(\/|$)/,
    /^\/stories(\/|$)/,
  ];
  // Land on groups feed — the user's primary use case.
  const HOME = 'https://www.facebook.com/groups/feed/';

  function enforce() {
    const p = location.pathname;
    // Search "All" tab mixes posts/sponsored with people/pages. Send to People.
    // "Videos" tab is the Reels SERP — also send to People.
    if (/^\/search\/(top|videos)(\/|$)/.test(p)) {
      location.replace(location.href.replace(/\/search\/(top|videos)/, '/search/people'));
      return;
    }
    if (BLOCKED.some(r => r.test(p))) {
      location.replace(HOME);
    }
  }

  enforce();
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function() { _push.apply(this, arguments); enforce(); };
  history.replaceState = function() { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);
  setInterval(enforce, 1000);

})();
