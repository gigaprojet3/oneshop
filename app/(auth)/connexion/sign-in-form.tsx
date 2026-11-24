"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { SubmitButton } from "@/components/form-bits";
import { Alert, Field, Input } from "@/components/ui";
import { signIn } from "@/lib/actions/auth";

export function SignInForm() {
  const params = useSearchParams();
  const [state, action] = useActionState(signIn, null);
  const linkError = params.get("erreur") === "lien";

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {state?.error ? <Alert>{state.error}</Alert> : null}
      {!state && linkError ? (
        <Alert>Ce lien de confirmation a expiré ou a déjà servi. Connectez-vous, ou inscrivez-vous à nouveau.</Alert>
      ) : null}
      <input type="hidden" name="suite" value={params.get("suite") ?? "/dashboard"} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} />
      </Field>
      <Field label="Mot de passe" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton pendingLabel="Connexion…" size="lg" className="mt-1 w-full">
        Se connecter
      </SubmitButton>
    </form>
  );
}
