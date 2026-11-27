"use server";

import { updateTag } from "next/cache";
import { getCurrentShop } from "@/lib/dal";
import { storefrontTag, themeContext } from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/env";
import { normalizeTheme, themeImages, type Theme } from "@/lib/theme/schema";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function themeFolder(shopId: string) {
  return `${shopId}/theme/`;
}

/** Enregistre le thème : revalidé ici, quoi que le navigateur envoie. */
export async function saveTheme(input: unknown): Promise<{ error?: string; theme?: Theme }> {
  const shop = await getCurrentShop();
  const supabase = await createClient();

  const { data: products } = await supabase.from("products").select("id").eq("shop_id", shop.id);
  const productIds = new Set((products ?? []).map((p) => p.id as string));
  const ctx = themeContext(shop, products ?? []);
  const folder = themeFolder(shop.id);

  const theme = normalizeTheme(input, ctx);
  // Seuls les produits et les images de cette boutique peuvent être référencés
  for (const section of theme.sections) {
    const s = section.settings;
    if (typeof s.productId === "string" && !productIds.has(s.productId)) s.productId = null;
    if (Array.isArray(s.productIds)) s.productIds = (s.productIds as string[]).filter((id) => productIds.has(id));
    if (typeof s.image === "string" && !s.image.startsWith(folder)) s.image = null;
  }

  const { error } = await supabase.from("shops").update({ theme }).eq("id", shop.id);
  if (error) return { error: "L'enregistrement a échoué. Vérifiez votre connexion et réessayez." };

  // Images retirées du thème : supprimées du stockage
  const before = shop.theme ? themeImages(normalizeTheme(shop.theme, ctx)) : [];
  const kept = new Set(themeImages(theme));
  const unused = before.filter((p) => p.startsWith(folder) && !kept.has(p));
  if (unused.length) await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(unused);

  updateTag(storefrontTag(shop.slug));
  return { theme };
}

/** Envoie une image de section (accroche, bénéfices…). Elle n'est utilisée qu'une fois le thème enregistré. */
export async function uploadThemeImage(form: FormData): Promise<{ error?: string; path?: string }> {
  const shop = await getCurrentShop();
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choisissez une image." };
  if (!IMAGE_TYPES[file.type]) return { error: "L'image doit être au format JPG, PNG ou WebP." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "L'image dépasse 4 Mo. Choisissez une image plus légère." };

  const supabase = await createClient();
  const path = `${themeFolder(shop.id)}${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: "L'envoi de l'image a échoué. Réessayez." };
  return { path };
}
