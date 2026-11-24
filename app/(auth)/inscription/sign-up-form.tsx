"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/form-bits";
import { Alert, Field, Input } from "@/components/ui";
import { signUp } from "@/lib/actions/auth";

export function SignUpForm() {
  const [state, action] = useActionState(signUp, null);

  if (state?.ok) {
    return (
      <div className="mt-8">
        <Alert tone="success">
          Compte créé. Nous avons envoyé un lien de confirmation à <strong>{state.fields?.email}</strong>. Ouvrez-le pour
          créer votre boutique. Pensez à regarder dans les spams.
        </Alert>
      </div>
    );
  }

  return (
    <form action={action} className="mt-8 flex flex-col gap-5">
      {state?.error ? <Alert>{state.error}</Alert> : null}
      <Field label="Votre nom" htmlFor="full_name">
        <Input id="full_name" name="full_name" autoComplete="name" required defaultValue={state?.fields?.full_name} />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.fields?.email} />
      </Field>
      <Field label="Mot de passe" htmlFor="password" hint="8 caractères minimum">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <SubmitButton pendingLabel="Création du compte…" size="lg" className="mt-1 w-full">
        Créer mon compte
      </SubmitButton>
    </form>
  );
}
