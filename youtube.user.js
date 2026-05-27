// ==UserScript==
// @name     youtube
// @version  1
// ==/UserScript==
// Hermit user agent: Mobile.
(function() {

  // ── CSS: hide ads, recommendations, shorts shelves, end screens. ──────
  // Tagging the <body> with data-tweak-page lets us scope page-specific
  // rules (notably: only show our search landing on the home page).
  const CSS = `
    /* Home feed grid — both mobile (ytm-) and desktop (ytd-). The masthead
       lives outside these, so it stays visible. */
    body[data-tweak-page="home"] ytm-rich-grid-renderer,
    body[data-tweak-page="home"] ytm-section-list-renderer,
    body[data-tweak-page="home"] ytd-rich-grid-renderer,
    body[data-tweak-page="home"] ytd-two-column-browse-results-renderer {
      display: none !important;
    }

    /* Shorts shelves embedded in feeds and search results. */
    ytd-reel-shelf-renderer,
    ytm-reel-shelf-renderer,
    ytd-rich-shelf-renderer[is-shorts],
    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
    grid-shelf-view-model:has([href^="/shorts"]) {
      display: none !important;
    }

    /* Watch page: related/recommended sidebar. */
    ytd-watch-next-secondary-results-renderer,
    #related,
    ytm-watch-next-related-renderer,
    ytm-item-section-renderer.related-items {
      display: none !important;
    }

    /* End-screen overlays, autoplay "up next" cards. */
    .ytp-ce-element,
    .ytp-endscreen-element,
    .ytp-upnext,
    .ytp-autonav-endscreen-upnext-container {
      display: none !important;
    }

    /* Ads in every form they take: in-feed slots, promoted videos, the
       player ad module/overlay, masthead banner, mealbar promo dialogs. */
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

    /* Desktop side-nav + mini-guide entries we never want to reach. */
    ytd-guide-entry-renderer:has(a[title="Shorts" i]),
    ytd-guide-entry-renderer:has(a[title="Trending" i]),
    ytd-guide-entry-renderer:has(a[title="Subscriptions" i]),
    ytd-guide-entry-renderer:has(a[title="Gaming" i]),
    ytd-mini-guide-entry-renderer[aria-label="Shorts" i],
    ytd-mini-guide-entry-renderer[aria-label="Trending" i],
    ytd-mini-guide-entry-renderer[aria-label="Subscriptions" i] {
      display: none !important;
    }

    /* Mobile bottom nav (pivot bar): keep Search, hide everything else. */
    ytm-pivot-bar-item-renderer:has(a[href="/"]),
    ytm-pivot-bar-item-renderer:has(a[href^="/shorts"]),
    ytm-pivot-bar-item-renderer:has(a[href^="/feed/subscriptions"]),
    ytm-pivot-bar-item-renderer:has(a[href^="/feed/library"]),
    ytm-pivot-bar-item-renderer:has(a[href^="/feed/you"]) {
      display: none !important;
    }

    /* Our injected landing — a full-screen overlay with just a search box.
       Shown only on the home page; the rule below toggles display. */
    #tweak-landing {
      display: none;
      position: fixed; inset: 0; z-index: 99999;
      background: #0f0f0f; color: #fff;
      align-items: center; justify-content: center;
      font-family: Roboto, Arial, sans-serif;
    }
    body[data-tweak-page="home"] #tweak-landing {
      display: flex !important;
    }
    #tweak-landing form {
      width: min(90vw, 480px);
      display: flex; gap: 8px;
    }
    #tweak-landing input {
      flex: 1; padding: 14px 16px; font-size: 16px;
      border: 1px solid #303030; border-radius: 24px;
      background: #121212; color: #fff; outline: none;
    }
    #tweak-landing input:focus { border-color: #1c62b9; }
    #tweak-landing button {
      padding: 0 18px; border-radius: 24px;
      border: 1px solid #303030; background: #222; color: #fff;
      font-size: 16px; cursor: pointer;
    }
  `;
  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // Build the search-only landing overlay. Native <form> submit navigates
  // to /results?search_query=X — no need to hook into YouTube's SPA router.
  function ensureLanding() {
    if (!document.body || document.getElementById('tweak-landing')) return;
    const wrap = document.createElement('div');
    wrap.id = 'tweak-landing';
    wrap.innerHTML =
      '<form action="/results" method="get">' +
        '<input name="search_query" type="search" autocomplete="off" ' +
               'autofocus placeholder="Search YouTube" />' +
        '<button type="submit">Search</button>' +
      '</form>';
    document.body.appendChild(wrap);
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

  // Routes to redirect away from. Everything navigates back to '/', which
  // is then visually replaced by our search landing.
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
    if (tag === 'home') ensureLanding();
  }

  function tick() {
    enforce();
    skipAds();
  }
  tick();
  // Observe DOM additions only (no attribute/style watching) so our own
  // writes can't feed back into the observer.
  new MutationObserver(tick)
    .observe(document.documentElement, { childList: true, subtree: true });

  // YouTube is a single-page app — hook history so route changes re-run.
  const _push = history.pushState;
  const _replace = history.replaceState;
  history.pushState = function() { _push.apply(this, arguments); enforce(); };
  history.replaceState = function() { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);
  setInterval(tick, 1000);

})();
