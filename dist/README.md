# dist/

Generated outputs — **do not edit by hand**.

Source: [`sites/`](../sites/) and [`sites.config.json`](../sites.config.json).
Regenerate: `node build.js` from the repo root.

- `userscripts/all.user.js` — combined userscript for all sites. Primary Tampermonkey install URL.
- `userscripts/<name>.user.js` — per-site userscripts. Lighter for Hermit (each Lite App is single-site anyway).
- `extension/` — bundled MV3 extension. Load as unpacked in Chrome/Firefox.
