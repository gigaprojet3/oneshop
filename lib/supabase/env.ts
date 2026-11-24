export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// La clé « publishable » (sb_publishable_…) ou l'ancienne clé « anon » fonctionnent toutes les deux.
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const PRODUCT_IMAGES_BUCKET = "product-images";

export function productImageUrl(path: string | null | undefined): string | null {
  if (!path || !supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
}
