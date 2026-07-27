// Bloom — find-alternatives Edge Function (Deno)
//
// Finds cheaper lookalikes of a wishlist item and writes them into
// `wishlist_alternatives`. The app calls this via:
//   supabase.functions.invoke('find-alternatives', { body: { itemId } })
//
// Layers:
//   1. Auth — user JWT verified via supabase-js getUser() (gateway verify_jwt
//      is also ON), then household membership is enforced before any work.
//   2. Search — SerpAPI (Google Lens when the item has a photo, else Google
//      Shopping). Without SERPAPI_KEY the function returns
//      { ok: true, alternatives: [], pending: true } so the app keeps showing
//      its "still finding lookalikes" state.
//   3. Safety filter — safety-critical baby gear (car seats, cribs, etc.)
//      is restricted to known retailers and new products only.
//   4. CPSC recall check — free saferproducts.gov API, no key required.
//
// Deploy:
//   supabase functions deploy find-alternatives --project-ref olqryrntsxglehxyahzf
// Secrets (Luis):
//   npx supabase secrets set SERPAPI_KEY=... --project-ref olqryrntsxglehxyahzf
//   (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are
//    injected automatically by the Supabase Edge runtime.)

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_ALTERNATIVES = 6;
const PHOTO_BUCKET = 'wishlist-photos';

// Retailers we trust for safety-critical categories (matched case-insensitively
// against the SerpAPI "source" field).
const KNOWN_RETAILERS = [
  'amazon',
  'target',
  'walmart',
  'buybuy baby',
  'buybuybaby',
  'pottery barn kids',
  'babylist',
];

// Safety-critical baby gear: never suggest used / off-brand dupes for these.
const SAFETY_CRITICAL: { re: RegExp; label: string }[] = [
  { re: /car[\s-]?seat/i, label: 'car seat' },
  { re: /\bcrib\b/i, label: 'crib' },
  { re: /bassinet/i, label: 'bassinet' },
  { re: /infant[\s-]?sleep|sleep[\s-]?(sack|positioner)|baby[\s-]?lounger|infant[\s-]?lounger/i, label: 'infant sleep' },
  { re: /breast[\s-]?pump/i, label: 'breast pump' },
  { re: /baby[\s-]?monitor/i, label: 'baby monitor' },
  { re: /formula/i, label: 'formula' },
  { re: /bottle[\s-]?nipple/i, label: 'bottle nipple' },
];

// Titles that indicate a secondhand / non-new listing.
const SECONDHAND_RE = /\b(used|second[\s-]?hand|open[\s-]?box|pre[\s-]?owned|preowned|refurbished)\b/i;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WishlistItem {
  id: string;
  household_id: string;
  name: string;
  category: string | null;
  target_price: number | null;
  photo_path: string | null;
}

interface Alternative {
  title: string;
  url: string | null;
  price: number | null;
  retailer: string | null;
  image_url: string | null;
}

