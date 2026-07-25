import { ImageSourcePropType } from 'react-native';
import { SUPABASE_URL } from './supabase';

/**
 * Category watercolor placeholders for wishlist items without a photo —
 * the same brush as the weekly illustrations, served from the public
 * `wishlist-art` bucket in the app's own Supabase project.
 */
const BASE = `${SUPABASE_URL}/storage/v1/object/public/wishlist-art`;

const ART: Record<string, string> = {
  nursery: `${BASE}/wishlist-nursery.png`,
  gear: `${BASE}/wishlist-gear.png`,
  clothing: `${BASE}/wishlist-clothing.png`,
  feeding: `${BASE}/wishlist-feeding.png`,
  'for mom': `${BASE}/wishlist-for-mom.png`,
};

/** Watercolor for a wishlist category; null when the category is unknown. */
export function wishlistCategoryArt(category: string | null | undefined): ImageSourcePropType | null {
  if (!category) return null;
  const url = ART[category.trim().toLowerCase()];
  return url ? { uri: url } : null;
}
