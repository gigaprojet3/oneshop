"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Panier d'une boutique, gardé dans le navigateur du client (localStorage).
 * On ne stocke que les identifiants et quantités : prix et stock viennent toujours du serveur.
 */
export type CartLine = { product_id: string; quantity: number };

const EMPTY: CartLine[] = [];
const listeners = new Set<() => void>();
const snapshots = new Map<string, { raw: string | null; lines: CartLine[] }>();

function key(slug: string) {
  return `oneshop:panier:${slug}`;
}

function read(slug: string): CartLine[] {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(key(slug));
  const cached = snapshots.get(slug);
  if (cached && cached.raw === raw) return cached.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      lines = parsed.filter((l) => typeof l?.product_id === "string" && Number.isInteger(l?.quantity) && l.quantity > 0);
    }
  } catch {
    lines = EMPTY;
  }
  snapshots.set(slug, { raw, lines });
  return lines;
}

function write(slug: string, lines: CartLine[]) {
  window.localStorage.setItem(key(slug), JSON.stringify(lines));
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener(); // synchronise les onglets ouverts
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(slug: string) {
  const lines = useSyncExternalStore(
    subscribe,
    () => read(slug),
    () => EMPTY,
  );

  const add = useCallback(
    (productId: string, quantity = 1) => {
      const current = read(slug);
      const existing = current.find((l) => l.product_id === productId);
      write(
        slug,
        existing
          ? current.map((l) => (l.product_id === productId ? { ...l, quantity: l.quantity + quantity } : l))
          : [...current, { product_id: productId, quantity }],
      );
    },
    [slug],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      write(
        slug,
        read(slug)
          .map((l) => (l.product_id === productId ? { ...l, quantity } : l))
          .filter((l) => l.quantity > 0),
      );
    },
    [slug],
  );

  const clear = useCallback(() => write(slug, []), [slug]);

  const count = lines.reduce((n, l) => n + l.quantity, 0);
  return { lines, count, add, setQuantity, clear };
}
