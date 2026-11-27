import { Archivo, Bodoni_Moda, Jost } from "next/font/google";

// Polices des boutiques. Non préchargées : chaque boutique n'en utilise qu'une partie.
export const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", preload: false });
export const bodoni = Bodoni_Moda({ subsets: ["latin"], axes: ["opsz"], variable: "--font-bodoni", preload: false });
export const jost = Jost({ subsets: ["latin"], variable: "--font-jost", preload: false });

export const storeFontVariables = `${archivo.variable} ${bodoni.variable} ${jost.variable}`;
