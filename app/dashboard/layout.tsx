import Link from "next/link";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { ExternalIcon, LogoutIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui";
import { signOut } from "@/lib/actions/auth";
import { daysLeft } from "@/lib/billing/subscriptions";
import { getBillingContext } from "@/lib/dal";
import { findPlan } from "@/lib/domain";
import { NavLinks, NavList } from "./nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 bg-paper print:bg-white">
      {/* Barre latérale (écrans larges) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-5 lg:flex print:hidden">
        <div className="px-2">
          <Logo href="/dashboard" />
        </div>
        <div className="mt-6 rounded-control border border-line">
          <Suspense fallback={<Skeleton className="h-[4.5rem]" />}>
            <ShopIdentity />
          </Suspense>
        </div>
        <nav className="mt-6 flex-1" aria-label="Navigation principale">
          <Suspense fallback={<NavList layout="sidebar" />}>
            <NavLinks layout="sidebar" />
          </Suspense>
        </nav>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 font-medium text-ink-soft hover:bg-paper hover:text-ink"
          >
            <LogoutIcon />
            Se déconnecter
          </button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* En-tête (mobile et tablette) */}
        <header className="sticky top-0 z-10 border-b border-line bg-surface lg:hidden print:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Logo href="/dashboard" />
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Se déconnecter"
                className="grid size-10 place-items-center rounded-control text-ink-soft hover:bg-paper"
              >
                <LogoutIcon />
              </button>
            </form>
          </div>
          <nav aria-label="Navigation principale">
            <Suspense fallback={<NavList layout="bar" />}>
              <NavLinks layout="bar" />
            </Suspense>
          </nav>
        </header>

        <Suspense fallback={null}>
          <TrialBanner />
        </Suspense>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-10 print:p-0">{children}</main>
      </div>
    </div>
  );
}

async function ShopIdentity() {
  const { shop, subscription } = await getBillingContext();
  const plan = findPlan(subscription.plan);
  return (
    <div className="min-w-0">
      <div className="px-3 py-2.5">
        <p className="truncate font-semibold text-ink">{shop.name}</p>
        <p className="truncate text-sm text-ink-faint">
          Plan {plan.name}
          {subscription.status === "trialing" ? ", en essai" : ""}
        </p>
      </div>
      <Link
        href={`/boutique/${shop.slug}`}
        target="_blank"
        className="flex items-center justify-between gap-2 border-t border-line px-3 py-2 text-sm font-semibold text-baobab-700 hover:bg-baobab-50"
      >
        Voir ma boutique
        <ExternalIcon className="size-4" />
      </Link>
    </div>
  );
}

/** Rappel permanent pendant l'essai et en cas de problème de paiement. */
async function TrialBanner() {
  const { subscription } = await getBillingContext();
  const plan = findPlan(subscription.plan);

  if (subscription.status === "trialing" && subscription.trial_ends_at) {
    const days = daysLeft(subscription.trial_ends_at);
    return (
      <div className="border-b border-karite-400/40 bg-karite-50 px-4 py-2.5 text-sm text-karite-700 sm:px-8 print:hidden">
        <span className="font-semibold">
          Essai gratuit : {days <= 1 ? "dernier jour" : `encore ${days} jours`}.
        </span>{" "}
        {subscription.cancel_at_period_end
          ? "Votre abonnement s'arrêtera à la fin de l'essai."
          : `Ensuite, plan ${plan.name} à ${plan.price.toLocaleString("fr-FR")} FCFA par mois.`}{" "}
        <Link href="/dashboard/abonnement" className="font-semibold underline underline-offset-4">
          Gérer l&apos;abonnement
        </Link>
      </div>
    );
  }

  if (subscription.status === "past_due" || subscription.status === "canceled") {
    return (
      <div className="border-b border-kola-500/30 bg-kola-50 px-4 py-2.5 text-sm text-kola-700 sm:px-8 print:hidden">
        <span className="font-semibold">
          {subscription.status === "past_due" ? "Le dernier paiement a échoué." : "Votre abonnement est arrêté."}
        </span>{" "}
        Votre boutique en ligne est fermée aux clients. Mettez à jour votre carte pour la rouvrir.
      </div>
    );
  }

  return null;
}
