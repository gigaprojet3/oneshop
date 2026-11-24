import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { ShopForm } from "@/components/shop-form";
import { Skeleton } from "@/components/ui";
import { createShop } from "@/lib/actions/shop";
import { findCurrentShop } from "@/lib/dal";

export const metadata: Metadata = { title: "Créer votre boutique" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-paper">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-2xl items-center px-5">
          <Logo />
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl px-5 py-12">
        <p className="text-sm font-semibold text-baobab-700">Étape 1 sur 2</p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.03em]">Votre boutique</h1>
        <p className="mt-2 max-w-[52ch] text-ink-soft">
          Ces informations s&apos;affichent sur votre boutique en ligne. Vous pourrez les modifier plus tard.
        </p>
        <div className="mt-10 rounded-panel border border-line bg-surface p-6 sm:p-8">
          <Suspense fallback={<Skeleton className="h-[34rem]" />}>
            <OnboardingForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function OnboardingForm() {
  if (await findCurrentShop()) redirect("/dashboard");
  return <ShopForm action={createShop} submitLabel="Continuer" pendingLabel="Création…" />;
}
