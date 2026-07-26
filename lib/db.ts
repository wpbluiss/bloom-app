import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { track } from './events';
import { formatISODate } from './weeks';

// ---------- Types (mirror of Supabase schema; do not modify schema) ----------

export type Role = 'mother' | 'partner';
export type EntryType = 'note' | 'milestone' | 'craving' | 'ultrasound';
export type MediaType = 'photo' | 'video';
export type WishlistStatus = 'wanted' | 'purchased' | 'archived';
export type FoodKind = 'craving' | 'meal' | 'avoided';

/** Storage buckets the app can read/write (signed URLs for private ones). */
export type BucketName = 'journal-media' | 'wishlist-photos' | 'avatars';

export interface Profile {
  id: string;
  display_name: string | null;
  role: Role | null;
  phone?: string | null; // added by migration 003 — absent until applied
  avatar_path?: string | null; // 'icon:<name>' sentinel or a storage path in `avatars`
  created_at?: string;
}

export interface Household {
  id: string;
  name: string | null;
  invite_code?: string | null; // added by migration 002 — absent until applied
  created_at?: string;
}

export interface HouseholdMember {
  household_id: string;
  user_id: string;
  role?: string | null;
}

export interface Pregnancy {
  id: string;
  household_id: string;
  due_date: string; // ISO date
  baby_nickname: string | null;
  baby_sex?: 'boy' | 'girl' | null; // optional; NULL until the parents know or share
  is_active: boolean;
  created_at?: string;
}

export interface Checkin {
  id?: string;
  pregnancy_id: string;
  user_id: string;
  checkin_date: string; // ISO date
  mood: string | null;
  symptoms: string[];
  notes: string | null;
}

export interface JournalEntry {
  id: string;
  household_id: string;
  pregnancy_id: string | null;
  author_id: string;
  week_number: number | null;
  entry_type: EntryType;
  title: string | null;
  body: string | null;
  entry_date: string;
  created_at?: string;
  media?: Media[];
}

export interface Media {
  id: string;
  journal_entry_id: string;
  household_id: string;
  storage_path: string;
  media_type: MediaType;
  caption: string | null;
  created_at?: string;
  signedUrl?: string;
}

export interface WishlistItem {
  id: string;
  household_id: string;
  added_by: string;
  name: string;
  category: string | null;
  photo_path: string | null;
  source_url: string | null;
  target_price: number | null;
  status: WishlistStatus;
  notes: string | null;
  created_at?: string;
  signedUrl?: string;
}

export interface WishlistAlternative {
  id: string;
  item_id: string;
  title: string;
  url: string | null;
  price: number | null;
  retailer: string | null;
  image_url: string | null;
  created_at?: string;
}

export interface FoodLog {
  id?: string;
  pregnancy_id: string;
  user_id: string;
  log_date: string;
  kind: FoodKind;
  food_name: string;
  notes: string | null;
}

// ---------- Auth / onboarding ----------

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInWithEmail(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifyOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data.session;
}

/** True when Sign in with Apple can run on this device (iOS 13+, capable hardware). */
export async function appleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Sign in with Apple → Supabase. Apple hands us an identity token; Supabase
 * verifies it against the app's Services ID. A fresh nonce rides along so the
 * token can't be replayed. Returns true on success; rethrows 'ERR_REQUEST_CANCELED'
 * when the sheet is dismissed so the caller can stay quiet.
 */
export async function signInWithApple(): Promise<boolean> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });
  if (!credential.identityToken) throw new Error('Apple returned no identity token');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  track('login', { method: 'apple' });
  // Apple only reveals the name on the very first consent — keep it if we got it.
  const name = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (name) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await supabase.from('profiles').upsert({ id: data.session.user.id, display_name: name });
    }
  }
  return true;
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchHouseholdFor(userId: string): Promise<Household | null> {
  const { data, error } = await supabase
    .from('household_members')
    .select('household_id, households(*)')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.households as unknown as Household) ?? null;
}

export async function fetchActivePregnancy(householdId: string): Promise<Pregnancy | null> {
  const { data, error } = await supabase
    .from('pregnancies')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Signup flow: profile + household + membership in one client-side flow (RLS allows). */
export async function createHouseholdForUser(userId: string, displayName: string, role: Role): Promise<Household> {
  const { error: pErr } = await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: displayName.trim() || null, role });
  if (pErr) throw pErr;

  const { data: household, error: hErr } = await supabase
    .from('households')
    .insert({ name: displayName.trim() ? `${displayName.trim()}'s family` : 'Our family' })
    .select()
    .single();
  if (hErr) throw hErr;

  const { error: mErr } = await supabase
    .from('household_members')
    .insert({ household_id: household.id, user_id: userId, role });
  if (mErr) throw mErr;

  return household as Household;
}

