import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { getStorefront } from "@/lib/storefront";
import { productImageUrl } from "@/lib/supabase/env";
import { CheckoutForm } from "../cart-views";

export const metadata: Metadata = { title: "Commande" };

export default function CheckoutPage({ params }: PageProps<"/boutique/[slug]/commande">) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-8 text-3xl font-extrabold tracking-[-0.03em]">Finaliser la commande</h1>
      <Suspense fallback={<Skeleton className="h-[32rem]" />}>
        <Checkout params={params} />
      </Suspense>
    </div>
  );
}

async function Checkout({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  return (
    <CheckoutForm
      slug={slug}
      deliveryFee={store.shop.default_delivery_fee}
      defaultCity={store.shop.city}
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
