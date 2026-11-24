import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LogoMark } from "@/components/brand";
import { Skeleton } from "@/components/ui";
import { getStorefront } from "@/lib/storefront";
import { CartLink } from "./store-ui";

export async function generateMetadata({ params }: LayoutProps<"/boutique/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStorefront(slug);
  const name = store?.shop.name ?? "Boutique";
  return { title: { default: name, template: `%s | ${name}` } };
}

export default function StoreLayout({ children, params }: LayoutProps<"/boutique/[slug]">) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Suspense fallback={<Skeleton className="h-7 w-40" />}>
            <StoreHeader params={params} />
          </Suspense>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={null}>
            <StoreContact params={params} />
          </Suspense>
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-ink">
            <LogoMark className="size-4 text-baobab-700" />
            Boutique créée avec OneShop
          </Link>
        </div>
      </footer>
    </div>
  );
}

async function StoreHeader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return <span className="font-bold">Boutique</span>;
  return (
    <>
      <Link
        href={`/boutique/${slug}`}
        className="flex min-w-0 items-center gap-3 rounded-md text-lg font-extrabold tracking-[-0.03em]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-base text-white" aria-hidden="true">
          {store.shop.name.trim().charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{store.shop.name}</span>
      </Link>
      <CartLink slug={slug} />
    </>
  );
}

async function StoreContact({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const store = await getStorefront(slug);
  if (!store) return <span />;
  return (
    <p>
      {store.shop.name}, {store.shop.city}. Une question ?{" "}
      <a href={`tel:${store.shop.phone}`} className="tabular font-semibold text-ink-soft hover:text-ink">
        {store.shop.phone}
      </a>
      {store.shop.email ? (
        <>
          {" "}
          ou{" "}
          <a href={`mailto:${store.shop.email}`} className="font-semibold text-ink-soft hover:text-ink">
            {store.shop.email}
          </a>
        </>
      ) : null}
    </p>
  );
}
