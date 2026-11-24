"use client";

import { useActionState, useState, type ReactNode } from "react";
import { SubmitButton } from "@/components/form-bits";
import { Alert, Field, Input } from "@/components/ui";
import { BRAND_LABEL, detectBrand, formatCardNumber, formatExpiry } from "@/lib/billing/card";
import type { FormState } from "@/lib/types";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export function CardForm({
  action,
  submitLabel,
  pendingLabel,
  simulated,
  successMessage,
  footer,
}: {
  action: Action;
  submitLabel: string;
  pendingLabel: string;
  simulated: boolean;
  successMessage?: string;
  footer?: ReactNode;
}) {
  const [state, formAction] = useActionState(action, null);
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const brand = detectBrand(number);
  const isAmex = brand === "amex";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error ? <Alert>{state.error}</Alert> : null}
      {state?.ok && successMessage ? <Alert tone="success">{successMessage}</Alert> : null}

      {simulated ? (
        <Alert tone="info">
          <strong className="font-semibold">Mode simulation :</strong> aucun paiement réel. Carte acceptée :{" "}
          <code className="tabular">4242 4242 4242 4242</code>, carte refusée :{" "}
          <code className="tabular">4000 0000 0000 0002</code>. Date future et code au choix.
        </Alert>
      ) : null}

      <Field label="Nom sur la carte" htmlFor="card_name">
        <Input id="card_name" name="card_name" autoComplete="cc-name" required defaultValue={state?.fields?.card_name} />
      </Field>

      <Field label="Numéro de carte" htmlFor="card_number">
        <div className="relative">
          <Input
            id="card_number"
            name="card_number"
            inputMode="numeric"
            autoComplete="cc-number"
            required
            placeholder="1234 1234 1234 1234"
            className="tabular pr-36"
            value={number}
            onChange={(e) => setNumber(formatCardNumber(e.target.value))}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">
            {number ? BRAND_LABEL[brand] : "Visa, Mastercard"}
          </span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Expiration" htmlFor="card_expiry">
          <Input
            id="card_expiry"
            name="card_expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            required
            placeholder="MM / AA"
            className="tabular"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
          />
        </Field>
        <Field label="Code de sécurité" htmlFor="card_cvc" hint={isAmex ? "4 chiffres sur le devant" : "3 chiffres au dos"}>
          <Input
            id="card_cvc"
            name="card_cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            required
            maxLength={isAmex ? 4 : 3}
            placeholder={isAmex ? "1234" : "123"}
            className="tabular"
          />
        </Field>
      </div>

      <SubmitButton pendingLabel={pendingLabel} size="lg" className="mt-1 w-full">
        {submitLabel}
      </SubmitButton>
      {footer}
    </form>
  );
}
