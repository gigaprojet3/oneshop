import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopForm } from "@/components/shop-form";
import { PageHeader, Panel, Skeleton } from "@/components/ui";
import { updateShop } from "@/lib/actions/shop";
import { getCurrentShop } from "@/lib/dal";

export const metadata: Metadata = { title: "Boutique" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Boutique" description="Les informations de votre boutique et vos réglages de livraison." />
      <Panel className="max-w-3xl p-5 sm:p-8">
        <Suspense fallback={<Skeleton className="h-[34rem]" />}>
          <SettingsForm />
        </Suspense>
      </Panel>
    </>
  );
}

async function SettingsForm() {
  const shop = await getCurrentShop();
  return (
    <ShopForm action={updateShop} shop={shop} submitLabel="Enregistrer les modifications" pendingLabel="Enregistrement…" />
  );
}
