import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { hasAccess, syncSubscription } from "./billing/subscriptions";
import { createClient } from "./supabase/server";
import type { Order, OrderWithItems, Product, Shop, Subscription } from "./types";

/**
 * Couche d'accès aux données : toutes les lectures passent par ici.
 * Chaque fonction revérifie la session ; la base applique en plus ses règles RLS.
 */

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/connexion");
  return { id: claims.sub, email: (claims.email as string | undefined) ?? "" };
});

/** La boutique du commerçant connecté, ou null s'il ne l'a pas encore créée. */
export const findCurrentShop = cache(async (): Promise<Shop | null> => {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("*").eq("owner_id", user.id).maybeSingle();
  return (data as Shop | null) ?? null;
});

/** L'abonnement de la boutique, mis à jour s'il a atteint une échéance. */
export const findSubscription = cache(async (): Promise<Subscription | null> => {
  const shop = await findCurrentShop();
  if (!shop) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("subscriptions").select("*").eq("shop_id", shop.id).maybeSingle();
  if (!data) return null;
  return syncSubscription(data as Subscription);
});

/**
 * Boutique et abonnement, sans exiger que l'abonnement soit à jour.
 * Sert aux pages de facturation, qui doivent rester accessibles après un échec de paiement.
 */
export const getBillingContext = cache(async (): Promise<{ shop: Shop; subscription: Subscription }> => {
  const shop = await findCurrentShop();
  if (!shop) redirect("/onboarding");
  const subscription = await findSubscription();
  if (!subscription) redirect("/onboarding/essai");
  return { shop, subscription };
});

/**
 * La boutique du commerçant connecté, avec un essai ou un abonnement en cours.
 * Sinon : création de boutique, saisie de carte ou page d'abonnement selon le cas.
 */
export const getCurrentShop = cache(async (): Promise<Shop> => {
  const { shop, subscription } = await getBillingContext();
  if (!hasAccess(subscription)) redirect("/dashboard/abonnement");
  return shop;
});

export async function listProducts(opts: { query?: string } = {}) {
  const shop = await getCurrentShop();
  const supabase = await createClient();
  let req = supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });
  if (opts.query) req = req.ilike("name", `%${opts.query}%`);
  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as Product[];
}

export async function countProducts() {
  const shop = await getCurrentShop();
  const supabase = await createClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", shop.id);
  return count ?? 0;
}

export async function getProduct(id: string) {
  const shop = await getCurrentShop();
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("id", id)
    .maybeSingle();
  return (data as Product | null) ?? null;
}

export async function listOrders(opts: { status?: string; limit?: number } = {}) {
  const shop = await getCurrentShop();
  const supabase = await createClient();
  let req = supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.status) req = req.eq("status", opts.status);
  const { data, error } = await req;
  if (error) throw error;
  return (data ?? []) as OrderWithItems[];
}

export async function getOrder(id: string) {
  const shop = await getCurrentShop();
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("shop_id", shop.id)
    .eq("id", id)
    .maybeSingle();
  return (data as OrderWithItems | null) ?? null;
}

/** Commandes des 30 derniers jours, pour le tableau de bord. */
export async function recentOrderStats() {
  const shop = await getCurrentShop();
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabase
    .from("orders")
    .select("id, number, status, total, customer_name, customer_phone, city, district, created_at, updated_at, source")
    .eq("shop_id", shop.id)
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pick<
    Order,
    | "id"
    | "number"
    | "status"
    | "total"
    | "customer_name"
    | "customer_phone"
    | "city"
    | "district"
    | "created_at"
    | "updated_at"
    | "source"
  >[];
}

export async function lowStockProducts(threshold = 3) {
  const shop = await getCurrentShop();
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, stock")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .lte("stock", threshold)
    .order("stock", { ascending: true })
    .limit(5);
  return (data ?? []) as Pick<Product, "id" | "name" | "stock">[];
}
