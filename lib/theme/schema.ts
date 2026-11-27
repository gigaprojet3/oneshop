/**
 * Thèmes de boutique : modèles, sections de la page d'accueil et leurs réglages.
 *
 * Chaque type de section est décrit une seule fois (SECTION_SPECS) : ses champs servent à la fois
 * à valider ce que le commerçant enregistre (normalizeTheme) et à construire l'éditeur.
 * Utilisable côté serveur comme dans le navigateur.
 */
import { isHexColor } from "./colors";

// ---------------------------------------------------------------------------
// Modèles et style
// ---------------------------------------------------------------------------
export type TemplateId = "impact" | "ecrin";
export type FontId = "affirmee" | "elegante" | "douce";
export type Background = "blanc" | "teinte";
export type ButtonShape = "arrondis" | "droits";

export const TEMPLATES: Record<
  TemplateId,
  { name: string; pitch: string; accent: string; font: FontId; background: Background; buttons: ButtonShape }
> = {
  impact: {
    name: "Impact",
    pitch: "Énergique et direct. Pour vendre vite un ou quelques produits, notamment depuis vos publicités.",
    accent: "#2b3fd6",
    font: "affirmee",
    background: "blanc",
    buttons: "arrondis",
  },
  ecrin: {
    name: "Écrin",
    pitch: "Raffiné et aéré. Pour la beauté, la mode, les bijoux et les créations qui se regardent de près.",
    accent: "#6b2d4a",
    font: "elegante",
    background: "teinte",
    buttons: "droits",
  },
};

export const FONTS: Record<FontId, { name: string; sample: string }> = {
  affirmee: { name: "Affirmée", sample: "Archivo, large et grasse" },
  elegante: { name: "Élégante", sample: "Bodoni Moda et Jost" },
  douce: { name: "Simple", sample: "Schibsted Grotesk" },
};

export const ACCENT_PRESETS = ["#2b3fd6", "#6b2d4a", "#0f6b4f", "#c2410c", "#b0123b", "#1f2937", "#8a5a00", "#5b3fa8"];

// ---------------------------------------------------------------------------
// Champs des sections
// ---------------------------------------------------------------------------
type Base = { key: string; label: string; hint?: string };
export type TextField = Base & { kind: "text"; max: number; multiline?: boolean; placeholder?: string };
export type ImageField = Base & { kind: "image" };
export type ProductField = Base & { kind: "product"; emptyLabel: string };
export type ProductsField = Base & { kind: "products" };
export type NumberField = Base & { kind: "number"; min: number; max: number };
export type ChoiceField = Base & { kind: "choice"; options: { value: string; label: string }[] };
export type ToggleField = Base & { kind: "toggle" };
export type ItemField = TextField | NumberField | ToggleField;
export type ListField = Base & { kind: "list"; itemLabel: string; max: number; fields: ItemField[] };
export type FieldSpec = TextField | ImageField | ProductField | ProductsField | NumberField | ChoiceField | ToggleField | ListField;

export type SectionType =
  | "hero"
  | "garanties"
  | "produits"
  | "vedette"
  | "avantages"
  | "histoire"
  | "comparatif"
  | "chiffres"
  | "avis"
  | "etapes"
  | "faq"
  | "appel";

export type SectionSpec = {
  label: string;
  /** À quoi sert la section dans le parcours d'achat. */
  purpose: string;
  fields: FieldSpec[];
};

const title = (placeholder?: string, max = 90): TextField => ({ key: "title", label: "Titre", kind: "text", max, placeholder });
const subtitle: TextField = { key: "subtitle", label: "Texte d'introduction", kind: "text", max: 240, multiline: true };
const cta = (placeholder: string): TextField => ({ key: "cta", label: "Texte du bouton", kind: "text", max: 32, placeholder });
const image = (hint?: string): ImageField => ({ key: "image", label: "Image", kind: "image", hint });

