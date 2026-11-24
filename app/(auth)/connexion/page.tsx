import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Se connecter" };

export default function SignInPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Content de vous revoir</h1>
      <p className="mt-2 text-ink-soft">Connectez-vous pour voir vos commandes du jour.</p>
      <Suspense fallback={<Skeleton className="mt-8 h-64" />}>
        <SignInForm />
      </Suspense>
      <p className="mt-8 text-sm text-ink-soft">
        Pas encore de boutique ?{" "}
        <Link href="/inscription" className="font-semibold text-baobab-700 underline-offset-4 hover:underline">
          Créer ma boutique
        </Link>
      </p>
    </>
  );
}
