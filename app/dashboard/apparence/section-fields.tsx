"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, TrashIcon } from "@/components/icons";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { uploadThemeImage } from "@/lib/actions/theme";
import { productImageUrl } from "@/lib/supabase/env";
import type { FieldSpec, ItemField, ListField, Settings } from "@/lib/theme/schema";

export type PickerProduct = { id: string; name: string; is_active: boolean };

type Props = {
  idPrefix: string;
  fields: FieldSpec[];
  values: Settings;
  products: PickerProduct[];
  onChange: (key: string, value: unknown) => void;
};

/** Formulaire d'une section, construit à partir de la description de ses champs (lib/theme/schema.ts). */
export function SectionFields({ idPrefix, fields, values, products, onChange }: Props) {
  return (
    <div className="flex flex-col gap-5">
      {fields.map((field) => (
        <FieldControl
          key={field.key}
          id={`${idPrefix}-${field.key}`}
          field={field}
          value={values[field.key]}
          products={products}
          onChange={(v) => onChange(field.key, v)}
        />
      ))}
    </div>
  );
}

function FieldControl({
  id,
  field,
  value,
  products,
  onChange,
}: {
  id: string;
  field: FieldSpec | ItemField;
  value: unknown;
  products: PickerProduct[];
  onChange: (value: unknown) => void;
}) {
  switch (field.kind) {
    case "text": {
      const text = typeof value === "string" ? value : "";
      const Control = field.multiline ? Textarea : Input;
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint}>
          <Control
            id={id}
            value={text}
            maxLength={field.max}
            placeholder={field.placeholder}
            rows={field.multiline ? 3 : undefined}
            onChange={(e) => onChange(e.target.value)}
          />
        </Field>
      );
    }
    case "number":
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint}>
          <Input
            id={id}
            type="number"
            min={field.min}
            max={field.max}
            className="tabular w-28"
            value={typeof value === "number" ? value : field.max}
            onChange={(e) => onChange(Math.min(field.max, Math.max(field.min, Number(e.target.value) || field.min)))}
          />
        </Field>
      );
    case "toggle":
      return (
        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-baobab-700" />
          {field.label}
        </label>
      );
    case "choice":
      return (
        <fieldset>
          <legend className="text-sm font-semibold">{field.label}</legend>
          <div className="mt-1.5 inline-flex rounded-control border border-line-strong p-0.5">
            {field.options.map((o) => (
              <label
                key={o.value}
                className={`cursor-pointer rounded-[0.4rem] px-3 py-1.5 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-baobab-500 ${
                  value === o.value ? "bg-baobab-700 text-white" : "text-ink-soft hover:text-ink"
                }`}
              >
                <input type="radio" name={id} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
                {o.label}
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "product":
      return (
        <Field label={field.label} htmlFor={id} hint={field.hint}>
          <Select id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || null)}>
            <option value="">{field.emptyLabel}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.is_active ? "" : " (pas en vente)"}
              </option>
            ))}
          </Select>
        </Field>
      );
    case "products": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <fieldset>
          <legend className="text-sm font-semibold">{field.label}</legend>
          {field.hint ? <p className="mt-0.5 text-[0.8rem] text-ink-faint">{field.hint}</p> : null}
          {products.length ? (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-control border border-line p-2">
              {products.map((p) => (
                <li key={p.id}>
                  <label className="flex items-center gap-2.5 rounded px-1.5 py-1 text-sm hover:bg-paper">
                    <input
                      type="checkbox"
                      className="size-4 accent-baobab-700"
                      checked={selected.includes(p.id)}
                      onChange={(e) => onChange(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))}
                    />
                    <span className="truncate">{p.name}</span>
                    {p.is_active ? null : <span className="shrink-0 text-xs text-ink-faint">pas en vente</span>}
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-sm text-ink-faint">Vous n&apos;avez pas encore de produits.</p>
          )}
        </fieldset>
      );
    }
    case "image":
      return <ImagePicker id={id} label={field.label} hint={field.hint} value={typeof value === "string" ? value : null} onChange={onChange} />;
    case "list":
      return <ListControl id={id} field={field} value={value} products={products} onChange={onChange} />;
  }
}

