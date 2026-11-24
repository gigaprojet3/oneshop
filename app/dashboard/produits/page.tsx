import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ImageIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { PageHeader, Panel, Skeleton, buttonClass } from "@/components/ui";
import { getBillingContext, listProducts } from "@/lib/dal";
import { findPlan } from "@/lib/domain";
import { fcfa, number } from "@/lib/format";
import { productImageUrl } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Produits" };

export default function ProductsPage({ searchParams }: PageProps<"/dashboard/produits">) {
  return (
    <>
      <PageHeader
        title="Produits"
        description="Ce que vous vendez, avec le prix et le stock disponible."
        actions={
          <Link href="/dashboard/produits/nouveau" className={buttonClass("primary")}>
            <PlusIcon className="size-4" />
            Ajouter un produit
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductList({ searchParams }: { searchParams: PageProps<"/dashboard/produits">["searchParams"] }) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 60) : "";
  const [{ subscription }, products] = await Promise.all([getBillingContext(), listProducts({ query })]);
  const plan = findPlan(subscription.plan);

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative w-full sm:max-w-xs" role="search">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <label htmlFor="q" className="sr-only">
            Rechercher un produit
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            placeholder="Rechercher un produit"
            className="h-10 w-full rounded-control border border-line-strong bg-surface pl-9 pr-3 text-[0.95rem] focus:border-baobab-500 focus:outline-none focus:ring-3 focus:ring-baobab-100"
          />
        </form>
        {plan.productLimit !== null && !query ? (
          <p className="tabular text-sm text-ink-soft">
            {number(products.length)} sur {number(plan.productLimit)} produits du plan {plan.name}
            {products.length >= plan.productLimit ? (
              <>
                .{" "}
                <Link href="/dashboard/abonnement" className="font-semibold text-baobab-700 hover:underline">
                  Changer de plan
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>

      {products.length === 0 ? (
        <Panel className="px-6 py-14 text-center">
          {query ? (
            <>
              <p className="font-semibold">Aucun produit ne correspond à « {query} ».</p>
              <Link href="/dashboard/produits" className="mt-3 inline-block font-semibold text-baobab-700 hover:underline">
                Voir tous les produits
              </Link>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold">Ajoutez votre premier produit</p>
              <p className="mx-auto mt-1 max-w-[46ch] text-ink-soft">
                Une photo, un prix en FCFA et la quantité disponible suffisent. Vous pourrez ensuite l&apos;ajouter à vos
                commandes en un clic.
              </p>
              <Link href="/dashboard/produits/nouveau" className={buttonClass("primary", "md", "mt-6")}>
                Ajouter un produit
              </Link>
            </>
          )}
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-line">
            {products.map((p) => {
              const src = productImageUrl(p.image_path);
              return (
                <li key={p.id}>
                  <Link
                    href={`/dashboard/produits/${p.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-paper sm:px-5"
                  >
                    <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-control bg-paper text-ink-faint">
                      {src ? (
                        <Image src={src} alt="" fill sizes="56px" className="object-cover" />
                      ) : (
                        <ImageIcon className="size-5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{p.name}</span>
                      <span className="tabular block text-sm text-ink-soft sm:hidden">{fcfa(p.price)}</span>
                      {!p.is_active ? (
                        <span className="mt-1 inline-block rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-ink-soft ring-1 ring-inset ring-line-strong">
                          Masqué
                        </span>
                      ) : null}
                    </span>
                    <span className="tabular hidden w-32 text-right font-semibold sm:block">{fcfa(p.price)}</span>
                    <span
                      className={`tabular w-24 text-right text-sm font-semibold ${
                        p.stock === 0 ? "text-kola-700" : p.stock <= 3 ? "text-karite-700" : "text-ink-soft"
                      }`}
                    >
                      {p.stock === 0 ? "Épuisé" : `${number(p.stock)} en stock`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </>
  );
}
