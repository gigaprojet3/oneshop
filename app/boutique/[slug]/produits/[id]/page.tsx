import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronLeftIcon, ImageIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui";
import { fcfa } from "@/lib/format";
import { getStorefront } from "@/lib/storefront";
import { productImageUrl } from "@/lib/supabase/env";
import { savingsPercent } from "@/components/storefront/sections";
import { AddToCart } from "@/components/storefront/store-ui";
import { storePath } from "@/lib/store-url";

type Params = PageProps<"/boutique/[slug]/produits/[id]">["params"];

async function load(params: Params) {
  const { slug, id } = await params;
  const store = await getStorefront(slug);
  const product = store?.products.find((p) => p.id === id);
  return store && product ? { slug, shop: store.shop, product } : null;
}

export async function generateMetadata({ params }: PageProps<"/boutique/[slug]/produits/[id]">): Promise<Metadata> {
  const data = await load(params);
  if (!data) return { title: "Produit introuvable" };
  return {
    title: data.product.name,
    description: data.product.description ?? undefined,
  };
}

export default function ProductPage({ params }: PageProps<"/boutique/[slug]/produits/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-2">
          <Skeleton className="aspect-square" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <Product params={params} />
    </Suspense>
  );
}

async function Product({ params }: { params: Params }) {
  const data = await load(params);
  if (!data) notFound();
  const { slug, shop, product } = data;
  const src = productImageUrl(product.image_path);
  const off = savingsPercent(product);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <Link
        href={storePath(slug)}
        className="mb-6 -ml-1 inline-flex items-center gap-1 rounded-md px-1 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <ChevronLeftIcon className="size-4" />
        Tous les produits
      </Link>
      <div className="grid gap-10 md:grid-cols-2 md:gap-14">
        <div className="relative grid aspect-square place-items-center overflow-hidden rounded-panel bg-paper text-ink-faint">
          {src ? (
            <Image src={src} alt={product.name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          ) : (
            <ImageIcon className="size-10" />
          )}
        </div>
        <div className="md:pt-4">
          <h1 className="s-display text-3xl leading-tight tracking-[-0.02em] sm:text-[2.6rem]">{product.name}</h1>
          <p className="tabular mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-2xl font-bold">{fcfa(product.price)}</span>
            {off > 0 && product.compare_at_price ? (
              <>
                <span className="text-lg text-ink-soft line-through">
                  <span className="sr-only">Au lieu de </span>
                  {fcfa(product.compare_at_price)}
                </span>
                <span className="rounded-full bg-baobab-700 px-2.5 py-0.5 text-sm font-bold text-white">−{off} %</span>
              </>
            ) : null}
          </p>
          <p className={`mt-2 text-sm font-semibold ${product.stock === 0 ? "text-kola-700" : product.stock <= 3 ? "text-karite-700" : "text-baobab-700"}`}>
            {product.stock === 0
              ? "Épuisé"
              : product.stock <= 3
                ? `Plus que ${product.stock} en stock`
                : "En stock"}
          </p>
          <div className="mt-8">
            <AddToCart slug={slug} productId={product.id} stock={product.stock} />
          </div>
          <dl className="mt-8 space-y-3 border-t border-line pt-6 text-[0.95rem]">
            <div>
              <dt className="font-semibold">Paiement à la livraison</dt>
              <dd className="text-ink-soft">Vous payez en espèces quand vous recevez votre colis.</dd>
            </div>
            <div>
              <dt className="font-semibold">Livraison</dt>
              <dd className="tabular text-ink-soft">
                Depuis {shop.city}.{" "}
                {shop.default_delivery_fee > 0 ? `Frais : ${fcfa(shop.default_delivery_fee)}.` : "Offerte."} Le livreur
                vous appelle avant de passer.
              </dd>
            </div>
          </dl>
          {product.description ? (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="font-semibold">Description</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{product.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
