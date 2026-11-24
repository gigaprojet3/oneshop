"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { countProducts, getBillingContext, getCurrentShop, getProduct } from "@/lib/dal";
import { findPlan } from "@/lib/domain";
import { storefrontTag } from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGES_BUCKET } from "@/lib/supabase/env";
import type { FormState } from "@/lib/types";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function readProductFields(form: FormData) {
  const fields = {
    name: str(form, "name"),
    description: str(form, "description"),
    price: str(form, "price").replace(/\s/g, ""),
    stock: str(form, "stock"),
    is_active: form.get("is_active") === "on" ? "on" : "",
  };
  const price = Number(fields.price);
  const stock = Number(fields.stock || 0);

  let error: string | undefined;
  if (fields.name.length < 2) error = "Donnez un nom au produit.";
  else if (!fields.price || !Number.isInteger(price) || price < 0)
    error = "Le prix doit être un montant entier en FCFA, par exemple 12500.";
  else if (!Number.isInteger(stock) || stock < 0) error = "Le stock doit être un nombre entier.";

  const image = form.get("image");
  const file = image instanceof File && image.size > 0 ? image : null;
  if (!error && file) {
    if (!IMAGE_TYPES[file.type]) error = "La photo doit être au format JPG, PNG ou WebP.";
    else if (file.size > MAX_IMAGE_BYTES) error = "La photo dépasse 4 Mo. Choisissez une image plus légère.";
  }

  return {
    fields,
    error,
    file,
    row: {
      name: fields.name,
      description: fields.description || null,
      price,
      stock,
      is_active: fields.is_active === "on",
    },
  };
}

async function uploadImage(shopId: string, file: File) {
  const supabase = await createClient();
  const path = `${shopId}/${crypto.randomUUID()}.${IMAGE_TYPES[file.type]}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("upload");
  return path;
}

async function removeImage(path: string | null) {
  if (!path) return;
  const supabase = await createClient();
  await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([path]);
}

export async function createProduct(_prev: FormState, form: FormData): Promise<FormState> {
  const shop = await getCurrentShop();
  const { fields, error, file, row } = readProductFields(form);
  if (error) return { error, fields };

  const { subscription } = await getBillingContext();
  const plan = findPlan(subscription.plan);
  if (plan.productLimit !== null && (await countProducts()) >= plan.productLimit) {
    return {
      error: `Votre plan ${plan.name} est limité à ${plan.productLimit} produits. Changez de plan pour en ajouter.`,
      fields,
    };
  }

  let imagePath: string | null = null;
  try {
    if (file) imagePath = await uploadImage(shop.id, file);
  } catch {
    return { error: "L'envoi de la photo a échoué. Réessayez ou enregistrez sans photo.", fields };
  }

  const supabase = await createClient();
  const { error: insertError } = await supabase
    .from("products")
    .insert({ ...row, shop_id: shop.id, image_path: imagePath });
  if (insertError) {
    await removeImage(imagePath);
    return { error: "L'enregistrement du produit a échoué. Réessayez.", fields };
  }

  updateTag(storefrontTag(shop.slug));
  redirect("/dashboard/produits");
}

export async function updateProduct(
  productId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const shop = await getCurrentShop();
  const product = await getProduct(productId);
  if (!product) return { error: "Ce produit n'existe plus." };

  const { fields, error, file, row } = readProductFields(form);
  if (error) return { error, fields };

  let imagePath = product.image_path;
  const removeRequested = form.get("remove_image") === "on";
  try {
    if (file) imagePath = await uploadImage(shop.id, file);
    else if (removeRequested) imagePath = null;
  } catch {
    return { error: "L'envoi de la photo a échoué. Réessayez.", fields };
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("products")
    .update({ ...row, image_path: imagePath })
    .eq("id", product.id)
    .eq("shop_id", shop.id);
  if (updateError) return { error: "L'enregistrement du produit a échoué. Réessayez.", fields };

  if (imagePath !== product.image_path) await removeImage(product.image_path);

  updateTag(storefrontTag(shop.slug));
  redirect("/dashboard/produits");
}

export async function deleteProduct(productId: string) {
  const shop = await getCurrentShop();
  const product = await getProduct(productId);
  if (!product) redirect("/dashboard/produits");

  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", product.id).eq("shop_id", shop.id);
  if (!error) await removeImage(product.image_path);
  updateTag(storefrontTag(shop.slug));

  redirect("/dashboard/produits");
}

export async function toggleProductActive(productId: string) {
  const shop = await getCurrentShop();
  const product = await getProduct(productId);
  if (!product) return;
  const supabase = await createClient();
  await supabase
    .from("products")
    .update({ is_active: !product.is_active })
    .eq("id", product.id)
    .eq("shop_id", shop.id);
  updateTag(storefrontTag(shop.slug));
  refresh();
}
