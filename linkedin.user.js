// ==UserScript==
// @name     linkedin
// @version  1.0
// ==/UserScript==
(function() {

  // Bump VERSION every commit so the alert proves the latest code is loaded.
  const VERSION = 'v1';
  alert(VERSION + ': linkedin script ran');

  // -------- CSS (inlined, no external fetch — LinkedIn CSP blocks that) ----
  const CSS = `
    /* DEBUG MARKER — remove once stable. */
    html, body { background: hotpink !important; }
    html::before {
      content: "TWEAKS LOADED ✓";
      position: fixed; top: 0; left: 0; right: 0;
      z-index: 2147483647;
      background: black; color: lime;
      font: bold 18px monospace;
      padding: 12px; text-align: center;
    }

    /* Hide global nav / bottom tab bar. */
    nav[aria-label*="Primary" i],
    [data-test-global-nav],
    [class*="global-nav__primary"],
    footer[role="navigation"] {
      display: none !important;
    }

    /* Hide "Start a post" entrypoints. */
    [aria-label*="start a post" i],
    [aria-label*="create a post" i],
    [data-control-name*="share"],
    a[href*="/posts/new"],
    button[aria-label*="post" i] {
      display: none !important;
    }

    /* Hide feed modules. */
    [data-test-id*="feed" i],
    [class*="feed-shared"],
    [class*="news-feed"] {
      display: none !important;
    }
  `;

  const style = document.createElement('style');
  style.textContent = CSS;
  (document.head || document.documentElement).appendChild(style);

  // -------- JS: allowlist redirect ----------------------------------------
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
    var ok = false;
    for (var i = 0; i < ALLOWED.length; i++) {
      if (ALLOWED[i].test(p)) { ok = true; break; }
    }
    if (!ok) location.replace(HOME);
  }

  enforce();
  var _push = history.pushState;
  var _replace = history.replaceState;
  history.pushState = function() { _push.apply(this, arguments); enforce(); };
  history.replaceState = function() { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);
  setInterval(enforce, 1000);

})();
