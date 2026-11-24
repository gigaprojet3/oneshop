import Link from "next/link";

/** Marque : un sac dont l'anse forme le « 1 » de OneShop. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="2" y="9" width="28" height="21" rx="6" fill="currentColor" />
      <path
        d="M11 12V9a5 5 0 0 1 10 0v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M14.2 16.5 17 15v10" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="25" r="2" fill="var(--color-karite-400)" />
    </svg>
  );
}

export function Logo({ href = "/", tone = "dark" }: { href?: string; tone?: "dark" | "light" }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-md text-[1.35rem] font-extrabold tracking-[-0.04em] ${
        tone === "light" ? "text-white" : "text-ink"
      }`}
    >
      <LogoMark className={`size-8 ${tone === "light" ? "text-karite-400" : "text-baobab-700"}`} />
      oneshop
    </Link>
  );
}

/**
 * Motif inspiré des tissus bogolan : rangées de marques géométriques
 * (losanges, peignes, points, zigzags) tracées à la main sur un fond sombre.
 */
export function Bogolan({ className = "", id = "bogolan" }: { className?: string; id?: string }) {
  return (
    <svg className={className} aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id={id} width="96" height="96" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {/* Losanges emboîtés */}
            <path d="M24 6 38 20 24 34 10 20Z" />
            <path d="M24 14 30 20 24 26 18 20Z" />
            {/* Peigne */}
            <path d="M54 8h30M58 8v12M66 8v12M74 8v12M82 8v12" />
            {/* Zigzag */}
            <path d="M4 50l8-8 8 8 8-8 8 8 8-8" />
            {/* Croix en carré */}
            <path d="M60 36h20v20H60zM60 36l20 20M80 36 60 56" />
            {/* Chevrons */}
            <path d="M8 72l8 8 8-8M8 82l8 8 8-8" />
            <path d="M40 66h48" />
            <path d="M40 90h48" />
          </g>
          <g fill="currentColor">
            <circle cx="24" cy="20" r="1.8" />
            <circle cx="48" cy="74" r="2" />
            <circle cx="60" cy="78" r="2" />
            <circle cx="72" cy="82" r="2" />
            <circle cx="84" cy="78" r="2" />
            <circle cx="54" cy="28" r="1.6" />
            <circle cx="86" cy="30" r="1.6" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
