#!/usr/bin/env node
/**
 * Bloom pre-flight smoke checks — run before every release build:
 *   node scripts/smoke.mjs
 * Exits non-zero on any failure.
 */
const BASE = process.env.BLOOM_BASE_URL ?? 'https://olqryrntsxglehxyahzf.supabase.co';
// The publishable key is public by design (it ships inside the app); RLS is the guard.
const KEY = process.env.BLOOM_PUBLISHABLE_KEY ?? 'sb_publishable_FLh8kwTvhGMrZXNQxladxw_HX6yP6Rf';

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? '✔' : '✖'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

// 1. Core tables reachable — anything but a 500 is fine (RLS may empty the rows)
for (const table of [
  'profiles',
  'pregnancies',
  'checkins',
  'journal_entries',
  'wishlist_items',
  'product_events',
  'error_reports',
]) {
  const res = await fetch(`${BASE}/rest/v1/${table}?select=*&limit=1`, { headers });
  check(`table ${table} reachable`, res.status !== 500, `HTTP ${res.status}`);
}

// 2. RLS: an anonymous event insert must be refused
{
  const res = await fetch(`${BASE}/rest/v1/product_events`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000', event: 'smoke', meta: {} }),
  });
  check('RLS refuses anonymous event insert', res.status !== 200 && res.status !== 201, `HTTP ${res.status}`);
}

// 3. Edge function demands auth
{
  const res = await fetch(`${BASE}/functions/v1/find-alternatives`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId: '00000000-0000-0000-0000-000000000000' }),
  });
  check('find-alternatives demands auth', [401, 403].includes(res.status), `HTTP ${res.status}`);
}

// 4. Public wishlist watercolor art serving
{
  const res = await fetch(`${BASE}/storage/v1/object/public/wishlist-art/wishlist-nursery.png`);
  check('wishlist watercolor art is public', res.status === 200, `HTTP ${res.status}`);
}

// 5. delete_own_account exists and refuses anonymous callers
{
  const res = await fetch(`${BASE}/rest/v1/rpc/delete_own_account`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: '{}',
  });
  check('delete_own_account guarded', res.status !== 200, `HTTP ${res.status}`);
}

if (failures) {
  console.error(`\n${failures} smoke check(s) failed.`);
  process.exit(1);
}
console.log('\nAll smoke checks passed.');
