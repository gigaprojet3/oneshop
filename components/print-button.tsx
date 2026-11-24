"use client";

import type { ReactNode } from "react";
import { PrintIcon } from "./icons";
import { buttonClass } from "./ui";

/** Imprime la page : la mise en page d'impression masque la navigation. */
export function PrintButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClass("secondary", "md", className)}>
      <PrintIcon className="size-4" />
      {children}
    </button>
  );
}
