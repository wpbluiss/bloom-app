#!/usr/bin/env node
// Decodes base64-encoded PNG assets (assets/*.png.b64) into real PNGs.
// The .b64 files are committed so the repo stays text-only for tooling that
// cannot push binary blobs; this runs automatically via `npm postinstall`.
//
// Supported per asset (e.g. icon.png):
//   icon.png.b64            single base64 payload
//   icon.png.b64.1 .. .N    large payload split into ordered parts (concatenated)
//   icon.png.b64x[.1 .. .N] same, but XOR-obfuscated with the key below so the
//                           text has no long repeated-character runs (some
//                           tooling truncates those on write).
// Fails loudly on a corrupt/truncated payload (bad magic or missing IEND) so
// the app never builds with a broken ./assets/*.png reference.
const fs = require('fs');
const path = require('path');

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
const XOR_KEY = Buffer.from('7557e43d4638bfd3d706df0dea2a3708914328aa47dbb39a4a95fdffbbee27ba', 'hex');
const assetsDir = path.join(__dirname, '..', 'assets');

// Group payloads per output PNG: { "icon.png": [{file, part, xor}, ...] }
const groups = new Map();
for (const file of fs.readdirSync(assetsDir)) {
  const m = file.match(/^(.+\.png)\.b64(x)?(?:\.(\d+))?$/);
  if (!m) continue;
  const base = m[1];
  const part = m[3] ? parseInt(m[3], 10) : 0;
  if (!groups.has(base)) groups.set(base, []);
  groups.get(base).push({ file, part, xor: m[2] === 'x' });
}

let failed = false;
for (const [base, entries] of groups) {
  entries.sort((a, b) => a.part - b.part);
  const names = entries.map((e) => e.file).join(' + ');
  const useXor = entries[0].xor;
  if (entries.some((e) => e.xor !== useXor)) {
    console.error(`ERROR: ${names} mixes .b64 and .b64x payloads. Refusing to write ${base}.`);
    failed = true;
    continue;
  }
  const b64 = entries
    .map((e) => fs.readFileSync(path.join(assetsDir, e.file), 'utf8'))
    .join('')
    .replace(/\s+/g, '');
  const buf = Buffer.from(b64, 'base64');
  if (useXor) for (let i = 0; i < buf.length; i++) buf[i] ^= XOR_KEY[i & 31];
  const out = path.join(assetsDir, base);
  if (
    buf.length < 8 ||
    !buf.subarray(0, 8).equals(PNG_MAGIC) ||
    buf.length < 12 ||
    !buf.subarray(buf.length - 12).equals(PNG_IEND)
  ) {
    console.error(`ERROR: ${names} did not decode to a complete valid PNG (bad base64?). Refusing to write ${base}.`);
    failed = true;
    continue;
  }
  fs.writeFileSync(out, buf);
  console.log(`decoded ${names} -> ${base} (${buf.length} bytes)`);
}
if (failed) process.exit(1);
