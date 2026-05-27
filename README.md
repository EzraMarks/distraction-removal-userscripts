# personal-app-tweaks

Scripts that make social/professional apps less invasive — ads, suggested content, and engagement nudges are hidden or made unreachable, while the actually useful parts (messaging, search, profiles) still work.

Currently: LinkedIn, Instagram, Facebook, YouTube.

## Layout

- `sites/<name>.js` — neutral source for each site (an IIFE, no headers). **Edit these.**
- `sites.config.json` — per-site metadata (version, match patterns, Hermit UA, GitHub raw-content base URL).
- `build.js` — generates the deploy targets below. Run `node build.js`.
- `dist/userscripts/<name>.user.js` — generated. For Tampermonkey or Hermit.
- `dist/extension/` — generated MV3 extension bundle. Built for free but not the primary install path (see "Unpacked extension" below).

## Mobile setup (the actual goal)

Set **Firefox as the default browser** on Android and disable each app's "open links in app" setting. Now any link a friend messages you opens in Firefox with these tweaks applied, instead of bouncing into the destination app's feed.

1. Install [Firefox for Android](https://play.google.com/store/apps/details?id=org.mozilla.firefox).
2. Install [Tampermonkey](https://addons.mozilla.org/en-US/android/addon/tampermonkey/) (works in Firefox Android via the recommended add-ons collection).
3. In Tampermonkey, install each userscript by URL — Tampermonkey auto-updates them whenever you push to `main`:
   - `https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/dist/userscripts/facebook.user.js`
   - `https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/dist/userscripts/instagram.user.js`
   - `https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/dist/userscripts/linkedin.user.js`
   - `https://raw.githubusercontent.com/EzraMarks/personal-app-tweaks/main/dist/userscripts/youtube.user.js`
4. Android Settings → Apps → (each social app) → "Open by default" → off. Links now route through Firefox.

LinkedIn caveat: mobile LinkedIn is intentionally stripped-down regardless of these scripts. In Firefox Android, request the desktop site (menu → "Request desktop site") for the full UI — the `linkedin` userscript assumes that layout.

## Desktop

Install Tampermonkey in Chrome or Firefox and add the userscripts by URL (same list as above). They auto-update.

## Hermit (Android, alternative to Firefox)

Hermit Lite Apps wrap a single site in its own webview with a user-script slot — useful if you'd rather have separate "app" icons. Paste the contents of `dist/userscripts/<name>.user.js` into Hermit's user-script slot. Set the user agent per site:

- **LinkedIn → Desktop** (mobile LinkedIn is intentionally limited).
- **Instagram → Mobile**.
- **Facebook → Mobile** (the desktop site uses a different DOM than what these selectors target).
- **YouTube → Mobile**.

`hermit-backup/` holds Hermit's Lite App backup archives. Restore from that folder to recreate the Lite Apps themselves.

## Unpacked extension (rare path)

If you'd rather run a single bundled extension than use Tampermonkey:

- **Chrome:** chrome://extensions → enable Developer mode → "Load unpacked" → pick `dist/extension/`.
- **Firefox (desktop):** about:debugging → This Firefox → "Load Temporary Add-on" → pick `dist/extension/manifest.json`. Temporary only — for a permanent install or any Firefox Android use, the XPI must be signed by Mozilla, and Mozilla bans remote-code loading, so you'd have to re-sign on every change. That's why Tampermonkey is the recommended path.

## Updating

Edit `sites/<name>.js` → `node build.js` → `git push`. Tampermonkey pulls the new version automatically on its next check.
