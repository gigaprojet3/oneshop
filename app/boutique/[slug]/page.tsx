import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ImageIcon } from "@/components/icons";
import { Skeleton } from "@/components/ui";
import { fcfa } from "@/lib/format";
import { getStorefront } from "@/lib/storefront";
import { productImageUrl } from "@/lib/supabase/env";

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

async function Store({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) notFound();
  const { shop, products } = store;

  return (
    <>
      <section className="border-b border-line bg-paper">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
          <h1 className="max-w-[20ch] text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-5xl">{shop.name}</h1>
          {shop.description ? <p className="mt-4 max-w-[56ch] text-lg leading-relaxed text-ink-soft">{shop.description}</p> : null}
          <ul className="mt-6 flex flex-wrap gap-2 text-sm font-semibold">
            <li className="rounded-full bg-surface px-3.5 py-1.5 ring-1 ring-inset ring-line">Paiement à la livraison</li>
            <li className="rounded-full bg-surface px-3.5 py-1.5 ring-1 ring-inset ring-line">Livraison depuis {shop.city}</li>
            {shop.default_delivery_fee > 0 ? (
              <li className="tabular rounded-full bg-surface px-3.5 py-1.5 ring-1 ring-inset ring-line">
                Frais de livraison : {fcfa(shop.default_delivery_fee)}
              </li>
            ) : (
              <li className="rounded-full bg-surface px-3.5 py-1.5 ring-1 ring-inset ring-line">Livraison offerte</li>
            )}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14" aria-label="Produits">
        {products.length === 0 ? (
          <p className="py-16 text-center text-ink-soft">Cette boutique n&apos;a pas encore mis de produits en vente.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => {
              const src = productImageUrl(p.image_path);
              return (
                <li key={p.id}>
                  <Link href={`/boutique/${slug}/produits/${p.id}`} className="group block rounded-panel">
                    <span className="relative grid aspect-square place-items-center overflow-hidden rounded-panel bg-paper text-ink-faint">
                      {src ? (
                        <Image
                          src={src}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <ImageIcon className="size-8" />
                      )}
                      {p.stock === 0 ? (
                        <span className="absolute left-2 top-2 rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink-soft">
                          Épuisé
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-3 block font-semibold leading-snug group-hover:underline">{p.name}</span>
                    <span className="tabular mt-0.5 block text-ink-soft">{fcfa(p.price)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
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
