import type { Metadata } from "next";
import { Suspense } from "react";
import { CardForm } from "@/components/card-form";
import { CheckIcon } from "@/components/icons";
import { PageHeader, Panel, Skeleton } from "@/components/ui";
import { updateCardAction } from "@/lib/actions/billing";
import { BRAND_LABEL, type CardBrand } from "@/lib/billing/card";
import { isSimulatedBilling } from "@/lib/billing/provider";
import { daysLeft } from "@/lib/billing/subscriptions";
import { getBillingContext } from "@/lib/dal";
import { PLANS, countryTimeZone, findPlan } from "@/lib/domain";
import { fcfa } from "@/lib/format";
import type { Subscription } from "@/lib/types";
import { CancelToggle, ChoosePlanButton } from "./plan-actions";

export const metadata: Metadata = { title: "Abonnement" };

export default function SubscriptionPage() {
  return (
    <>
      <PageHeader title="Abonnement" description="Votre plan, votre carte et vos prochains paiements, en FCFA." />
      <Suspense fallback={<Skeleton className="h-[32rem]" />}>
        <Billing />
      </Suspense>
    </>
  );
}

function longDate(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone }).format(
    new Date(iso),
  );
}

function statusLine(sub: Subscription, tz: string) {
  const plan = findPlan(sub.plan);
  const end = longDate(sub.current_period_end, tz);
  switch (sub.status) {
    case "trialing": {
      const days = daysLeft(sub.trial_ends_at ?? sub.current_period_end);
      return sub.cancel_at_period_end
        ? `Essai gratuit jusqu'au ${end}. L'abonnement s'arrêtera ensuite, rien ne sera débité.`
        : `Essai gratuit, encore ${days} jour${days > 1 ? "s" : ""}. Premier débit de ${fcfa(plan.price)} le ${end}.`;
    }
    case "active":
      return sub.cancel_at_period_end
        ? `Abonnement arrêté à partir du ${end}. Votre boutique reste ouverte jusque-là.`
        : `Prochain débit de ${fcfa(plan.price)} le ${end}.`;
    case "past_due":
      return `Le paiement du ${end} a échoué. Votre boutique est fermée aux clients jusqu'au règlement.`;
    case "canceled":
      return "Abonnement arrêté. Votre boutique est fermée aux clients.";
  }
}

async function Billing() {
  const { shop, subscription: sub } = await getBillingContext();
  const tz = countryTimeZone(shop.country);
  const current = findPlan(sub.plan);
  const blocked = sub.status === "past_due" || sub.status === "canceled";
  const brand = (sub.card_brand ?? "inconnue") as CardBrand;

  return (
    <div className="flex flex-col gap-8">
      <Panel className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold text-ink-soft">Votre plan</p>
          <p className="mt-1 text-2xl font-bold tracking-[-0.02em]">
            {current.name} <span className="tabular text-lg font-medium text-ink-soft">{fcfa(current.price)} / mois</span>
          </p>
          <p className={`mt-2 max-w-[60ch] ${blocked ? "font-semibold text-kola-700" : "text-ink-soft"}`}>
            {statusLine(sub, tz)}
          </p>
        </div>
        {!blocked ? (
          <CancelToggle cancelAtPeriodEnd={sub.cancel_at_period_end} endLabel={longDate(sub.current_period_end, tz)} />
        ) : null}
      </Panel>

      <div>
        <h2 className="mb-4 text-xl font-bold tracking-[-0.02em]">Changer de plan</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === current.id;
            return (
              <section
                key={plan.id}
                className={`flex flex-col rounded-panel bg-surface p-6 ${
                  isCurrent ? "ring-2 ring-baobab-700" : "border border-line"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {isCurrent ? (
                    <span className="rounded-full bg-baobab-50 px-2.5 py-0.5 text-xs font-semibold text-baobab-700">
                      Votre plan
                    </span>
                  ) : null}
                </div>
                <p className="text-ink-soft">{plan.pitch}</p>
                <p className="tabular mt-5 text-3xl font-extrabold tracking-[-0.03em]">
                  {fcfa(plan.price)}
                  <span className="text-base font-medium text-ink-soft"> / mois</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <CheckIcon className="mt-0.5 size-4 shrink-0 text-baobab-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && !blocked ? (
                  <ChoosePlanButton
                    planId={plan.id}
                    featured={plan.price > current.price}
                    label={`Passer au plan ${plan.name}`}
                  />
                ) : null}
              </section>
            );
          })}
        </div>
        {sub.status === "trialing" ? (
          <p className="mt-3 text-sm text-ink-faint">
            Pendant l&apos;essai, changer de plan ne déclenche aucun paiement : le plan choisi sera facturé à la fin de
            l&apos;essai.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-faint">Le nouveau tarif s&apos;applique à partir du prochain paiement.</p>
        )}
      </div>

      <Panel className="grid gap-8 p-5 sm:p-6 md:grid-cols-[1fr_22rem]">
        <div>
          <h2 className="text-xl font-bold tracking-[-0.02em]">Moyen de paiement</h2>
          {sub.card_last4 ? (
            <p className="mt-3 text-ink-soft">
              <span className="font-semibold text-ink">{BRAND_LABEL[brand]}</span> se terminant par{" "}
              <span className="tabular font-semibold text-ink">{sub.card_last4}</span>, expire le{" "}
              <span className="tabular">
                {String(sub.card_exp_month).padStart(2, "0")}/{sub.card_exp_year}
              </span>
              .
            </p>
          ) : (
            <p className="mt-3 text-ink-soft">Aucune carte enregistrée.</p>
          )}
          {blocked ? (
            <p className="mt-3 max-w-[46ch] text-ink-soft">
              Le paiement de {fcfa(current.price)} sera tenté dès que vous enregistrez une carte. Votre boutique rouvre
              aussitôt.
            </p>
          ) : null}
        </div>
        <CardForm
          action={updateCardAction}
          simulated={isSimulatedBilling}
          submitLabel={blocked ? `Payer ${fcfa(current.price)} et rouvrir ma boutique` : "Remplacer la carte"}
          pendingLabel="Vérification de la carte…"
          successMessage={blocked ? "Paiement accepté. Votre boutique est de nouveau ouverte." : "Carte remplacée."}
        />
      </Panel>
    </div>
  );
}
