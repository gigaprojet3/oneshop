/**
 * Adresses publiques des boutiques.
 *
 * Avec NEXT_PUBLIC_ROOT_DOMAIN (ex. « oneshop.com », ou « localhost:3000 » en local), chaque boutique a
 * son sous-domaine : chez-awa.oneshop.com. Le proxy (proxy.ts) réécrit ces requêtes vers les pages
 * app/boutique/[slug]/, donc les liens internes d'une boutique partent de la racine (« /panier »).
 * Sans cette variable, les boutiques restent servies sous /boutique/[slug].
 *
 * Utilisable côté serveur, côté navigateur et dans le proxy.
 */

function parseRoot(raw: string | undefined) {
  const value = raw?.trim().toLowerCase().replace(/\/+$/, "");
  if (!value) return null;
  const match = /^(https?):\/\/(.+)$/.exec(value);
  const host = match ? match[2] : value;
  const protocol = match ? match[1] : host.startsWith("localhost") ? "http" : "https";
  return { host, protocol };
}

const ROOT = parseRoot(process.env.NEXT_PUBLIC_ROOT_DOMAIN);

/** Domaine principal (avec le port éventuel), ou null si les sous-domaines sont désactivés. */
export const ROOT_DOMAIN = ROOT?.host ?? null;

/**
 * Sous-domaines qui ne peuvent pas devenir des adresses de boutique :
 * ils servent (ou serviront) au site lui-même.
 */
export const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "dashboard", "tableau-de-bord", "compte", "connexion", "inscription",
  "boutique", "boutiques", "oneshop", "aide", "help", "support", "contact", "blog", "docs", "status",
  "mail", "email", "smtp", "ftp", "cdn", "static", "assets", "img", "images", "media", "dev", "test", "staging",
]);

export function isReservedSlug(slug: string) {
  return RESERVED_SUBDOMAINS.has(slug);
}

/**
 * Lien interne à une boutique, pour <Link> et redirect().
 * storePath("chez-awa", "/panier") → « /panier » sur le sous-domaine, « /boutique/chez-awa/panier » sinon.
 */
export function storePath(slug: string, path = "") {
  if (ROOT) return path || "/";
  return `/boutique/${slug}${path}`;
}

/** Adresse complète d'une boutique, pour les liens depuis le tableau de bord ou les emails. */
export function storeUrl(slug: string, path = "") {
  if (ROOT) return `${ROOT.protocol}://${slug}.${ROOT.host}${path}`;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");
  return `${site}/boutique/${slug}${path}`;
}

/** Adresse affichée au commerçant, sans « https:// ». */
export function storeDisplayUrl(slug: string) {
  return storeUrl(slug).replace(/^https?:\/\//, "");
}

/**
 * Boutique désignée par l'en-tête Host, ou null pour le site principal.
 * « chez-awa.oneshop.com » → « chez-awa » ; « oneshop.com », « www.oneshop.com » → null.
 */
export function slugFromHost(host: string | null) {
  if (!ROOT || !host) return null;
  const h = host.toLowerCase();
  const suffix = `.${ROOT.host}`;
  if (!h.endsWith(suffix)) return null;
  const sub = h.slice(0, -suffix.length);
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(sub) || isReservedSlug(sub)) return null;
  return sub;
}
