import type { Metadata } from "next";
import { Suspense } from "react";
import { StoreFrame } from "@/components/storefront/frame";
import { getStorefront } from "@/lib/storefront";

export async function generateMetadata({ params }: LayoutProps<"/boutique/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  const name = store?.shop.name ?? "Boutique";
  return { title: { default: name, template: `%s | ${name}` } };
}

export default function StoreLayout({ children, params }: LayoutProps<"/boutique/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh flex-1 bg-white" />}>
      <ThemedStore params={params}>{children}</ThemedStore>
    </Suspense>
  );
}

/** Habille toutes les pages de la boutique avec son thème (couleurs, polices, en-tête, pied de page). */
async function ThemedStore({ params, children }: { params: Promise<{ slug: string }>; children: React.ReactNode }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  // Boutique introuvable ou fermée : la page affiche elle-même « introuvable »
  if (!store) return <div className="flex flex-1 flex-col bg-surface">{children}</div>;
  return (
    <StoreFrame theme={store.theme} shop={store.shop} slug={slug}>
      {children}
    </StoreFrame>
  );
}
