"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { storefrontTag } from "@/lib/storefront";
import { createPublicClient } from "@/lib/supabase/public";
import type { FormState } from "@/lib/types";

function str(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

/** Commande passée par un client sur la boutique en ligne, payée à la livraison. */
export async function placeOrder(slug: string, _prev: FormState, form: FormData): Promise<FormState> {
  const fields = {
    customer_name: str(form, "customer_name", 80),
    customer_phone: str(form, "customer_phone", 30),
    customer_email: str(form, "customer_email", 120),
    city: str(form, "city", 80),
    district: str(form, "district", 80),
    landmark: str(form, "landmark", 200),
    note: str(form, "note", 500),
  };

  let items: { product_id: string; quantity: number }[] = [];
  try {
    const parsed = JSON.parse(String(form.get("items") ?? "[]"));
    if (Array.isArray(parsed)) {
      items = parsed
        .filter((i) => typeof i?.product_id === "string" && Number.isInteger(i?.quantity) && i.quantity > 0)
        .map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
    }
  } catch {
    items = [];
  }

  let error: string | undefined;
  if (items.length === 0) error = "Votre panier est vide.";
  else if (fields.customer_name.length < 2) error = "Indiquez votre nom et prénom.";
  else if (fields.customer_phone.replace(/\D/g, "").length < 8)
    error = "Indiquez un numéro de téléphone valide : le livreur vous appellera avant de passer.";
  else if (fields.customer_email && !/^\S+@\S+\.\S+$/.test(fields.customer_email))
    error = "Cette adresse email n'est pas valide.";
  else if (fields.city.length < 2) error = "Indiquez votre ville.";
  else if (!fields.district) error = "Indiquez votre quartier ou votre commune.";
  if (error) return { error, fields };

  const supabase = createPublicClient();
  const { data, error: rpcError } = await supabase.rpc("place_storefront_order", {
    p_slug: slug,
    p_customer_name: fields.customer_name,
    p_customer_phone: fields.customer_phone,
    p_customer_email: fields.customer_email,
    p_city: fields.city,
    p_district: fields.district,
    p_landmark: fields.landmark,
    p_note: fields.note,
    p_items: items,
  });

  if (rpcError) {
    return {
      error:
        rpcError.code === "22023"
          ? `${rpcError.message}. Modifiez votre panier puis réessayez.`
          : "Votre commande n'a pas pu être envoyée. Vérifiez votre connexion et réessayez.",
      fields,
    };
  }

  updateTag(storefrontTag(slug)); // le stock affiché a changé
  redirect(`/boutique/${slug}/commande/${data as string}`);
}