export const SECTION_SPECS: Record<SectionType, SectionSpec> = {
  hero: {
    label: "Accroche",
    purpose: "Le haut de page : dire en une phrase ce que vous vendez et donner envie de commander.",
    fields: [
      { key: "eyebrow", label: "Phrase de confiance", kind: "text", max: 80, placeholder: "Plus de 500 clients livrés à Abidjan", hint: "Au-dessus du titre. Écrivez un fait vérifiable." },
      title("Des écouteurs qui tiennent toute la journée"),
      subtitle,
      { key: "points", label: "Arguments courts", kind: "list", itemLabel: "Argument", max: 4, fields: [{ key: "text", label: "Argument", kind: "text", max: 50 }] },
      { key: "productId", label: "Produit mis en avant", kind: "product", emptyLabel: "Aucun : présenter toute la boutique", hint: "Affiche son prix et mène directement à sa fiche." },
      image("Facultatif. Remplace la photo du produit."),
      cta("Commander maintenant"),
    ],
  },
  garanties: {
    label: "Bandeau de garanties",
    purpose: "Rassurer d'un coup d'œil : livraison, paiement, retours.",
    fields: [{ key: "items", label: "Garanties", kind: "list", itemLabel: "Garantie", max: 8, fields: [{ key: "text", label: "Garantie", kind: "text", max: 40 }] }],
  },
  produits: {
    label: "Grille de produits",
    purpose: "Montrer le catalogue pour que chacun trouve son produit.",
    fields: [
      title("Nos produits"),
      subtitle,
      { key: "productIds", label: "Produits affichés", kind: "products", hint: "Aucun coché : les derniers produits en vente." },
      { key: "limit", label: "Nombre maximum", kind: "number", min: 1, max: 24 },
    ],
  },
  vedette: {
    label: "Produit vedette",
    purpose: "Un produit présenté en grand, avec le bouton d'ajout au panier directement sur l'accueil.",
    fields: [
      { key: "productId", label: "Produit", kind: "product", emptyLabel: "Choisir un produit" },
      { key: "points", label: "Points forts", kind: "list", itemLabel: "Point fort", max: 5, fields: [{ key: "text", label: "Point fort", kind: "text", max: 80 }] },
      { key: "showStock", label: "Afficher le stock quand il en reste peu", kind: "toggle" },
    ],
  },
  avantages: {
    label: "Bénéfices",
    purpose: "Expliquer ce que le client y gagne, pas seulement ce qu'est le produit.",
    fields: [
      title("Pourquoi nos clients l'adorent"),
      subtitle,
      { key: "items", label: "Bénéfices", kind: "list", itemLabel: "Bénéfice", max: 6, fields: [
        { key: "title", label: "Bénéfice", kind: "text", max: 60 },
        { key: "text", label: "Explication", kind: "text", max: 200, multiline: true },
      ] },
      image("Facultatif. Une photo du produit en situation."),
    ],
  },
  histoire: {
    label: "Image et texte",
    purpose: "Raconter votre savoir-faire ou l'origine du produit pour créer la confiance.",
    fields: [
      title("Notre histoire"),
      { key: "text", label: "Texte", kind: "text", max: 900, multiline: true },
      image(),
      { key: "side", label: "Position de l'image", kind: "choice", options: [{ value: "gauche", label: "À gauche" }, { value: "droite", label: "À droite" }] },
    ],
  },
  comparatif: {
    label: "Tableau comparatif",
    purpose: "Montrer en quoi votre produit fait mieux que les autres.",
    fields: [
      title("Pourquoi choisir le nôtre"),
      { key: "ours", label: "Votre colonne", kind: "text", max: 30, placeholder: "Notre produit" },
      { key: "theirs", label: "Colonne comparée", kind: "text", max: 30, placeholder: "Les autres" },
      { key: "rows", label: "Critères", kind: "list", itemLabel: "Critère", max: 8, fields: [
        { key: "label", label: "Critère", kind: "text", max: 60 },
        { key: "ours", label: "Chez vous", kind: "toggle" },
        { key: "theirs", label: "Chez les autres", kind: "toggle" },
      ] },
    ],
  },
  chiffres: {
    label: "Chiffres clés",
    purpose: "Des résultats mesurés, qui appuient vos promesses.",
    fields: [
      title("Des résultats qui se voient"),
      { key: "items", label: "Chiffres", kind: "list", itemLabel: "Chiffre", max: 4, fields: [
        { key: "value", label: "Valeur", kind: "text", max: 12, placeholder: "92 %" },
        { key: "label", label: "Ce que mesure ce chiffre", kind: "text", max: 120 },
      ] },
      { key: "note", label: "Source", kind: "text", max: 160, placeholder: "Sondage auprès de 120 clientes, mars 2026", hint: "Dites d'où viennent les chiffres." },
    ],
  },
  avis: {
    label: "Avis clients",
    purpose: "La preuve par vos clients. Ne publiez que de vrais avis.",
    fields: [
      title("Ils nous ont fait confiance"),
      { key: "layout", label: "Présentation", kind: "choice", options: [{ value: "grille", label: "Grille" }, { value: "defilant", label: "Défilant" }] },
      { key: "items", label: "Avis", kind: "list", itemLabel: "Avis", max: 12, fields: [
        { key: "name", label: "Prénom et initiale", kind: "text", max: 40, placeholder: "Awa D." },
        { key: "city", label: "Ville", kind: "text", max: 40 },
        { key: "text", label: "Avis", kind: "text", max: 400, multiline: true },
        { key: "rating", label: "Note sur 5", kind: "number", min: 1, max: 5 },
      ] },
    ],
  },
  etapes: {
    label: "Comment commander",
    purpose: "Lever la peur de commander en ligne : on paie seulement à la réception.",
    fields: [
      title("Commander, c'est simple"),
      { key: "items", label: "Étapes", kind: "list", itemLabel: "Étape", max: 4, fields: [
        { key: "title", label: "Étape", kind: "text", max: 60 },
        { key: "text", label: "Détail", kind: "text", max: 200, multiline: true },
      ] },
    ],
  },
  faq: {
    label: "Questions fréquentes",
    purpose: "Répondre aux dernières hésitations avant la commande.",
    fields: [
      title("Vos questions, nos réponses"),
      { key: "items", label: "Questions", kind: "list", itemLabel: "Question", max: 10, fields: [
        { key: "question", label: "Question", kind: "text", max: 160 },
        { key: "answer", label: "Réponse", kind: "text", max: 600, multiline: true },
      ] },
    ],
  },
  appel: {
    label: "Dernier appel",
    purpose: "Une dernière invitation à commander, en bas de page.",
    fields: [
      title("Prêt à commander ?"),
      { key: "text", label: "Texte", kind: "text", max: 200, multiline: true },
      { key: "productId", label: "Le bouton mène à", kind: "product", emptyLabel: "Tous les produits" },
      cta("Commander maintenant"),
    ],
  },
};

