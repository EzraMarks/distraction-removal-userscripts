// ==UserScript==
// @name     instagram
// @version  9
// ==/UserScript==
// Hermit user agent: Mobile.
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

  function tick() {
    document.querySelectorAll('article').forEach(filterArticle);
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
