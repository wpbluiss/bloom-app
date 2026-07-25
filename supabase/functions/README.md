# Bloom Edge Functions

Server-side logic for Bloom runs as Supabase Edge Functions (Deno) on project
`olqryrntsxglehxyahzf`.

## Functions

### `find-alternatives` — "find cheaper lookalikes"

The app calls it from the wishlist screen:

```ts
supabase.functions.invoke('find-alternatives', { body: { itemId } })
```

**Flow**

1. **Auth** — the caller's user JWT is verified with `supabase.auth.getUser()`
   (the Supabase gateway also enforces `verify_jwt = true`). The function then
   loads the `wishlist_items` row and confirms the caller is in the item's
   household via `household_members` (403 otherwise). All privileged DB work
   uses the service-role key; RLS is never relied on inside the function.
2. **Query building** — `name + category`, with `target_price` appended as a
   budget signal (`... under $80`).
3. **Search (layered, env-driven)**
   - `SERPAPI_KEY` set + item has `photo_path` → a 120-second signed URL from
     the private `wishlist-photos` bucket is sent to **SerpAPI Google Lens**
     (visual lookalikes). If Lens returns nothing (or there is no photo), it
     falls back to **SerpAPI Google Shopping** with the text query.
   - `SERPAPI_KEY` missing → returns `{ ok: true, alternatives: [], pending: true }`.
     The app renders its friendly "still finding lookalikes" state — nothing
     breaks before the key is configured.
4. **Safety filter** — safety-critical baby gear (car seat, crib, bassinet,
   infant sleep, breast pump, baby monitor, formula, bottle nipple) is never
   matched with used/off-brand dupes. Results are restricted to known
   retailers (Amazon, Target, Walmart, BuyBuy Baby, Pottery Barn Kids,
   Babylist), listings titled "used / secondhand / open box / pre-owned /
   refurbished" are dropped, and the response carries a `safety_note` the app
   can surface.
5. **CPSC recall check** — free `saferproducts.gov` API, no key. If the item
   name closely matches a recall title, the function returns a
   `recall_warning` (title + URL), clears stored alternatives for the item,
   and inserts nothing. Best-effort: API failures never block the main flow.
6. **Persistence** — existing `wishlist_alternatives` rows for the item are
   deleted, then survivors (max 6, cheapest first, non-empty titles only) are
   inserted. Re-invoking is an idempotent refresh.

**Response**

```jsonc
{
  "ok": true,
  "alternatives": [{ "title": "...", "url": "...", "price": 49.99, "retailer": "Amazon", "image_url": "..." }],
  "safety_note": "...",      // only for safety-critical categories
  "recall_warning": { "title": "...", "url": "..." },  // only on recall match
  "pending": true            // only when search provider is not configured
}
```

CORS: `Access-Control-Allow-Origin: *`, `OPTIONS` preflight handled.

## Environment / secrets

Set via `npx supabase secrets set ... --project-ref olqryrntsxglehxyahzf`:

| Secret | Required | Purpose |
| --- | --- | --- |
| `SERPAPI_KEY` | Optional (activates real search) | SerpAPI Google Lens / Google Shopping |
| `SUPABASE_URL` | Auto-injected | — |
| `SUPABASE_ANON_KEY` | Auto-injected | JWT verification via `getUser()` |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | DB writes, storage signed URLs, membership check |

To activate real search (Luis):

```bash
npx supabase secrets set SERPAPI_KEY=... --project-ref olqryrntsxglehxyahzf
```

No redeploy needed — the function reads the env var per invocation.

## Cost notes

- **Supabase Edge Functions** — free tier includes 500K invocations/month;
   a wishlist lookup is one invocation, so this is effectively free at
   foreseeable scale.
- **SerpAPI** — free tier is **100 searches/month**, then paid plans from
   ~$75/mo (5K searches). One wishlist item = one search (Lens *or* Shopping,
   not both, unless Lens returns nothing). Mitigations if volume grows: cache
   results in `wishlist_alternatives` (already the design — refresh only on
   demand), debounce re-invokes in the app, or move to a retailer affiliate
   API (below) which is free.
- **CPSC Recalls API** — free, no key, no meaningful rate limit.

## Affiliate-upgrade path (monetization)

The schema and app already treat `wishlist_alternatives.url` as an opaque
link, so monetization plugs in **without app changes** — only the function
changes how it builds URLs before insert:

1. **Amazon Associates** — when `retailer` is Amazon, append our tag to the
   product URL (`?tag=bloom-20`) or rewrite to an `amazon.com/dp/<ASIN>?tag=...`
   canonical link. Store the tag in a new `AMAZON_ASSOC_TAG` secret.
2. **Impact (and other networks)** — Target, Walmart, BuyBuy Baby, Pottery
   Barn Kids and Babylist all run programs on Impact/CJ/Rakuten. Wrap the
   destination URL in the network's tracking link
   (`https://<network>.net/click?url=<encoded>&irpid=...`) at insert time.
3. **Migration order** — start with Amazon (largest share of baby-gear
   purchases), then add Impact links per retailer. A simple
   `affiliateUrl(url, retailer)` helper inside the function keeps this a
   ~20-line change; rows already in the table just get refreshed on the next
   invoke.
4. **Compliance note** — keep the safety filter as-is: affiliate tagging
   never applies to secondhand marketplaces for safety-critical categories,
   since those results are filtered out before URLs are built.
