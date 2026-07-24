// Bloom — find-alternatives Edge Function (Deno)
//
// Looks for cheaper lookalikes of a wishlist item and writes them into
// `wishlist_alternatives`. The app calls this via:
//   supabase.functions.invoke('find-alternatives', { body: { itemId } })
//
// Deploy with:
//   supabase functions deploy find-alternatives --project-ref olqryrntsxglehxyahzf
//
// TODO(Luis): wire up a real product-search provider (e.g. SerpAPI Google
// Shopping, Rainforest API, or a retailer affiliate API). Set the API key as
// a function secret (`supabase secrets set SEARCH_API_KEY=...`) and replace
// the `searchAlternatives` stub below. Until then the function returns a
// graceful empty array so the app never crashes and simply shows
// "We're still finding lookalikes for this one".

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface Alternative {
  title: string;
  url: string | null;
  price: number | null;
  retailer: string | null;
  image_url: string | null;
}

// STUB: returns [] until a real search provider is connected.
async function searchAlternatives(_query: string, _maxPrice: number | null): Promise<Alternative[]> {
  return [];
}

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  try {
    const { itemId } = await req.json();
    if (!itemId) {
      return json({ error: 'itemId is required' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: item, error } = await supabase
      .from('wishlist_items')
      .select('id, household_id, name, target_price')
      .eq('id', itemId)
      .single();
    if (error || !item) {
      return json({ error: 'item not found' }, 404);
    }

    const alternatives = await searchAlternatives(item.name, item.target_price);

    if (alternatives.length > 0) {
      await supabase.from('wishlist_alternatives').delete().eq('item_id', itemId);
      await supabase.from('wishlist_alternatives').insert(
        alternatives.map((a) => ({ ...a, item_id: itemId }))
      );
    }

    return json({ alternatives });
  } catch (e) {
    // Never crash the app — return an empty result on any failure.
    console.error('find-alternatives failed', e);
    return json({ alternatives: [] });
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
