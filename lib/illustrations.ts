import { Image, ImageSourcePropType } from 'react-native';
import { SUPABASE_URL } from './supabase';
import { clampWeek } from './weeks';

/**
 * The signature set: one soft watercolor spot illustration per week (4–40),
 * matching that week's size comparison. Served from the public `illustrations`
 * bucket in the app's own Supabase project (read-only, ~120KB each) and cached
 * on device by the native image stack.
 *
 * To vendor the PNGs into the repo instead (assets/illustrations/), run
 * scripts/import-illustrations.sh, commit the PNGs, and swap in
 * lib/illustrations.local.ts for this file.
 */
const BASE = `${SUPABASE_URL}/storage/v1/object/public/illustrations`;

export function weekIllustrationUrl(week: number): string {
  const n = String(clampWeek(week)).padStart(2, '0');
  return `${BASE}/week-${n}.png`;
}

/** Watercolor for the given pregnancy week (clamped to 4–40). */
export function weekIllustration(week: number): ImageSourcePropType {
  return { uri: weekIllustrationUrl(week) };
}

/** Warm the on-device cache for upcoming weeks; fire-and-forget. */
export function prefetchIllustrations(weeks: number[]): void {
  weeks.forEach((w) => {
    Image.prefetch(weekIllustrationUrl(w)).catch(() => false);
  });
}
