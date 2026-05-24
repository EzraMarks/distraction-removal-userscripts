# personal-app-tweaks

User scripts for [Hermit](https://hermit.chimbori.com/) on Android. The goal is to use these apps for what they're actually useful for — messaging, search, looking people up — without the feed, ads, and recommended content.

Currently: LinkedIn.

## How it works

One self-contained `.user.js` per site. CSS and JS are inlined; no external fetching (Hermit doesn't support `@require`/`@updateURL`, and LinkedIn's CSP blocks cross-origin fetch from user-script context).

Each script has two layers:
1. **JS redirect** — disallowed pages are made unreachable (e.g. `/feed/` redirects to `/messaging/`)
2. **CSS rules** — secondary fallback to hide distracting elements that slip through

## Setup

1. Create a Hermit Lite App for the site. Set user agent to **Desktop** (LinkedIn's mobile site is intentionally limited).
2. Lite App settings → User Scripts → New script.
3. The script name must end in `.user.js` — Hermit silently ignores scripts that don't.
4. Paste the file contents. Save. Reload.

## Updating

Edit `<site>.user.js` → copy the raw file → paste into the Hermit script → save → reload. About 30 seconds.

## Selector notes

LinkedIn's class names are obfuscated and change frequently, so selectors use `href`, `aria-label`, and `data-testid` instead. One gotcha: profile pages use absolute `href` values (`https://www.linkedin.com/jobs`) while other pages use relative ones (`/jobs/`). Selectors need to match both — use the path fragment without a trailing slash (e.g. `a[href*="/jobs"]`).
