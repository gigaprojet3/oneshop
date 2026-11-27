import type { CSSProperties } from "react";
import { readableOnWhiteText } from "./colors";
import type { FontId, TemplateId, Theme } from "./schema";

const FONT_STACKS: Record<FontId, { display: string; body: string; stretch: string; weight: string }> = {
  affirmee: { display: "var(--font-archivo), ui-sans-serif, system-ui, sans-serif", body: "var(--font-archivo)", stretch: "118%", weight: "800" },
  elegante: { display: "var(--font-bodoni), Didot, Georgia, serif", body: "var(--font-jost)", stretch: "100%", weight: "500" },
  douce: { display: "var(--font-schibsted), ui-sans-serif, system-ui, sans-serif", body: "var(--font-schibsted)", stretch: "100%", weight: "750" },
};

const PALETTES: Record<TemplateId, { ink: string; soft: string; line: string; alt: string; pop: string }> = {
  // Impact : blanc franc, encre bleu nuit, jaune tournesol pour les remises
  impact: { ink: "#141a33", soft: "#4c5372", line: "#e2e4ee", alt: "#f2f3f8", pop: "#ffd23f" },
  // Écrin : ébène chaude et sable, pour laisser respirer les photos
  ecrin: { ink: "#231c1a", soft: "#6f635d", line: "#e7dfd8", alt: "#f4eee7", pop: "#f4eee7" },
};

/**
 * Variables CSS d'une boutique, posées sur son conteneur (.store-root).
 * globals.css en dérive les couleurs et polices de toutes les pages de la boutique.
 */
export function themeStyle(theme: Theme): CSSProperties {
  const p = PALETTES[theme.template];
  const f = FONT_STACKS[theme.font];
  const tinted = theme.background === "teinte";
  return {
    "--s-accent": theme.accent,
    "--s-accent-strong": readableOnWhiteText(theme.accent),
    "--s-ink": p.ink,
    "--s-soft": p.soft,
    "--s-line": p.line,
    "--s-pop": p.pop,
    "--s-bg": tinted ? `color-mix(in oklab, ${theme.accent} 4%, white)` : "#ffffff",
    "--s-alt": tinted ? `color-mix(in oklab, ${theme.accent} 9%, white)` : p.alt,
    "--s-display": f.display,
    "--s-body": `${f.body}, ui-sans-serif, system-ui, sans-serif`,
    "--s-display-stretch": f.stretch,
    "--s-display-weight": f.weight,
    "--s-btn-radius": theme.buttons === "arrondis" ? "999px" : "2px",
  } as CSSProperties;
}
