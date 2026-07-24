import { supabase } from './supabase';
import { formatISODate } from './weeks';

// ---------- Types (mirror of Supabase schema; do not modify schema) ----------

export type Role = 'mother' | 'partner';
export type EntryType = 'note' | 'milestone' | 'craving' | 'ultrasound';
export type MediaType = 'photo' | 'video';
export type WishlistStatus = 'wanted' | 'purchased' | 'archived';
export type FoodKind = 'craving' | 'meal' | 'avoided';

export interface Profile {
  id: string;
  display_name: string | null;
  role: Role | null;
  created_at?: string;
}

export interface Household {
  id: string;
  name: string | null;
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
    .upsert({ id: userId, display_name: displayName, role });
  if (pErr) throw pErr;

  const { data: household, error: hErr } = await supabase
    .from('households')
    .insert({ name: `${displayName}'s family` })
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
  return data as JournalEntry;
}

export async function createMediaRow(media: Omit<Media, 'id' | 'created_at' | 'signedUrl'>): Promise<void> {
  const { error } = await supabase.from('media').insert(media);
  if (error) throw error;
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

// ---------- Storage ----------

export async function signedUrl(bucket: 'journal-media' | 'wishlist-photos', path: string): Promise<string | undefined> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) return undefined;
  return data.signedUrl;
}

export async function uploadToBucket(
  bucket: 'journal-media' | 'wishlist-photos',
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
