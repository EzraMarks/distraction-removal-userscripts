// ==UserScript==
// @name         facebook
// @namespace    https://github.com/EzraMarks/personal-app-tweaks
// @version      12
// @description  Hide ads, feeds, and recommended content on social apps.
// @match        *://*.facebook.com/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/dist/userscripts/facebook.user.js
// @updateURL    https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/dist/userscripts/facebook.user.js
// ==/UserScript==
// Hermit user agent: Mobile.
(function() {

  const CSS = `
    /* Nav: hide home/watch/reels/gaming/dating/notifications/friends/memories/saved.
       Keep groups + marketplace.
       Match by href fragment — class names are obfuscated and rotate. */
    a[href="/"],
    a[href^="/watch"],
    a[href^="/reel"],
    a[href^="/gaming"],
    a[href^="/dating"],
    a[href^="/notifications"],
    a[href^="/memories"],
    a[href^="/saved"],
    a[aria-label="Home" i],
    a[aria-label="Watch" i],
    a[aria-label="Reels" i],
    a[aria-label="Gaming" i],
    a[aria-label="Notifications" i],
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

    /* === Mobile FB (no <a> nav; tabs are divs with semantic aria-labels). ===
       Hide feed/friends/reels/notifications. Keep messages + marketplace. */
    [role="tab"][aria-label^="feed" i],
    [role="tab"][aria-label^="reels" i],
    [role="tab"][aria-label^="notifications" i] {
      display: none !important;
    }

    /* Mobile stories tray + create-story */
    [role="button"][aria-label*="story" i] {
      display: none !important;
    }

    /* Mobile reels embedded in the feed */
    [role="button"][aria-label*="reel video" i] {
      display: none !important;
    }

    /* Mobile post composer ("What's on your mind?") */
    [role="button"][aria-label*="What's on your mind" i],
    [role="button"][aria-label="Photo" i] {
      display: none !important;
    }

    /* Back button on /bookmarks/ leads to / which redirects right back. */
    body[data-fbt-page="bookmarks"] [role="button"][aria-label="Back" i] {
      display: none !important;
    }
  `;

  // Bookmarks menu (/bookmarks/) tile labels to remove from the DOM.
  // FB lays out this grid with hardcoded per-item margins: even-index
  // listitems get `margin-left: 12px` (left column), odd-index get
  // `margin: -77px 0 0 210px` (right column, lifted up to align with the
  // previous row). Removing items breaks that pattern — a surviving
  // odd-index item still has -77px margin-top and floats above the list.
  // So after removal we renumber and reapply the margins by new index.
  const BOOKMARK_HIDE = new Set([
    'Messages', 'Reels', 'Dating', 'Pages', 'Saved', 'Memories', 'Birthdays',
    'Games', 'Ads Manager', 'Feeds', 'Watch',
  ]);
  function hideBookmarkTiles() {
    if (!/^\/bookmarks(\/|$)/.test(location.pathname)) return;
    const lists = new Set();
    document.querySelectorAll('a, [role="link"], [role="button"]').forEach(el => {
      const t = (el.innerText || '').trim().split('\n')[0];
      if (!BOOKMARK_HIDE.has(t)) return;
      const li = el.closest('[role="listitem"]');
      if (!li || isTopLevel(li)) return;
      if (li.parentElement) lists.add(li.parentElement);
      li.remove();
    });
    lists.forEach(list => {
      Array.from(list.children).forEach((it, idx) => {
        const m = idx % 2 === 0 ? '0 0 0 12px' : '-77px 0 0 210px';
        if (it.style.margin !== m) it.style.setProperty('margin', m, 'important');
      });
    });
  }

  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // Never hide top-level wrappers — they hold the entire app. A node is
  // "top-level" if it's within ~3 elements of <body> (so #screen-root, its
  // immediate scaffolding, etc.), if it carries an id, or if it occupies
  // most of the viewport width.
  function isTopLevel(el) {
    if (!el || el === document.body || el === document.documentElement) return true;
    if (el.id) return true;
    let p = el;
    for (let depth = 0; depth < 4 && p; depth++) {
      p = p.parentElement;
      if (p === document.body) return true;
    }
    return false;
  }

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
      // Walk up to the nearest feed-card-ish container and hide it. Cap
      // the upper bound so we never hide a page-level wrapper.
      let host = el;
      for (let i = 0; i < 8 && host.parentElement; i++) {
        host = host.parentElement;
        if (isTopLevel(host)) return;
        const h = host.offsetHeight;
        if (host.getAttribute('role') === 'article' ||
            host.getAttribute('data-pagelet') ||
            (host.tagName === 'DIV' && h > 100 && h < 800)) {
          host.style.setProperty('display', 'none', 'important');
          return;
        }
      }
    });
  }

  // Mobile "People You May Know" cards have no stable selector — each is a
  // small container with an "Add friend" button. Hide the surrounding card.
  function hidePYMK() {
    document.querySelectorAll('[role="button"]').forEach(b => {
      if (!/^Add friend/.test((b.innerText || '').trim())) return;
      let host = b;
      for (let i = 0; i < 8 && host.parentElement; i++) {
        host = host.parentElement;
        if (isTopLevel(host)) return;
        if (host.tagName === 'DIV' && host.offsetHeight > 100 && host.offsetHeight < 400) {
          host.style.setProperty('display', 'none', 'important');
          return;
        }
      }
    });
  }

  // The story buttons are hidden via CSS, but the card containers around
  // them (photo background, badge counts) remain. Walk up from any story
  // button to the smallest ancestor that wraps multiple story buttons —
  // that's the stories row.
  function hideStoryRow() {
    const stories = document.querySelectorAll('[role="button"][aria-label*="story" i]');
    if (!stories.length) return;
    let host = stories[0].parentElement;
    for (let i = 0; i < 10 && host; i++) {
      if (isTopLevel(host)) return;
      if (host.querySelectorAll('[role="button"][aria-label*="story" i]').length >= 2) {
        if (host.offsetHeight > 1500) return;
        if (host.style.display !== 'none') host.style.setProperty('display', 'none', 'important');
        return;
      }
      host = host.parentElement;
    }
  }

  // Hide the inline "Reels" ribbon header on the feed (a small clickable
  // strip with just the text "Reels" and a kebab menu).
  function hideReelsRibbon() {
    document.querySelectorAll('span, h2, h3, div').forEach(el => {
      if ((el.textContent || '').trim() !== 'Reels') return;
      if (el.children.length > 0) return; // leaf nodes only
      let host = el;
      for (let i = 0; i < 6 && host.parentElement; i++) {
        host = host.parentElement;
        if (isTopLevel(host)) return;
        const r = host.getBoundingClientRect();
        if (r.height > 30 && r.height < 200) {
          if (host.style.display !== 'none') host.style.setProperty('display', 'none', 'important');
          return;
        }
      }
    });
  }

  // "Open app" banner at the bottom of mobile pages.
  function hideOpenAppBanner() {
    document.querySelectorAll('[role="button"], a').forEach(el => {
      if ((el.textContent || '').trim() !== 'Open app') return;
      let host = el;
      for (let i = 0; i < 5 && host.parentElement; i++) {
        host = host.parentElement;
        if (isTopLevel(host)) return;
        const r = host.getBoundingClientRect();
        if (r.height > 40 && r.height < 150) {
          if (host.style.display !== 'none') host.style.setProperty('display', 'none', 'important');
          return;
        }
      }
    });
  }

  // Mobile feed posts: each post has a "More options for <author>" button.
  // Walk up to the LARGEST ancestor that still wraps just this one post.
  // FB re-renders and strips inline styles, so we re-apply on every
  // MutationObserver tick (no memoization).
  function hideFeedPosts() {
    if (!/^\/$|^\/home/.test(location.pathname)) return; // only on home
    document.querySelectorAll('[role="button"][aria-label^="More options for" i]').forEach(b => {
      let host = b.parentElement;
      let card = null;
      for (let i = 0; i < 12 && host; i++) {
        if (isTopLevel(host)) break;
        const moreCount = host.querySelectorAll('[role="button"][aria-label^="More options for" i]').length;
        if (moreCount !== 1) break; // ancestor wraps multiple posts — stop
        card = host;
        host = host.parentElement;
      }
      if (card && card.offsetHeight < 2500 && card.style.display !== 'none') {
        card.style.setProperty('display', 'none', 'important');
      }
    });
  }

  // Lock the reel/watch viewer to a single video so the user can't swipe
  // down to FB's recommended reels.
  //
  // The IG version used "scrollable container with any descendant <video>",
  // which on FB matched the entire app shell (player + sidebar as
  // siblings) and blanked the page. Here we require at least TWO direct
  // children that each contain a video — that's the distinctive reel-stack
  // signature; a page shell has one video child and unrelated others.
  function lockReel() {
    if (!/^\/(watch|reels?)(\/|$)/.test(location.pathname)) return;
    document.querySelectorAll('div, section').forEach(el => {
      if (isTopLevel(el)) return;
      const videoKids = Array.from(el.children).filter(c => c.querySelector('video'));
      if (videoKids.length < 2) return;
      if (!el.dataset.fbtReelLocked) {
        el.style.setProperty('overflow', 'hidden', 'important');
        el.dataset.fbtReelLocked = '1';
      }
      videoKids.slice(1).forEach(c => {
        if (c.style.display !== 'none') {
          c.style.setProperty('display', 'none', 'important');
        }
      });
    });
  }

  function hideAll() {
    hideByText();
    hidePYMK();
    hideStoryRow();
    hideReelsRibbon();
    hideOpenAppBanner();
    hideFeedPosts();
    hideBookmarkTiles();
    lockReel();
  }
  hideAll();
  // Observe DOM additions only — NOT style/attribute changes. Otherwise
  // our own display:none writes feed back into the observer and trigger
  // re-runs in a loop that eventually hides the whole page.
  new MutationObserver(hideAll)
    .observe(document.documentElement, { childList: true, subtree: true });

  // Redirect away from disallowed pages. Allowed (not in this list):
  //   /bookmarks/       — the FB menu page (our landing — clear tile UI)
  //   /messages/        — messenger
  //   /search/          — search
  //   /groups/          — groups (Buy Nothing, etc.)
  //   /marketplace/     — marketplace
  //   /friends/         — friends list
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
    /^\/memories(\/|$)/,
    /^\/saved(\/|$)/,
    /^\/stories(\/|$)/,
  ];
  // Landing page: the FB menu (/bookmarks/) — big tile buttons for
  // Messages, Groups, Friends, Marketplace, Events plus a Search affordance.
  // The home feed's nav rendered poorly under Hermit; this gives a stable,
  // tappable surface instead.
  const HOME = 'https://www.facebook.com/bookmarks/';

  // FB resolves shared content server-side to URLs that look like the
  // feed pages we're trying to block:
  //   /share/v/<id>/ → /watch?v=<id>   (single video)
  //   /share/r/<id>/ → /reel/<id>/     (individual reel)
  // Treat the resolved URL as allowed when it clearly points at one item
  // rather than the surrounding feed/tab.
  function isAllowedSharedView(p) {
    if (p === '/watch' && /[?&]v=/.test(location.search)) return true;
    if (/^\/reels?\/[^/]+/.test(p)) return true;
    return false;
  }

  function enforce() {
    const p = location.pathname;
    // Search "All" tab mixes posts/sponsored with people/pages. Send to People.
    // "Videos" tab is the Reels SERP — also send to People.
    if (/^\/search\/(top|videos)(\/|$)/.test(p)) {
      location.replace(location.href.replace(/\/search\/(top|videos)/, '/search/people'));
      return;
    }
    if (BLOCKED.some(r => r.test(p)) && !isAllowedSharedView(p)) {
      location.replace(HOME);
      return;
    }
    // Tag the body so page-scoped CSS (e.g., hiding the back button on
    // /bookmarks/) can match without affecting other pages.
    if (document.body) {
      const tag = /^\/bookmarks(\/|$)/.test(p) ? 'bookmarks' : '';
      if (document.body.getAttribute('data-fbt-page') !== tag) {
        document.body.setAttribute('data-fbt-page', tag);
      }
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
