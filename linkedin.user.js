// ==UserScript==
// @name        linkedin
// @version     14
// @match       https://www.linkedin.com/*
// @updateURL   https://cdn.jsdelivr.net/gh/EzraMarks/personal-app-tweaks@main/linkedin.user.js
// @downloadURL https://cdn.jsdelivr.net/gh/EzraMarks/personal-app-tweaks@main/linkedin.user.js
// @run-at      document-start
// ==/UserScript==
(function() {

  // TEMP: version indicator — remove once scaling is confirmed working
  window.addEventListener('DOMContentLoaded', function() {
    var badge = document.createElement('div');
    badge.textContent = 'v11';
    badge.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;background:red;color:white;font:bold 18px sans-serif;padding:4px 8px;pointer-events:none';
    document.body.appendChild(badge);
  });

  const CSS = `
    html { zoom: 1.5; }

    /* Nav: hide everything except Search and Messaging.
       Use path fragment without trailing slash — profile pages use absolute URLs
       (e.g. https://www.linkedin.com/mynetwork) while messaging uses relative (/mynetwork/). */
    a[href*="/feed"],
    a[href*="/mynetwork"],
    a[href*="/jobs"],
    a[href*="/notifications"],
    a[href*="/learning"] {
      display: none !important;
    }

    /* Feed page: hide content. These selectors are feed-specific (verified absent on search). */
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

  // Redirect away from disallowed pages — makes feed/network/jobs unreachable
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
    // Redirect /search/results/all to people — no stable CSS selector to hide just the Posts section
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
