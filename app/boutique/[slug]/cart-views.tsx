"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/form-bits";
import { ImageIcon, TrashIcon } from "@/components/icons";
import { Alert, Field, Input, Textarea, buttonClass } from "@/components/ui";
import { placeOrder } from "@/lib/actions/storefront";
import { useCart } from "@/lib/cart";
import { fcfa } from "@/lib/format";

export type CartProduct = { id: string; name: string; price: number; stock: number; image: string | null };

/** Associe les lignes du panier aux produits encore en vente, avec les prix actuels. */
function useResolvedCart(slug: string, products: CartProduct[]) {
  const cart = useCart(slug);
  const byId = new Map(products.map((p) => [p.id, p]));
  const rows = cart.lines.flatMap((l) => {
    const product = byId.get(l.product_id);
    return product ? [{ product, quantity: l.quantity }] : [];
  });
  const subtotal = rows.reduce((sum, r) => sum + r.product.price * r.quantity, 0);
  const unavailable = cart.lines.length - rows.length;
  return { ...cart, rows, subtotal, unavailable };
}

function Totals({ subtotal, deliveryFee }: { subtotal: number; deliveryFee: number }) {
  return (
    <dl className="space-y-2.5">
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Sous-total</dt>
        <dd className="tabular">{fcfa(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">Livraison</dt>
        <dd className="tabular">{deliveryFee > 0 ? fcfa(deliveryFee) : "Offerte"}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="font-semibold">Total à payer à la livraison</dt>
        <dd className="tabular text-2xl font-extrabold tracking-[-0.03em]">{fcfa(subtotal + deliveryFee)}</dd>
      </div>
    </dl>
  );
}

function EmptyCart({ slug }: { slug: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-lg font-semibold">Votre panier est vide</p>
      <Link href={`/boutique/${slug}`} className={buttonClass("primary", "md", "mt-6 rounded-full")}>
        Voir les produits
      </Link>
    </div>
  );
}

export function CartView({ slug, products, deliveryFee }: { slug: string; products: CartProduct[]; deliveryFee: number }) {
  const { rows, subtotal, setQuantity, unavailable } = useResolvedCart(slug, products);

  if (rows.length === 0) return <EmptyCart slug={slug} />;
  const overStock = rows.some((r) => r.quantity > r.product.stock);

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div>
        {unavailable > 0 ? (
          <div className="mb-4">
            <Alert tone="info">Un article de votre panier n&apos;est plus en vente et a été retiré.</Alert>
          </div>
        ) : null}
        <ul className="divide-y divide-line border-y border-line">
          {rows.map(({ product, quantity }) => (
            <li key={product.id} className="flex gap-4 py-4">
              <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-control bg-paper text-ink-faint">
                {product.image ? (
                  <Image src={product.image} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <ImageIcon className="size-6" />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex justify-between gap-4">
                  <Link href={`/boutique/${slug}/produits/${product.id}`} className="font-semibold hover:underline">
                    {product.name}
                  </Link>
                  <span className="tabular shrink-0 font-semibold">{fcfa(product.price * quantity)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-control border border-line-strong">
                    <button
                      type="button"
                      className="grid size-9 place-items-center text-ink-soft hover:text-ink"
                      onClick={() => setQuantity(product.id, quantity - 1)}
                      aria-label={`Retirer un ${product.name}`}
                    >
                      −
                    </button>
                    <span className="tabular w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      type="button"
                      className="grid size-9 place-items-center text-ink-soft hover:text-ink disabled:opacity-40"
                      onClick={() => setQuantity(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      aria-label={`Ajouter un ${product.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuantity(product.id, 0)}
                    className="inline-flex items-center gap-1 text-sm text-ink-faint hover:text-kola-700"
                  >
                    <TrashIcon className="size-4" />
                    Retirer
                  </button>
                </div>
                {quantity > product.stock ? (
                  <p className="text-sm font-semibold text-kola-700">
                    {product.stock === 0 ? "Épuisé" : `Seulement ${product.stock} disponible${product.stock > 1 ? "s" : ""}`}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="rounded-panel border border-line p-5 sm:p-6">
        <Totals subtotal={subtotal} deliveryFee={deliveryFee} />
        {overStock ? (
          <p className="mt-5 text-sm font-semibold text-kola-700">Ajustez les quantités en rouge pour continuer.</p>
        ) : (
          <Link href={`/boutique/${slug}/commande`} className={buttonClass("primary", "lg", "mt-6 w-full rounded-full")}>
            Commander
          </Link>
        )}
      </aside>
    </div>
  );
}

export function CheckoutForm({
  slug,
  products,
  deliveryFee,
  defaultCity,
}: {
  slug: string;
  products: CartProduct[];
  deliveryFee: number;
  defaultCity: string;
}) {
  const { rows, subtotal } = useResolvedCart(slug, products);
  const [state, action] = useActionState(placeOrder.bind(null, slug), null);
  const values = state?.fields;

  if (rows.length === 0) return <EmptyCart slug={slug} />;

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-6">
        {state?.error ? <Alert>{state.error}</Alert> : null}
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(rows.map((r) => ({ product_id: r.product.id, quantity: r.quantity })))}
        />

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-4 text-lg font-bold tracking-[-0.02em]">Vos coordonnées</legend>
          <Field label="Nom et prénom" htmlFor="customer_name">
            <Input id="customer_name" name="customer_name" autoComplete="name" required defaultValue={values?.customer_name} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Téléphone" htmlFor="customer_phone" hint="Le livreur vous appellera avant de passer.">
              <Input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                className="tabular"
                defaultValue={values?.customer_phone}
              />
            </Field>
            <Field label="Email" htmlFor="customer_email" hint="Facultatif.">
              <Input id="customer_email" name="customer_email" type="email" autoComplete="email" defaultValue={values?.customer_email} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-5">
          <legend className="mb-4 text-lg font-bold tracking-[-0.02em]">Adresse de livraison</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" autoComplete="address-level2" required defaultValue={values?.city ?? defaultCity} />
            </Field>
            <Field label="Quartier ou commune" htmlFor="district">
              <Input id="district" name="district" required defaultValue={values?.district} />
            </Field>
          </div>
          <Field label="Adresse ou point de repère" htmlFor="landmark" hint="Rue, immeuble, ou un lieu connu à proximité.">
            <Input id="landmark" name="landmark" autoComplete="street-address" defaultValue={values?.landmark} />
          </Field>
          <Field label="Instructions pour la livraison" htmlFor="note" hint="Facultatif.">
            <Textarea id="note" name="note" rows={3} defaultValue={values?.note} />
          </Field>
        </fieldset>
      </div>

      <aside className="rounded-panel border border-line p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold tracking-[-0.02em]">Votre commande</h2>
        <ul className="my-5 space-y-2 text-[0.95rem]">
          {rows.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between gap-4">
              <span className="min-w-0">
                <span className="tabular text-ink-soft">{quantity} ×</span> {product.name}
              </span>
              <span className="tabular shrink-0">{fcfa(product.price * quantity)}</span>
            </li>
          ))}
        </ul>
        <Totals subtotal={subtotal} deliveryFee={deliveryFee} />
        <div className="mt-5 rounded-control bg-paper px-4 py-3 text-sm">
          <p className="font-semibold">Paiement à la livraison</p>
          <p className="text-ink-soft">Vous payez en espèces à la réception du colis.</p>
        </div>
        <SubmitButton pendingLabel="Envoi de la commande…" size="lg" className="mt-5 w-full rounded-full">
          Confirmer la commande
        </SubmitButton>
      </aside>
    </form>
  );
}
