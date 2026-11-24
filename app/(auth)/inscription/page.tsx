import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Créer ma boutique" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-[-0.03em]">Créez votre boutique</h1>
      <p className="mt-2 text-ink-soft">3 jours d&apos;essai gratuit sur le plan Business. Rien n&apos;est débité avant la fin de l&apos;essai.</p>
      <SignUpForm />
      <p className="mt-8 text-sm text-ink-soft">
        Vous avez déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-baobab-700 underline-offset-4 hover:underline">
          Se connecter
        </Link>
      </p>
    </>
  );
}
