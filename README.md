# personal-app-tweaks

User scripts for [Hermit](https://hermit.chimbori.com/) on Android. The goal is to use these apps for what they're actually useful for — messaging, search, looking people up — without the feed, ads, and recommended content.

Currently: LinkedIn, Instagram, Facebook.

## Setup

1. Create a Hermit Lite App for the site. Set the user agent per site:
   - **LinkedIn → Desktop** (mobile LinkedIn is intentionally limited).
   - **Instagram → Mobile** (default).
   - **Facebook → Mobile** (the desktop site uses a different DOM than what these selectors target).
2. Lite App settings → User Scripts → New script.
3. The script name must end in `.user.js` — Hermit silently ignores scripts that don't.
4. Paste the file contents. Save. Reload.

## Updating

Edit `<site>.user.js` → copy the raw file → paste into the Hermit script → save → reload.
