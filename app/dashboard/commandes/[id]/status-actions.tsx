"use client";

import { useState, useTransition } from "react";
import { Alert, Button } from "@/components/ui";
import { setOrderStatus } from "@/lib/actions/orders";
import { ACTION_LABEL, NEXT_STATUSES, type OrderStatus } from "@/lib/domain";

/** Boutons pour faire avancer la commande à l'étape suivante. */
export function StatusActions({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = NEXT_STATUSES[status];

  if (next.length === 0) return null;

  const [primary, ...others] = next;
  const isNegative = (s: OrderStatus) => s === "annulee" || s === "refusee";

  function run(target: OrderStatus) {
    if (isNegative(target) && !window.confirm(`${ACTION_LABEL[target]} ? Le stock des produits sera remis en vente.`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setOrderStatus(orderId, target);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? <Alert>{error}</Alert> : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={primary === "livree" ? "money" : isNegative(primary) ? "danger" : "primary"}
          size="lg"
          disabled={pending}
          onClick={() => run(primary)}
        >
          {pending ? "Mise à jour…" : ACTION_LABEL[primary]}
        </Button>
        {others.map((s) => (
          <Button key={s} variant={isNegative(s) ? "danger" : "secondary"} size="lg" disabled={pending} onClick={() => run(s)}>
            {ACTION_LABEL[s]}
          </Button>
        ))}
      </div>
    </div>
  );
}
