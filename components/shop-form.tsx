"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/form-bits";
import { Alert, Field, Input, Select, Textarea } from "@/components/ui";
import { COUNTRIES, findCountry } from "@/lib/domain";
import { slugify } from "@/lib/format";
import type { FormState, Shop } from "@/lib/types";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

// Ex. « oneshop.com/boutique/ » : l'adresse publique de la boutique
const STORE_PREFIX = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/^https?:\/\//, "")}/boutique/`;

export function ShopForm({
  action,
  shop,
  submitLabel,
  pendingLabel,
}: {
  action: Action;
  shop?: Shop;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const values = state?.fields;

  const [name, setName] = useState(values?.name ?? shop?.name ?? "");
  const [slug, setSlug] = useState(values?.slug ?? shop?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(shop));
  const [countryCode, setCountryCode] = useState(values?.country ?? shop?.country ?? "CI");
  const country = findCountry(countryCode) ?? COUNTRIES[0];

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state?.error ? <Alert>{state.error}</Alert> : null}
      {state?.ok ? <Alert tone="success">Modifications enregistrées.</Alert> : null}

      <Field label="Nom de la boutique" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          maxLength={60}
          placeholder="Ex. Chez Awa Couture"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
        />
      </Field>

      <Field
        label="Adresse de la boutique"
        htmlFor="slug"
        hint="Lettres, chiffres et tirets. C'est le lien de votre boutique en ligne."
      >
        <div className="flex items-stretch overflow-hidden rounded-control border border-line-strong focus-within:border-baobab-500 focus-within:ring-3 focus-within:ring-baobab-100">
          <span className="flex items-center bg-paper px-3 text-[0.95rem] text-ink-faint">{STORE_PREFIX}</span>
          <input
            id="slug"
            name="slug"
            required
            minLength={3}
            maxLength={40}
            className="h-11 min-w-0 flex-1 bg-surface px-2 text-[0.95rem] focus:outline-none"
            value={slug}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Pays" htmlFor="country" hint={`Prix affichés en FCFA (${country.currency})`}>
          <Select id="country" name="country" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Ville" htmlFor="city">
          <Input
            id="city"
            name="city"
            required
            placeholder={country.capital}
            defaultValue={values?.city ?? shop?.city ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Téléphone de la boutique" htmlFor="phone" hint="Affiché sur votre boutique en ligne.">
          <div className="flex items-stretch overflow-hidden rounded-control border border-line-strong focus-within:border-baobab-500 focus-within:ring-3 focus-within:ring-baobab-100">
            <span className="tabular flex items-center bg-paper px-3 text-[0.95rem] text-ink-faint">{country.dial}</span>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              required
              placeholder="07 00 00 00 00"
              className="tabular h-11 min-w-0 flex-1 bg-surface px-2 text-[0.95rem] focus:outline-none"
              defaultValue={values?.phone ?? shop?.phone ?? ""}
            />
          </div>
        </Field>
        <Field label="Frais de livraison habituels" htmlFor="default_delivery_fee" hint="Proposés par défaut sur chaque commande.">
          <div className="flex items-stretch overflow-hidden rounded-control border border-line-strong focus-within:border-baobab-500 focus-within:ring-3 focus-within:ring-baobab-100">
            <input
              id="default_delivery_fee"
              name="default_delivery_fee"
              inputMode="numeric"
              pattern="[0-9 ]*"
              placeholder="1500"
              className="tabular h-11 min-w-0 flex-1 bg-surface px-3.5 text-[0.95rem] focus:outline-none"
              defaultValue={values?.default_delivery_fee ?? String(shop?.default_delivery_fee ?? "")}
            />
            <span className="flex items-center bg-paper px-3 text-sm font-semibold text-ink-faint">FCFA</span>
          </div>
        </Field>
      </div>

      <Field label="Email de contact" htmlFor="email" hint="Facultatif. Affiché sur votre boutique en ligne.">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="contact@maboutique.com"
          defaultValue={values?.email ?? shop?.email ?? ""}
        />
      </Field>

      <Field label="Ce que vous vendez" htmlFor="description" hint="Facultatif. Une ou deux phrases pour vos clients.">
        <Textarea
          id="description"
          name="description"
          maxLength={300}
          placeholder="Pagnes wax, bazin et tenues sur mesure. Livraison dans tout Abidjan."
          defaultValue={values?.description ?? shop?.description ?? ""}
        />
      </Field>

      <div>
        <SubmitButton pendingLabel={pendingLabel} size="lg">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
