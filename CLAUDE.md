# For Claude

## What this is

Scripts that make social/professional apps less invasive — ads, suggested content, and engagement nudges are hidden or made unreachable, while the actually useful parts (messaging, search, profiles) still work.

## Workflow

1. Edit `sites/<name>.js` — the neutral per-site source (an IIFE, no header).
2. Run `node build.js` to regenerate `dist/hermit/<name>.user.js` and `dist/extension/`.
3. The user pastes `dist/hermit/<name>.user.js` into Hermit, or loads `dist/extension/` as an unpacked browser extension.
4. The user reports what's still broken or distracting.

Test selectors in Chrome DevTools MCP (logged into the target site) before committing.

### Testing with auto-injection

Inline `evaluate_script` injects don't survive navigations — every link click wipes the script and the page reverts to its default state. To match Hermit's behavior (script auto-runs on every page load), pass the script body via `navigate_page`'s `initScript` parameter:

```
navigate_page url=https://www.facebook.com/ initScript="<contents of sites/facebook.js>"
```

`initScript` runs in the page's main world on every fresh document — same model as Hermit. Wrap the body in `try { ... } catch (e) { window.__fbInitErr = String(e); }` so script bugs don't silently no-op; expose a `window.__fbInitOk = true` at the end so you can confirm it ran via `evaluate_script`. Defer DOM-touching code until `DOMContentLoaded` (or guard on `document.head || document.documentElement`) — initScript fires before the `<head>` exists.

Emulate the right device for each site (`emulate` tool): mobile UA for Facebook/Instagram, desktop UA for LinkedIn. See README for the user-agent matrix.

### Common failure modes

- **Whole page disappears.** A walk-up heuristic in the script (`hideX()` functions that climb the parent chain) hit the HTML or BODY element and hid it. Always guard walk-ups with `if (host === document.body || host === document.documentElement) break` and a height cap.
- **MutationObserver feedback loop.** If the observer watches `attributes` (especially `style`), each `display:none` write triggers another full pass, which writes more styles, and so on until the page is empty. Observe `{ childList: true, subtree: true }` only.
- **FB strips inline styles on re-render.** Don't memoize "already hidden" via `dataset` — let the observer re-apply on every DOM addition.

## Architecture

- `sites/<name>.js` is the neutral source: one self-contained IIFE per site, no userscript header, no `import`/`require`.
- `sites.config.json` lists each site (name, version, match patterns, Hermit user agent). `build.js` reads this and emits:
  - `dist/hermit/<name>.user.js` — IIFE plus a Tampermonkey-style header. Hermit silently ignores files that don't end in `.user.js`.
  - `dist/extension/` — a single MV3 extension (Chrome + Firefox) with one `content_scripts` entry per site, `run_at: document_start`, `world: MAIN`. The `MAIN` world is required so the Instagram `JSON.parse` / `Response.json` hooks affect the page's actual parses (the default isolated world would no-op).
- CSS and JS must be inlined into each site file. Hermit has no `@require`/`@grant`/`@updateURL`, and LinkedIn's CSP blocks cross-origin fetch.
- The JS allowlist-redirect is the main mechanism. CSS is a fallback.

## Selectors

LinkedIn's class names are obfuscated and rotate — use `href` patterns, `aria-label`, and `data-testid` instead. Profile pages use absolute `href` values while other pages use relative ones, so selectors need to match both (e.g. `a[href*="/jobs"]` without a trailing slash).

Some CSS rules that hide feed elements also inadvertently match search results or profiles. If that happens, scope the rule more tightly or handle it in JS.
