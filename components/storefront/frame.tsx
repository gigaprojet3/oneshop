/**
 * Cadre commun à toutes les pages d'une boutique : variables du thème, bandeau d'annonce,
 * en-tête et pied de page. Utilisé par la boutique en ligne et par l'aperçu de l'éditeur.
 */
import Link from "next/link";
import type { ReactNode } from "react";
import { storePath } from "@/lib/store-url";
import type { Theme } from "@/lib/theme/schema";
import { themeStyle } from "@/lib/theme/style";
import type { StorefrontShop } from "@/lib/types";
import { storeFontVariables } from "./fonts";
import { CartLink } from "./store-ui";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "/";

export function StoreFrame({
  theme,
  shop,
  slug,
  children,
  className = "",
}: {
  theme: Theme;
  shop: StorefrontShop;
  slug: string;
  children: ReactNode;
  className?: string;
}) {
  const ecrin = theme.template === "ecrin";
  const nav = (
    <nav aria-label="Navigation de la boutique" className="hidden @3xl:block">
      <ul className="flex items-center gap-7 text-[0.95rem] font-medium">
        <li>
          <Link href={storePath(slug)} className="hover:underline hover:underline-offset-4">
            Accueil
          </Link>
        </li>
        <li>
          <Link href={storePath(slug, "/produits")} className="hover:underline hover:underline-offset-4">
            Tous les produits
          </Link>
        </li>
      </ul>
    </nav>
  );

  return (
    <div className={`store-root @container flex min-h-full flex-1 flex-col ${storeFontVariables} ${className}`} style={themeStyle(theme)}>
      {theme.announcement.enabled && theme.announcement.text ? (
        <p className="bg-s-ink px-4 py-2.5 text-center text-sm font-medium text-white">{theme.announcement.text}</p>
      ) : null}

      <header className="sticky top-0 z-20 border-b border-s-line bg-s-bg/95 backdrop-blur">
        {ecrin ? (
          <div className="mx-auto grid h-18 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 @3xl:px-8">
            {nav}
            <Link href={storePath(slug)} className="s-display col-start-2 truncate text-center text-[1.6rem] leading-none tracking-[-0.01em]">
              {shop.name}
            </Link>
            <div className="col-start-3 flex justify-end">
              <CartLink slug={slug} />
            </div>
          </div>
        ) : (
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 @3xl:px-8">
            <Link href={storePath(slug)} className="flex min-w-0 items-center gap-2.5">
              <span className="s-display grid size-9 shrink-0 place-items-center rounded-lg bg-s-accent text-lg text-white" aria-hidden="true">
                {shop.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className="s-display truncate text-[1.2rem] tracking-[-0.02em]">{shop.name}</span>
            </Link>
            <div className="flex items-center gap-6">
              {nav}
              <CartLink slug={slug} />
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className={ecrin ? "border-t border-s-line bg-s-bg" : "bg-s-ink text-white"}>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 @3xl:grid-cols-[1.4fr_1fr_1fr] @3xl:px-8">
          <div>
            <p className="s-display text-[1.6rem] leading-tight">{shop.name}</p>
            {shop.description ? <p className={`mt-3 max-w-[42ch] text-[0.95rem] leading-relaxed ${ecrin ? "text-s-soft" : "text-white/70"}`}>{shop.description}</p> : null}
          </div>
          <div className="text-[0.95rem]">
            <p className="font-semibold">Une question ?</p>
            <ul className={`mt-3 space-y-1.5 ${ecrin ? "text-s-soft" : "text-white/75"}`}>
              <li>
                <a href={`tel:${shop.phone}`} className="tabular hover:underline">
                  {shop.phone}
                </a>
              </li>
              {shop.email ? (
                <li>
                  <a href={`mailto:${shop.email}`} className="hover:underline">
                    {shop.email}
                  </a>
                </li>
              ) : null}
              <li>{shop.city}</li>
            </ul>
          </div>
          <div className="text-[0.95rem]">
            <p className="font-semibold">Commander</p>
            <ul className={`mt-3 space-y-1.5 ${ecrin ? "text-s-soft" : "text-white/75"}`}>
              <li>
                <Link href={storePath(slug, "/produits")} className="hover:underline">
                  Tous les produits
                </Link>
              </li>
              <li>
                <Link href={storePath(slug, "/panier")} className="hover:underline">
                  Mon panier
                </Link>
              </li>
              <li>Paiement en espèces à la livraison</li>
            </ul>
          </div>
        </div>
        <div className={`border-t ${ecrin ? "border-s-line text-s-soft" : "border-white/15 text-white/60"}`}>
          <p className="mx-auto max-w-6xl px-5 py-5 text-sm @3xl:px-8">
            <a href={SITE_URL} className="hover:underline">
              Boutique créée avec OneShop
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
