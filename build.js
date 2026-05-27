#!/usr/bin/env node
// Build the neutral sources in sites/ into two outputs:
//   - dist/userscripts/<name>.user.js : full userscript with metadata
//     headers. Works in both Hermit (pasted manually) and Tampermonkey
//     (auto-updates from the GitHub raw URLs in @updateURL/@downloadURL).
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

const contentScripts = [];

function pad(k) { return k.padEnd(13, ' '); }

for (const site of cfg.sites) {
  const src = fs.readFileSync(path.join(SRC, `${site.name}.js`), 'utf8');

  const url = `${cfg.userscriptBaseUrl}/${site.name}.user.js`;
  // Glob @match patterns from match patterns in sites.config.json.
  // Userscript managers accept Chrome match-pattern syntax directly.
  const lines = [
    '// ==UserScript==',
    `// ${pad('@name')} ${site.name}`,
    `// ${pad('@namespace')} https://github.com/EzraMarks/personal-app-tweaks`,
    `// ${pad('@version')} ${site.version}`,
    `// ${pad('@description')} ${cfg.extension.description}`,
    ...site.matches.map(m => `// ${pad('@match')} ${m}`),
    `// ${pad('@run-at')} document-start`,
    `// ${pad('@grant')} none`,
    `// ${pad('@downloadURL')} ${url}`,
    `// ${pad('@updateURL')} ${url}`,
    '// ==/UserScript==',
  ];
  const uaNote = site.hermit.note
    ? `${site.hermit.userAgent} (${site.hermit.note})`
    : site.hermit.userAgent;
  lines.push(`// Hermit user agent: ${uaNote}.`, '');
  const header = lines.join('\n');
  fs.writeFileSync(path.join(US_OUT, `${site.name}.user.js`), header + src);

  fs.writeFileSync(path.join(EXT_OUT, 'sites', `${site.name}.js`), src);
  contentScripts.push({
    matches: site.matches,
    js: [`sites/${site.name}.js`],
    run_at: 'document_start',
    // Run in the page's main world so JSON.parse / Response.json hooks
    // (used by the Instagram script) actually affect the page's parses.
    world: 'MAIN',
    all_frames: false,
  });
}

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

fs.writeFileSync(
  path.join(DIST, 'README.md'),
  `# dist/\n\nGenerated outputs — **do not edit by hand**.\n\n` +
  `Source: [\`sites/\`](../sites/) and [\`sites.config.json\`](../sites.config.json).\n` +
  `Regenerate: \`node build.js\` from the repo root.\n\n` +
  `- \`userscripts/<name>.user.js\` — install via Tampermonkey (recommended) or paste into Hermit.\n` +
  `- \`extension/\` — load as an unpacked extension in Chrome or Firefox.\n`
);

console.log(`built ${cfg.sites.length} site(s)`);
console.log(`  userscripts: ${path.relative(ROOT, US_OUT)}/`);
console.log(`  extension:   ${path.relative(ROOT, EXT_OUT)}/`);
