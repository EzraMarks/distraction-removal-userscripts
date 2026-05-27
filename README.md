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
- **Firefox (desktop):** about:debugging → This Firefox → "Load Temporary Add-on" → pick `dist/extension/manifest.json`. Temporary only; for permanent install use a signed `.xpi` (below).
- **Firefox (Android):** install a signed `.xpi` — Firefox for Android refuses unsigned extensions.

### Signing an `.xpi`

1. Create an account on [addons.mozilla.org](https://addons.mozilla.org/) and generate API credentials at <https://addons.mozilla.org/developers/addon/api/key/>. You'll get a JWT issuer + secret.
2. `npm install` (one-time).
3. Bump `extension.version` in `sites.config.json` — AMO refuses duplicate versions.
4. Run:
   ```sh
   WEB_EXT_API_KEY=<jwt-issuer> WEB_EXT_API_SECRET=<jwt-secret> npm run sign
   ```
   This builds, submits to AMO's self-distribution channel (unlisted), and drops the signed `.xpi` in `dist/xpi/`.
5. Host the `.xpi` somewhere reachable (e.g. GitHub release, or `python3 -m http.server` on the same network) and open the URL in Firefox Android to install.

## Updating

Edit `sites/<name>.js` → `node build.js` → commit → re-paste into Hermit (or the extension auto-reloads).
