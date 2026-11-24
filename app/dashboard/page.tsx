import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalIcon, PlusIcon } from "@/components/icons";
import { OrderContact } from "@/components/order-contact";
import { Panel, Skeleton, STATUS_TONE, buttonClass } from "@/components/ui";
import { getCurrentShop, lowStockProducts, recentOrderStats } from "@/lib/dal";
import { PIPELINE, STATUS_HINT, STATUS_LABEL, countryTimeZone, type OrderStatus } from "@/lib/domain";
import { dateTime, fcfa, number, orderRef } from "@/lib/format";

export const metadata: Metadata = { title: "Accueil" };

export default function DashboardHome() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const [shop, orders, lowStock] = await Promise.all([getCurrentShop(), recentOrderStats(), lowStockProducts()]);
  const tz = countryTimeZone(shop.country);

  const by = (status: OrderStatus) => orders.filter((o) => o.status === status);
  const sum = (list: { total: number }[]) => list.reduce((acc, o) => acc + o.total, 0);

  const delivered = by("livree");
  const refused = by("refusee");
  const inTransit = by("en_livraison");
  const toConfirm = by("nouvelle");
  const closed = delivered.length + refused.length;
  const refusalRate = closed > 0 ? Math.round((refused.length / closed) * 100) : null;

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-ink-soft">{shop.name}, 30 derniers jours</p>
          <h1 className="mt-1 text-[2.4rem] font-extrabold leading-none tracking-[-0.04em] text-ink sm:text-[3.2rem]">
            <span className="tabular">{fcfa(sum(delivered))}</span>
          </h1>
          <p className="mt-2 text-lg text-ink-soft">
            encaissés à la livraison
            {inTransit.length > 0 ? (
              <>
                , et <strong className="tabular font-semibold text-indigo-500">{fcfa(sum(inTransit))}</strong> en route
                avec vos livreurs
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/boutique/${shop.slug}`} target="_blank" className={buttonClass("secondary")}>
            <ExternalIcon className="size-4" />
            Voir ma boutique
          </Link>
          <Link href="/dashboard/produits/nouveau" className={buttonClass("primary")}>
            <PlusIcon className="size-4" />
            Ajouter un produit
          </Link>
        </div>
      </header>

      {/* Le parcours d'une commande payée à la livraison */}
      <Panel className="overflow-hidden">
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((status, i) => {
            const list = by(status);
            return (
              <li
                key={status}
                className={`relative border-line p-5 sm:p-6 ${i > 0 ? "border-t sm:border-t-0" : ""} ${
                  i % 2 === 1 ? "sm:border-l" : ""
                } ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} ${i > 0 ? "lg:border-l" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${STATUS_TONE[status].dot}`} />
                  <Link
                    href={`/dashboard/commandes?statut=${status}`}
                    className="font-semibold text-ink underline-offset-4 hover:underline"
                  >
                    {STATUS_LABEL[status]}
                  </Link>
                </div>
                <p className="tabular mt-4 text-4xl font-extrabold tracking-[-0.03em]">{number(list.length)}</p>
                <p className="tabular mt-1 text-ink-soft">{fcfa(sum(list))}</p>
                <p className="mt-4 text-sm leading-snug text-ink-faint">{STATUS_HINT[status]}</p>
                {i < PIPELINE.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2.5 top-1/2 z-[1] hidden size-5 -translate-y-1/2 rotate-45 border-r border-t border-line bg-surface lg:block"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line bg-paper px-5 py-3.5 text-sm text-ink-soft sm:px-6">
          <span>
            Refusées à la porte :{" "}
            <strong className="tabular font-semibold text-kola-700">{number(refused.length)}</strong>
            {refusalRate !== null ? <span className="tabular"> ({refusalRate} % des colis livrés ou refusés)</span> : null}
          </span>
          <span>
            Annulées : <strong className="tabular font-semibold text-ink">{number(by("annulee").length)}</strong>
          </span>
        </div>
      </Panel>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold tracking-[-0.02em]">À appeler maintenant</h2>
            <Link href="/dashboard/commandes?statut=nouvelle" className="text-sm font-semibold text-baobab-700 hover:underline">
              Toutes les commandes à confirmer
            </Link>
          </div>
          {toConfirm.length === 0 ? (
            <div className="px-5 py-10 text-center sm:px-6">
              <p className="font-semibold">Aucune commande en attente de confirmation.</p>
              <p className="mt-1 text-ink-soft">
                Les nouvelles commandes de votre boutique en ligne apparaîtront ici. Appelez chaque client pour confirmer
                avant d&apos;envoyer le colis.
              </p>
              <Link href="/dashboard/commandes/nouvelle" className={buttonClass("secondary", "md", "mt-5")}>
                Saisir une commande
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {toConfirm.slice(0, 6).map((o) => (
                <li key={o.id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                  <Link href={`/dashboard/commandes/${o.id}`} className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      <span className="tabular text-ink-faint">{orderRef(o.number)}</span> {o.customer_name}
                    </p>
                    <p className="tabular truncate text-sm text-ink-soft">
                      {fcfa(o.total)}, {o.city}, reçue le {dateTime(o.created_at, tz)}
                    </p>
                  </Link>
                  <OrderContact order={o} shopName={shop.name} compact />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <div className="border-b border-line px-5 py-4 sm:px-6">
            <h2 className="text-lg font-bold tracking-[-0.02em]">Bientôt en rupture</h2>
          </div>
          {lowStock.length === 0 ? (
            <p className="px-5 py-8 text-ink-soft sm:px-6">Tous vos produits en ligne ont plus de 3 pièces en stock.</p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
                  <Link href={`/dashboard/produits/${p.id}`} className="min-w-0 truncate font-medium hover:underline">
                    {p.name}
                  </Link>
                  <span
                    className={`tabular shrink-0 text-sm font-semibold ${p.stock === 0 ? "text-kola-700" : "text-karite-700"}`}
                  >
                    {p.stock === 0 ? "Épuisé" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Chargement">
      <div className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-14 w-80" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-56 w-full" />
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
