"use client";

import { useState, useTransition } from "react";
import { Alert, Button } from "@/components/ui";
import { changePlanAction, setCancelAction } from "@/lib/actions/billing";

export function ChoosePlanButton({ planId, label, featured }: { planId: string; label: string; featured: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-6 flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      <Button
        variant={featured ? "primary" : "secondary"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await changePlanAction(planId);
            if (result.error) setError(result.error);
          })
        }
      >
        {pending ? "Changement…" : label}
      </Button>
    </div>
  );
}

export function CancelToggle({ cancelAtPeriodEnd, endLabel }: { cancelAtPeriodEnd: boolean; endLabel: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(cancel: boolean) {
    if (
      cancel &&
      !window.confirm(
        `Arrêter l'abonnement ? Votre boutique restera ouverte jusqu'au ${endLabel}, puis elle sera fermée aux clients.`,
      )
    ) {
      return;
    }
    start(async () => {
      setError(null);
      const result = await setCancelAction(cancel);
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <Alert>{error}</Alert> : null}
      {cancelAtPeriodEnd ? (
        <Button variant="primary" disabled={pending} onClick={() => run(false)}>
          {pending ? "Réactivation…" : "Garder mon abonnement"}
        </Button>
      ) : (
        <Button variant="danger" disabled={pending} onClick={() => run(true)}>
          {pending ? "Arrêt…" : "Arrêter l'abonnement"}
        </Button>
      )}
    </div>
  );
}
