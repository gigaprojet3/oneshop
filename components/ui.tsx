import type { ComponentProps, ReactNode } from "react";
import { STATUS_LABEL, type OrderStatus } from "@/lib/domain";

// ---------------------------------------------------------------------------
// Boutons : une seule hiérarchie dans toute l'application
// ---------------------------------------------------------------------------
const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

const BUTTON_VARIANT = {
  primary: "bg-baobab-700 text-white hover:bg-baobab-900",
  secondary: "border border-line-strong bg-surface text-ink hover:border-ink-faint hover:bg-paper",
  ghost: "text-ink-soft hover:bg-baobab-50 hover:text-baobab-900",
  danger: "border border-kola-500/30 bg-surface text-kola-700 hover:bg-kola-50",
  money: "bg-karite-400 text-ink hover:bg-[#d4951c]",
} as const;

const BUTTON_SIZE = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[0.95rem]",
  lg: "h-13 px-6 text-base",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANT;

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof BUTTON_SIZE = "md", extra = "") {
  return `${BUTTON_BASE} ${BUTTON_VARIANT[variant]} ${BUTTON_SIZE[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: keyof typeof BUTTON_SIZE }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

// ---------------------------------------------------------------------------
// Formulaires
// ---------------------------------------------------------------------------
const CONTROL =
  "w-full rounded-control border border-line-strong bg-surface px-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint transition-colors hover:border-ink-faint focus:border-baobab-500 focus:outline-none focus:ring-3 focus:ring-baobab-100";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[0.8rem] leading-snug text-ink-faint">{hint}</p> : null}
    </div>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${CONTROL} h-11 ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${CONTROL} h-11 appearance-auto pr-2 ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${CONTROL} min-h-24 py-2.5 leading-relaxed ${className}`} {...props} />;
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-kola-500/30 bg-kola-50 text-kola-700",
    success: "border-baobab-300/50 bg-baobab-50 text-baobab-900",
    info: "border-karite-400/40 bg-karite-50 text-karite-700",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-control border px-4 py-3 text-sm leading-relaxed ${styles}`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Statuts de commande : chaque étape a sa couleur, partout la même
// ---------------------------------------------------------------------------
export const STATUS_TONE: Record<OrderStatus, { dot: string; badge: string }> = {
  nouvelle: { dot: "bg-karite-400", badge: "bg-karite-50 text-karite-700 ring-karite-400/40" },
  confirmee: { dot: "bg-baobab-500", badge: "bg-baobab-50 text-baobab-700 ring-baobab-300/50" },
  en_livraison: { dot: "bg-indigo-500", badge: "bg-indigo-50 text-indigo-500 ring-indigo-500/25" },
  livree: { dot: "bg-baobab-900", badge: "bg-baobab-700 text-white ring-baobab-700" },
  refusee: { dot: "bg-kola-500", badge: "bg-kola-50 text-kola-700 ring-kola-500/30" },
  annulee: { dot: "bg-ink-faint", badge: "bg-paper text-ink-soft ring-line-strong" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_TONE[status].badge}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Mise en page des pages du tableau de bord
// ---------------------------------------------------------------------------
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-[1.9rem] font-bold leading-tight tracking-[-0.03em] text-ink">{title}</h1>
        {description ? <p className="mt-1.5 max-w-[60ch] text-ink-soft">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-panel border border-line bg-surface ${className}`}>{children}</section>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-control bg-line/70 ${className}`} />;
}
