// ==UserScript==
// @name     linkedin
// @version  3
// ==/UserScript==
(function() {

  const CSS = `
    /* Nav: hide everything except Search and Messaging */
    a[href*="/feed/"],
    a[href*="/mynetwork/"],
    a[href*="/jobs/"],
    a[href*="/notifications/"],
    a[href*="/learning/"] {
      display: none !important;
    }

    /* Feed page: hide content (redirect below is primary, this is CSS fallback) */
    section[aria-label="Primary content"],
    [data-testid="mainFeed"],
    aside[aria-label="Sidebar"],
    aside[aria-label="Aside"],
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
    if (!ALLOWED.some(r => r.test(location.pathname))) location.replace(HOME);
  }

  enforce();
  var _push = history.pushState;
  var _replace = history.replaceState;
  history.pushState = function() { _push.apply(this, arguments); enforce(); };
  history.replaceState = function() { _replace.apply(this, arguments); enforce(); };
  window.addEventListener('popstate', enforce);
  setInterval(enforce, 1000);

})();
