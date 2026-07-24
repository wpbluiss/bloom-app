#!/usr/bin/env node
// Decodes base64-encoded PNG assets (assets/*.png.b64) into real PNGs.
// The .b64 files are committed so the repo stays text-only for tooling that
// cannot push binary blobs; this runs automatically via `npm postinstall`.
// Fails loudly on a corrupt/truncated .b64 so the app never builds with a
// broken ./assets/icon.png reference (app.json icon/splash/adaptiveIcon).
const fs = require('fs');
const path = require('path');

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const assetsDir = path.join(__dirname, '..', 'assets');

let failed = false;
for (const file of fs.readdirSync(assetsDir)) {
  if (!file.endsWith('.png.b64')) continue;
  const out = path.join(assetsDir, file.replace(/\.b64$/, ''));
  const b64 = fs.readFileSync(path.join(assetsDir, file), 'utf8').replace(/\s+/g, '');
  const buf = Buffer.from(b64, 'base64');
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_MAGIC)) {
    console.error(`ERROR: ${file} did not decode to a valid PNG (bad base64?). Refusing to write ${path.basename(out)}.`);
    failed = true;
    continue;
  }
  fs.writeFileSync(out, buf);
  console.log(`decoded ${file} -> ${path.basename(out)}`);
}
if (failed) process.exit(1);
