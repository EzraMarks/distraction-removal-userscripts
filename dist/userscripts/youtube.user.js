// ==UserScript==
// @name         youtube
// @namespace    https://github.com/EzraMarks/distraction-removal-userscripts
// @version      10
// @description  Hide ads, feeds, and recommended content on social apps.
// @match        *://*.youtube.com/*
// @run-at       document-start
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/EzraMarks/distraction-removal-userscripts/main/dist/userscripts/youtube.user.js
// @updateURL    https://raw.githubusercontent.com/EzraMarks/distraction-removal-userscripts/main/dist/userscripts/youtube.user.js
// ==/UserScript==
// Hermit user agent: Mobile.
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
