#!/usr/bin/env node
// Build the neutral sources in sites/ into two outputs:
//   - dist/hermit/<name>.user.js : prepended with a Tampermonkey-style
//     userscript header so Hermit's script slot accepts them.
//   - dist/extension/             : a single MV3 extension that runs the
//     same content scripts in Chrome and Firefox. Each site is its own
//     entry in content_scripts so it only loads on its host.
//
// No dependencies — just node.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'sites.config.json'), 'utf8'));

const SRC = path.join(ROOT, 'sites');
const DIST = path.join(ROOT, 'dist');
const HERMIT_OUT = path.join(DIST, 'hermit');
const EXT_OUT = path.join(DIST, 'extension');

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(HERMIT_OUT, { recursive: true });
fs.mkdirSync(path.join(EXT_OUT, 'sites'), { recursive: true });

const contentScripts = [];

for (const site of cfg.sites) {
  const src = fs.readFileSync(path.join(SRC, `${site.name}.js`), 'utf8');

  const uaNote = site.hermit.note
    ? `${site.hermit.userAgent} (${site.hermit.note})`
    : site.hermit.userAgent;
  const header = [
    '// ==UserScript==',
    `// @name     ${site.name}`,
    `// @version  ${site.version}`,
    '// ==/UserScript==',
    `// Hermit user agent: ${uaNote}.`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(HERMIT_OUT, `${site.name}.user.js`), header + src);

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

console.log(`built ${cfg.sites.length} site(s)`);
console.log(`  hermit:    ${path.relative(ROOT, HERMIT_OUT)}/`);
console.log(`  extension: ${path.relative(ROOT, EXT_OUT)}/`);
