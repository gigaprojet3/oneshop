"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button, type ButtonVariant } from "./ui";

/** Bouton d'envoi qui passe en attente pendant l'exécution de l'action. */
export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ComponentProps<"button"> & {
  pendingLabel: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      className={className}
      {...props}
      disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
