import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeftIcon } from "./icons";

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mb-3 -ml-1 inline-flex items-center gap-1 rounded-md px-1 text-sm font-semibold text-ink-soft hover:text-ink"
    >
      <ChevronLeftIcon className="size-4" />
      {children}
    </Link>
  );
}