export const SECTION_TYPES = Object.keys(SECTION_SPECS) as SectionType[];

// ---------------------------------------------------------------------------
// Thème
// ---------------------------------------------------------------------------
export type Settings = Record<string, unknown>;
export type Section = { id: string; type: SectionType; hidden: boolean; settings: Settings };

export type Theme = {
  template: TemplateId;
  accent: string;
  font: FontId;
  background: Background;
  buttons: ButtonShape;
  announcement: { enabled: boolean; text: string };
  sections: Section[];
};

export const MAX_SECTIONS = 20;

/** Ce que les valeurs par défaut peuvent reprendre de la boutique. */
export type ThemeContext = { name: string; city: string; deliveryFee: number; firstProductId: string | null };

function fee(ctx: ThemeContext) {
  // Sans Intl : le texte doit être identique côté serveur et dans l'aperçu du navigateur
  const amount = String(ctx.deliveryFee).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return ctx.deliveryFee > 0 ? `${amount} FCFA` : "offerte";
}

/** Contenu de départ d'une section : des textes vrais pour toute boutique, sauf avis et chiffres, à remplir. */
export function defaultSettings(type: SectionType, ctx: ThemeContext): Settings {
  switch (type) {
    case "hero":
      return {
        eyebrow: `Livraison depuis ${ctx.city}, paiement à la réception`,
        title: ctx.name,
        subtitle: "Commandez en deux minutes. Notre livreur vous appelle, et vous payez seulement quand vous avez le colis en main.",
        points: [{ text: "On vous appelle avant de livrer" }, { text: "Vous vérifiez avant de payer" }],
        productId: ctx.firstProductId,
        image: null,
        cta: ctx.firstProductId ? "Commander maintenant" : "Voir les produits",
      };
    case "garanties":
      return {
        items: [
          { text: "Paiement à la livraison" },
          { text: `Livraison depuis ${ctx.city}` },
          { text: "Confirmation par téléphone" },
          { text: "Vous vérifiez avant de payer" },
        ],
      };
    case "produits":
      return { title: "Nos produits", subtitle: "", productIds: [], limit: 8 };
    case "vedette":
      return { productId: ctx.firstProductId, points: [], showStock: true };
    case "avantages":
      return {
        title: "Pourquoi commander chez nous",
        subtitle: "",
        items: [
          { title: "Aucun risque", text: "Vous ne payez rien en ligne. Vous réglez le livreur une fois le colis entre vos mains." },
          { title: "Un vrai contact", text: "Nous vous appelons pour confirmer chaque commande et répondre à vos questions." },
          { title: "Livré chez vous", text: `Nous livrons depuis ${ctx.city}. Frais de livraison : ${fee(ctx)}.` },
        ],
        image: null,
      };
    case "histoire":
      return { title: `L'histoire de ${ctx.name}`, text: "", image: null, side: "gauche" };
    case "comparatif":
      return {
        title: "Pourquoi choisir le nôtre",
        ours: ctx.name.slice(0, 30),
        theirs: "Les autres",
        rows: [
          { label: "Paiement à la livraison", ours: true, theirs: false },
          { label: "Confirmation par téléphone", ours: true, theirs: false },
          { label: "Vous vérifiez avant de payer", ours: true, theirs: false },
        ],
      };
    case "chiffres":
      return { title: "Des résultats qui se voient", items: [], note: "" };
    case "avis":
      return { title: "Ils nous ont fait confiance", layout: "grille", items: [] };
    case "etapes":
      return {
        title: "Commander, c'est simple",
        items: [
          { title: "Vous commandez", text: "Choisissez vos produits et laissez votre numéro. Aucun paiement en ligne." },
          { title: "Nous vous appelons", text: "Nous confirmons la commande et convenons de l'heure de livraison." },
          { title: "Vous payez à la réception", text: "Vous vérifiez votre colis, puis vous réglez le livreur en espèces." },
        ],
      };
    case "faq":
      return {
        title: "Vos questions, nos réponses",
        items: [
          { question: "Comment je paie ?", answer: "En espèces, au livreur, au moment où vous recevez votre colis. Rien n'est à payer en ligne." },
          { question: "Combien coûte la livraison ?", answer: `La livraison est ${ctx.deliveryFee > 0 ? `facturée ${fee(ctx)}` : "offerte"}. Nous livrons depuis ${ctx.city}.` },
          { question: "Quand vais-je recevoir ma commande ?", answer: "Nous vous appelons après votre commande pour convenir ensemble du jour et de l'heure de livraison." },
        ],
      };
    case "appel":
      return { title: "Prêt à commander ?", text: "Vous ne payez qu'à la livraison, après avoir vérifié votre colis.", productId: null, cta: "Commander maintenant" };
  }
}

