#!/usr/bin/env node
// Build the neutral sources in sites/ into three outputs:
//   - dist/userscripts/<name>.user.js : one userscript per site. Lighter
//     for Hermit (each Lite App is single-site anyway). Also installable
//     in Tampermonkey if you want per-site versioning/disabling.
//   - dist/userscripts/all.user.js    : a single combined userscript that
//     dispatches by hostname. The primary Tampermonkey install URL —
//     one URL, one auto-update entry, one version field to bump.
//   - dist/extension/                  : a single MV3 extension that runs
//     the same content scripts in Chrome and Firefox.
//
// No dependencies — just node.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'sites.config.json'), 'utf8'));

const SRC = path.join(ROOT, 'sites');
const DIST = path.join(ROOT, 'dist');
const US_OUT = path.join(DIST, 'userscripts');
const EXT_OUT = path.join(DIST, 'extension');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(US_OUT, { recursive: true });
fs.mkdirSync(path.join(EXT_OUT, 'sites'), { recursive: true });

function pad(k) { return k.padEnd(13, ' '); }

// Derive a hostname regex from a site's match pattern. Match patterns
// look like "*://*.facebook.com/*"; we want /(?:^|\.)facebook\.com$/.
function hostRegex(matchPattern) {
  const host = matchPattern.replace(/^\*:\/\/\*\./, '').replace(/\/\*$/, '');
  return `/(?:^|\\.)${host.replace(/\./g, '\\.')}$/`;
}

function userscriptHeader({ name, version, matches, url, footer }) {
  const lines = [
    '// ==UserScript==',
    `// ${pad('@name')} ${name}`,
    `// ${pad('@namespace')} https://github.com/EzraMarks/distraction-removal-userscripts`,
    `// ${pad('@version')} ${version}`,
    `// ${pad('@description')} ${cfg.extension.description}`,
    ...matches.map(m => `// ${pad('@match')} ${m}`),
    `// ${pad('@run-at')} document-start`,
    `// ${pad('@grant')} none`,
    `// ${pad('@downloadURL')} ${url}`,
    `// ${pad('@updateURL')} ${url}`,
    '// ==/UserScript==',
  ];
  if (footer) lines.push(footer);
  lines.push('');
  return lines.join('\n');
}

const contentScripts = [];
const allMatches = [];
const bundleParts = [];

for (const site of cfg.sites) {
  const src = fs.readFileSync(path.join(SRC, `${site.name}.js`), 'utf8');

  // ── Per-site userscript ────────────────────────────────────────────
  const uaNote = site.hermit.note
    ? `${site.hermit.userAgent} (${site.hermit.note})`
    : site.hermit.userAgent;
  const perSiteHeader = userscriptHeader({
    name: site.name,
    version: site.version,
    matches: site.matches,
    url: `${cfg.userscriptBaseUrl}/${site.name}.user.js`,
    footer: `// Hermit user agent: ${uaNote}.`,
  });
  fs.writeFileSync(path.join(US_OUT, `${site.name}.user.js`), perSiteHeader + src);

  // ── Bundle parts (gated by hostname) ───────────────────────────────
  // Each per-site source is already an IIFE; wrapping in `if (host
  // matches) { ... }` is enough to keep only one branch active per page.
  // Use the FIRST @match pattern's host as the gate (good enough; all
  // current sites have one match each).
  bundleParts.push(`// ── ${site.name} ──`);
  bundleParts.push(`if (${hostRegex(site.matches[0])}.test(location.hostname)) {`);
  bundleParts.push(src.trimEnd());
  bundleParts.push('}');
  bundleParts.push('');
  for (const m of site.matches) {
    if (!allMatches.includes(m)) allMatches.push(m);
  }

  // ── Extension content script ───────────────────────────────────────
  fs.writeFileSync(path.join(EXT_OUT, 'sites', `${site.name}.js`), src);
  contentScripts.push({
    matches: site.matches,
    js: [`sites/${site.name}.js`],
    run_at: 'document_start',
    // Run in the page's main world so JSON.parse / Response.json hooks
    // (used by the Instagram script) affect the page's actual parses.
    world: 'MAIN',
    all_frames: false,
  });
}

// ── Combined "all" userscript ─────────────────────────────────────────
// Version: max of per-site versions. Any single-site bump bumps the bundle,
// so Tampermonkey re-pulls on the next check.
const bundleVersion = Math.max(...cfg.sites.map(s => s.version));
const bundleHeader = userscriptHeader({
  name: 'distraction-removal-userscripts',
  version: bundleVersion,
  matches: allMatches,
  url: `${cfg.userscriptBaseUrl}/all.user.js`,
});
fs.writeFileSync(
  path.join(US_OUT, 'all.user.js'),
  bundleHeader + bundleParts.join('\n')
);

// ── MV3 extension manifest ────────────────────────────────────────────
const manifest = {
  manifest_version: 3,
  name: cfg.extension.name,
  version: cfg.extension.version,
  description: cfg.extension.description,
  browser_specific_settings: { gecko: { id: cfg.extension.geckoId } },
  content_scripts: contentScripts,
};
fs.writeFileSync(
  path.join(EXT_OUT, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n'
);

// ── dist/ README ──────────────────────────────────────────────────────
fs.writeFileSync(
  path.join(DIST, 'README.md'),
  `# dist/\n\nGenerated outputs — **do not edit by hand**.\n\n` +
  `Source: [\`sites/\`](../sites/) and [\`sites.config.json\`](../sites.config.json).\n` +
  `Regenerate: \`node build.js\` from the repo root.\n\n` +
  `- \`userscripts/all.user.js\` — combined userscript for all sites. ` +
  `Primary Tampermonkey install URL.\n` +
  `- \`userscripts/<name>.user.js\` — per-site userscripts. Lighter for ` +
  `Hermit (each Lite App is single-site anyway).\n` +
  `- \`extension/\` — bundled MV3 extension. Load as unpacked in Chrome/Firefox.\n`
);

console.log(`built ${cfg.sites.length} site(s) + 1 bundle (v${bundleVersion})`);
console.log(`  userscripts: ${path.relative(ROOT, US_OUT)}/`);
console.log(`  extension:   ${path.relative(ROOT, EXT_OUT)}/`);
