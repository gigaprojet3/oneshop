import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { PageHeader, Panel, Skeleton, buttonClass } from "@/components/ui";
import { getCurrentShop, listProducts } from "@/lib/dal";
import { OrderForm } from "./order-form";

export const metadata: Metadata = { title: "Nouvelle commande" };

export default function NewOrderPage() {
  return (
    <>
      <PageHeader
        title="Nouvelle commande"
        description="Pour une commande passée par téléphone ou en magasin. Le client paiera à la livraison."
        back={<BackLink href="/dashboard/commandes">Commandes</BackLink>}
      />
      <Suspense fallback={<Skeleton className="h-[36rem]" />}>
        <NewOrder />
      </Suspense>
    </>
  );
}

async function NewOrder() {
  const [shop, products] = await Promise.all([getCurrentShop(), listProducts()]);
  const available = products
    .filter((p) => p.is_active)
    .map((p) => ({ id: p.id, name: p.name, price: p.price, stock: p.stock }));

  if (available.length === 0) {
    return (
      <Panel className="px-6 py-14 text-center">
        <p className="text-lg font-semibold">Ajoutez d&apos;abord un produit</p>
        <p className="mx-auto mt-1 max-w-[46ch] text-ink-soft">
          Une commande regroupe un ou plusieurs de vos produits. Créez-en au moins un pour enregistrer votre première
          commande.
        </p>
        <Link href="/dashboard/produits/nouveau" className={buttonClass("primary", "md", "mt-6")}>
          Ajouter un produit
        </Link>
      </Panel>
    );
  }

  return <OrderForm products={available} defaultCity={shop.city} defaultDeliveryFee={shop.default_delivery_fee} />;
}
