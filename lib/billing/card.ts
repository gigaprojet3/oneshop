// Validation des cartes bancaires, partagée entre le formulaire (client) et le serveur.

export type CardBrand = "visa" | "mastercard" | "amex" | "inconnue";

export const BRAND_LABEL: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  inconnue: "Carte",
};

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function detectBrand(number: string): CardBrand {
  const n = digitsOnly(number);
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  return "inconnue";
}

/** 4242424242424242 → « 4242 4242 4242 4242 » */
export function formatCardNumber(value: string) {
  const n = digitsOnly(value).slice(0, 19);
  if (detectBrand(n) === "amex") {
    return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(" ");
  }
  return n.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** « 0428 » → « 04 / 28 » */
export function formatExpiry(value: string) {
  const n = digitsOnly(value).slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)} / ${n.slice(2)}` : n;
}

function luhn(number: string) {
  let sum = 0;
  let double = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let d = Number(number[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

export type CardInput = { number: string; expiry: string; cvc: string; name: string };

export type ValidCard = {
  number: string;
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
};

export function validateCard(input: CardInput, now = new Date()): { card: ValidCard } | { error: string } {
  const number = digitsOnly(input.number);
  const exp = digitsOnly(input.expiry);
  const cvc = digitsOnly(input.cvc);
  const name = input.name.trim();
  const brand = detectBrand(number);

  if (name.length < 2) return { error: "Indiquez le nom inscrit sur la carte." };
  if (number.length < 13 || number.length > 19 || !luhn(number)) {
    return { error: "Ce numéro de carte n'est pas valide. Vérifiez les chiffres." };
  }
  if (brand === "inconnue") return { error: "Seules les cartes Visa, Mastercard et American Express sont acceptées." };
  if (exp.length !== 4) return { error: "Indiquez la date d'expiration au format MM / AA." };

  const expMonth = Number(exp.slice(0, 2));
  const expYear = 2000 + Number(exp.slice(2));
  if (expMonth < 1 || expMonth > 12) return { error: "Le mois d'expiration doit être compris entre 01 et 12." };
  const endOfMonth = new Date(Date.UTC(expYear, expMonth, 1));
  if (endOfMonth <= now) return { error: "Cette carte a expiré." };

  const cvcLength = brand === "amex" ? 4 : 3;
  if (cvc.length !== cvcLength) return { error: `Le code de sécurité doit contenir ${cvcLength} chiffres.` };

  return { card: { number, brand, last4: number.slice(-4), expMonth, expYear, name } };
}
