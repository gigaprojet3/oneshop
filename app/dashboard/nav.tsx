"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BoxIcon, BrushIcon, CardIcon, HomeIcon, ReceiptIcon, StoreIcon } from "@/components/icons";

export const NAV = [
  { href: "/dashboard", label: "Accueil", icon: HomeIcon },
  { href: "/dashboard/commandes", label: "Commandes", icon: ReceiptIcon },
  { href: "/dashboard/produits", label: "Produits", icon: BoxIcon },
  { href: "/dashboard/apparence", label: "Apparence", icon: BrushIcon },
  { href: "/dashboard/parametres", label: "Boutique", icon: StoreIcon },
  { href: "/dashboard/abonnement", label: "Abonnement", icon: CardIcon },
] as const;

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function NavLinks({ layout }: { layout: "sidebar" | "bar" }) {
  const pathname = usePathname();
  return <NavList layout={layout} pathname={pathname} />;
}

/** Version sans état actif, affichée pendant le chargement. */
export function NavList({ layout, pathname = null }: { layout: "sidebar" | "bar"; pathname?: string | null }) {
  return (
    <ul className={layout === "sidebar" ? "flex flex-col gap-0.5" : "flex gap-1 overflow-x-auto px-3 pb-2"}>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-control font-medium transition-colors ${
                layout === "sidebar" ? "px-3 py-2.5" : "px-3 py-2 text-sm"
              } ${
                active
                  ? "bg-baobab-50 text-baobab-900"
                  : "text-ink-soft hover:bg-paper hover:text-ink"
              }`}
            >
              <Icon className={`size-5 ${active ? "text-baobab-700" : ""}`} />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
