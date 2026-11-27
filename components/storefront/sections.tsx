/**
 * Sections de la page d'accueil d'une boutique, pour les deux modèles (Impact et Écrin).
 * Composants sans état ni accès aux données : ils servent à la boutique en ligne (rendu serveur)
 * comme à l'aperçu en direct de l'éditeur (rendu navigateur). Les tailles suivent la largeur du
 * conteneur (@container, variantes @3xl…), pour que l'aperçu mobile soit fidèle.
 */
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ImageIcon } from "@/components/icons";
import { fcfa } from "@/lib/format";
import { storePath } from "@/lib/store-url";
import { productImageUrl } from "@/lib/supabase/env";
import type { Section, SectionType, TemplateId, Theme } from "@/lib/theme/schema";
import type { StorefrontProduct, StorefrontShop } from "@/lib/types";
import { AddToCart } from "./store-ui";

export type StoreContext = {
  slug: string;
  shop: StorefrontShop;
  products: StorefrontProduct[];
  template: TemplateId;
  /** Aperçu de l'éditeur : signale les sections vides au lieu de les cacher. */
  preview?: boolean;
};

type Text = string;
type ListItem = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Petits éléments communs
// ---------------------------------------------------------------------------
function str(v: unknown): Text {
  return typeof v === "string" ? v : "";
}
function list(v: unknown): ListItem[] {
  return Array.isArray(v) ? (v as ListItem[]) : [];
}
function productById(ctx: StoreContext, id: unknown) {
  return typeof id === "string" ? ctx.products.find((p) => p.id === id) : undefined;
}
function productHref(ctx: StoreContext, p?: StorefrontProduct) {
  return storePath(ctx.slug, p ? `/produits/${p.id}` : "/produits");
}

/** Remise affichée, arrondie à l'entier : 22 000 → 15 000 = 32 %. */
export function savingsPercent(p: StorefrontProduct) {
  if (!p.compare_at_price || p.compare_at_price <= p.price) return 0;
  return Math.round((1 - p.price / p.compare_at_price) * 100);
}

const Check = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
);
const Cross = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="m6 6 8 8M14 6l-8 8" />
  </svg>
);
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-s-accent" role="img" aria-label={`Noté ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={`size-4 ${i <= rating ? "" : "opacity-25"}`} fill="currentColor" aria-hidden="true">
          <path d="m10 1.8 2.5 5.3 5.7.7-4.2 4 1.1 5.7L10 14.7l-5.1 2.8 1.1-5.7-4.2-4 5.7-.7z" />
        </svg>
      ))}
    </span>
  );
}

