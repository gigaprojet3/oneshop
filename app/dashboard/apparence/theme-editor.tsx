"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { ExternalIcon, TrashIcon } from "@/components/icons";
import { StoreFrame } from "@/components/storefront/frame";
import { StoreSections } from "@/components/storefront/sections";
import { Alert, Panel, buttonClass } from "@/components/ui";
import { saveTheme } from "@/lib/actions/theme";
import {
  ACCENT_PRESETS,
  FONTS,
  MAX_SECTIONS,
  SECTION_SPECS,
  SECTION_TYPES,
  TEMPLATES,
  defaultSettings,
  templateSections,
  type FontId,
  type Section,
  type SectionType,
  type TemplateId,
  type Theme,
  type ThemeContext,
} from "@/lib/theme/schema";
import type { StorefrontProduct, StorefrontShop } from "@/lib/types";
import { IconButton, SectionFields, type PickerProduct } from "./section-fields";

type Device = "ordinateur" | "mobile";
const DEVICE_WIDTH: Record<Device, number> = { ordinateur: 1280, mobile: 390 };

export function ThemeEditor({
  initialTheme,
  shop,
  products,
  ctx,
  storeHref,
}: {
  initialTheme: Theme;
  shop: StorefrontShop;
  /** Tous les produits du commerçant, en vente ou non. */
  products: (StorefrontProduct & { is_active: boolean })[];
  ctx: ThemeContext;
  storeHref: string;
}) {
  const [theme, setTheme] = useState(initialTheme);
  const [saved, setSaved] = useState(() => JSON.stringify(initialTheme));
  const [open, setOpen] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("ordinateur");
  const [tab, setTab] = useState<"reglages" | "apercu">("reglages");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(theme) !== saved;

  const forSale = useMemo(() => products.filter((p) => p.is_active), [products]);
  const pickerProducts: PickerProduct[] = products.map((p) => ({ id: p.id, name: p.name, is_active: p.is_active }));

  // Prévenir avant de quitter la page avec des modifications non enregistrées
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (patch: Partial<Theme>) => {
    setMessage(null);
    setTheme((t) => ({ ...t, ...patch }));
  };
  const updateSection = (id: string, patch: (s: Section) => Section) =>
    update({ sections: theme.sections.map((s) => (s.id === id ? patch(s) : s)) });
  const moveSection = (i: number, d: -1 | 1) => {
    const next = [...theme.sections];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    update({ sections: next });
  };

  const chooseTemplate = (id: TemplateId) => {
    const t = TEMPLATES[id];
    update({ template: id, accent: t.accent, font: t.font, background: t.background, buttons: t.buttons });
  };

  const addSection = (type: SectionType) => {
    const id = `${type}-${crypto.randomUUID().slice(0, 8)}`;
    update({ sections: [...theme.sections, { id, type, hidden: false, settings: defaultSettings(type, ctx) }] });
    setOpen(id);
  };

  const save = () =>
    start(async () => {
      const res = await saveTheme(theme);
      if (res.error || !res.theme) {
        setMessage({ tone: "error", text: res.error ?? "L'enregistrement a échoué." });
        return;
      }
      setTheme(res.theme);
      setSaved(JSON.stringify(res.theme));
      setMessage({ tone: "success", text: "Modifications enregistrées. Elles sont en ligne." });
    });

  return (
    <div className="flex flex-col gap-4">
      {/* Barre d'enregistrement */}
      <div className="z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-y border-line bg-paper/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8 lg:sticky lg:top-0">
        <p className="text-sm text-ink-soft" role="status">
          {pending ? "Enregistrement…" : dirty ? "Modifications non enregistrées" : "Tout est enregistré"}
        </p>
        <div className="flex gap-2">
          <a href={storeHref} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
            <ExternalIcon className="size-4" />
            Voir ma boutique
          </a>
          <button
            type="button"
            className={buttonClass("ghost", "sm")}
            disabled={!dirty || pending}
            onClick={() => {
              setTheme(JSON.parse(saved));
              setMessage(null);
            }}
          >
            Annuler
          </button>
          <button type="button" className={buttonClass("primary", "sm")} disabled={!dirty || pending} onClick={save}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {/* Onglets sur petit écran */}
      <div className="inline-flex self-start rounded-control border border-line-strong bg-surface p-0.5 lg:hidden" role="tablist">
        {(["reglages", "apercu"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-[0.4rem] px-4 py-1.5 text-sm font-semibold ${tab === t ? "bg-baobab-700 text-white" : "text-ink-soft"}`}
          >
            {t === "reglages" ? "Réglages" : "Aperçu"}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[23rem_minmax(0,1fr)]">
        {/* Réglages */}
        <div className={`flex flex-col gap-5 ${tab === "apercu" ? "max-lg:hidden" : ""}`}>
          <Panel className="p-5">
            <h2 className="font-bold">Modèle</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => (
                <TemplateCard key={id} id={id} selected={theme.template === id} onSelect={() => chooseTemplate(id)} />
              ))}
            </div>
            <p className="mt-3 text-sm leading-snug text-ink-soft">{TEMPLATES[theme.template].pitch}</p>
            {confirmReset ? (
              <div className="mt-3 rounded-control border border-karite-400/40 bg-karite-50 p-3 text-sm text-karite-700">
                <p>Vos sections actuelles seront remplacées par celles conseillées pour {TEMPLATES[theme.template].name}.</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={buttonClass("primary", "sm")}
                    onClick={() => {
                      update({ sections: templateSections(theme.template, ctx) });
                      setConfirmReset(false);
                      setOpen(null);
                    }}
                  >
                    Remplacer les sections
                  </button>
                  <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setConfirmReset(false)}>
                    Garder les miennes
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmReset(true)} className="mt-3 text-sm font-semibold text-baobab-700 hover:underline">
                Utiliser les sections conseillées pour ce modèle
              </button>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="font-bold">Couleurs et style</h2>
            <fieldset className="mt-4">
              <legend className="text-sm font-semibold">Couleur principale</legend>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Couleur ${c}`}
                    aria-pressed={theme.accent === c}
                    onClick={() => update({ accent: c })}
                    className={`size-8 rounded-full ring-offset-2 ${theme.accent === c ? "ring-2 ring-ink" : "hover:ring-2 hover:ring-line-strong"}`}
                    style={{ background: c }}
                  />
                ))}
                <label className="flex items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="color"
                    value={theme.accent}
                    onChange={(e) => update({ accent: e.target.value })}
                    className="size-8 cursor-pointer rounded-full border border-line-strong bg-transparent"
                  />
                  Autre
                </label>
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold">Police</legend>
              <div className="mt-2 grid gap-1.5">
                {(Object.keys(FONTS) as FontId[]).map((f) => (
                  <label
                    key={f}
                    className={`flex cursor-pointer items-center justify-between rounded-control border px-3 py-2 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-baobab-500 ${
                      theme.font === f ? "border-baobab-500 bg-baobab-50" : "border-line hover:bg-paper"
                    }`}
                  >
                    <input type="radio" name="font" checked={theme.font === f} onChange={() => update({ font: f })} className="sr-only" />
                    <span className="font-semibold">{FONTS[f].name}</span>
                    <span className="text-ink-faint">{FONTS[f].sample}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <Segmented
                legend="Fond"
                value={theme.background}
                options={[
                  ["blanc", "Blanc"],
                  ["teinte", "Teinté"],
                ]}
                onChange={(v) => update({ background: v })}
              />
              <Segmented
                legend="Boutons"
                value={theme.buttons}
                options={[
                  ["arrondis", "Arrondis"],
                  ["droits", "Droits"],
                ]}
                onChange={(v) => update({ buttons: v })}
              />
            </div>
          </Panel>

          <Panel className="p-5">
            <label className="flex items-center justify-between gap-3">
              <span className="font-bold">Bandeau d&apos;annonce</span>
              <input
                type="checkbox"
                checked={theme.announcement.enabled}
                onChange={(e) => update({ announcement: { ...theme.announcement, enabled: e.target.checked } })}
                className="size-4 accent-baobab-700"
              />
            </label>
            <p className="mt-1 text-sm text-ink-soft">Tout en haut de chaque page. Idéal pour une offre ou la livraison.</p>
            {theme.announcement.enabled ? (
              <input
                aria-label="Texte du bandeau"
                value={theme.announcement.text}
                maxLength={120}
                onChange={(e) => update({ announcement: { ...theme.announcement, text: e.target.value } })}
                placeholder="Livraison offerte dès 20 000 FCFA"
                className="mt-3 h-11 w-full rounded-control border border-line-strong bg-surface px-3.5 text-[0.95rem] focus:border-baobab-500 focus:ring-3 focus:ring-baobab-100 focus:outline-none"
              />
            ) : null}
          </Panel>

          <Panel className="p-5">
            <h2 className="font-bold">Sections de l&apos;accueil</h2>
            <p className="mt-1 text-sm text-ink-soft">Dans l&apos;ordre où vos clients les voient. Cliquez sur une section pour la modifier.</p>
            <ol className="mt-4 flex flex-col gap-2">
              {theme.sections.map((section, i) => {
                const spec = SECTION_SPECS[section.type];
                const isOpen = open === section.id;
                return (
                  <li key={section.id} className={`rounded-control border ${isOpen ? "border-baobab-300 bg-surface" : "border-line"}`}>
                    <div className="flex items-center gap-1 py-1 pr-1 pl-3">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() => setOpen(isOpen ? null : section.id)}
                        className={`min-w-0 flex-1 truncate py-1.5 text-left text-sm font-semibold ${section.hidden ? "text-ink-faint line-through decoration-1" : ""}`}
                      >
                        {spec.label}
                      </button>
                      <IconButton label={`Monter : ${spec.label}`} disabled={i === 0} onClick={() => moveSection(i, -1)}>
                        ↑
                      </IconButton>
                      <IconButton label={`Descendre : ${spec.label}`} disabled={i === theme.sections.length - 1} onClick={() => moveSection(i, 1)}>
                        ↓
                      </IconButton>
                      <IconButton
                        label={section.hidden ? `Afficher : ${spec.label}` : `Masquer : ${spec.label}`}
                        pressed={!section.hidden}
                        onClick={() => updateSection(section.id, (s) => ({ ...s, hidden: !s.hidden }))}
                      >
                        <EyeIcon off={section.hidden} />
                      </IconButton>
                    </div>
                    {isOpen ? (
                      <div className="border-t border-line px-3 pt-3 pb-4">
                        <p className="mb-4 text-sm leading-snug text-ink-soft">{spec.purpose}</p>
                        {section.hidden ? (
                          <p className="mb-4 rounded-control bg-paper px-3 py-2 text-sm text-ink-soft">
                            Section masquée : vos clients ne la voient pas.{" "}
                            <button
                              type="button"
                              className="font-semibold text-baobab-700 hover:underline"
                              onClick={() => updateSection(section.id, (s) => ({ ...s, hidden: false }))}
                            >
                              L&apos;afficher
                            </button>
                          </p>
                        ) : null}
                        <SectionFields
                          idPrefix={section.id}
                          fields={spec.fields}
                          values={section.settings}
                          products={pickerProducts}
                          onChange={(key, value) => updateSection(section.id, (s) => ({ ...s, settings: { ...s.settings, [key]: value } }))}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            update({ sections: theme.sections.filter((s) => s.id !== section.id) });
                            setOpen(null);
                          }}
                          className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-kola-700 hover:underline"
                        >
                          <TrashIcon className="size-4" />
                          Supprimer la section
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <AddSection disabled={theme.sections.length >= MAX_SECTIONS} onAdd={addSection} />
          </Panel>
        </div>

        {/* Aperçu */}
        <div className={`min-w-0 lg:sticky lg:top-16 ${tab === "reglages" ? "max-lg:hidden" : ""}`}>
          <div className="mb-2 hidden items-center justify-between lg:flex">
            <p className="text-sm font-semibold text-ink-soft">Aperçu</p>
            <Segmented
              legend="Taille de l'aperçu"
              hideLegend
              value={device}
              options={[
                ["ordinateur", "Ordinateur"],
                ["mobile", "Mobile"],
              ]}
              onChange={setDevice}
            />
          </div>
          <Preview
            theme={theme}
            shop={shop}
            products={forSale}
            device={device}
            focusId={open}
          />
        </div>
      </div>
    </div>
  );
}

function Preview({
  theme,
  shop,
  products,
  device,
  focusId,
}: {
  theme: Theme;
  shop: StorefrontShop;
  products: StorefrontProduct[];
  device: Device;
  focusId: string | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(800);
  const [narrow, setNarrow] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setAvailable(entry.contentRect.width);
      setNarrow(window.innerWidth < 1024);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const width = DEVICE_WIDTH[narrow ? "mobile" : device];
  const zoom = Math.min(1, available / width);

  // Fait défiler l'aperçu jusqu'à la section ouverte dans les réglages
  useEffect(() => {
    const el = box.current;
    if (!el || !focusId) return;
    const target = el.querySelector<HTMLElement>(`[data-section="${focusId}"]`);
    if (target) el.scrollTo({ top: el.scrollTop + target.getBoundingClientRect().top - el.getBoundingClientRect().top, behavior: "smooth" });
  }, [focusId]);

  return (
    <div
      ref={box}
      className="h-[calc(100dvh-9rem)] min-h-[32rem] overflow-y-auto overscroll-contain rounded-panel border border-line-strong bg-[repeating-linear-gradient(45deg,var(--color-paper)_0_10px,var(--color-surface)_10px_20px)]"
    >
      <div className="mx-auto bg-white shadow-sm" style={{ width, zoom }} inert>
        <StoreFrame theme={theme} shop={shop} slug={shop.slug}>
          <StoreSections theme={theme} ctx={{ slug: shop.slug, shop, products, template: theme.template, preview: true }} />
        </StoreFrame>
      </div>
    </div>
  );
}

function TemplateCard({ id, selected, onSelect }: { id: TemplateId; selected: boolean; onSelect: () => void }) {
  const t = TEMPLATES[id];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`overflow-hidden rounded-control border-2 text-left transition-colors ${selected ? "border-baobab-700" : "border-line hover:border-line-strong"}`}
    >
      {/* Miniature dessinée : la silhouette de chaque modèle */}
      {id === "impact" ? (
        <span className="flex h-20 items-center gap-2 bg-white p-2.5" aria-hidden="true">
          <span className="flex flex-1 flex-col gap-1">
            <span className="h-2.5 w-full rounded-sm bg-[#141a33]" />
            <span className="h-2.5 w-3/4 rounded-sm bg-[#141a33]" />
            <span className="mt-1 h-3 w-2/3 rounded-full" style={{ background: t.accent }} />
          </span>
          <span className="relative size-12 shrink-0">
            <span className="absolute inset-0 translate-x-1 translate-y-1 rounded-md" style={{ background: t.accent }} />
            <span className="absolute inset-0 rounded-md border border-[#141a33] bg-[#f2f3f8]" />
            <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-[#ffd23f]" />
          </span>
        </span>
      ) : (
        <span className="flex h-20 items-end gap-2 bg-[#f4eee7] p-2.5" aria-hidden="true">
          <span className="flex flex-1 flex-col gap-1 pb-1">
            <span className="h-2 w-full bg-[#231c1a]" />
            <span className="h-2 w-2/3 bg-[#231c1a]" />
            <span className="mt-1.5 h-2.5 w-1/2" style={{ background: t.accent }} />
          </span>
          <span className="h-14 w-10 shrink-0 rounded-t-full" style={{ background: `color-mix(in oklab, ${t.accent} 35%, white)` }} />
        </span>
      )}
      <span className="block border-t border-line px-2.5 py-2 text-sm font-bold">{t.name}</span>
    </button>
  );
}

function Segmented<T extends string>({
  legend,
  value,
  options,
  onChange,
  hideLegend,
}: {
  legend: string;
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
  hideLegend?: boolean;
}) {
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "text-sm font-semibold"}>{legend}</legend>
      <div className={`inline-flex rounded-control border border-line-strong bg-surface p-0.5 ${hideLegend ? "" : "mt-1.5"}`}>
        {options.map(([v, label]) => (
          <label
            key={v}
            className={`cursor-pointer rounded-[0.4rem] px-3 py-1.5 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-baobab-500 ${
              value === v ? "bg-baobab-700 text-white" : "text-ink-soft hover:text-ink"
            }`}
          >
            <input type="radio" name={legend} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function AddSection({ disabled, onAdd }: { disabled: boolean; onAdd: (type: SectionType) => void }) {
  const [type, setType] = useState<SectionType>("vedette");
  return (
    <div className="mt-4 flex gap-2 border-t border-line pt-4">
      <label htmlFor="add-section" className="sr-only">
        Type de section à ajouter
      </label>
      <select
        id="add-section"
        value={type}
        onChange={(e) => setType(e.target.value as SectionType)}
        className="h-9 min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-2 text-sm"
      >
        {SECTION_TYPES.map((t) => (
          <option key={t} value={t}>
            {SECTION_SPECS[t].label}
          </option>
        ))}
      </select>
      <button type="button" disabled={disabled} onClick={() => onAdd(type)} className={buttonClass("secondary", "sm")}>
        Ajouter
      </button>
    </div>
  );
}

function EyeIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
      {off ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}
