# personal-app-tweaks

Scripts that make social/professional apps less invasive — ads, suggested content, and engagement nudges are hidden or made unreachable, while the actually useful parts (messaging, search, profiles) still work.

Currently: LinkedIn, Instagram, Facebook, YouTube.

## Layout

- `sites/<name>.js` — neutral source for each site (an IIFE, no headers). **Edit these.**
- `sites.config.json` — per-site metadata (version, match patterns, Hermit UA).
- `build.js` — generates the two deploy targets below. Run `node build.js`.
- `dist/hermit/<name>.user.js` — generated. Paste into Hermit.
- `dist/extension/` — generated. Load as an unpacked extension in Chrome or Firefox.

## Hermit (Android)

1. Create a Hermit Lite App for the site. Set the user agent per site:
   - **LinkedIn → Desktop** (mobile LinkedIn is intentionally limited).
   - **Instagram → Mobile** (default).
   - **Facebook → Mobile** (the desktop site uses a different DOM than what these selectors target).
   - **YouTube → Mobile** (default).
2. Lite App settings → User Scripts → New script.
3. Paste the contents of `dist/hermit/<name>.user.js`. Save. Reload.

`hermit-backup/` holds Hermit's Lite App backup archives (the .hermit zips). Restore from that folder to recreate the Lite Apps themselves.

## Firefox / Chrome (desktop or Android Firefox)

The intent on Android: set **Firefox as the default browser**, install this extension, and disable per-app deep links — so messenger-shared links open in Firefox with these tweaks already applied, instead of bouncing into the destination app's UI.

To install as an unpacked extension:

- **Chrome:** chrome://extensions → enable Developer mode → "Load unpacked" → pick `dist/extension/`.
- **Firefox (desktop):** about:debugging → This Firefox → "Load Temporary Add-on" → pick `dist/extension/manifest.json`. (Permanent install requires AMO signing.)
- **Firefox (Android):** install via a Custom Collection on AMO, or sideload a signed `.xpi`.

## Updating

Edit `sites/<name>.js` → `node build.js` → commit → re-paste into Hermit (or the extension auto-reloads).
