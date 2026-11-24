import type { Metadata, Viewport } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OneShop : votre boutique en ligne, payée à la livraison",
    template: "%s | OneShop",
  },
  description:
    "Créez votre boutique, gérez vos produits et suivez chaque commande jusqu'à l'encaissement. Pensé pour les commerçants d'Afrique francophone.",
};

export const viewport: Viewport = {
  themeColor: "#0b5d45",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${schibsted.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