function Wrap({ tone = "bg", children, className = "", id }: { tone?: "bg" | "alt" | "accent" | "ink"; children: ReactNode; className?: string; id?: string }) {
  const tones = {
    bg: "bg-s-bg text-s-ink",
    alt: "bg-s-alt text-s-ink",
    accent: "bg-s-accent text-white",
    ink: "bg-s-ink text-white",
  };
  return (
    <section id={id} className={`${tones[tone]} ${className}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 @3xl:px-8 @3xl:py-24">{children}</div>
    </section>
  );
}

function Heading({ ctx, title, intro, center, light }: { ctx: StoreContext; title: string; intro?: string; center?: boolean; light?: boolean }) {
  if (!title && !intro) return null;
  const size =
    ctx.template === "ecrin"
      ? "text-[2.3rem] leading-[1.02] tracking-[-0.01em] @3xl:text-[3.6rem]"
      : "text-[2rem] leading-[0.98] tracking-[-0.025em] @3xl:text-[3.1rem]";
  return (
    <div className={`mb-10 @3xl:mb-14 ${center ? "mx-auto text-center" : ""}`}>
      {title ? <h2 className={`s-display max-w-[16em] text-balance ${center ? "mx-auto" : ""} ${size}`}>{title}</h2> : null}
      {intro ? (
        <p className={`mt-4 max-w-[58ch] text-[1.05rem] leading-relaxed ${center ? "mx-auto" : ""} ${light ? "text-white/80" : "text-s-soft"}`}>{intro}</p>
      ) : null}
    </div>
  );
}

function Media({
  path,
  alt,
  sizes,
  className = "",
  priority,
}: {
  path: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const src = productImageUrl(path);
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-s-alt text-s-soft ${className}`}>
      {src ? <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" /> : <ImageIcon className="size-10 opacity-60" />}
    </div>
  );
}

function PriceLine({ p, large, light }: { p: StorefrontProduct; large?: boolean; light?: boolean }) {
  const off = savingsPercent(p);
  return (
    <p className={`tabular flex flex-wrap items-baseline gap-x-3 gap-y-1 ${large ? "text-[1.9rem] @3xl:text-[2.2rem]" : "text-base"}`}>
      <span className="font-bold">{fcfa(p.price)}</span>
      {off > 0 && p.compare_at_price ? (
        <span className={`${large ? "text-lg" : "text-sm"} line-through ${light ? "text-white/60" : "text-s-soft"}`}>
          <span className="sr-only">Au lieu de </span>
          {fcfa(p.compare_at_price)}
        </span>
      ) : null}
    </p>
  );
}

function SavingsBadge({ p, ctx, className = "" }: { p: StorefrontProduct; ctx: StoreContext; className?: string }) {
  const off = savingsPercent(p);
  if (!off) return null;
  return ctx.template === "impact" ? (
    <span className={`tabular inline-flex items-center rounded-full bg-s-pop px-2.5 py-1 text-sm font-extrabold text-s-ink ${className}`}>−{off} %</span>
  ) : (
    <span className={`tabular inline-flex items-center bg-s-bg px-2.5 py-1 text-xs font-medium tracking-wide text-s-ink ${className}`}>−{off} %</span>
  );
}

function PrimaryButton({ href, children, className = "", inverted }: { href: string; children: ReactNode; className?: string; inverted?: boolean }) {
  return (
    <Link
      href={href}
      className={`s-btn ${inverted ? "bg-white text-s-accent hover:bg-white/90" : "bg-s-accent text-white hover:brightness-110"} ${className}`}
    >
      {children}
    </Link>
  );
}

function EmptyNote({ ctx, children }: { ctx: StoreContext; children: ReactNode }) {
  if (!ctx.preview) return null;
  return (
    <div className="mx-auto my-6 max-w-6xl px-5">
      <p className="rounded-md border border-dashed border-s-line px-4 py-6 text-center text-sm text-s-soft">{children}</p>
    </div>
  );
}

function Reassurance({ ctx, light }: { ctx: StoreContext; light?: boolean }) {
  const fee = ctx.shop.default_delivery_fee;
  return (
    <ul className={`mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm ${light ? "text-white/80" : "text-s-soft"}`}>
      <li className="flex items-center gap-1.5">
        <Check className="size-4 text-s-accent" />
        Paiement à la livraison
      </li>
      <li className="flex items-center gap-1.5">
        <Check className="size-4 text-s-accent" />
        {fee > 0 ? `Livraison ${fcfa(fee)}` : "Livraison offerte"}
      </li>
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Accroche
// ---------------------------------------------------------------------------
function Hero({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const product = productById(ctx, s.productId);
  const imagePath = (s.image as string | null) ?? product?.image_path ?? null;
  const title = str(s.title) || product?.name || ctx.shop.name;
  const points = list(s.points).map((p) => str(p.text)).filter(Boolean);
  const href = productHref(ctx, product);
  const cta = str(s.cta) || (product ? "Commander maintenant" : "Voir les produits");

  if (ctx.template === "ecrin") {
    return (
      <section className="bg-s-bg text-s-ink">
        <div className="mx-auto grid max-w-6xl items-end gap-10 px-5 pt-10 pb-16 @3xl:grid-cols-[1.1fr_0.9fr] @3xl:gap-16 @3xl:px-8 @3xl:pt-16 @3xl:pb-24">
          <div className="order-2 @3xl:order-1 @3xl:pb-10">
            {str(s.eyebrow) ? <p className="text-[0.95rem] text-s-soft">{str(s.eyebrow)}</p> : null}
            <h1 className="s-display mt-4 text-balance text-[2.9rem] leading-[0.98] tracking-[-0.015em] @3xl:text-[5.2rem]">{title}</h1>
            {str(s.subtitle) ? <p className="mt-6 max-w-[44ch] text-[1.1rem] leading-[1.7] text-s-soft">{str(s.subtitle)}</p> : null}
            {points.length ? (
              <ul className="mt-6 space-y-2 text-[0.98rem]">
                {points.map((p, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="size-1.5 rotate-45 bg-s-accent" aria-hidden="true" />
                    {p}
                  </li>
                ))}
              </ul>
            ) : null}
            {product ? (
              <div className="mt-8 flex items-center gap-3">
                <PriceLine p={product} />
                <SavingsBadge p={product} ctx={ctx} className="border border-s-line" />
              </div>
            ) : null}
            <PrimaryButton href={href} className="mt-8 w-full @xl:w-auto">
              {cta}
            </PrimaryButton>
          </div>
          <Media
            path={imagePath}
            alt={product?.name ?? ctx.shop.name}
            sizes="(min-width: 768px) 45vw, 100vw"
            priority
            className="s-arch order-1 aspect-[4/5] w-full @3xl:order-2"
          />
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden bg-s-bg text-s-ink">
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pt-6 pb-14 @3xl:grid-cols-[1.05fr_1fr] @3xl:gap-14 @3xl:px-8 @3xl:pt-14 @3xl:pb-20">
        <div className="order-2 @3xl:order-1">
          {str(s.eyebrow) ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-s-alt px-3.5 py-1.5 text-sm font-semibold">
              <span className="size-2 rounded-full bg-s-accent" aria-hidden="true" />
              {str(s.eyebrow)}
            </p>
          ) : null}
          <h1 className="s-display mt-5 text-balance text-[2.55rem] leading-[0.94] tracking-[-0.03em] @3xl:text-[4.1rem]">{title}</h1>
          {str(s.subtitle) ? <p className="mt-5 max-w-[48ch] text-[1.08rem] leading-relaxed text-s-soft">{str(s.subtitle)}</p> : null}
          {points.length ? (
            <ul className="mt-6 grid gap-2.5 font-semibold @xl:grid-cols-2">
              {points.map((p, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-s-accent text-white">
                    <Check className="size-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
          {product ? (
            <div className="mt-7 flex items-center gap-3">
              <PriceLine p={product} large />
            </div>
          ) : null}
          <PrimaryButton href={href} className="mt-6 w-full text-[1.05rem] @xl:w-auto @xl:min-w-72">
            {cta}
          </PrimaryButton>
          <Reassurance ctx={ctx} />
        </div>
        <div className="relative order-1 @3xl:order-2">
          <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[1.75rem] bg-s-accent @3xl:translate-x-5 @3xl:translate-y-5" aria-hidden="true" />
          <Media
            path={imagePath}
            alt={product?.name ?? ctx.shop.name}
            sizes="(min-width: 768px) 48vw, 100vw"
            priority
            className="aspect-square w-full rounded-[1.75rem] border-2 border-s-ink"
          />
          {product && savingsPercent(product) > 0 ? (
            <span className="tabular absolute -top-3 -right-1 grid size-24 rotate-12 place-items-center rounded-full bg-s-pop text-center text-s-ink shadow-[0_6px_0_var(--s-ink)] @3xl:size-28">
              <span className="leading-none">
                <span className="block text-xs font-bold">Économisez</span>
                <span className="s-display block text-[1.7rem] @3xl:text-[2rem]">{savingsPercent(product)} %</span>
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Bandeau de garanties
// ---------------------------------------------------------------------------
function Guarantees({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const items = list(s.items).map((i) => str(i.text)).filter(Boolean);
  if (!items.length) return <EmptyNote ctx={ctx}>Bandeau de garanties vide : ajoutez au moins une garantie.</EmptyNote>;

  if (ctx.template === "ecrin") {
    return (
      <div className="border-y border-s-line bg-s-bg">
        <ul className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-10 gap-y-3 px-5 py-5 text-[0.95rem] text-s-soft">
          {items.map((t, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <span className="size-1.5 rotate-45 bg-s-accent" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <li key={i} className="flex items-center gap-6 pr-6 whitespace-nowrap">
          {t}
          <span aria-hidden="true">✦</span>
        </li>
      ))}
    </ul>
  );
  return (
    <div className="s-marquee-wrap overflow-hidden bg-s-accent py-3.5 text-[0.95rem] font-bold text-white">
      <div className="s-marquee" style={{ ["--s-marquee-duration" as string]: `${Math.max(18, items.length * 6)}s` }}>
        {row(false)}
        {row(true)}
        {row(true)}
        {row(true)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grille de produits
// ---------------------------------------------------------------------------
export function ProductGrid({ products, ctx }: { products: StorefrontProduct[]; ctx: StoreContext }) {
  const ecrin = ctx.template === "ecrin";
  return (
    <ul className={`grid grid-cols-2 gap-x-4 @3xl:grid-cols-3 @5xl:grid-cols-4 ${ecrin ? "gap-y-12 @3xl:gap-x-8" : "gap-y-9 @3xl:gap-x-6"}`}>
      {products.map((p) => (
        <li key={p.id}>
          <Link href={productHref(ctx, p)} className="group block">
            <span className="relative block">
              <Media
                path={p.image_path}
                alt={p.name}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className={ecrin ? "aspect-[4/5]" : "aspect-square rounded-2xl"}
              />
              <span className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
                {p.stock === 0 ? (
                  <span className="rounded-full bg-s-bg px-2.5 py-1 text-xs font-semibold text-s-soft">Épuisé</span>
                ) : (
                  <SavingsBadge p={p} ctx={ctx} />
                )}
              </span>
            </span>
            <span className={`mt-3.5 block leading-snug group-hover:underline ${ecrin ? "s-display text-[1.15rem]" : "font-semibold"}`}>{p.name}</span>
            <span className={`mt-1 block ${ecrin ? "text-s-soft" : ""}`}>
              <PriceLine p={p} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Products({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const ids = Array.isArray(s.productIds) ? (s.productIds as string[]) : [];
  const limit = typeof s.limit === "number" ? s.limit : 8;
  const chosen = ids.length ? ids.map((id) => productById(ctx, id)).filter((p): p is StorefrontProduct => Boolean(p)) : ctx.products;
  const shown = chosen.slice(0, limit);

  if (!shown.length) {
    return ctx.preview ? (
      <EmptyNote ctx={ctx}>Aucun produit en vente pour l&apos;instant : ajoutez-en depuis l&apos;onglet Produits.</EmptyNote>
    ) : (
      <Wrap>
        <p className="py-6 text-center text-s-soft">Cette boutique n&apos;a pas encore mis de produits en vente.</p>
      </Wrap>
    );
  }
  return (
    <Wrap id="produits">
      <div className="flex flex-wrap items-end justify-between gap-x-6">
        <Heading ctx={ctx} title={str(s.title)} intro={str(s.subtitle)} />
        {ctx.products.length > shown.length ? (
          <Link href={storePath(ctx.slug, "/produits")} className="mb-10 font-semibold underline underline-offset-4 @3xl:mb-14">
            Voir les {ctx.products.length} produits
          </Link>
        ) : null}
      </div>
      <ProductGrid products={shown} ctx={ctx} />
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Produit vedette
// ---------------------------------------------------------------------------
function Featured({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const p = productById(ctx, s.productId);
  if (!p) return <EmptyNote ctx={ctx}>Produit vedette : choisissez un produit en vente.</EmptyNote>;
  const points = list(s.points).map((x) => str(x.text)).filter(Boolean);
  const ecrin = ctx.template === "ecrin";
  const low = s.showStock === true && p.stock > 0 && p.stock <= 5;

  return (
    <Wrap tone="alt">
      <div className="grid items-center gap-10 @3xl:grid-cols-2 @3xl:gap-16">
        <Media path={p.image_path} alt={p.name} sizes="(min-width: 768px) 50vw, 100vw" className={ecrin ? "s-arch aspect-[4/5]" : "aspect-square rounded-[1.75rem]"} />
        <div>
          <h2 className={`s-display text-balance ${ecrin ? "text-[2.3rem] leading-[1.02] @3xl:text-[3.2rem]" : "text-[2rem] leading-[0.98] tracking-[-0.025em] @3xl:text-[2.8rem]"}`}>{p.name}</h2>
          <div className="mt-4 flex items-center gap-3">
            <PriceLine p={p} large />
            <SavingsBadge p={p} ctx={ctx} />
          </div>
          {low ? <p className="mt-2 font-semibold text-s-accent">Plus que {p.stock} en stock</p> : null}
          {points.length ? (
            <ul className="mt-6 space-y-2.5">
              {points.map((t, i) => (
                <li key={i} className="flex gap-2.5">
                  <Check className="mt-1 size-4 shrink-0 text-s-accent" />
                  {t}
                </li>
              ))}
            </ul>
          ) : p.description ? (
            <p className="mt-6 line-clamp-5 max-w-[56ch] leading-relaxed text-s-soft">{p.description}</p>
          ) : null}
          <div className="mt-8">
            <AddToCart slug={ctx.slug} productId={p.id} stock={p.stock} />
          </div>
          <Reassurance ctx={ctx} />
        </div>
      </div>
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Bénéfices
// ---------------------------------------------------------------------------
function Benefits({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const items = list(s.items).filter((i) => str(i.title) || str(i.text));
  if (!items.length) return <EmptyNote ctx={ctx}>Bénéfices : ajoutez au moins un bénéfice.</EmptyNote>;
  const image = s.image as string | null;
  const ecrin = ctx.template === "ecrin";

  const grid = (
    <ul className={`grid gap-x-8 ${ecrin ? "gap-y-0" : "gap-y-8"} ${image ? "" : "@3xl:grid-cols-3"}`}>
      {items.map((it, i) =>
        ecrin ? (
          <li key={i} className="border-t border-s-line py-6">
            <h3 className="s-display text-[1.5rem] leading-tight">{str(it.title)}</h3>
            {str(it.text) ? <p className="mt-2 max-w-[52ch] leading-[1.7] text-s-soft">{str(it.text)}</p> : null}
          </li>
        ) : (
          <li key={i} className="flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-s-accent text-white">
              <Check className="size-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold leading-snug [font-stretch:105%]">{str(it.title)}</h3>
              {str(it.text) ? <p className="mt-1.5 leading-relaxed text-s-soft">{str(it.text)}</p> : null}
            </div>
          </li>
        ),
      )}
    </ul>
  );

  return (
    <Wrap tone={ecrin ? "bg" : "alt"}>
      {image ? (
        <div className="grid items-center gap-12 @3xl:grid-cols-2 @3xl:gap-20">
          <Media path={image} alt="" sizes="(min-width: 768px) 50vw, 100vw" className={ecrin ? "s-arch aspect-[4/5]" : "aspect-[4/5] rounded-[1.75rem]"} />
          <div>
            <Heading ctx={ctx} title={str(s.title)} intro={str(s.subtitle)} />
            {grid}
          </div>
        </div>
      ) : (
        <>
          <Heading ctx={ctx} title={str(s.title)} intro={str(s.subtitle)} center={!ecrin} />
          {grid}
        </>
      )}
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Image et texte
// ---------------------------------------------------------------------------
function Story({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const text = str(s.text);
  const image = s.image as string | null;
  if (!text && !image) return <EmptyNote ctx={ctx}>Image et texte : écrivez votre texte ou ajoutez une image.</EmptyNote>;
  const ecrin = ctx.template === "ecrin";
  const right = s.side === "droite";
  return (
    <Wrap tone={ecrin ? "alt" : "bg"}>
      <div className="grid items-center gap-12 @3xl:grid-cols-2 @3xl:gap-20">
        {image ? (
          <Media
            path={image}
            alt=""
            sizes="(min-width: 768px) 50vw, 100vw"
            className={`${ecrin ? "s-arch aspect-[4/5]" : "aspect-square rounded-[1.75rem]"} ${right ? "@3xl:order-2" : ""}`}
          />
        ) : null}
        <div className={image ? "" : "@3xl:col-span-2 @3xl:mx-auto"}>
          {str(s.title) ? (
            <h2 className={`s-display text-balance ${ecrin ? "text-[2.3rem] leading-[1.02] @3xl:text-[3.4rem]" : "text-[2rem] leading-[0.98] tracking-[-0.025em] @3xl:text-[2.8rem]"}`}>
              {str(s.title)}
            </h2>
          ) : null}
          {text ? <p className={`mt-6 max-w-[60ch] whitespace-pre-line text-[1.05rem] text-s-soft ${ecrin ? "leading-[1.8]" : "leading-relaxed"}`}>{text}</p> : null}
        </div>
      </div>
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Tableau comparatif
// ---------------------------------------------------------------------------
function Comparison({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const rows = list(s.rows).filter((r) => str(r.label));
  if (!rows.length) return <EmptyNote ctx={ctx}>Tableau comparatif : ajoutez au moins un critère.</EmptyNote>;
  const ours = str(s.ours) || ctx.shop.name;
  const theirs = str(s.theirs) || "Les autres";
  const ecrin = ctx.template === "ecrin";
  return (
    <Wrap>
      <Heading ctx={ctx} title={str(s.title)} center />
      <div className="mx-auto max-w-3xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="w-full pb-4">
                <span className="sr-only">Critère</span>
              </th>
              <th
                scope="col"
                className={`px-3 py-4 text-center text-sm font-bold whitespace-nowrap @xl:px-6 ${ecrin ? "border-b-2 border-s-accent" : "rounded-t-2xl bg-s-accent text-white"}`}
              >
                {ours}
              </th>
              <th scope="col" className="px-3 py-4 text-center text-sm font-semibold whitespace-nowrap text-s-soft @xl:px-6">
                {theirs}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-s-line">
                <th scope="row" className="py-4 pr-3 font-medium @xl:text-[1.05rem]">
                  {str(r.label)}
                </th>
                <td className={`px-3 text-center @xl:px-6 ${ecrin ? "" : "bg-s-tint/8"} ${!ecrin && i === rows.length - 1 ? "rounded-b-2xl" : ""}`}>
                  {r.ours ? <Check className="mx-auto size-5 text-s-accent" /> : <Cross className="mx-auto size-5 text-s-soft" />}
                  <span className="sr-only">{r.ours ? "Oui" : "Non"}</span>
                </td>
                <td className="px-3 text-center @xl:px-6">
                  {r.theirs ? <Check className="mx-auto size-5 text-s-soft" /> : <Cross className="mx-auto size-5 text-s-soft opacity-60" />}
                  <span className="sr-only">{r.theirs ? "Oui" : "Non"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Chiffres clés
// ---------------------------------------------------------------------------
function Stats({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const items = list(s.items).filter((i) => str(i.value));
  if (!items.length) return <EmptyNote ctx={ctx}>Chiffres clés : ajoutez des chiffres mesurés, avec leur source.</EmptyNote>;
  const ecrin = ctx.template === "ecrin";
  const cols = ["", "@3xl:grid-cols-1", "@3xl:grid-cols-2", "@3xl:grid-cols-3", "@3xl:grid-cols-4"][items.length];
  return (
    <Wrap tone={ecrin ? "alt" : "accent"}>
      <Heading ctx={ctx} title={str(s.title)} center light={!ecrin} />
      <dl className={`grid gap-10 text-center ${cols}`}>
        {items.map((it, i) => (
          <div key={i}>
            <dt className="sr-only">{str(it.label)}</dt>
            <dd>
              <span className={`s-display tabular block text-[3.4rem] leading-none @3xl:text-[4.5rem] ${ecrin ? "text-s-accent" : ""}`}>{str(it.value)}</span>
              <span className={`mx-auto mt-3 block max-w-[28ch] leading-snug ${ecrin ? "text-s-soft" : "text-white/85"}`}>{str(it.label)}</span>
            </dd>
          </div>
        ))}
      </dl>
      {str(s.note) ? <p className={`mt-10 text-center text-sm ${ecrin ? "text-s-soft" : "text-white/70"}`}>{str(s.note)}</p> : null}
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Avis clients
// ---------------------------------------------------------------------------
function Reviews({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const items = list(s.items).filter((i) => str(i.text));
  if (!items.length) return <EmptyNote ctx={ctx}>Avis clients : ajoutez de vrais avis reçus de vos clients.</EmptyNote>;
  const ecrin = ctx.template === "ecrin";

  const card = (it: ListItem, i: number, hidden = false) => (
    <figure
      key={i}
      aria-hidden={hidden || undefined}
      className={`flex flex-col ${ecrin ? "border-t border-s-line pt-6" : "rounded-2xl border border-s-line bg-s-bg p-6"} ${s.layout === "defilant" ? "mr-5 w-[19rem] shrink-0" : ""}`}
    >
      {typeof it.rating === "number" ? <Stars rating={it.rating} /> : null}
      <blockquote className={`mt-4 flex-1 leading-relaxed ${ecrin ? "s-display text-[1.25rem] leading-snug" : ""}`}>{str(it.text)}</blockquote>
      <figcaption className="mt-5 text-sm">
        <span className="font-semibold">{str(it.name) || "Client"}</span>
        {str(it.city) ? <span className="text-s-soft">, {str(it.city)}</span> : null}
      </figcaption>
    </figure>
  );

  return (
    <Wrap tone={ecrin ? "bg" : "alt"}>
      <Heading ctx={ctx} title={str(s.title)} center={!ecrin} />
      {s.layout === "defilant" ? (
        <div className="s-marquee-wrap -mx-5 overflow-hidden @3xl:-mx-8">
          <div className="s-marquee items-stretch" style={{ ["--s-marquee-duration" as string]: `${Math.max(30, items.length * 9)}s` }}>
            {items.map((it, i) => card(it, i))}
            {items.map((it, i) => card(it, i + items.length, true))}
          </div>
        </div>
      ) : (
        <div className={`grid gap-5 @3xl:grid-cols-3 ${ecrin ? "@3xl:gap-x-10" : ""}`}>{items.map((it, i) => card(it, i))}</div>
      )}
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Comment commander
// ---------------------------------------------------------------------------
function Steps({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const items = list(s.items).filter((i) => str(i.title));
  if (!items.length) return <EmptyNote ctx={ctx}>Comment commander : ajoutez les étapes.</EmptyNote>;
  const ecrin = ctx.template === "ecrin";
  const cols = ["", "", "@3xl:grid-cols-2", "@3xl:grid-cols-3", "@3xl:grid-cols-4"][items.length];
  return (
    <Wrap tone={ecrin ? "alt" : "bg"}>
      <Heading ctx={ctx} title={str(s.title)} center />
      <ol className={`grid gap-10 ${cols}`}>
        {items.map((it, i) => (
          <li key={i} className={ecrin ? "text-center" : "flex gap-4 @3xl:block"}>
            {ecrin ? (
              <span className="s-display block text-[3.5rem] leading-none text-s-accent">{i + 1}</span>
            ) : (
              <span className="s-display grid size-12 shrink-0 place-items-center rounded-full border-2 border-s-ink text-xl">{i + 1}</span>
            )}
            <div className={ecrin ? "mt-3" : "@3xl:mt-5"}>
              <h3 className={ecrin ? "s-display text-[1.45rem]" : "text-lg font-bold [font-stretch:105%]"}>{str(it.title)}</h3>
              {str(it.text) ? <p className={`mt-1.5 leading-relaxed text-s-soft ${ecrin ? "mx-auto max-w-[32ch]" : "max-w-[40ch]"}`}>{str(it.text)}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Questions fréquentes
// ---------------------------------------------------------------------------
function Faq({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const items = list(s.items).filter((i) => str(i.question));
  if (!items.length) return <EmptyNote ctx={ctx}>Questions fréquentes : ajoutez au moins une question.</EmptyNote>;
  return (
    <Wrap>
      <Heading ctx={ctx} title={str(s.title)} center />
      <div className="mx-auto max-w-3xl border-b border-s-line">
        {items.map((it, i) => (
          <details key={i} className="group border-t border-s-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[1.05rem] font-semibold [&::-webkit-details-marker]:hidden">
              {str(it.question)}
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-s-line text-lg transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="max-w-[64ch] pb-6 whitespace-pre-line leading-relaxed text-s-soft">{str(it.answer)}</p>
          </details>
        ))}
      </div>
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Dernier appel
// ---------------------------------------------------------------------------
function FinalCall({ s, ctx }: { s: Section["settings"]; ctx: StoreContext }) {
  const product = productById(ctx, s.productId);
  const ecrin = ctx.template === "ecrin";
  return (
    <Wrap tone={ecrin ? "alt" : "accent"}>
      <div className="mx-auto max-w-2xl text-center">
        {str(s.title) ? (
          <h2 className={`s-display text-balance ${ecrin ? "text-[2.4rem] leading-[1.02] @3xl:text-[3.8rem]" : "text-[2.2rem] leading-[0.96] tracking-[-0.03em] @3xl:text-[3.6rem]"}`}>
            {str(s.title)}
          </h2>
        ) : null}
        {str(s.text) ? <p className={`mx-auto mt-5 max-w-[48ch] text-[1.08rem] leading-relaxed ${ecrin ? "text-s-soft" : "text-white/85"}`}>{str(s.text)}</p> : null}
        <PrimaryButton href={productHref(ctx, product)} inverted={!ecrin} className="mt-8 w-full @xl:w-auto @xl:min-w-72">
          {str(s.cta) || "Commander maintenant"}
        </PrimaryButton>
      </div>
    </Wrap>
  );
}

// ---------------------------------------------------------------------------
// Assemblage
// ---------------------------------------------------------------------------
const RENDERERS: Record<SectionType, (props: { s: Section["settings"]; ctx: StoreContext }) => ReactNode> = {
  hero: Hero,
  garanties: Guarantees,
  produits: Products,
  vedette: Featured,
  avantages: Benefits,
  histoire: Story,
  comparatif: Comparison,
  chiffres: Stats,
  avis: Reviews,
  etapes: Steps,
  faq: Faq,
  appel: FinalCall,
};

export function StoreSections({ theme, ctx }: { theme: Theme; ctx: StoreContext }) {
  const visible = theme.sections.filter((s) => !s.hidden);
  if (!visible.length) {
    return (
      <Wrap>
        <ProductGrid products={ctx.products} ctx={ctx} />
      </Wrap>
    );
  }
  return (
    <>
      {visible.map((section) => {
        const Render = RENDERERS[section.type];
        return (
          <div key={section.id} data-section={section.id}>
            <Render s={section.settings} ctx={ctx} />
          </div>
        );
      })}
    </>
  );
}
