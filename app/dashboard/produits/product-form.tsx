"use client";

import { useActionState, useEffect, useState } from "react";
import { SubmitButton } from "@/components/form-bits";
import { ImageIcon } from "@/components/icons";
import { Alert, Field, Input, Textarea } from "@/components/ui";
import type { FormState, Product } from "@/lib/types";

type Action = (prev: FormState, form: FormData) => Promise<FormState>;

export function ProductForm({
  action,
  product,
  imageUrl,
  submitLabel,
}: {
  action: Action;
  product?: Product;
  imageUrl?: string | null;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const values = state?.fields;
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview ?? (removeImage ? null : imageUrl ?? null);

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-6">
        {state?.error ? <Alert>{state.error}</Alert> : null}

        <Field label="Nom du produit" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            maxLength={120}
            placeholder="Ex. Pagne wax Vlisco 6 yards"
            defaultValue={values?.name ?? product?.name ?? ""}
          />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Prix" htmlFor="price">
            <div className="flex items-stretch overflow-hidden rounded-control border border-line-strong focus-within:border-baobab-500 focus-within:ring-3 focus-within:ring-baobab-100">
              <input
                id="price"
                name="price"
                required
                inputMode="numeric"
                pattern="[0-9 ]*"
                placeholder="12500"
                className="tabular h-11 min-w-0 flex-1 bg-surface px-3.5 text-[0.95rem] focus:outline-none"
                defaultValue={values?.price ?? (product ? String(product.price) : "")}
              />
              <span className="flex items-center bg-paper px-3 text-sm font-semibold text-ink-faint">FCFA</span>
            </div>
          </Field>
          <Field label="Prix barré" htmlFor="compare_at_price" hint="Facultatif. L'ancien prix, affiché barré avec le pourcentage de remise.">
            <div className="flex items-stretch overflow-hidden rounded-control border border-line-strong focus-within:border-baobab-500 focus-within:ring-3 focus-within:ring-baobab-100">
              <input
                id="compare_at_price"
                name="compare_at_price"
                inputMode="numeric"
                pattern="[0-9 ]*"
                placeholder="15000"
                className="tabular h-11 min-w-0 flex-1 bg-surface px-3.5 text-[0.95rem] focus:outline-none"
                defaultValue={values?.compare_at_price ?? (product?.compare_at_price ? String(product.compare_at_price) : "")}
              />
              <span className="flex items-center bg-paper px-3 text-sm font-semibold text-ink-faint">FCFA</span>
            </div>
          </Field>
          <Field label="Quantité en stock" htmlFor="stock" hint="Elle baisse à chaque commande enregistrée.">
            <Input
              id="stock"
              name="stock"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="0"
              className="tabular"
              defaultValue={values?.stock ?? (product ? String(product.stock) : "")}
            />
          </Field>
        </div>

        <Field label="Description" htmlFor="description" hint="Facultatif. Taille, matière, couleurs disponibles…">
          <Textarea
            id="description"
            name="description"
            maxLength={1000}
            rows={5}
            defaultValue={values?.description ?? product?.description ?? ""}
          />
        </Field>

        <label className="flex items-start gap-3 rounded-control border border-line p-4">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={values ? values.is_active === "on" : (product?.is_active ?? true)}
            className="mt-1 size-4 accent-baobab-700"
          />
          <span>
            <span className="block font-semibold">En vente</span>
            <span className="block text-sm text-ink-soft">
              Décochez pour masquer ce produit sans le supprimer, par exemple en attendant un réassort.
            </span>
          </span>
        </label>

        <div>
          <SubmitButton pendingLabel="Enregistrement…" size="lg">
            {submitLabel}
          </SubmitButton>
        </div>
      </div>

      <div className="order-first flex flex-col gap-3 lg:order-none">
        <span className="text-sm font-semibold">Photo</span>
        <label className="group relative grid aspect-square cursor-pointer place-items-center overflow-hidden rounded-panel border border-dashed border-line-strong bg-paper text-ink-faint hover:border-baobab-500 focus-within:ring-3 focus-within:ring-baobab-100">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) ou image Supabase
            <img src={shown} alt="Aperçu du produit" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 p-6 text-center text-sm">
              <ImageIcon className="size-8" />
              Choisir une photo
              <span className="text-xs">JPG, PNG ou WebP, 4 Mo maximum</span>
            </span>
          )}
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
              if (file) setRemoveImage(false);
            }}
          />
        </label>
        {imageUrl && !preview ? (
          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="remove_image"
              checked={removeImage}
              onChange={(e) => setRemoveImage(e.target.checked)}
              className="size-4 accent-kola-500"
            />
            Retirer la photo
          </label>
        ) : null}
        <p className="text-xs leading-relaxed text-ink-faint">
          Une photo nette, à la lumière du jour, sur fond uni, aide vos clients à commander sans poser de questions.
        </p>
      </div>
    </form>
  );
}
