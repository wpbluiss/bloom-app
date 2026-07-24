#!/usr/bin/env node
// Decodes base64-encoded PNG assets (assets/*.png.b64) into real PNGs.
// The .b64 files are committed so the repo stays text-only for tooling that
// cannot push binary blobs; this runs automatically via `npm postinstall`.
// Large assets may be committed as ordered parts (icon.png.b64.1, icon.png.b64.2,
// ...) which are concatenated before decoding; a single icon.png.b64 still works.
// Fails loudly on a corrupt/truncated .b64 so the app never builds with a
// broken ./assets/icon.png reference (app.json icon/splash/adaptiveIcon).
const fs = require('fs');
const path = require('path');

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const assetsDir = path.join(__dirname, '..', 'assets');

// Group payloads per output PNG: { "icon.png": [{file, part}, ...] }
const groups = new Map();
for (const file of fs.readdirSync(assetsDir)) {
  const m = file.match(/^(.+\.png)\.b64(?:\.(\d+))?$/);
  if (!m) continue;
  const base = m[1];
  const part = m[2] ? parseInt(m[2], 10) : 0;
  if (!groups.has(base)) groups.set(base, []);
  groups.get(base).push({ file, part });
}

let failed = false;
for (const [base, entries] of groups) {
  entries.sort((a, b) => a.part - b.part);
  const names = entries.map((e) => e.file).join(' + ');
  const b64 = entries
    .map((e) => fs.readFileSync(path.join(assetsDir, e.file), 'utf8'))
    .join('')
    .replace(/\s+/g, '');
  const buf = Buffer.from(b64, 'base64');
  const out = path.join(assetsDir, base);
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    console.error(`ERROR: ${names} did not decode to a valid PNG (bad base64?). Refusing to write ${base}.`);
    failed = true;
    continue;
  }
  fs.writeFileSync(out, buf);
  console.log(`decoded ${names} -> ${base}`);
}
if (failed) process.exit(1);
