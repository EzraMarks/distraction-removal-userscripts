// ==UserScript==
// @name         distraction-removal-userscripts
// @namespace    https://github.com/EzraMarks/distraction-removal-userscripts
// @version      17
// @description  Hide ads, feeds, and recommended content on social apps.
// @match        *://*.facebook.com/*
// @match        *://*.instagram.com/*
// @match        *://*.linkedin.com/*
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/EzraMarks/distraction-removal-userscripts/main/dist/userscripts/all.user.js
// @updateURL    https://raw.githubusercontent.com/EzraMarks/distraction-removal-userscripts/main/dist/userscripts/all.user.js
// ==/UserScript==
// ── facebook ──
if (/(?:^|\.)facebook\.com$/.test(location.hostname)) {
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

    /* On reel pages, disable snap behavior (a safety net). The actual
       "hide everything but the visible reel" pass happens in JS below
       (lockReel) because FB lazy-fills carousel slots with new videos
       as you scroll, so a static CSS filter would gradually let them
       leak through. */
    body[data-fbt-page="reel"] .vscroller-snap {
      scroll-snap-type: none !important;
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

  // On a /reel/<id> page, keep only the carousel child that contains
  // the current video and hide its siblings. FB's reel scroller has
  // ~16 placeholder children that lazy-fill with new reels as you
  // scroll — so we re-evaluate on every observer tick (no memoization)
  // and FB stripping our inline display:none just means we re-apply.
  function lockReel() {
    if (!/^\/reels?\/[^/]+/.test(location.pathname)) return;
    document.querySelectorAll('.vscroller-snap').forEach(scroller => {
      const kids = Array.from(scroller.children);
      const keepIdx = kids.findIndex(k => k.querySelector('video'));
      if (keepIdx < 0) return;
      kids.forEach((k, i) => {
        if (i === keepIdx) return;
        if (k.style.display !== 'none') {
          k.style.setProperty('display', 'none', 'important');
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
  // Messages, Groups, Friends, Marketplace, Events plus a Search
  // affordance. Cleaner mobile entry point than the feed-with-nav-bar.
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
    // Tag the body so page-scoped CSS can match without affecting other
    // pages: 'bookmarks' (hide back button), 'reel' (lock the reel
    // carousel to a single video).
    if (document.body) {
      let tag = '';
      if (/^\/bookmarks(\/|$)/.test(p)) tag = 'bookmarks';
      else if (/^\/reels?\/[^/]+/.test(p)) tag = 'reel';
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
}

// ── instagram ──
if (/(?:^|\.)instagram\.com$/.test(location.hostname)) {
(function() {

  // ── 1. Data-layer filter ──────────────────────────────────────────────
  // Hook JSON.parse and Response.json so ads / suggested posts are stripped
  // from IG's GraphQL responses before React renders them. Field names are
  // server-defined so they're stable across class-name rotations.
  const SPONSORED = ['is_sponsored', 'ad_id'];
  function isAdNode(n) {
    if (!n || typeof n !== 'object') return false;
    if (n.ad) return true;
    if (n.product_type === 'ad') return true;
    if (n.media && (n.media.is_sponsored === true || n.media.product_type === 'ad' || n.media.ad_id)) return true;
    for (const k of SPONSORED) if (n[k]) return true;
    return false;
  }
  function isSuggestedNode(n) {
    return !!(n && typeof n === 'object' && (n.explore_story || n.suggested_users));
  }
  function scrub(obj, seen) {
    if (!obj || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return obj;
    seen.add(obj);
    if (Array.isArray(obj)) {
      for (let i = obj.length - 1; i >= 0; i--) {
        const item = obj[i];
        if (item && typeof item === 'object') {
          const node = item.node || item;
          if (isAdNode(node) || isSuggestedNode(node)) {
            obj.splice(i, 1);
            continue;
          }
          scrub(item, seen);
        }
      }
      return obj;
    }
    for (const k in obj) {
      try { scrub(obj[k], seen); } catch (e) {}
    }
    return obj;
  }
  const _parse = JSON.parse;
  JSON.parse = function() {
    const r = _parse.apply(this, arguments);
    try { scrub(r, new WeakSet()); } catch (e) {}
    return r;
  };
  const _resJson = Response.prototype.json;
  Response.prototype.json = function() {
    return _resJson.apply(this, arguments).then(r => { try { scrub(r, new WeakSet()); } catch (e) {} return r; });
  };

  // ── 2. CSS: hide nav items ────────────────────────────────────────────
  const CSS = `
    /* Keep "Explore" nav — its magnifying-glass icon is how you reach
       search on mobile. The discovery grid on /explore/ itself is hidden
       below in JS. */
    a:has(svg[aria-label="Reels"]),
    a:has(svg[aria-label="Notifications"]),
    a:has(svg[aria-label="New post"]) {
      display: none !important;
    }

    /* On /explore/, hide the discovery grid. <main> has the search bar
       in a <nav>; everything else (whether wrapped in a <div> or as
       direct <a> tiles) is grid content. */
    body[data-tweak-page="explore"] main > :not(nav) {
      display: none !important;
    }

    /* On /explore/search/, content scrolls *over* the bottom nav (the
       nav already has a solid background, but its stacking order is
       below the scrolling list). Force the fixed nav above all content
       so anything underneath is hidden by its background. */
    body[data-tweak-page="search"] div[data-tweak-bottomnav] {
      z-index: 9999 !important;
    }
  `;
  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // ── 3. DOM fallback for ads / suggested that slip past the data hook ──
  function filterArticle(a) {
    if (a.dataset.tweaked) return;
    const text = a.innerText || '';
    const firstLines = text.split('\n').slice(0, 6).join(' ');
    const isAd = /\bSponsored\b/.test(text) || /(^|\s)Ad(\s|$)/.test(firstLines);
    const isSuggested = /Suggested for you/i.test(text);
    let hasFollow = false;
    for (const b of a.querySelectorAll('button, div[role="button"]')) {
      if (b.innerText.trim() === 'Follow') { hasFollow = true; break; }
    }
    if (isAd || isSuggested || hasFollow) {
      a.style.setProperty('display', 'none', 'important');
    }
    a.dataset.tweaked = '1';
  }

  // Hide the bottom-nav "Plus icon" (New post) — not wrapped in <a> on mobile
  function hidePlusIcon() {
    document.querySelectorAll('svg[aria-label="Plus icon"]').forEach(function(svg) {
      const host = svg.closest('a, button, [role="button"], [role="link"]');
      if (host) host.style.setProperty('display', 'none', 'important');
    });
  }

  // Mark the fixed bottom-nav wrapper so CSS can raise its z-index
  // (content sometimes stacks above it and scrolls *through* it).
  function tagBottomNav() {
    const home = document.querySelector('a[href="/"] svg[aria-label="Home"]')?.closest('a');
    let el = home;
    while (el && el.parentElement) {
      if (getComputedStyle(el).position === 'fixed') break;
      el = el.parentElement;
    }
    if (el) el.setAttribute('data-tweak-bottomnav', '1');
  }

  // The article filter is meant for the feed (where "Follow" indicates a
  // Suggested post). On a single-post URL — /p/<id>/, /reel/<id>/,
  // /reels/<id>/, /tv/<id>/, /<user>/p/<id>/ — the lone article IS the
  // post we want to read; "Follow" just means we don't follow the author.
  // Filtering there would blank the page. Skip filter on those routes.
  function isSinglePostPage() {
    return /^\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/[^/]+/.test(location.pathname);
  }

  function tick() {
    if (!isSinglePostPage()) {
      document.querySelectorAll('article').forEach(filterArticle);
    }
    hidePlusIcon();
    tagBottomNav();
    lockReel();
  }
  tick();
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });

  // ── 4. Page-level handling ────────────────────────────────────────────
  // /reels/                       — redirect home
  // /explore/search/keyword/?q=X  — keyword content grid → /explore/
  //                                 (user re-taps search to do account search)
  // /explore/                     — kept; grid hidden via the CSS rule above
  //                                 (toggled by the body data attribute)
  function enforce() {
    var p = location.pathname;
    // /reels/ (no id) → home. /reels/<id>/ stays so DM-shared reels open;
    // the swipe-to-next is disabled below via "data-tweak-page=reel".
    if (p === '/reels/' || p === '/reels') {
      location.replace('https://www.instagram.com/');
      return;
    }
    if (/^\/explore\/search\/keyword(\/|$)/.test(p)) {
      location.replace('https://www.instagram.com/explore/');
      return;
    }
    if (document.body) {
      let tag = '';
      if (p === '/explore/') tag = 'explore';
      else if (/^\/explore\/search(\/|$)/.test(p)) tag = 'search';
      else if (/^\/reels?\/[^/]+/.test(p)) tag = 'reel';
      document.body.setAttribute('data-tweak-page', tag);
    }
  }

  // Lock any "reels stack" so the user can't swipe to the next reel.
  // Triggers on /reel/<id>/, /reels/<id>/, AND the chat-overlay reel viewer
  // (which keeps the URL at /direct/t/<id>/ — URL-agnostic detector needed).
  //
  // Heuristic: a scrollable container with multiple children, scrollHeight
  // much greater than clientHeight, and at least one <video> descendant.
  // The home feed scrolls at document level (no internal scroller), so it's
  // unaffected.
  function lockReel() {
    document.querySelectorAll('div, section').forEach(el => {
      // Re-evaluate each tick: IG lazy-loads more reels as siblings, and
      // they need to be hidden too.
      const cs = getComputedStyle(el);
      const overflowedY = cs.overflowY === 'scroll' || cs.overflowY === 'auto';
      const alreadyLocked = el.dataset.tweakReelLocked === '1';
      if (!alreadyLocked) {
        if (!overflowedY) return;
        if (el.children.length < 2) return;
        if (el.scrollHeight < el.clientHeight * 2) return;
        if (!el.querySelector('video')) return;
        el.style.setProperty('overflow', 'hidden', 'important');
        el.dataset.tweakReelLocked = '1';
      }
      // Hide every child after the first, including any just added.
      Array.from(el.children).slice(1).forEach(c => {
        if (c.style.display !== 'none') {
          c.style.setProperty('display', 'none', 'important');
        }
      });
    });
  }
  enforce();
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function() { _push.apply(this, arguments); enforce(); };
  history.replaceState = function() { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);
  setInterval(enforce, 1000);

})();
}

// ── linkedin ──
if (/(?:^|\.)linkedin\.com$/.test(location.hostname)) {
(function() {

  const CSS = `
    /* Nav: hide everything except Search and Messaging.
       Path fragment without trailing slash — profile pages use absolute URLs. */
    a[href*="/feed"],
    a[href*="/mynetwork"],
    a[href*="/jobs"],
    a[href*="/notifications"],
    a[href*="/learning"] {
      display: none !important;
    }

    /* Feed page: hide content (feed-specific, verified absent on search/profiles). */
    [data-testid="mainFeed"],
    [aria-label*="start a post" i] {
      display: none !important;
    }

    /* Ads */
    [data-ad-banner] {
      display: none !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // "For Business" has no stable CSS selector — hide by text match
  document.querySelectorAll('header button, header a').forEach(function(el) {
    if (el.textContent.trim() === 'For Business') {
      (el.closest('li') || el).style.setProperty('display', 'none', 'important');
    }
  });

  // Redirect away from disallowed pages
  const ALLOWED = [
    /^\/messaging(\/|$)/,
    /^\/search\//,
    /^\/in\//,
    /^\/login/,
    /^\/checkpoint/,
    /^\/uas\//,
  ];
  const HOME = 'https://www.linkedin.com/messaging/';

  function enforce() {
    var p = location.pathname;
    // Redirect /search/results/all to people — no stable CSS selector to hide just Posts
    if (p.startsWith('/search/results/all')) {
      location.replace(location.href.replace('/search/results/all', '/search/results/people'));
      return;
    }
    if (!ALLOWED.some(r => r.test(p))) location.replace(HOME);
  }

  enforce();
  var _push = history.pushState;
  var _replace = history.replaceState;
  history.pushState = function() { _push.apply(this, arguments); enforce(); };
  history.replaceState = function() { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);
  setInterval(enforce, 1000);

})();
}

// ── youtube ──
if (/(?:^|\.)youtube\.com$/.test(location.hostname)) {
(function() {

  // The goal is "search bar only" — but we don't render our own search;
  // we hide everything else and let YouTube's native top-bar search do the
  // work. Note: YouTube enforces Trusted Types, so any injected HTML must
  // be built with DOM APIs (no innerHTML).
  const CSS = `
    /* Home feed grid — both mobile (ytm-) and desktop (ytd-). */
    body[data-tweak-page="home"] ytm-rich-grid-renderer,
    body[data-tweak-page="home"] ytm-section-list-renderer,
    body[data-tweak-page="home"] ytm-single-column-browse-results-renderer,
    body[data-tweak-page="home"] ytd-rich-grid-renderer,
    body[data-tweak-page="home"] ytd-two-column-browse-results-renderer {
      display: none !important;
    }

    /* Shorts shelves wherever they appear. */
    ytd-reel-shelf-renderer,
    ytm-reel-shelf-renderer,
    ytd-rich-shelf-renderer[is-shorts],
    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
    grid-shelf-view-model:has([href^="/shorts"]) {
      display: none !important;
    }

    /* Watch page related videos. Container classes (e.g.
       div.related-items-container) shift between YouTube layouts /
       webviews, so we instead target the video card element directly —
       it's stable and never used by the comments UI. */
    ytd-watch-next-secondary-results-renderer,
    #related,
    ytm-watch-next-related-renderer,
    body[data-tweak-page="watch"] ytm-video-with-context-renderer,
    body[data-tweak-page="watch"] ytm-compact-video-renderer,
    body[data-tweak-page="watch"] ytm-compact-autoplay-renderer {
      display: none !important;
    }
    /* Hide the load-more spinner ONLY inside sections that contained
       related-video cards — not the comments thread's spinner, which
       uses the same element. */
    body[data-tweak-page="watch"] ytm-item-section-renderer:has(ytm-video-with-context-renderer) ytm-continuation-item-renderer,
    body[data-tweak-page="watch"] lazy-list:has(ytm-video-with-context-renderer) ytm-continuation-item-renderer {
      display: none !important;
    }

    /* Search-box autocomplete dropdown. */
    .ytSearchboxComponentSuggestionsContainer,
    yt-searchbox-suggestions-container {
      display: none !important;
    }

    /* End-screen overlays, autoplay "up next" cards, prev/next-video
       buttons in the player chrome (they queue suggested videos). */
    .ytp-ce-element,
    .ytp-endscreen-element,
    .ytp-upnext,
    .ytp-autonav-endscreen-upnext-container,
    .ytp-prev-button,
    .ytp-next-button,
    .player-middle-controls-prev-next-button,
    button[aria-label="Previous video" i],
    button[aria-label="Next video" i] {
      display: none !important;
    }

    /* Ads everywhere. */
    ytd-ad-slot-renderer,
    ytd-promoted-sparkles-web-renderer,
    ytd-display-ad-renderer,
    ytd-companion-slot-renderer,
    ytd-action-companion-ad-renderer,
    ytd-promoted-video-renderer,
    ytd-statement-banner-renderer,
    ytm-promoted-sparkles-web-renderer,
    ytm-promoted-video-renderer,
    ytm-companion-slot,
    #player-ads,
    #masthead-ad,
    .ytp-ad-module,
    .ytp-ad-overlay-container,
    .video-ads,
    tp-yt-paper-dialog:has(yt-mealbar-promo-renderer) {
      display: none !important;
    }

    /* Desktop side-nav entries we never want to reach. */
    ytd-guide-entry-renderer:has(a[title="Shorts" i]),
    ytd-guide-entry-renderer:has(a[title="Trending" i]),
    ytd-guide-entry-renderer:has(a[title="Subscriptions" i]),
    ytd-guide-entry-renderer:has(a[title="Gaming" i]),
    ytd-mini-guide-entry-renderer[aria-label="Shorts" i],
    ytd-mini-guide-entry-renderer[aria-label="Trending" i],
    ytd-mini-guide-entry-renderer[aria-label="Subscriptions" i] {
      display: none !important;
    }

    /* Mobile bottom pivot bar — hide all of it. Search is in the top bar. */
    ytm-pivot-bar-renderer {
      display: none !important;
    }
  `;

  function injectStyle() {
    if (document.getElementById('tweak-style')) return;
    const root = document.head || document.documentElement;
    if (!root) return;
    const style = document.createElement('style');
    style.id = 'tweak-style';
    style.textContent = CSS;
    root.appendChild(style);
  }

  // Auto-skip video ads: click any visible skip button, and as a fallback
  // seek to the end of the ad video and mute it so it's silent + brief.
  function skipAds() {
    const skip = document.querySelector(
      '.ytp-ad-skip-button, .ytp-skip-ad-button, ' +
      '.ytp-ad-skip-button-modern, .ytp-ad-skip-button-container button'
    );
    if (skip) { try { skip.click(); } catch (e) {} }
    if (document.querySelector('.ad-showing, .ytp-ad-player-overlay')) {
      const v = document.querySelector('video.html5-main-video, video');
      if (v && isFinite(v.duration) && v.duration > 0) {
        try { v.currentTime = v.duration; v.muted = true; } catch (e) {}
      }
    }
  }

  // Routes that redirect home. We can't actually land on a "blank" page,
  // so we accept the home URL and let the home-page rules above hide the
  // feed grid — leaving just the top bar (logo + search + sign in).
  const BLOCKED = [
    /^\/shorts(\/|$)/,
    /^\/gaming(\/|$)/,
    /^\/feed\/?$/,
    /^\/feed\/(trending|explore|subscriptions|library|history|you|playlists|channels|guide_builder|storefront|podcasts|courses)(\/|$)/,
  ];

  function enforce() {
    const p = location.pathname;
    if (BLOCKED.some(r => r.test(p))) {
      location.replace('/');
      return;
    }
    if (!document.body) return;
    let tag = '';
    if (p === '/' || p === '') tag = 'home';
    else if (p.startsWith('/results')) tag = 'results';
    else if (p.startsWith('/watch')) tag = 'watch';
    if (document.body.getAttribute('data-tweak-page') !== tag) {
      document.body.setAttribute('data-tweak-page', tag);
    }
  }

  function tick() {
    injectStyle();
    enforce();
    skipAds();
  }

  // initScript may fire before documentElement exists — defer the observer.
  function start() {
    tick();
    new MutationObserver(tick)
      .observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.documentElement) start();
  else document.addEventListener('readystatechange', function once() {
    if (document.documentElement) {
      document.removeEventListener('readystatechange', once);
      start();
    }
  });

  // YouTube is a single-page app — hook history so route changes re-run.
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function() { _push.apply(this, arguments); enforce(); };
  history.replaceState = function() { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);
  setInterval(tick, 1000);

})();
}
