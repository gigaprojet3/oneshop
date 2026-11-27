import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckIcon } from "@/components/icons";
import { Skeleton, StatusBadge, buttonClass } from "@/components/ui";
import type { OrderStatus } from "@/lib/domain";
import { fcfa, orderRef } from "@/lib/format";
import { createPublicClient } from "@/lib/supabase/public";
import { ClearCart } from "@/components/storefront/store-ui";
import { storePath } from "@/lib/store-url";

export const metadata: Metadata = { title: "Commande confirmée", robots: { index: false } };

type PublicOrder = {
  number: number;
  status: OrderStatus;
  customer_name: string;
  city: string;
  district: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: { name: string; quantity: number; unit_price: number }[];
  shop_name: string;
  shop_slug: string;
  shop_phone: string;
};

export default function ConfirmationPage({ params }: PageProps<"/boutique/[slug]/commande/[token]">) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Confirmation params={params} />
      </Suspense>
    </div>
  );
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Confirmation({ params }: { params: Promise<{ slug: string; token: string }> }) {
  const { slug, token } = await params;
  if (!UUID.test(token)) notFound();

  // Lecture non mise en cache : le statut de la commande évolue.
  const { data } = await createPublicClient().rpc("storefront_order", { p_token: token });
  const order = (data as PublicOrder[] | null)?.[0];
  if (!order || order.shop_slug !== slug) notFound();

  return (
    <>
      <ClearCart slug={slug} />
      <span className="grid size-14 place-items-center rounded-full bg-baobab-700 text-white">
        <CheckIcon className="size-7" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold tracking-[-0.03em]">Merci {order.customer_name}, c&apos;est commandé.</h1>
      <p className="mt-3 text-lg leading-relaxed text-ink-soft">
        {order.shop_name} va vous appeler pour confirmer, puis le livreur vous contactera avant de passer à{" "}
        {[order.district, order.city].filter(Boolean).join(", ")}. Gardez{" "}
        <span className="tabular font-semibold text-ink">{fcfa(order.total)}</span> en espèces pour la livraison.
      </p>

      <div className="mt-8 rounded-panel border border-line">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <p className="font-semibold">
            Commande <span className="tabular">{orderRef(order.number)}</span>
          </p>
          <StatusBadge status={order.status} />
        </div>
        <ul className="space-y-2 px-5 py-4">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-4">
              <span>
                <span className="tabular text-ink-soft">{item.quantity} ×</span> {item.name}
              </span>
              <span className="tabular">{fcfa(item.unit_price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line bg-paper px-5 py-4">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Livraison</dt>
            <dd className="tabular">{order.delivery_fee > 0 ? fcfa(order.delivery_fee) : "Offerte"}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="font-semibold">À payer à la livraison</dt>
            <dd className="tabular text-xl font-extrabold">{fcfa(order.total)}</dd>
          </div>
        </dl>
      </div>

      <p className="mt-6 text-ink-soft">
        Une question ? Appelez la boutique au{" "}
        <a href={`tel:${order.shop_phone}`} className="tabular font-semibold text-ink hover:underline">
          {order.shop_phone}
        </a>
        . Gardez cette page : elle affiche l&apos;avancement de votre commande.
      </p>
      <Link href={storePath(slug)} className={buttonClass("secondary", "md", "mt-8 rounded-full")}>
        Continuer mes achats
      </Link>
    </>
  );
}
