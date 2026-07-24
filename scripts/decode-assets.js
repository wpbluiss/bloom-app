#!/usr/bin/env node
// Decodes base64-encoded PNG assets (assets/*.png.b64) into real PNGs.
// The .b64 files are committed so the repo stays text-only for tooling that
// cannot push binary blobs; this runs automatically via `npm postinstall`.
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
for (const file of fs.readdirSync(assetsDir)) {
  if (!file.endsWith('.png.b64')) continue;
  const out = path.join(assetsDir, file.replace(/\.b64$/, ''));
  const b64 = fs.readFileSync(path.join(assetsDir, file), 'utf8').replace(/\s+/g, '');
  fs.writeFileSync(out, Buffer.from(b64, 'base64'));
  console.log(`decoded ${file} -> ${path.basename(out)}`);
}
