// Données métier partagées entre le serveur et le client.

export type Currency = "XOF" | "XAF";

export const COUNTRIES = [
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", currency: "XOF", capital: "Abidjan", tz: "Africa/Abidjan" },
  { code: "SN", name: "Sénégal", dial: "+221", currency: "XOF", capital: "Dakar", tz: "Africa/Dakar" },
  { code: "CM", name: "Cameroun", dial: "+237", currency: "XAF", capital: "Douala", tz: "Africa/Douala" },
  { code: "BJ", name: "Bénin", dial: "+229", currency: "XOF", capital: "Cotonou", tz: "Africa/Porto-Novo" },
  { code: "TG", name: "Togo", dial: "+228", currency: "XOF", capital: "Lomé", tz: "Africa/Lome" },
  { code: "BF", name: "Burkina Faso", dial: "+226", currency: "XOF", capital: "Ouagadougou", tz: "Africa/Ouagadougou" },
  { code: "ML", name: "Mali", dial: "+223", currency: "XOF", capital: "Bamako", tz: "Africa/Bamako" },
  { code: "NE", name: "Niger", dial: "+227", currency: "XOF", capital: "Niamey", tz: "Africa/Niamey" },
  { code: "GA", name: "Gabon", dial: "+241", currency: "XAF", capital: "Libreville", tz: "Africa/Libreville" },
  { code: "CG", name: "Congo", dial: "+242", currency: "XAF", capital: "Brazzaville", tz: "Africa/Brazzaville" },
  { code: "TD", name: "Tchad", dial: "+235", currency: "XAF", capital: "N'Djaména", tz: "Africa/Ndjamena" },
  { code: "GW", name: "Guinée-Bissau", dial: "+245", currency: "XOF", capital: "Bissau", tz: "Africa/Bissau" },
] as const satisfies ReadonlyArray<{
  code: string;
  name: string;
  dial: string;
  currency: Currency;
  capital: string;
  tz: string;
}>;

export type CountryCode = (typeof COUNTRIES)[number]["code"];

export function findCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code);
}

export function countryTimeZone(code: string) {
  return findCountry(code)?.tz ?? "Africa/Abidjan";
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------
export const ORDER_STATUSES = [
  "nouvelle",
  "confirmee",
  "en_livraison",
  "livree",
  "refusee",
  "annulee",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  nouvelle: "À confirmer",
  confirmee: "Confirmée",
  en_livraison: "En livraison",
  livree: "Livrée et payée",
  refusee: "Refusée",
  annulee: "Annulée",
};

/** Ce que le commerçant doit faire ensuite, pour chaque étape. */
export const STATUS_HINT: Record<OrderStatus, string> = {
  nouvelle: "Appelez le client pour confirmer",
  confirmee: "Préparez le colis et confiez-le au livreur",
  en_livraison: "Le livreur encaisse à la remise du colis",
  livree: "Argent encaissé",
  refusee: "Le client n'a pas pris le colis",
  annulee: "Commande arrêtée avant la livraison",
};

/** Étapes du parcours normal d'une commande payée à la livraison. */
export const PIPELINE: OrderStatus[] = ["nouvelle", "confirmee", "en_livraison", "livree"];

/** Transitions proposées depuis chaque statut. */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  nouvelle: ["confirmee", "annulee"],
  confirmee: ["en_livraison", "annulee"],
  en_livraison: ["livree", "refusee"],
  livree: [],
  refusee: ["en_livraison"],
  annulee: ["nouvelle"],
};

export const ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  nouvelle: "Remettre à confirmer",
  confirmee: "Confirmer la commande",
  en_livraison: "Envoyer en livraison",
  livree: "Marquer livrée et payée",
  refusee: "Marquer refusée",
  annulee: "Annuler la commande",
};

export const ORDER_SOURCES = ["boutique", "manuelle"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const SOURCE_LABEL: Record<OrderSource, string> = {
  boutique: "Boutique en ligne",
  manuelle: "Saisie manuelle",
};

// ---------------------------------------------------------------------------
// Abonnements : pas de plan gratuit, essai de 3 jours sur Business avec carte
// ---------------------------------------------------------------------------
export const TRIAL_DAYS = 3;
export const TRIAL_PLAN: PlanId = "business";

export type PlanId = "basic" | "pro" | "business";

export const PLANS: {
  id: PlanId;
  name: string;
  price: number;
  pitch: string;
  productLimit: number | null;
  features: string[];
}[] = [
  {
    id: "basic",
    name: "Basic",
    price: 5000,
    pitch: "Pour lancer votre boutique",
    productLimit: 50,
    features: [
      "Boutique en ligne avec panier",
      "50 produits",
      "Commandes illimitées, sans commission",
      "Paiement à la livraison",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 10000,
    pitch: "Pour les boutiques qui grandissent",
    productLimit: 500,
    features: ["Tout le plan Basic", "500 produits", "Support par email"],
  },
  {
    id: "business",
    name: "Business",
    price: 15000,
    pitch: "Pour les gros catalogues",
    productLimit: null,
    features: ["Tout le plan Pro", "Produits illimités", "Support prioritaire"],
  },
];

export function findPlan(id: string) {
  return PLANS.find((p) => p.id === id) ?? PLANS[PLANS.length - 1];
}
