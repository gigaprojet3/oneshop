import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import { normalizeTheme, type Theme, type ThemeContext } from "./theme/schema";
import type { StorefrontProduct, StorefrontShop } from "./types";

/** Étiquette de cache d'une boutique en ligne : invalidée à chaque modification. */
export function storefrontTag(slug: string) {
  return `boutique:${slug}`;
}

export function themeContext(
  shop: Pick<StorefrontShop, "name" | "city" | "default_delivery_fee">,
  products: Pick<StorefrontProduct, "id">[],
): ThemeContext {
  return { name: shop.name, city: shop.city, deliveryFee: shop.default_delivery_fee, firstProductId: products[0]?.id ?? null };
}

/**
 * Boutique en ligne, son thème et ses produits en vente. Mis en cache côté serveur :
 * les pages publiques restent rapides même avec beaucoup de visiteurs.
 * Renvoie null si la boutique n'existe pas ou si son abonnement est arrêté.
 */
export async function getStorefront(
  slug: string,
): Promise<{ shop: StorefrontShop; theme: Theme; products: StorefrontProduct[] } | null> {
  "use cache";
  cacheTag(storefrontTag(slug));
  cacheLife("minutes");

  const supabase = createPublicClient();
  const [{ data: shops }, { data: rows }] = await Promise.all([
    supabase.rpc("storefront_shop", { p_slug: slug }),
    supabase.rpc("storefront_products", { p_slug: slug }),
  ]);
  const row = (shops as (StorefrontShop & { theme: unknown })[] | null)?.[0];
  if (!row) return null;
  const { theme: rawTheme, ...shop } = row;
  const products = (rows as StorefrontProduct[] | null) ?? [];
  return { shop, theme: normalizeTheme(rawTheme, themeContext(shop, products)), products };
}
