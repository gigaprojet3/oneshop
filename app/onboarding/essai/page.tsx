import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { CardForm } from "@/components/card-form";
import { CheckIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui";
import { startTrialAction } from "@/lib/actions/billing";
import { isSimulatedBilling } from "@/lib/billing/provider";
import { findCurrentShop, findSubscription } from "@/lib/dal";
import { TRIAL_DAYS, TRIAL_PLAN, findPlan } from "@/lib/domain";
import { number } from "@/lib/format";

export const metadata: Metadata = { title: "Démarrer l'essai gratuit" };

const plan = findPlan(TRIAL_PLAN);

export default function TrialPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-5">
          <Logo />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-4xl gap-10 px-5 py-12 md:grid-cols-[1fr_24rem]">
        <div>
          <p className="text-sm font-semibold text-baobab-700">Étape 2 sur 2</p>
          <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em]">Démarrez votre essai gratuit</h1>
          <p className="mt-2 max-w-[48ch] text-ink-soft">
            {TRIAL_DAYS} jours sur le plan {plan.name}, avec toutes les fonctionnalités. Votre carte est enregistrée mais
            rien n&apos;est débité pendant l&apos;essai.
          </p>

          {/* Ce qui va se passer : une vraie chronologie */}
          <ol className="mt-8 space-y-5">
            <li className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-baobab-700 text-white">
                <CheckIcon className="size-4" />
              </span>
              <div>
                <p className="font-semibold">Aujourd&apos;hui</p>
                <p className="text-ink-soft">Votre boutique en ligne ouvre. Ajoutez vos produits et partagez son lien.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-karite-100 font-bold text-karite-700">
                {TRIAL_DAYS - 1}
              </span>
              <div>
                <p className="font-semibold">Dans {TRIAL_DAYS - 1} jours</p>
                <p className="text-ink-soft">Un rappel s&apos;affiche dans votre tableau de bord. Vous pouvez arrêter en un clic.</p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper font-bold text-ink-soft ring-1 ring-line-strong">
                {TRIAL_DAYS}
              </span>
              <div>
                <p className="font-semibold">Dans {TRIAL_DAYS} jours</p>
                <p className="text-ink-soft">
                  Premier débit de <span className="tabular font-semibold text-ink">{number(plan.price)} FCFA</span>,
                  puis chaque mois. Vous pourrez passer sur un plan moins cher avant cette date.
                </p>
              </div>
            </li>
          </ol>
        </div>

        <div className="rounded-panel border border-line bg-surface p-6">
          <Suspense fallback={<Skeleton className="h-96" />}>
            <TrialForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function TrialForm() {
  if (!(await findCurrentShop())) redirect("/onboarding");
  if (await findSubscription()) redirect("/dashboard");
  return (
    <CardForm
      action={startTrialAction}
      simulated={isSimulatedBilling}
      submitLabel={`Démarrer mes ${TRIAL_DAYS} jours gratuits`}
      pendingLabel="Vérification de la carte…"
      footer={
        <p className="text-center text-sm text-ink-faint">
          Puis <span className="tabular">{number(plan.price)}</span> FCFA par mois. Sans engagement.
        </p>
      }
    />
  );
}
