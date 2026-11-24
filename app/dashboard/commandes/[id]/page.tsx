import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BackLink } from "@/components/back-link";
import { PinIcon } from "@/components/icons";
import { PrintButton } from "@/components/print-button";
import { OrderContact } from "@/components/order-contact";
import { Panel, Skeleton, STATUS_TONE, StatusBadge } from "@/components/ui";
import { getCurrentShop, getOrder } from "@/lib/dal";
import { PIPELINE, STATUS_HINT, STATUS_LABEL, countryTimeZone } from "@/lib/domain";
import { dateTime, fcfa, orderRef } from "@/lib/format";
import { StatusActions } from "./status-actions";

export const metadata: Metadata = { title: "Commande" };

export default function OrderPage({ params }: PageProps<"/dashboard/commandes/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Skeleton className="mb-8 h-12 w-72" />
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <Skeleton className="h-96" />
            <Skeleton className="h-72" />
          </div>
        </>
      }
    >
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({ params }: { params: PageProps<"/dashboard/commandes/[id]">["params"] }) {
  const { id } = await params;
  const [shop, order] = await Promise.all([getCurrentShop(), getOrder(id)]);
  if (!order) notFound();
  const tz = countryTimeZone(shop.country);

  const stepIndex = PIPELINE.indexOf(order.status);
  const offTrack = stepIndex === -1;

  return (
    <>
      <header className="mb-8">
        <BackLink href="/dashboard/commandes">Commandes</BackLink>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[1.9rem] font-bold leading-tight tracking-[-0.03em]">
            <span className="tabular">{orderRef(order.number)}</span> {order.customer_name}
          </h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1.5 text-ink-soft">
          {order.source === "boutique" ? "Passée sur votre boutique en ligne" : "Saisie depuis le tableau de bord"} le{" "}
          <span className="tabular">{dateTime(order.created_at, tz)}</span>
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="flex flex-col gap-8">
          {/* Où en est la commande */}
          <Panel className="p-5 sm:p-6">
            <ol className="grid grid-cols-4 gap-2" aria-label="Étapes de la commande">
              {PIPELINE.map((s, i) => {
                const done = !offTrack && i <= stepIndex;
                return (
                  <li key={s} className="flex flex-col gap-2" aria-current={s === order.status ? "step" : undefined}>
                    <span className={`h-1.5 rounded-full ${done ? STATUS_TONE[s].dot : "bg-line"}`} />
                    <span className={`text-xs font-semibold sm:text-sm ${done ? "text-ink" : "text-ink-faint"}`}>
                      {STATUS_LABEL[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-5 font-semibold">{STATUS_HINT[order.status]}.</p>
            {order.status === "nouvelle" ? (
              <div className="mt-3">
                <OrderContact order={order} shopName={shop.name} />
              </div>
            ) : null}
            <div className="mt-6 border-t border-line pt-6 print:hidden">
              <StatusActions orderId={order.id} status={order.status} />
              {order.status === "livree" ? (
                <p className="text-ink-soft">
                  Commande terminée le <span className="tabular">{dateTime(order.updated_at, tz)}</span>.
                </p>
              ) : null}
            </div>
          </Panel>

          {/* Contenu du colis */}
          <Panel className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 text-lg font-bold tracking-[-0.02em] sm:px-6">Colis</h2>
            <ul className="divide-y divide-line">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{item.name}</span>
                    <span className="tabular block text-sm text-ink-soft">
                      {item.quantity} × {fcfa(item.unit_price)}
                    </span>
                  </span>
                  <span className="tabular font-semibold">{fcfa(item.unit_price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line bg-paper px-5 py-4 sm:px-6">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Produits</dt>
                <dd className="tabular">{fcfa(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Livraison</dt>
                <dd className="tabular">{fcfa(order.delivery_fee)}</dd>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <dt className="font-semibold">À encaisser</dt>
                <dd className="tabular text-2xl font-extrabold tracking-[-0.03em] text-karite-700">{fcfa(order.total)}</dd>
              </div>
            </dl>
          </Panel>
        </div>

        {/* Livraison */}
        <Panel className="p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Livraison</h2>
          <div className="mt-4 space-y-1">
            <p className="font-semibold">{order.customer_name}</p>
            <a href={`tel:${order.customer_phone.replace(/\s/g, "")}`} className="tabular block text-baobab-700 hover:underline">
              {order.customer_phone}
            </a>
            {order.customer_email ? (
              <a href={`mailto:${order.customer_email}`} className="block break-all text-baobab-700 hover:underline">
                {order.customer_email}
              </a>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2.5">
            <PinIcon className="mt-0.5 size-5 shrink-0 text-ink-faint" />
            <div>
              <p>{[order.district, order.city].filter(Boolean).join(", ")}</p>
              {order.landmark ? <p className="mt-1 text-ink-soft">{order.landmark}</p> : null}
            </div>
          </div>
          {order.note ? (
            <p className="mt-4 rounded-control bg-karite-50 px-3 py-2.5 text-sm text-karite-700">{order.note}</p>
          ) : null}
          {order.status === "confirmee" || order.status === "en_livraison" ? (
            <PrintButton className="mt-6 w-full print:hidden">Imprimer le bon de livraison</PrintButton>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
