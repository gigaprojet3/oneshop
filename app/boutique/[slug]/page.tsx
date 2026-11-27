import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StoreSections } from "@/components/storefront/sections";
import { Skeleton } from "@/components/ui";
import { getStorefront } from "@/lib/storefront";

export async function generateMetadata({ params }: PageProps<"/boutique/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return { title: "Boutique introuvable" };
  return {
    title: { absolute: store.shop.name },
    description: store.shop.description ?? `Commandez chez ${store.shop.name}, paiement à la livraison.`,
  };
}

export default function StorePage({ params }: PageProps<"/boutique/[slug]">) {
  return (
    <Suspense fallback={<StoreSkeleton />}>
      <Store params={params} />
    </Suspense>
  );
}

/** Page d'accueil : les sections choisies par le commerçant, dans son ordre (Tableau de bord > Apparence). */
async function Store({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  return (
    <StoreSections
      theme={store.theme}
      ctx={{ slug, shop: store.shop, products: store.products, template: store.theme.template }}
    />
  );
}

function StoreSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <Skeleton className="h-12 w-72" />
      <Skeleton className="mt-4 h-6 w-96 max-w-full" />
      <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}
