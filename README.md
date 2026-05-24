# personal-app-tweaks

User scripts for [Hermit](https://hermit.chimbori.com/) on Android. The goal is to use these apps for what they're actually useful for — messaging, search, looking people up — without the feed, ads, and recommended content.

Currently: LinkedIn, Instagram.

## Setup

1. Create a Hermit Lite App for the site. Set user agent to **Desktop** (LinkedIn's mobile site is intentionally limited).
2. Lite App settings → User Scripts → New script.
3. The script name must end in `.user.js` — Hermit silently ignores scripts that don't.
4. Paste the file contents. Save. Reload.

## Updating

Edit `<site>.user.js` → copy the raw file → paste into the Hermit script → save → reload.
