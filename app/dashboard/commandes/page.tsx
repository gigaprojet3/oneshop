import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "@/components/icons";
import { PageHeader, Panel, Skeleton, StatusBadge, buttonClass } from "@/components/ui";
import { getCurrentShop, listOrders } from "@/lib/dal";
import { ORDER_STATUSES, SOURCE_LABEL, STATUS_LABEL, countryTimeZone, type OrderStatus } from "@/lib/domain";
import { dateTime, fcfa, orderRef } from "@/lib/format";

export const metadata: Metadata = { title: "Commandes" };

export default function OrdersPage({ searchParams }: PageProps<"/dashboard/commandes">) {
  return (
    <>
      <PageHeader
        title="Commandes"
        description="Les commandes passées sur votre boutique en ligne et celles que vous saisissez, de la confirmation à l'encaissement."
        actions={
          <Link href="/dashboard/commandes/nouvelle" className={buttonClass("primary")}>
            <PlusIcon className="size-4" />
            Nouvelle commande
          </Link>
        }
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <OrderList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrderList({ searchParams }: { searchParams: PageProps<"/dashboard/commandes">["searchParams"] }) {
  const { statut } = await searchParams;
  const status = (ORDER_STATUSES as readonly string[]).includes(String(statut)) ? (statut as OrderStatus) : undefined;
  const [shop, orders] = await Promise.all([getCurrentShop(), listOrders({ status })]);
  const tz = countryTimeZone(shop.country);

  const tabs: { value?: OrderStatus; label: string }[] = [
    { label: "Toutes" },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  ];

  return (
    <>
      <nav aria-label="Filtrer par statut" className="mb-4 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {tabs.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/dashboard/commandes?statut=${tab.value}` : "/dashboard/commandes"}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                active ? "bg-ink text-white" : "bg-surface text-ink-soft ring-1 ring-inset ring-line hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <Panel className="px-6 py-14 text-center">
          <p className="text-lg font-semibold">
            {status ? `Aucune commande « ${STATUS_LABEL[status].toLowerCase()} »` : "Aucune commande pour l'instant"}
          </p>
          <p className="mx-auto mt-1 max-w-[50ch] text-ink-soft">
            Les commandes passées sur votre boutique en ligne apparaissent ici automatiquement. Vous pouvez aussi saisir
            une commande reçue par téléphone.
          </p>
          <Link href="/dashboard/commandes/nouvelle" className={buttonClass("primary", "md", "mt-6")}>
            Saisir une commande
          </Link>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <table className="w-full text-left">
            <thead className="hidden border-b border-line bg-paper text-sm text-ink-soft md:table-header-group">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Commande</th>
                <th scope="col" className="px-3 py-3 font-semibold">Livraison</th>
                <th scope="col" className="px-3 py-3 font-semibold">Statut</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">À encaisser</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => {
                const articles = o.order_items.reduce((n, i) => n + i.quantity, 0);
                return (
                  <tr key={o.id} className="relative block hover:bg-paper md:table-row">
                    <td className="block px-4 pr-32 pt-3.5 md:table-cell md:px-5 md:py-3.5">
                      <Link href={`/dashboard/commandes/${o.id}`} className="font-semibold after:absolute after:inset-0">
                        <span className="tabular text-ink-faint">{orderRef(o.number)}</span> {o.customer_name}
                      </Link>
                      <p className="text-sm text-ink-soft">
                        {articles} article{articles > 1 ? "s" : ""}, via {SOURCE_LABEL[o.source]},{" "}
                        <span className="tabular">{dateTime(o.created_at, tz)}</span>
                      </p>
                    </td>
                    <td className="block px-4 text-sm text-ink-soft md:table-cell md:px-3 md:py-3.5">
                      {[o.district, o.city].filter(Boolean).join(", ")}
                    </td>
                    <td className="inline-block px-4 pb-3.5 pt-2 md:table-cell md:px-3 md:py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="tabular absolute right-4 top-3.5 font-semibold md:static md:table-cell md:px-5 md:py-3.5 md:text-right">
                      {fcfa(o.total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      )}
    </>
  );
}