/** Sections de départ de chaque modèle, dans l'ordre d'un parcours d'achat. Avis et chiffres sont masqués tant qu'ils sont vides. */
const TEMPLATE_SECTIONS: Record<TemplateId, SectionType[]> = {
  impact: ["hero", "garanties", "avantages", "comparatif", "avis", "produits", "etapes", "faq", "appel"],
  ecrin: ["hero", "garanties", "produits", "histoire", "avantages", "chiffres", "avis", "etapes", "faq", "appel"],
};

export function newSection(type: SectionType, ctx: ThemeContext, id: string): Section {
  const settings = defaultSettings(type, ctx);
  const empty = (type === "avis" || type === "chiffres" || type === "histoire") && !hasContent(type, settings);
  return { id, type, hidden: empty, settings };
}

function hasContent(type: SectionType, s: Settings) {
  if (type === "histoire") return Boolean(s.text);
  return Array.isArray(s.items) && s.items.length > 0;
}

export function templateSections(template: TemplateId, ctx: ThemeContext): Section[] {
  return TEMPLATE_SECTIONS[template].map((type, i) => {
    const section = newSection(type, ctx, `${type}-${i}`);
    // Écrin ouvre sur une image de marque plutôt que sur un produit
    if (template === "ecrin" && type === "hero") {
      section.settings = { ...section.settings, productId: null, cta: "Découvrir la collection", points: [] };
    }
    if (template === "ecrin" && type === "produits") section.settings = { ...section.settings, title: "La collection" };
    return section;
  });
}

