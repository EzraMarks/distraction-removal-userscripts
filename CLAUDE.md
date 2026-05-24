# For Claude

## What this is

Scripts that make social/professional apps less invasive — ads, suggested content, and engagement nudges are hidden or made unreachable, while the actually useful parts (messaging, search, profiles) still work. Each script is opinionated about what's worth keeping.

## Workflow

1. Edit `<site>.user.js` here.
2. The user pastes it into Hermit's user-script slot and reloads.
3. The user reports what's still broken or distracting.

Test selectors in Chrome DevTools MCP (logged into the target site) before committing. Verify rules actually match the elements they're supposed to.

## Architecture

- One self-contained `.user.js` per site. The filename must end in `.user.js` — Hermit silently ignores others.
- CSS and JS must be inlined. Hermit has no `@require`/`@grant`/`@updateURL`, and LinkedIn's CSP blocks cross-origin fetch.
- Hermit Lite Apps use a desktop user agent for LinkedIn. Test in desktop Chrome.

## Things learned the hard way

- Bump `@version` on every commit. The user confirms the right version loaded after pasting.
- Add a debug marker (hot pink background, version alert) while iterating; remove it before the final commit.
- Selector order of reliability: `href` patterns, then `aria-label`, then `data-testid`, then DOM structure. Class names are obfuscated and rotate — avoid them.
- Profile pages use absolute `href` values; other pages use relative ones. `a[href*="/jobs"]` (no trailing slash) matches both.
- Some CSS selectors that hide feed elements also match search results and profile pages — if that happens, scope the rule more tightly or move the logic to JS.
- The JS allowlist-redirect is the main mechanism. CSS is just a fallback for what slips through.
