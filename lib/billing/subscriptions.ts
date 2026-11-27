import "server-only";
import { findPlan, TRIAL_DAYS, TRIAL_PLAN, type PlanId } from "@/lib/domain";
import { requestTime } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subscription } from "@/lib/types";
import type { ValidCard } from "./card";
import { billingProvider } from "./provider";

/**
 * Cycle de vie des abonnements. Toutes les écritures passent par la clé secrète :
 * le commerçant peut lire son abonnement, jamais le modifier lui-même.
 */

const DAY = 24 * 3600 * 1000;

function addMonth(date: Date) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

export function hasAccess(sub: Subscription | null) {
  return sub !== null && (sub.status === "trialing" || sub.status === "active");
}

export function daysLeft(iso: string, now: number) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / DAY));
}

async function save(id: string, patch: Partial<Subscription>) {
  const admin = createAdminClient();
  const { data, error } = await admin.from("subscriptions").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Subscription;
}

/** Démarre l'essai gratuit sur le plan Business, carte enregistrée mais non débitée. */
export async function startTrial(shopId: string, card: ValidCard): Promise<{ error?: string }> {
  const attached = await billingProvider.attachCard(card, null);
  if (!attached.ok) return { error: attached.error };

  const trialEnd = new Date(Date.now() + TRIAL_DAYS * DAY).toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("subscriptions").insert({
    shop_id: shopId,
    plan: TRIAL_PLAN,
    status: "trialing",
    trial_ends_at: trialEnd,
    current_period_end: trialEnd,
    provider: billingProvider.id,
    provider_customer_id: attached.customerId,
    card_brand: attached.brand,
    card_last4: attached.last4,
    card_exp_month: attached.expMonth,
    card_exp_year: attached.expYear,
  });
  if (error) {
    return {
      error: error.code === "23505" ? "Cette boutique a déjà un abonnement." : "L'abonnement n'a pas pu être créé. Réessayez.",
    };
  }
  return {};
}

/**
 * Fait avancer l'abonnement s'il a atteint une échéance : fin d'essai ou fin de mois.
 * Avec un vrai prestataire, ce travail est fait par les webhooks ; ici il est fait à la lecture.
 */
export async function syncSubscription(sub: Subscription): Promise<Subscription> {
  const now = await requestTime();
  if (sub.status !== "trialing" && sub.status !== "active") return sub;

  let periodEnd = new Date(sub.current_period_end);
  if (periodEnd.getTime() > now) return sub;

  if (sub.cancel_at_period_end) return save(sub.id, { status: "canceled" });

  const amount = findPlan(sub.plan).price;
  // Rattrape les mois écoulés (si personne ne s'est connecté pendant longtemps)
  while (periodEnd.getTime() <= now) {
    const charged = await billingProvider.charge(sub.provider_customer_id ?? "", amount, sub.card_last4 ?? "");
    if (!charged.ok) {
      return save(sub.id, { status: "past_due", current_period_end: periodEnd.toISOString() });
    }
    periodEnd = addMonth(periodEnd);
  }
  return save(sub.id, { status: "active", current_period_end: periodEnd.toISOString() });
}

export async function changePlan(sub: Subscription, plan: PlanId) {
  return save(sub.id, { plan });
}

export async function setCancelAtPeriodEnd(sub: Subscription, cancel: boolean) {
  return save(sub.id, { cancel_at_period_end: cancel });
}

/**
 * Remplace la carte. Si un paiement était en échec, il est retenté tout de suite
 * avec la nouvelle carte et l'abonnement repart pour un mois.
 */
export async function replaceCard(sub: Subscription, card: ValidCard): Promise<{ error?: string }> {
  const attached = await billingProvider.attachCard(card, sub.provider_customer_id);
  if (!attached.ok) return { error: attached.error };

  const patch: Partial<Subscription> = {
    provider_customer_id: attached.customerId,
    card_brand: attached.brand,
    card_last4: attached.last4,
    card_exp_month: attached.expMonth,
    card_exp_year: attached.expYear,
  };

  if (sub.status === "past_due" || sub.status === "canceled") {
    const charged = await billingProvider.charge(attached.customerId, findPlan(sub.plan).price, attached.last4);
    if (!charged.ok) return { error: charged.error };
    Object.assign(patch, {
      status: "active",
      cancel_at_period_end: false,
      current_period_end: addMonth(new Date()).toISOString(),
    });
  }

  await save(sub.id, patch);
  return {};
}
