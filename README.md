# personal-app-tweaks

User scripts for [Hermit](https://hermit.chimbori.com/) on Android. Goal: use these apps as tools, not feeds — strip the algorithmic content, ads, and engagement traps, keep only the useful parts.

Currently: LinkedIn (messaging + search only, no feed).

## How it works

One self-contained `.user.js` per site. CSS + JS inlined — no external fetching (Hermit doesn't support `@require`/`@updateURL`, and LinkedIn's CSP blocks cross-origin fetch from user-script context).

Each script has two layers of defense:
1. **JS redirect** — makes disallowed pages unreachable (e.g. `/feed/` → `/messaging/`)
2. **CSS rules** — secondary fallback to hide distracting elements

## Setup

1. Create a Hermit Lite App for the site. Set user agent to **Desktop** (mobile LinkedIn is crippled).
2. Lite App settings → User Scripts → New script.
3. **Name must end in `.user.js`** (Hermit silently rejects others).
4. Paste the file contents. Save. Reload.

## Update flow

Edit `<site>.user.js` → copy raw → paste into Hermit script → save → reload. ~30 seconds.

## Selector notes

- Prefer `href`, `aria-label`, `data-testid` over class names — LinkedIn's classes are obfuscated and rotate frequently.
- Profile pages use absolute `href` values (`https://www.linkedin.com/jobs`); other pages use relative (`/jobs/`). Selectors must match both — use path fragment without trailing slash.
