"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { findCountry } from "@/lib/domain";
import { getCurrentShop, getCurrentUser, findCurrentShop } from "@/lib/dal";
import { slugify } from "@/lib/format";
import { isReservedSlug } from "@/lib/store-url";
import { storefrontTag } from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function readShopFields(form: FormData) {
  const fields = {
    name: str(form, "name"),
    slug: slugify(str(form, "slug") || str(form, "name")),
    country: str(form, "country"),
    city: str(form, "city"),
    phone: str(form, "phone"),
    email: str(form, "email"),
    description: str(form, "description"),
    default_delivery_fee: str(form, "default_delivery_fee"),
  };

  const country = findCountry(fields.country);
  const fee = Number(fields.default_delivery_fee || 0);
  const phoneDigits = fields.phone.replace(/[^\d]/g, "");

  let error: string | undefined;
  if (fields.name.length < 2) error = "Le nom de la boutique doit faire au moins 2 caractères.";
  else if (fields.slug.length < 3) error = "L'adresse de la boutique doit faire au moins 3 caractères.";
  else if (isReservedSlug(fields.slug)) error = "Cette adresse est réservée par OneShop. Choisissez-en une autre.";
  else if (!country) error = "Choisissez votre pays.";
  else if (!fields.city) error = "Indiquez votre ville.";
  else if (phoneDigits.length < 8) error = "Ce numéro de téléphone est trop court.";
  else if (fields.email && !/^\S+@\S+\.\S+$/.test(fields.email)) error = "Cette adresse email n'est pas valide.";
  else if (!Number.isInteger(fee) || fee < 0) error = "Les frais de livraison doivent être un montant en FCFA.";

  // Numéro stocké au format international : 07 00 00 00 00 (CI) → +2250700000000
  const phone =
    country && !fields.phone.startsWith("+") && !phoneDigits.startsWith(country.dial.slice(1))
      ? `${country.dial}${phoneDigits}`
      : `+${phoneDigits}`;

  return {
    fields,
    error,
    row: country
      ? {
          name: fields.name,
          slug: fields.slug,
          country: country.code,
          currency: country.currency,
          city: fields.city,
          phone,
          email: fields.email || null,
          description: fields.description || null,
          default_delivery_fee: fee,
        }
      : null,
  };
}

function dbError(code: string | undefined) {
  if (code === "23505") return "Cette adresse de boutique est déjà prise. Essayez-en une autre.";
  return "L'enregistrement a échoué. Réessayez.";
}

export async function createShop(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (await findCurrentShop()) redirect("/dashboard");

  const { fields, error, row } = readShopFields(form);
  if (error || !row) return { error, fields };

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("shops").insert({ ...row, owner_id: user.id });
  if (insertError) return { error: dbError(insertError.code), fields };

  redirect("/onboarding/essai");
}

export async function updateShop(_prev: FormState, form: FormData): Promise<FormState> {
  const shop = await getCurrentShop();
  const { fields, error, row } = readShopFields(form);
  if (error || !row) return { error, fields };

  const supabase = await createClient();
  const { error: updateError } = await supabase.from("shops").update(row).eq("id", shop.id);
  if (updateError) return { error: dbError(updateError.code), fields };

  updateTag(storefrontTag(shop.slug));
  if (row.slug !== shop.slug) updateTag(storefrontTag(row.slug));
  refresh();
  return { ok: true, fields };
}
