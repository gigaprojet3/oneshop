import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGrid } from "@/components/storefront/sections";
import { Skeleton } from "@/components/ui";
import { getStorefront } from "@/lib/storefront";

export const metadata: Metadata = { title: "Tous les produits" };

export default function AllProductsPage({ params }: PageProps<"/boutique/[slug]/produits">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 @3xl:px-8 @3xl:py-16">
      <h1 className="s-display text-[2.4rem] leading-none tracking-[-0.02em] @3xl:text-[3.4rem]">Tous les produits</h1>
      <Suspense
        fallback={
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        }
      >
        <Catalogue params={params} />
      </Suspense>
    </div>
  );
}

async function Catalogue({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  if (!store.products.length) {
    return <p className="mt-10 py-12 text-center text-ink-soft">Cette boutique n&apos;a pas encore mis de produits en vente.</p>;
  }
  return (
    <div className="mt-10">
      <ProductGrid products={store.products} ctx={{ slug, shop: store.shop, products: store.products, template: store.theme.template }} />
    </div>
  );
}
