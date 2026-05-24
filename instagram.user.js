// ==UserScript==
// @name     instagram
// @version  3
// ==/UserScript==
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
    a:has(svg[aria-label="Explore"]),
    a:has(svg[aria-label="Reels"]),
    a:has(svg[aria-label="Notifications"]),
    a:has(svg[aria-label="New post"]) {
      display: none !important;
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

  function tick() {
    document.querySelectorAll('article').forEach(filterArticle);
    hidePlusIcon();
  }
  tick();
  new MutationObserver(tick).observe(document.documentElement, { childList: true, subtree: true });

  // ── 4. Redirect away from pure-discovery pages ────────────────────────
  // /explore/  — discovery grid (only kept content is the search bar at top)
  // /explore/search/keyword/ — keyword content grid
  // /reels/    — reels feed
  //
  // /explore/search/ (account search with "Followed by X + N more" hints)
  // is the only discovery URL we want, so explore-* redirects land there.
  function enforce() {
    var p = location.pathname;
    if (/^\/reels(\/|$)/.test(p)) {
      location.replace('https://www.instagram.com/');
    } else if (p === '/explore/' || /^\/explore\/search\/keyword(\/|$)/.test(p)) {
      location.replace('https://www.instagram.com/explore/search/');
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
