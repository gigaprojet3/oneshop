"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { getCurrentShop, getOrder } from "@/lib/dal";
import { NEXT_STATUSES, ORDER_STATUSES, type OrderStatus } from "@/lib/domain";
import { storefrontTag } from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function createOrder(_prev: FormState, form: FormData): Promise<FormState> {
  const shop = await getCurrentShop();

  const fields = {
    customer_name: str(form, "customer_name"),
    customer_phone: str(form, "customer_phone"),
    customer_email: str(form, "customer_email"),
    city: str(form, "city"),
    district: str(form, "district"),
    landmark: str(form, "landmark"),
    note: str(form, "note"),
    delivery_fee: str(form, "delivery_fee").replace(/\s/g, ""),
    items: str(form, "items"),
  };

  let items: { product_id: string; quantity: number }[] = [];
  try {
    items = JSON.parse(fields.items || "[]");
  } catch {
    items = [];
  }
  items = items.filter((i) => typeof i.product_id === "string" && Number.isInteger(i.quantity) && i.quantity > 0);

  const fee = Number(fields.delivery_fee || 0);

  let error: string | undefined;
  if (items.length === 0) error = "Ajoutez au moins un produit à la commande.";
  else if (!fields.customer_name) error = "Indiquez le nom du client.";
  else if (fields.customer_phone.replace(/[^\d]/g, "").length < 8)
    error = "Indiquez un numéro de téléphone valide pour que le livreur puisse appeler.";
  else if (!fields.city) error = "Indiquez la ville de livraison.";
  else if (!Number.isInteger(fee) || fee < 0) error = "Les frais de livraison doivent être un montant en FCFA.";
  if (error) return { error, fields };

  const supabase = await createClient();
  const { data, error: rpcError } = await supabase.rpc("create_order", {
    p_shop_id: shop.id,
    p_customer_name: fields.customer_name,
    p_customer_phone: fields.customer_phone,
    p_customer_email: fields.customer_email,
    p_city: fields.city,
    p_district: fields.district,
    p_landmark: fields.landmark,
    p_note: fields.note,
    p_delivery_fee: fee,
    p_items: items,
  });

  if (rpcError) {
    // Les messages levés par la fonction SQL sont déjà rédigés pour le commerçant.
    const readable = rpcError.code === "22023" ? rpcError.message : "L'enregistrement de la commande a échoué. Réessayez.";
    return { error: readable, fields };
  }

  updateTag(storefrontTag(shop.slug)); // le stock a changé
  redirect(`/dashboard/commandes/${data as string}`);
}

export async function setOrderStatus(orderId: string, status: string): Promise<{ error?: string }> {
  const shop = await getCurrentShop();
  const order = await getOrder(orderId);
  if (!order) return { error: "Cette commande n'existe plus." };
  if (
    !(ORDER_STATUSES as readonly string[]).includes(status) ||
    !NEXT_STATUSES[order.status].includes(status as OrderStatus)
  ) {
    return { error: "Ce changement de statut n'est pas possible depuis l'étape actuelle." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", order.id).eq("shop_id", shop.id);
  if (error) {
    // 23514 : la remise en circulation ferait passer un stock sous zéro
    return {
      error:
        error.code === "23514"
          ? "Stock insuffisant pour relancer cette commande. Réapprovisionnez le produit d'abord."
          : "La mise à jour a échoué. Réessayez.",
    };
  }
  updateTag(storefrontTag(shop.slug)); // le stock peut revenir en vente
  refresh();
  return {};
}
