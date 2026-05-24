# For Claude

## Purpose

Strip algorithmic noise from social/professional apps — ads, suggested content, engagement nudges — while keeping the functional parts (messaging, search, profiles). Each script is opinionated: it decides what's useful and makes everything else unreachable or invisible.

## Workflow

1. Edit `<site>.user.js` here.
2. User pastes the file into Hermit's user-script slot, reloads.
3. User reports what's still broken or distracting.

**Before committing:** test selectors in Chrome DevTools MCP (logged into the target site as the user). Verify rules actually match — don't guess.

## Architecture

- One self-contained `.user.js` per site. Must end in `.user.js` (Hermit rejects others silently).
- CSS + JS must be inlined. Hermit has no `@require`/`@grant`/`@updateURL`, and LinkedIn's CSP blocks cross-origin fetch.
- Hermit Lite Apps use **desktop user agent** for LinkedIn. Test in desktop Chrome.

## Conventions

- Bump `@version` every commit — user confirms the right version loaded after paste.
- Add debug pink background + version alert while iterating; remove before final commit.
- Selector priority: `href` patterns > `aria-label` > `data-testid` > structure. Never class names.
- Profile pages use absolute `href` values; other pages use relative. Use path fragment without trailing slash to match both (e.g. `a[href*="/jobs"]` not `a[href*="/jobs/"]`).
- The JS allowlist-redirect is load-bearing — CSS is just a fallback.
- When a CSS selector also matches pages it shouldn't (search, profiles), scope it or drop it and handle in JS instead.