function ListControl({
  id,
  field,
  value,
  products,
  onChange,
}: {
  id: string;
  field: ListField;
  value: unknown;
  products: PickerProduct[];
  onChange: (value: unknown) => void;
}) {
  const items = Array.isArray(value) ? (value as Settings[]) : [];
  const set = (next: Settings[]) => onChange(next);
  const move = (i: number, d: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    set(next);
  };
  const blank = () =>
    Object.fromEntries(field.fields.map((f) => [f.key, f.kind === "toggle" ? true : f.kind === "number" ? f.max : ""]));

  return (
    <fieldset>
      <legend className="text-sm font-semibold">{field.label}</legend>
      {field.hint ? <p className="mt-0.5 text-[0.8rem] text-ink-faint">{field.hint}</p> : null}
      <ol className="mt-2 space-y-2">
        {items.map((item, i) => {
          const single = field.fields.length === 1 && field.fields[0].kind === "text" && !field.fields[0].multiline;
          return (
            <li key={i} className={single ? "flex items-center gap-1" : "rounded-control border border-line bg-paper/60 p-3"}>
              {single ? (
                <Input
                  aria-label={`${field.itemLabel} ${i + 1}`}
                  value={typeof item[field.fields[0].key] === "string" ? (item[field.fields[0].key] as string) : ""}
                  maxLength={(field.fields[0] as { max: number }).max}
                  onChange={(e) => set(items.map((it, j) => (j === i ? { ...it, [field.fields[0].key]: e.target.value } : it)))}
                />
              ) : (
                <>
                  <p className="mb-2 text-xs font-semibold text-ink-faint">
                    {field.itemLabel} {i + 1}
                  </p>
                  <div className="flex flex-col gap-3">
                    {field.fields.map((f) => (
                      <FieldControl
                        key={f.key}
                        id={`${id}-${i}-${f.key}`}
                        field={f}
                        value={item[f.key]}
                        products={products}
                        onChange={(v) => set(items.map((it, j) => (j === i ? { ...it, [f.key]: v } : it)))}
                      />
                    ))}
                  </div>
                </>
              )}
              <div className={`flex shrink-0 items-center gap-0.5 ${single ? "" : "mt-2 justify-end"}`}>
                <IconButton label={`Monter : ${field.itemLabel} ${i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </IconButton>
                <IconButton label={`Descendre : ${field.itemLabel} ${i + 1}`} disabled={i === items.length - 1} onClick={() => move(i, 1)}>
                  ↓
                </IconButton>
                <IconButton label={`Retirer : ${field.itemLabel} ${i + 1}`} onClick={() => set(items.filter((_, j) => j !== i))}>
                  <TrashIcon className="size-4" />
                </IconButton>
              </div>
            </li>
          );
        })}
      </ol>
      {items.length < field.max ? (
        <button type="button" onClick={() => set([...items, blank()])} className="mt-2 text-sm font-semibold text-baobab-700 hover:underline">
          + Ajouter : {field.itemLabel.toLowerCase()}
        </button>
      ) : (
        <p className="mt-2 text-xs text-ink-faint">Maximum atteint ({field.max}).</p>
      )}
    </fieldset>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-md text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function ImagePicker({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string | null;
  onChange: (value: unknown) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const src = productImageUrl(value);

  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      {hint ? <p className="mt-0.5 text-[0.8rem] text-ink-faint">{hint}</p> : null}
      <div className="mt-2 flex items-center gap-3">
        <span className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-control border border-line bg-paper text-ink-faint">
          {/* eslint-disable-next-line @next/next/no-img-element -- miniature d'une image Supabase */}
          {src ? <img src={src} alt="" className="absolute inset-0 size-full object-cover" /> : <ImageIcon className="size-6" />}
        </span>
        <div className="flex flex-wrap gap-2">
          <label htmlFor={id} className="cursor-pointer rounded-control border border-line-strong px-3 py-1.5 text-sm font-semibold hover:bg-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-baobab-500">
            {pending ? "Envoi…" : src ? "Changer" : "Choisir une image"}
            <input
              ref={input}
              id={id}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={pending}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setError(null);
                const form = new FormData();
                form.set("image", file);
                start(async () => {
                  const res = await uploadThemeImage(form);
                  if (res.error) setError(res.error);
                  else onChange(res.path);
                  if (input.current) input.current.value = "";
                });
              }}
            />
          </label>
          {src ? (
            <button type="button" onClick={() => onChange(null)} className="rounded-control px-3 py-1.5 text-sm font-semibold text-kola-700 hover:bg-kola-50">
              Retirer
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-kola-700">
          {error}
        </p>
      ) : (
        <p className="mt-2 text-xs text-ink-faint">JPG, PNG ou WebP, 4 Mo maximum.</p>
      )}
    </div>
  );
}