interface RecallMatch {
  title: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function parsePrice(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}

function safetyCategoryFor(item: WishlistItem): string | null {
  const haystack = `${item.name} ${item.category ?? ''}`;
  for (const { re, label } of SAFETY_CRITICAL) {
    if (re.test(haystack)) return label;
  }
  return null;
}

function isKnownRetailer(source: string | null): boolean {
  if (!source) return false;
  const s = source.toLowerCase();
  return KNOWN_RETAILERS.some((r) => s.includes(r));
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// "Close" match: containment either way, or >=60% token overlap of the item
// name against the recall title.
function isCloseRecallMatch(name: string, recallTitle: string): boolean {
  const a = normalize(name);
  const b = normalize(recallTitle);
  if (!a || !b) return false;
  if (b.includes(a) || a.includes(b)) return true;
  const nameTokens = new Set(a.split(' ').filter((t) => t.length > 2));
  const titleTokens = new Set(b.split(' ').filter((t) => t.length > 2));
  if (nameTokens.size === 0) return false;
  let overlap = 0;
  for (const t of nameTokens) if (titleTokens.has(t)) overlap++;
  return overlap / nameTokens.size >= 0.6;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// CPSC recall check (free, no API key)
// ---------------------------------------------------------------------------

async function checkRecalls(itemName: string): Promise<RecallMatch[]> {
  try {
    const url =
      'https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallTitle=' +
      encodeURIComponent(itemName);
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) return [];
    const recalls = (await res.json()) as Array<{ Title?: string; URL?: string }>;
    if (!Array.isArray(recalls)) return [];
    return recalls
      .filter((r) => r?.Title && isCloseRecallMatch(itemName, r.Title))
      .slice(0, 3)
      .map((r) => ({ title: r.Title as string, url: r.URL ?? 'https://www.saferproducts.gov' }));
  } catch (e) {
    // Recall checks are best-effort; never block the main flow.
    console.warn('CPSC recall check failed', e);
    return [];
  }
}

// ---------------------------------------------------------------------------
// SerpAPI search (Google Lens when a photo exists, else Google Shopping)
// ---------------------------------------------------------------------------

async function searchWithSerpApi(
  item: WishlistItem,
  signedPhotoUrl: string | null,
): Promise<Alternative[]> {
  const apiKey = Deno.env.get('SERPAPI_KEY');
  if (!apiKey) return [];

  const budget = item.target_price != null ? ` under $${item.target_price}` : '';
  const textQuery = `${item.name} ${item.category ?? ''}${budget}`.replace(/\s+/g, ' ').trim();

  let results: Alternative[] = [];

  if (signedPhotoUrl) {
    // Google Lens: visual lookalike search from the item photo.
    const params = new URLSearchParams({
      engine: 'google_lens',
      url: signedPhotoUrl,
      api_key: apiKey,
      hl: 'en',
      country: 'us',
    });
    const res = await fetchWithTimeout(`https://serpapi.com/search.json?${params}`, 15000);
    if (res.ok) {
      const data = await res.json();
      const matches = Array.isArray(data?.visual_matches) ? data.visual_matches : [];
      results = matches.map((m: Record<string, unknown>) => ({
        title: String(m.title ?? ''),
        url: (m.link as string) ?? null,
        price: parsePrice((m.price as Record<string, unknown> | undefined)?.extracted_value ?? m.price),
        retailer: (m.source as string) ?? null,
        image_url: (m.thumbnail as string) ?? null,
      }));
    } else {
      console.warn('SerpAPI google_lens failed', res.status);
    }
  }

  if (results.length === 0) {
    // Google Shopping: text search (also the fallback when Lens finds nothing).
    const params = new URLSearchParams({
      engine: 'google_shopping',
      q: textQuery,
      api_key: apiKey,
      gl: 'us',
      hl: 'en',
      num: '12',
    });
    const res = await fetchWithTimeout(`https://serpapi.com/search.json?${params}`, 15000);
    if (!res.ok) throw new Error(`SerpAPI google_shopping failed: ${res.status}`);
    const data = await res.json();
    const matches = Array.isArray(data?.shopping_results) ? data.shopping_results : [];
    results = matches.map((m: Record<string, unknown>) => ({
      title: String(m.title ?? ''),
      url: (m.link as string) ?? (m.product_link as string) ?? null,
      price: parsePrice(m.extracted_price ?? m.price),
      retailer: (m.source as string) ?? null,
      image_url: (m.thumbnail as string) ?? null,
    }));
  }

  return results.filter((r) => r.title.trim().length > 0);
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const { itemId } = await req.json();
    if (!itemId || typeof itemId !== 'string') {
      return json({ ok: false, error: 'itemId is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1) Auth: verify the caller's JWT.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ ok: false, error: 'Missing Authorization header' }, 401);
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return json({ ok: false, error: 'Unauthorized' }, 401);
    }

    // Service-role client for privileged reads/writes (bypasses RLS).
    const admin = createClient(supabaseUrl, serviceKey);

    // 2) Load the wishlist item.
    const { data: item, error: itemError } = await admin
      .from('wishlist_items')
      .select('id, household_id, name, category, target_price, photo_path')
      .eq('id', itemId)
      .single();
    if (itemError || !item) {
      return json({ ok: false, error: 'Item not found' }, 404);
    }

    // 3) Authorization: caller must belong to the item's household.
    const { data: membership } = await admin
      .from('household_members')
      .select('user_id')
      .eq('household_id', item.household_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) {
      return json({ ok: false, error: 'Not a member of this household' }, 403);
    }

    // 4) Safety classification (from research: never dupe safety-critical gear).
    const safetyCategory = safetyCategoryFor(item as WishlistItem);
    const safetyNote = safetyCategory
      ? `For safety, we only suggest new, certified options for ${safetyCategory} — never secondhand or unbranded.`
      : undefined;

    // 5) CPSC recall check (best-effort, free).
    const recalls = await checkRecalls(item.name);
    if (recalls.length > 0) {
      // The item itself looks recalled: warn and do not suggest alternatives.
      await admin.from('wishlist_alternatives').delete().eq('item_id', itemId);
      return json({
        ok: true,
        alternatives: [],
        recall_warning: { title: recalls[0].title, url: recalls[0].url },
        ...(safetyNote ? { safety_note: safetyNote } : {}),
      });
    }

    // 6) Search. Without SERPAPI_KEY we stay in the graceful "pending" state.
    if (!Deno.env.get('SERPAPI_KEY')) {
      return json({
        ok: true,
        alternatives: [],
        pending: true,
        ...(safetyNote ? { safety_note: safetyNote } : {}),
      });
    }

    // Signed photo URL for Google Lens (private bucket -> temporary URL).
    let signedPhotoUrl: string | null = null;
    if (item.photo_path) {
      const { data: signed, error: signError } = await admin.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(item.photo_path, 120);
      if (signError) console.warn('createSignedUrl failed', signError);
      signedPhotoUrl = signed?.signedUrl ?? null;
    }

    let alternatives = await searchWithSerpApi(item as WishlistItem, signedPhotoUrl);

    // 7) Safety filter for safety-critical categories.
    if (safetyCategory) {
      alternatives = alternatives.filter(
        (a) => isKnownRetailer(a.retailer) && !SECONDHAND_RE.test(a.title),
      );
    }

    // Cheapest first, nulls last; keep at most MAX_ALTERNATIVES.
    alternatives.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    alternatives = alternatives.slice(0, MAX_ALTERNATIVES);

    // 8) Idempotent refresh of wishlist_alternatives.
    await admin.from('wishlist_alternatives').delete().eq('item_id', itemId);
    if (alternatives.length > 0) {
      const rows = alternatives
        .filter((a) => a.title.trim().length > 0) // never insert empty titles
        .map((a) => ({ ...a, item_id: itemId }));
      if (rows.length > 0) {
        const { error: insertError } = await admin.from('wishlist_alternatives').insert(rows);
        if (insertError) throw insertError;
      }
    }

    return json({
      ok: true,
      alternatives,
      ...(safetyNote ? { safety_note: safetyNote } : {}),
    });
  } catch (e) {
    console.error('find-alternatives failed', e);
    return json({ ok: false, alternatives: [], error: String(e) }, 500);
  }
});
