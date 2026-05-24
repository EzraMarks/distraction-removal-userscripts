# For Claude

## What this is

Scripts that make social/professional apps less invasive — ads, suggested content, and engagement nudges are hidden or made unreachable, while the actually useful parts (messaging, search, profiles) still work.

## Workflow

1. Edit `<site>.user.js` here.
2. The user pastes it into Hermit's user-script slot and reloads.
3. The user reports what's still broken or distracting.

Test selectors in Chrome DevTools MCP (logged into the target site) before committing.

## Architecture

- One self-contained `.user.js` per site. The filename must end in `.user.js` — Hermit silently ignores others.
- CSS and JS must be inlined. Hermit has no `@require`/`@grant`/`@updateURL`, and LinkedIn's CSP blocks cross-origin fetch.
- Hermit Lite Apps use a desktop user agent for LinkedIn. Test in desktop Chrome.
- The JS allowlist-redirect is the main mechanism. CSS is a fallback.

## Selectors

LinkedIn's class names are obfuscated and rotate — use `href` patterns, `aria-label`, and `data-testid` instead. Profile pages use absolute `href` values while other pages use relative ones, so selectors need to match both (e.g. `a[href*="/jobs"]` without a trailing slash).

Some CSS rules that hide feed elements also inadvertently match search results or profiles. If that happens, scope the rule more tightly or handle it in JS.
