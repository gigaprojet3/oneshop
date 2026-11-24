import type { ReactNode } from "react";
import { Bogolan, Logo } from "@/components/brand";
import { Alert } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-full flex-1 lg:grid-cols-[1fr_0.9fr]">
      <div className="flex flex-col bg-surface px-5 py-6 sm:px-10">
        <Logo />
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {!isSupabaseConfigured ? (
            <div className="mb-6">
              <Alert tone="info">
                Supabase n&apos;est pas encore configuré. Copiez <code>.env.example</code> en <code>.env.local</code>,
                renseignez l&apos;URL et la clé de votre projet, puis relancez <code>npm run dev</code>.
              </Alert>
            </div>
          ) : null}
          {children}
        </main>
      </div>

      <aside className="relative hidden overflow-hidden bg-baobab-900 text-baobab-700 lg:block">
        <Bogolan className="absolute inset-0 h-full w-full" id="bogolan-auth" />
        <div className="absolute inset-x-10 bottom-10 rounded-panel bg-baobab-900/90 p-8 text-white ring-1 ring-white/10 backdrop-blur-sm">
          <p className="text-2xl font-bold leading-snug tracking-[-0.02em]">
            Chaque soir, sachez combien vos livreurs doivent vous remettre.
          </p>
          <p className="mt-3 leading-relaxed text-baobab-100">
            Commandes à confirmer, colis en route, ventes encaissées : tout est sur un seul écran, en FCFA.
          </p>
        </div>
      </aside>
    </div>
  );
}
