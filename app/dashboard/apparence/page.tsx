import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Skeleton } from "@/components/ui";
import { getCurrentShop, listProducts } from "@/lib/dal";
import { storeUrl } from "@/lib/store-url";
import { themeContext } from "@/lib/storefront";
import { normalizeTheme } from "@/lib/theme/schema";
import { ThemeEditor } from "./theme-editor";

export const metadata: Metadata = { title: "Apparence" };

export default function AppearancePage() {
  return (
    <>
      <PageHeader
        title="Apparence"
        description="Choisissez un modèle, vos couleurs, puis composez la page d'accueil de votre boutique section par section."
      />
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-[23rem_1fr]">
            <Skeleton className="h-[36rem]" />
            <Skeleton className="h-[36rem]" />
          </div>
        }
      >
        <Editor />
      </Suspense>
    </>
  );
}

async function Editor() {
  const [shop, products] = await Promise.all([getCurrentShop(), listProducts()]);
  const forSale = products.filter((p) => p.is_active);
  const ctx = themeContext(shop, forSale);
  return (
    <ThemeEditor
      initialTheme={normalizeTheme(shop.theme, ctx)}
      shop={{
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        description: shop.description,
        city: shop.city,
        country: shop.country,
        currency: shop.currency,
        phone: shop.phone,
        email: shop.email,
        default_delivery_fee: shop.default_delivery_fee,
      }}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        compare_at_price: p.compare_at_price,
        stock: p.stock,
        image_path: p.image_path,
        is_active: p.is_active,
      }))}
      ctx={ctx}
      storeHref={storeUrl(shop.slug)}
    />
  );
}
