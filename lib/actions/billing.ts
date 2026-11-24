"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { validateCard } from "@/lib/billing/card";
import { changePlan, replaceCard, setCancelAtPeriodEnd, startTrial } from "@/lib/billing/subscriptions";
import { countProducts, findCurrentShop, findSubscription, getBillingContext } from "@/lib/dal";
import { PLANS } from "@/lib/domain";
import { storefrontTag } from "@/lib/storefront";
import type { FormState } from "@/lib/types";

// Avec un vrai prestataire, ces champs seraient remplacés par un jeton :
// le numéro de carte ne doit pas transiter par notre serveur.
function readCard(form: FormData) {
  return validateCard({
    number: String(form.get("card_number") ?? ""),
    expiry: String(form.get("card_expiry") ?? ""),
    cvc: String(form.get("card_cvc") ?? ""),
    name: String(form.get("card_name") ?? ""),
  });
}

const MISSING_SECRET =
  "Configuration incomplète : ajoutez SUPABASE_SECRET_KEY dans .env.local (Supabase > Project Settings > API > Secret keys), puis relancez le serveur.";

function billingConfigured() {
  return Boolean(process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** On ne renvoie jamais les données de carte au navigateur, seulement le nom. */
function keepName(form: FormData) {
  return { card_name: String(form.get("card_name") ?? "") };
}

export async function startTrialAction(_prev: FormState, form: FormData): Promise<FormState> {
  const shop = await findCurrentShop();
  if (!shop) redirect("/onboarding");
  if (await findSubscription()) redirect("/dashboard");
  if (!billingConfigured()) return { error: MISSING_SECRET, fields: keepName(form) };

  const result = readCard(form);
  if ("error" in result) return { error: result.error, fields: keepName(form) };

  const started = await startTrial(shop.id, result.card);
  if (started.error) return { error: started.error, fields: keepName(form) };

  updateTag(storefrontTag(shop.slug));
  redirect("/dashboard?bienvenue=1");
}

export async function updateCardAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { shop, subscription } = await getBillingContext();
  if (!billingConfigured()) return { error: MISSING_SECRET, fields: keepName(form) };
  const result = readCard(form);
  if ("error" in result) return { error: result.error, fields: keepName(form) };

  const replaced = await replaceCard(subscription, result.card);
  if (replaced.error) return { error: replaced.error, fields: keepName(form) };

  updateTag(storefrontTag(shop.slug));
  refresh();
  return { ok: true };
}

export async function changePlanAction(planId: string): Promise<{ error?: string }> {
  const { subscription } = await getBillingContext();
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return { error: "Ce plan n'existe pas." };
  if (plan.id === subscription.plan) return {};
  if (!billingConfigured()) return { error: MISSING_SECRET };
  if (subscription.status === "canceled" || subscription.status === "past_due") {
    return { error: "Mettez d'abord à jour votre carte pour réactiver votre abonnement." };
  }

  if (plan.productLimit !== null) {
    const count = await countProducts();
    if (count > plan.productLimit) {
      return {
        error: `Le plan ${plan.name} est limité à ${plan.productLimit} produits et vous en avez ${count}. Supprimez-en d'abord ${
          count - plan.productLimit
        }.`,
      };
    }
  }

  await changePlan(subscription, plan.id);
  refresh();
  return {};
}

export async function setCancelAction(cancel: boolean): Promise<{ error?: string }> {
  const { subscription } = await getBillingContext();
  if (subscription.status === "canceled") return { error: "Cet abonnement est déjà arrêté." };
  if (!billingConfigured()) return { error: MISSING_SECRET };
  await setCancelAtPeriodEnd(subscription, cancel);
  refresh();
  return {};
}
