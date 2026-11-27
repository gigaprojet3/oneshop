/** Petits calculs de couleurs pour garder des textes lisibles quelle que soit la couleur choisie. */

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
}

function channels(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(rgb: number[]) {
  return `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string) {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Assombrit la couleur jusqu'à ce qu'un texte blanc y soit lisible (contraste AA). */
export function readableOnWhiteText(hex: string) {
  let rgb = channels(hex);
  let out = hex;
  for (let i = 0; i < 20 && contrast(out, "#ffffff") < 4.5; i++) {
    rgb = rgb.map((c) => c * 0.9);
    out = toHex(rgb);
  }
  return out;
}
