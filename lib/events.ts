import { supabase } from './supabase';

/**
 * Product analytics — one row per meaningful action, written through RLS with
 * the user's own session (table: product_events, migration 005).
 *
 * Fire-and-forget by design: tracking must never block, throw, or alter UI.
 */

export type BloomEvent =
  | 'app_open'
  | 'checkin_done'
  | 'journal_save'
  | 'journal_quick_pick'
  | 'learn_open'
  | 'learn_complete'
  | 'learn_source_open'
  | 'wishlist_add'
  | 'deal_finder_tap'
  | 'deal_finder_autorun'
  | 'deal_open';

let cachedUid: string | null | undefined;

async function currentUid(): Promise<string | null> {
  if (cachedUid !== undefined) return cachedUid;
  try {
    const { data } = await supabase.auth.getSession(); // local, no network
    cachedUid = data.session?.user.id ?? null;
  } catch {
    cachedUid = null;
  }
  return cachedUid;
}

/** Record an event. Never awaited by callers, never throws — safe anywhere. */
export function track(event: BloomEvent, meta: Record<string, unknown> = {}): void {
  void currentUid()
    .then((uid) => {
      if (!uid) return;
      return supabase
        .from('product_events')
        .insert({ user_id: uid, event, meta })
        .then(({ error }) => {
          if (error) cachedUid = undefined; // drop cache on auth drift; next call re-resolves
        });
    })
    .catch(() => {});
}

/** Call on sign-out so the next session re-resolves identity. */
export function resetTrackingIdentity(): void {
  cachedUid = undefined;
}
