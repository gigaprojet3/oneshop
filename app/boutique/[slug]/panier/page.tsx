import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getStorefront } from "@/lib/storefront";
import { productImageUrl } from "@/lib/supabase/env";
import { CartView } from "../cart-views";

export const metadata: Metadata = { title: "Panier" };

export default function CartPage({ params }: PageProps<"/boutique/[slug]/panier">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-[-0.03em]">Panier</h1>
      <Suspense fallback={<Skeleton className="h-72" />}>
        <Cart params={params} />
      </Suspense>
    </div>
  );
}

async function Cart({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  return (
    <CartView
      slug={slug}
      deliveryFee={store.shop.default_delivery_fee}
      products={store.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        image: productImageUrl(p.image_path),
      }))}
    />
  );
}