export async function createPregnancy(input: {
  householdId: string;
  dueDate: string;
  babyNickname?: string | null;
}): Promise<Pregnancy> {
  const { data, error } = await supabase
    .from('pregnancies')
    .insert({
      household_id: input.householdId,
      due_date: input.dueDate,
      baby_nickname: input.babyNickname ?? null,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Pregnancy;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function updatePregnancy(id: string, patch: Partial<Pregnancy>) {
  const { error } = await supabase.from('pregnancies').update(patch).eq('id', id);
  if (error) throw error;
}

/** Number of members in a household (drives the "invite your partner" card). */
export async function fetchHouseholdMemberCount(householdId: string): Promise<number | null> {
  const { count, error } = await supabase
    .from('household_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('household_id', householdId);
  if (error) return null;
  return count;
}

/** Best-effort profile lookup (RLS may scope profiles to self; degrade to []). */
export async function fetchProfilesByIds(ids: string[]): Promise<Profile[]> {
  if (ids.length === 0) return [];
  try {
    const { data, error } = await supabase.from('profiles').select('*').in('id', ids);
    if (error) return [];
    return (data ?? []) as Profile[];
  } catch {
    return [];
  }
}

// ---------- Check-ins ----------

export async function fetchTodayCheckin(pregnancyId: string, userId: string): Promise<Checkin | null> {
  const { data, error } = await supabase
    .from('checkins')
    .select('*')
    .eq('pregnancy_id', pregnancyId)
    .eq('user_id', userId)
    .eq('checkin_date', formatISODate(new Date()))
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertCheckin(checkin: Checkin): Promise<void> {
  const { error } = await supabase
    .from('checkins')
    .upsert(checkin, { onConflict: 'pregnancy_id,user_id,checkin_date' });
  if (error) throw error;
  track('checkin_done', { mood: checkin.mood, symptoms: checkin.symptoms?.length ?? 0 });
}

// ---------- Journal ----------

export async function fetchJournalEntries(householdId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*, media(*)')
    .eq('household_id', householdId)
    .order('entry_date', { ascending: false });
  if (error) throw error;
  const entries = (data ?? []) as JournalEntry[];
  await attachSignedUrls(entries);
  return entries;
}

async function attachSignedUrls(entries: JournalEntry[]) {
  const paths: Media[] = entries.flatMap((e) => e.media ?? []);
  await Promise.all(
    paths.map(async (m) => {
      m.signedUrl = await signedUrl('journal-media', m.storage_path);
    })
  );
}

export async function createJournalEntry(entry: Omit<JournalEntry, 'id' | 'created_at' | 'media'>): Promise<JournalEntry> {
  const { data, error } = await supabase.from('journal_entries').insert(entry).select().single();
  if (error) throw error;
  track('journal_save', { type: entry.entry_type, has_title: !!entry.title });
  return data as JournalEntry;
}

/** Edit a moment in place — text and type only; media rows are untouched. */
export async function updateJournalEntry(
  id: string,
  patch: Partial<Pick<JournalEntry, 'entry_type' | 'title' | 'body'>>
): Promise<void> {
  const { error } = await supabase.from('journal_entries').update(patch).eq('id', id);
  if (error) throw error;
}

export async function createMediaRow(media: Omit<Media, 'id' | 'created_at' | 'signedUrl'>): Promise<void> {
  const { error } = await supabase.from('media').insert(media);
  if (error) throw error;
}

/**
 * Total media items (photos + videos) in a household's journal — drives the
 * free-tier cap (25 items). Fails open (0) so a network blip never blocks a memory.
 */
export async function countHouseholdMedia(householdId: string): Promise<number> {
  const { count, error } = await supabase
    .from('media')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId);
  if (error) return 0;
  return count ?? 0;
}

/**
 * Media items added since an ISO timestamp — drives the free-tier +Moment
 * monthly cap (10/month, counted from the first of the calendar month).
 * Fails open (0) for the same reason.
 */
export async function countMediaSince(householdId: string, sinceISO: string): Promise<number> {
  const { count, error } = await supabase
    .from('media')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .gte('created_at', sinceISO);
  if (error) return 0;
  return count ?? 0;
}

// ---------- Wishlist ----------

export async function fetchWishlist(householdId: string): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*')
    .eq('household_id', householdId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const items = (data ?? []) as WishlistItem[];
  await Promise.all(
    items.map(async (it) => {
      if (it.photo_path) it.signedUrl = await signedUrl('wishlist-photos', it.photo_path);
    })
  );
  return items;
}

export async function createWishlistItem(item: Omit<WishlistItem, 'id' | 'created_at' | 'signedUrl'>): Promise<WishlistItem> {
  const { data, error } = await supabase.from('wishlist_items').insert(item).select().single();
  if (error) throw error;
  track('wishlist_add', { category: item.category, has_price: item.target_price != null });
  // Deal finder auto-run (E3): hunt alternatives in the background the moment an
  // item is saved — every wishlist item becomes a savings moment without a tap.
  track('deal_finder_autorun', { item: data.id });
  void findAlternatives(data.id).catch(() => {});
  return data as WishlistItem;
}

export async function updateWishlistItem(id: string, patch: Partial<WishlistItem>) {
  const { error } = await supabase.from('wishlist_items').update(patch).eq('id', id);
  if (error) throw error;
}

export async function fetchAlternatives(itemId: string): Promise<WishlistAlternative[]> {
  const { data, error } = await supabase
    .from('wishlist_alternatives')
    .select('*')
    .eq('item_id', itemId)
    .order('price', { ascending: true });
  if (error) throw error;
  return (data ?? []) as WishlistAlternative[];
}

export async function findAlternatives(itemId: string): Promise<WishlistAlternative[]> {
  const { data, error } = await supabase.functions.invoke('find-alternatives', { body: { itemId } });
  if (error) throw error;
  return ((data as { alternatives?: WishlistAlternative[] })?.alternatives ?? []) as WishlistAlternative[];
}

// ---------- Food logs ----------

export async function fetchFoodLogs(pregnancyId: string, kind?: FoodKind): Promise<FoodLog[]> {
  let q = supabase
    .from('food_logs')
    .select('*')
    .eq('pregnancy_id', pregnancyId)
    .order('log_date', { ascending: false });
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as FoodLog[];
}

export async function createFoodLog(log: FoodLog): Promise<void> {
  const { error } = await supabase.from('food_logs').insert(log);
  if (error) throw error;
}

// ---------- Partner ping-pong ("For you both") ----------

export type PartnerActivity =
  | { kind: 'mood'; mood: string; note: string | null; date: string; userId: string }
  | { kind: 'craving'; food: string; date: string; userId: string }
  | { kind: 'journal'; snippet: string; date: string; userId: string };

/**
 * The other person's freshest trace in this pregnancy — latest mood check-in,
 * craving, or journal note — so each open reveals what your partner just did.
 * Returns null when nothing exists yet or the query isn't permitted.
 */
export async function fetchLatestPartnerActivity(
  pregnancyId: string,
  householdId: string,
  myUserId: string
): Promise<PartnerActivity | null> {
  try {
    const [checkins, cravings, journal] = await Promise.all([
      supabase
        .from('checkins')
        .select('user_id, mood, notes, checkin_date')
        .eq('pregnancy_id', pregnancyId)
        .neq('user_id', myUserId)
        .order('checkin_date', { ascending: false })
        .limit(1),
      supabase
        .from('food_logs')
        .select('user_id, food_name, log_date')
        .eq('pregnancy_id', pregnancyId)
        .eq('kind', 'craving')
        .neq('user_id', myUserId)
        .order('log_date', { ascending: false })
        .limit(1),
      supabase
        .from('journal_entries')
        .select('author_id, title, body, entry_date')
        .eq('household_id', householdId)
        .neq('author_id', myUserId)
        .order('entry_date', { ascending: false })
        .limit(1),
    ]);

    const candidates: PartnerActivity[] = [];
    const c = checkins.data?.[0];
    if (c?.mood) {
      candidates.push({ kind: 'mood', mood: c.mood as string, note: (c.notes as string) ?? null, date: c.checkin_date as string, userId: c.user_id as string });
    }
    const f = cravings.data?.[0];
    if (f) {
      candidates.push({ kind: 'craving', food: f.food_name as string, date: f.log_date as string, userId: f.user_id as string });
    }
    const j = journal.data?.[0];
    if (j) {
      const snippet = ((j.title as string) || (j.body as string) || '').slice(0, 80);
      if (snippet) {
        candidates.push({ kind: 'journal', snippet, date: j.entry_date as string, userId: j.author_id as string });
      }
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => (a.date < b.date ? 1 : -1));
    return candidates[0];
  } catch (e) {
    console.warn('partner activity unavailable', e);
    return null;
  }
}

// ---------- Storage ----------

export async function signedUrl(bucket: BucketName, path: string): Promise<string | undefined> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data.signedUrl;
}

export async function uploadToBucket(
  bucket: BucketName,
  householdId: string,
  bytes: ArrayBuffer | Uint8Array,
  ext: string,
  contentType: string
): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${householdId}/${id}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType });
  if (error) throw error;
  return path;
}

// ---------- Account deletion (App Review 5.1.1(v)) ----------

/**
 * Permanently delete the account and everything the user authored, via the
 * server-side security-definer function (migration 006). Shared memories stay
 * with the partner; a solo household is removed entirely. Signs out after.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
