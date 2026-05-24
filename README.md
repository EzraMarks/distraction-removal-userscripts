# personal-app-tweaks

Small CSS + JS customizations I apply to social/professional apps running inside
[Hermit](https://hermit.chimbori.com/) on my phone, to strip out distractions.

## How it works

Each Hermit Lite App runs a tiny `bootstrap.js` (set once, in Hermit's user-script
slot — **never edited again**). It derives the site name from the hostname
(`www.linkedin.com` → `linkedin`) and fetches the matching `<name>.css` and
`<name>.js` from this repo every page load. To support a new site, just add the
files — no bootstrap change.

```
bootstrap.js          ← paste into each Hermit Lite App's user-script slot
linkedin.css          ← hide rules
linkedin.js           ← allowlist-by-redirect (only messaging + search reachable)
instagram.css         ← (not yet)
instagram.js          ← (not yet)
```

## Setup per site

1. Create a Hermit Lite App pointing at the site (e.g. `https://www.linkedin.com/messaging/`).
2. Set its user-agent to **desktop** (LinkedIn's mobile web is deliberately crippled).
3. Open the lite app's settings → User Scripts → paste the contents of `bootstrap.js`.
4. Reload. Tweaks are live.

## Notes

- The JS redirect is the load-bearing piece. CSS rules rot when sites redesign;
  URL paths rot less often.
- Cache-busting via `?v=timestamp` is intentional — GitHub raw caches aggressively.
- Public repo on purpose. There's nothing sensitive in CSS rules.
