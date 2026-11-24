const amount = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

/** 12500 → « 12 500 FCFA » */
export function fcfa(value: number) {
  return `${amount.format(value)} FCFA`;
}

export function number(value: number) {
  return amount.format(value);
}

/** Date et heure dans le fuseau de la boutique (Abidjan, Douala, Cotonou…). */
export function dateTime(iso: string, timeZone = "Africa/Abidjan") {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function orderRef(n: number) {
  return `#${String(n).padStart(4, "0")}`;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
