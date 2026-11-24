import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import type { StorefrontProduct, StorefrontShop } from "./types";

/** Étiquette de cache d'une boutique en ligne : invalidée à chaque modification. */
export function storefrontTag(slug: string) {
  return `boutique:${slug}`;
}

/**
 * Boutique en ligne et ses produits en vente. Mis en cache côté serveur :
 * les pages publiques restent rapides même avec beaucoup de visiteurs.
 * Renvoie null si la boutique n'existe pas ou si son abonnement est arrêté.
 */
export async function getStorefront(slug: string): Promise<{ shop: StorefrontShop; products: StorefrontProduct[] } | null> {
  "use cache";
  cacheTag(storefrontTag(slug));
  cacheLife("minutes");

  const supabase = createPublicClient();
  const [{ data: shops }, { data: products }] = await Promise.all([
    supabase.rpc("storefront_shop", { p_slug: slug }),
    supabase.rpc("storefront_products", { p_slug: slug }),
  ]);
  const shop = (shops as StorefrontShop[] | null)?.[0];
  if (!shop) return null;
  return { shop, products: (products as StorefrontProduct[] | null) ?? [] };
}
