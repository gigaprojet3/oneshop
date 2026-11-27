"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartIcon } from "@/components/icons";
import { Button } from "@/components/ui";
import { useCart } from "@/lib/cart";
import { storePath } from "@/lib/store-url";

export function CartLink({ slug }: { slug: string }) {
  const { count } = useCart(slug);
  return (
    <Link
      href={storePath(slug, "/panier")}
      className="relative inline-flex h-10 items-center gap-2 rounded-full px-3 font-semibold text-ink hover:bg-paper"
      aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`}
    >
      <CartIcon className="size-5" />
      <span className="hidden sm:inline">Panier</span>
      {count > 0 ? (
        <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function AddToCart({ slug, productId, stock }: { slug: string; productId: string; stock: number }) {
  const { lines, add } = useCart(slug);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = lines.find((l) => l.product_id === productId)?.quantity ?? 0;
  const max = Math.max(0, stock - inCart);

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 4000);
    return () => clearTimeout(t);
  }, [added]);

  if (stock === 0) {
    return <p className="rounded-control bg-paper px-4 py-3 font-semibold text-ink-soft">Épuisé pour le moment</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-control border border-line-strong">
          <button
            type="button"
            className="grid size-11 place-items-center text-lg text-ink-soft hover:text-ink disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Diminuer la quantité"
          >
            −
          </button>
          <span className="tabular w-10 text-center font-semibold" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="grid size-11 place-items-center text-lg text-ink-soft hover:text-ink disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            disabled={quantity >= max}
            aria-label="Augmenter la quantité"
          >
            +
          </button>
        </div>
        <Button
          size="lg"
          className="flex-1 rounded-full"
          disabled={max === 0}
          onClick={() => {
            add(productId, Math.min(quantity, max));
            setQuantity(1);
            setAdded(true);
          }}
        >
          {max === 0 ? "Tout le stock est dans votre panier" : "Ajouter au panier"}
        </Button>
      </div>
      {added ? (
        <p role="status" className="text-sm text-baobab-700">
          Ajouté au panier.{" "}
          <Link href={storePath(slug, "/panier")} className="font-semibold underline underline-offset-4">
            Voir le panier
          </Link>
        </p>
      ) : null}
    </div>
  );
}

/** Vide le panier une fois la commande enregistrée. */
export function ClearCart({ slug }: { slug: string }) {
  const { clear, count } = useCart(slug);
  useEffect(() => {
    if (count > 0) clear();
  }, [clear, count]);
  return null;
}
