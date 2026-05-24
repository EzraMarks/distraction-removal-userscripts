# For Claude

## Iteration loop

The user runs the scripts inside Hermit on Android. We can't deploy directly —
the workflow is:

1. Edit `<site>.user.js` here.
2. User copies the file into Hermit's user-script slot, reloads.
3. User reports what's still distracting / broken.

To minimize round-trips, **test selectors locally first** with the
Chrome DevTools MCP before guessing. Drive real Chrome (logged in to the
target site) and verify rules actually match before committing.

## Architecture

- One self-contained `.user.js` per site. Filename must end in `.user.js`
  (Hermit silently rejects scripts without that extension).
- Hermit doesn't support `@require` / `@grant` / `@updateURL`, and most target
  sites' CSP blocks cross-origin fetch from user-script context — so CSS+JS
  must be inlined in the script, no remote loading.
- Hermit Lite Apps are set to **desktop user agent** for LinkedIn (mobile web
  is crippled). Test in desktop Chrome accordingly.

## Conventions

- Each script starts with a `VERSION` constant and a `alert(VERSION + ...)` at
  the top while iterating. Bump VERSION every commit so the user can confirm
  the latest code is loaded after a paste. Remove the alert + debug pink/banner
  once the script is stable.
- Selector strategy: prefer `aria-label`, `data-test-*`, `role`, `href`
  patterns. Avoid class names (obfuscated, rotate often on LinkedIn/Meta).
- The JS allowlist-redirect is load-bearing — it's what makes the feed
  *unreachable*, not just hidden. CSS rules are the secondary defense.
