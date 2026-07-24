import { supabase } from './supabase';

/**
 * Household invite codes. Backed by migration 002 (invite_code column +
 * SECURITY DEFINER RPCs). Everything here degrades gracefully while the
 * migration is still pending: lookups return null, joins surface a warm error.
 */

export class InvalidCodeError extends Error {
  constructor() {
    super('invalid_code');
    this.name = 'InvalidCodeError';
  }
}

export interface HouseholdPreview {
  id: string;
  name: string | null;
}

/** Whose family does this code belong to? Null when the code matches nothing. */
export async function previewHouseholdByCode(code: string): Promise<HouseholdPreview | null> {
  const { data, error } = await supabase.rpc('preview_household_by_code', { code: code.trim() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row ? { id: row.id as string, name: (row.name as string) ?? null } : null;
}

/** Move the current user into the household that owns this code. Returns household id. */
export async function joinHouseholdByCode(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_household_by_code', { code: code.trim() });
  if (error) {
    if (error.message.includes('invalid_code')) throw new InvalidCodeError();
    throw error;
  }
  return data as string;
}

/** Mint a fresh code for the current household; the old one stops working. */
export async function regenerateInviteCode(): Promise<string> {
  const { data, error } = await supabase.rpc('regenerate_invite_code');
  if (error) throw error;
  return data as string;
}