export function defaultTheme(template: TemplateId, ctx: ThemeContext): Theme {
  const t = TEMPLATES[template];
  return {
    template,
    accent: t.accent,
    font: t.font,
    background: t.background,
    buttons: t.buttons,
    announcement: {
      enabled: true,
      text: ctx.deliveryFee > 0 ? "Paiement à la livraison partout où nous livrons" : "Livraison offerte et paiement à la livraison",
    },
    sections: templateSections(template, ctx),
  };
}

// ---------------------------------------------------------------------------
// Validation : tout ce qui vient de la base ou du navigateur passe par ici
// ---------------------------------------------------------------------------
function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/\r\n/g, "\n").trim().slice(0, max) : "";
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function normalizeValue(field: FieldSpec | ItemField, value: unknown): unknown {
  switch (field.kind) {
    case "text":
      return clean(value, field.max);
    case "image":
    case "product":
      return typeof value === "string" && value.length > 0 && value.length <= 300 ? value : null;
    case "products":
      return Array.isArray(value) ? [...new Set(value.filter((v): v is string => typeof v === "string" && v.length <= 64))].slice(0, 24) : [];
    case "number": {
      const n = Math.round(Number(value));
      return Number.isFinite(n) ? Math.min(field.max, Math.max(field.min, n)) : field.max;
    }
    case "choice":
      return oneOf(value, field.options.map((o) => o.value), field.options[0].value);
    case "toggle":
      return value === true;
    case "list":
      if (!Array.isArray(value)) return [];
      return value
        .slice(0, field.max)
        .filter((item) => item && typeof item === "object")
        .map((item) => Object.fromEntries(field.fields.map((f) => [f.key, normalizeValue(f, (item as Settings)[f.key])])));
  }
}

export function normalizeSettings(type: SectionType, raw: unknown): Settings {
  const source = raw && typeof raw === "object" ? (raw as Settings) : {};
  return Object.fromEntries(SECTION_SPECS[type].fields.map((f) => [f.key, normalizeValue(f, source[f.key])]));
}

export function normalizeTheme(raw: unknown, ctx: ThemeContext): Theme {
  if (!raw || typeof raw !== "object") return defaultTheme("impact", ctx);
  const t = raw as Record<string, unknown>;
  const template = oneOf<TemplateId>(t.template, ["impact", "ecrin"], "impact");
  const base = TEMPLATES[template];
  const announcement = (t.announcement && typeof t.announcement === "object" ? t.announcement : {}) as Record<string, unknown>;

  const seen = new Set<string>();
  const sections: Section[] = [];
  for (const s of Array.isArray(t.sections) ? t.sections : []) {
    if (!s || typeof s !== "object" || sections.length >= MAX_SECTIONS) continue;
    const { id, type, hidden, settings } = s as Record<string, unknown>;
    if (!SECTION_TYPES.includes(type as SectionType)) continue;
    const safeId = typeof id === "string" && /^[a-z0-9-]{1,40}$/i.test(id) && !seen.has(id) ? id : `${type}-${sections.length}-${seen.size}`;
    seen.add(safeId);
    sections.push({ id: safeId, type: type as SectionType, hidden: hidden === true, settings: normalizeSettings(type as SectionType, settings) });
  }

  return {
    template,
    accent: isHexColor(t.accent) ? t.accent.toLowerCase() : base.accent,
    font: oneOf<FontId>(t.font, ["affirmee", "elegante", "douce"], base.font),
    background: oneOf<Background>(t.background, ["blanc", "teinte"], base.background),
    buttons: oneOf<ButtonShape>(t.buttons, ["arrondis", "droits"], base.buttons),
    announcement: { enabled: announcement.enabled === true, text: clean(announcement.text, 120) },
    sections,
  };
}

/** Toutes les images utilisées par un thème (pour supprimer celles qui ne servent plus). */
export function themeImages(theme: Theme): string[] {
  return theme.sections.map((s) => s.settings.image).filter((p): p is string => typeof p === "string");
}
