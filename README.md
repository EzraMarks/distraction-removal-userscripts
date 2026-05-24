# personal-app-tweaks

Small CSS + JS customizations I apply to social/professional apps running inside
[Hermit](https://hermit.chimbori.com/) on my phone, to strip out distractions.

## How it works

One self-contained user script per site (e.g. `linkedin.user.js`). Each script
includes inlined CSS rules and JS logic — no external fetching, because
Hermit doesn't support `@require`/`@updateURL` and most target sites' CSP
blocks cross-origin fetch from user-script context.

```
linkedin.user.js     ← inlined CSS + JS for LinkedIn
instagram.user.js    ← (not yet)
```

## Setup per site

1. Create a Hermit Lite App for the site.
2. Set its user agent to **Desktop** (mobile web is deliberately crippled on most of these).
3. Open the lite app's settings → User Scripts → New script.
4. **Name must end in `.user.js`** — Hermit silently rejects scripts that don't.
5. Paste the contents of the matching `<site>.user.js` from this repo. Save.
6. Reload.

## Update flow

When rules need to change:

1. Edit `<site>.user.js` in this repo.
2. Open the raw file in any browser, copy contents.
3. In Hermit → Lite App → User Scripts → open the existing script → replace
   contents → save → reload.

~30 seconds per update.

## Conventions

- Each script has a `VERSION` constant at the top. Bumping it on every commit
  means the version-alert (while debug mode is on) makes it visually obvious
  whether the latest code is loaded after a paste.
- A debug marker (hot pink background + banner) lives in each script while we
  iterate, then gets removed once the rules are stable.

## Notes

- Public repo on purpose — there's nothing sensitive in CSS rules.
- Selectors based on class names rot quickly (LinkedIn obfuscates them).
  Prefer `aria-label`, `data-test-*`, `role`, and `href` patterns. The JS
  redirect is the load-bearing piece for LinkedIn — URLs change less often
  than DOM.
