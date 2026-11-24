"use client";

import { useActionState, useMemo, useState } from "react";
import { SubmitButton } from "@/components/form-bits";
import { TrashIcon } from "@/components/icons";
import { Alert, Field, Input, Panel, Select, Textarea } from "@/components/ui";
import { createOrder } from "@/lib/actions/orders";
import { fcfa } from "@/lib/format";

type ProductOption = { id: string; name: string; price: number; stock: number };
type Line = { product_id: string; quantity: number };

function parseLines(json: string | undefined): Line[] {
  try {
    const parsed = JSON.parse(json ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function OrderForm({
  products,
  defaultCity,
  defaultDeliveryFee,
}: {
  products: ProductOption[];
  defaultCity: string;
  defaultDeliveryFee: number;
}) {
  const [state, formAction] = useActionState(createOrder, null);
  const values = state?.fields;

  const [lines, setLines] = useState<Line[]>(() => parseLines(values?.items));
  const [fee, setFee] = useState(values?.delivery_fee ?? String(defaultDeliveryFee || ""));

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const remaining = products.filter((p) => !lines.some((l) => l.product_id === p.id));
  const subtotal = lines.reduce((sum, l) => sum + (byId.get(l.product_id)?.price ?? 0) * l.quantity, 0);
  const feeValue = Number(fee.replace(/\s/g, "")) || 0;

  function addProduct(id: string) {
    if (!id) return;
    setLines((prev) => [...prev, { product_id: id, quantity: 1 }]);
  }

  function setQuantity(id: string, quantity: number) {
    setLines((prev) => prev.map((l) => (l.product_id === id ? { ...l, quantity: Math.max(1, quantity) } : l)));
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <div className="flex flex-col gap-8">
        {state?.error ? <Alert>{state.error}</Alert> : null}

        <Panel className="p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Produits commandés</h2>
          <input type="hidden" name="items" value={JSON.stringify(lines)} />

          {lines.length > 0 ? (
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {lines.map((line) => {
                const p = byId.get(line.product_id);
                if (!p) return null;
                const over = line.quantity > p.stock;
                return (
                  <li key={line.product_id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className={`tabular text-sm ${over ? "font-semibold text-kola-700" : "text-ink-soft"}`}>
                        {fcfa(p.price)} l&apos;unité, {p.stock} en stock
                      </p>
                    </div>
                    <div className="flex items-center rounded-control border border-line-strong">
                      <button
                        type="button"
                        className="grid size-9 place-items-center text-lg text-ink-soft hover:text-ink disabled:opacity-40"
                        onClick={() => setQuantity(p.id, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        aria-label={`Retirer un ${p.name}`}
                      >
                        −
                      </button>
                      <input
                        aria-label={`Quantité de ${p.name}`}
                        inputMode="numeric"
                        className="tabular h-9 w-12 border-x border-line text-center focus:outline-none"
                        value={line.quantity}
                        onChange={(e) => setQuantity(p.id, Number(e.target.value.replace(/\D/g, "")) || 1)}
                      />
                      <button
                        type="button"
                        className="grid size-9 place-items-center text-lg text-ink-soft hover:text-ink"
                        onClick={() => setQuantity(p.id, line.quantity + 1)}
                        aria-label={`Ajouter un ${p.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="tabular w-28 text-right font-semibold">{fcfa(p.price * line.quantity)}</span>
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((l) => l.product_id !== p.id))}
                      className="grid size-9 place-items-center rounded-control text-ink-faint hover:bg-kola-50 hover:text-kola-700"
                      aria-label={`Retirer ${p.name} de la commande`}
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-ink-soft">Choisissez les produits que le client a demandés.</p>
          )}

          {remaining.length > 0 ? (
            <div className="mt-4">
              <label htmlFor="add-product" className="sr-only">
                Ajouter un produit
              </label>
              <Select id="add-product" value="" onChange={(e) => addProduct(e.target.value)}>
                <option value="">+ Ajouter un produit…</option>
                {remaining.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock === 0}>
                    {p.name} ({fcfa(p.price)}){p.stock === 0 ? ", épuisé" : ""}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </Panel>

        <Panel className="p-5 sm:p-6">
          <h2 className="text-lg font-bold tracking-[-0.02em]">Client et livraison</h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <Field label="Nom du client" htmlFor="customer_name">
              <Input id="customer_name" name="customer_name" required defaultValue={values?.customer_name} />
            </Field>
            <Field label="Téléphone" htmlFor="customer_phone" hint="Le livreur appellera ce numéro.">
              <Input
                id="customer_phone"
                name="customer_phone"
                type="tel"
                inputMode="tel"
                required
                className="tabular"
                placeholder="07 00 00 00 00"
                defaultValue={values?.customer_phone}
              />
            </Field>
            <Field label="Email" htmlFor="customer_email" hint="Facultatif." className="sm:col-span-2">
              <Input id="customer_email" name="customer_email" type="email" defaultValue={values?.customer_email} />
            </Field>
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" required defaultValue={values?.city ?? defaultCity} />
            </Field>
            <Field label="Quartier ou commune" htmlFor="district">
              <Input id="district" name="district" placeholder="Ex. Cocody Angré" defaultValue={values?.district} />
            </Field>
            <Field
              label="Point de repère"
              htmlFor="landmark"
              hint="Ce qui aide le livreur à trouver le client."
              className="sm:col-span-2"
            >
              <Input
                id="landmark"
                name="landmark"
                placeholder="Ex. Derrière la pharmacie des Lauriers, portail bleu"
                defaultValue={values?.landmark}
              />
            </Field>
          </div>


          <Field label="Note interne" htmlFor="note" hint="Facultatif. Visible seulement par vous." className="mt-6">
            <Textarea id="note" name="note" rows={3} placeholder="Ex. Livrer après 17 h" defaultValue={values?.note} />
          </Field>
        </Panel>
      </div>

      {/* Récapitulatif : ce que le livreur devra encaisser */}
      <Panel className="p-5 sm:p-6 lg:sticky lg:top-8">
        <h2 className="text-lg font-bold tracking-[-0.02em]">À encaisser à la livraison</h2>
        <dl className="mt-5 space-y-3">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Produits</dt>
            <dd className="tabular font-semibold">{fcfa(subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt>
              <label htmlFor="delivery_fee" className="text-ink-soft">
                Livraison
              </label>
            </dt>
            <dd className="flex items-center gap-2">
              <input
                id="delivery_fee"
                name="delivery_fee"
                inputMode="numeric"
                value={fee}
                onChange={(e) => setFee(e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder="0"
                className="tabular h-9 w-24 rounded-control border border-line-strong px-2 text-right focus:border-baobab-500 focus:outline-none focus:ring-3 focus:ring-baobab-100"
              />
              <span className="text-sm text-ink-faint">FCFA</span>
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-5">
          <span className="font-semibold">Total</span>
          <span className="tabular text-3xl font-extrabold tracking-[-0.03em] text-karite-700">
            {fcfa(subtotal + feeValue)}
          </span>
        </div>
        <SubmitButton pendingLabel="Enregistrement…" size="lg" className="mt-6 w-full" disabled={lines.length === 0}>
          Enregistrer la commande
        </SubmitButton>
        <p className="mt-3 text-center text-sm text-ink-faint">Le stock des produits sera réservé.</p>
      </Panel>
    </form>
  );
}
