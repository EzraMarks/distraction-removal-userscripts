# personal-app-tweaks

CSS + JS user scripts for [Hermit](https://hermit.chimbori.com/) on Android — strips distractions from LinkedIn, etc.

## How it works

One self-contained `.user.js` per site. CSS + JS are inlined; no external fetching (Hermit doesn't support `@require`/`@updateURL`, and site CSP blocks cross-origin fetch).

## Setup

1. Create a Hermit Lite App for the site. Set user agent to **Desktop**.
2. Lite App settings → User Scripts → New script.
3. **Name must end in `.user.js`** (Hermit silently rejects others).
4. Paste the file contents. Save. Reload.

## Update flow

Edit `<site>.user.js` → copy raw → paste into Hermit script → save → reload. ~30 seconds.

## Notes

- `VERSION` constant at top — bump every commit so you can confirm latest code is loaded.
- Prefer `aria-label`, `data-test-*`, `role`, `href` selectors over class names (obfuscated, rotate often).
- JS allowlist-redirect is the load-bearing piece for LinkedIn (makes feed *unreachable*, not just hidden).
