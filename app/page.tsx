import Link from "next/link";
import { Bogolan, Logo } from "@/components/brand";
import { buttonClass } from "@/components/ui";
import { PLANS, TRIAL_PLAN } from "@/lib/domain";
import { number } from "@/lib/format";
import type { CSSProperties } from "react";
import styles from "./landing.module.css";

const JOURNEY = [
  { label: "Commande sur votre boutique", detail: "Aïcha K. ajoute 2 pagnes wax au panier", time: "09:12" },
  { label: "Confirmée par appel", detail: "Livraison à Cocody, près de la pharmacie des Lauriers", time: "09:20" },
  { label: "Remise au livreur", detail: "Le colis part avec Moussa", time: "14:05" },
  { label: "Livrée et payée", detail: "18 500 FCFA encaissés à la livraison", time: "16:40" },
];

const STEPS = [
  {
    title: "Créez votre boutique",
    text: "Choisissez un nom et une adresse. Votre boutique en ligne est prête en quelques minutes.",
  },
  {
    title: "Ajoutez vos produits",
    text: "Photos, prix en FCFA, stock. Le stock se met à jour tout seul à chaque vente.",
  },
  {
    title: "Partagez votre lien",
    text: "Vos clients parcourent le catalogue, remplissent leur panier et commandent, sans créer de compte.",
  },
  {
    title: "Livrez et encaissez",
    text: "Confirmez, expédiez, encaissez à la livraison. Vous savez à tout moment où est chaque colis.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col overflow-x-clip bg-surface">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <Logo />
          <nav className="flex items-center gap-0.5 text-[0.95rem] sm:gap-2">
            <a href="#tarifs" className="hidden rounded-md px-3 py-2 font-medium text-ink-soft hover:text-ink sm:block">
              Tarifs
            </a>
            <Link
              href="/connexion"
              className="whitespace-nowrap rounded-md px-2 py-2 font-medium text-ink-soft hover:text-ink sm:px-3"
            >
              Se connecter
            </Link>
            <Link href="/inscription" className={buttonClass("primary", "sm", "rounded-full px-4")}>
              <span className="sm:hidden">Essai gratuit</span>
              <span className="hidden sm:inline">Démarrer l&apos;essai gratuit</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero : le parcours d'une commande payée à la livraison */}
        <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-24">
          <div>
            <h1 className="max-w-[14ch] text-[2.6rem] font-extrabold leading-[1.02] tracking-[-0.04em] text-ink sm:text-display">
              Votre boutique en ligne, payée à la livraison.
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
              OneShop est la plateforme e-commerce pensée pour l&apos;Afrique francophone : une boutique à votre nom, un
              panier, des prix en FCFA, et un tableau de bord qui suit chaque colis jusqu&apos;à l&apos;encaissement.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/inscription" className={buttonClass("primary", "lg", "rounded-full")}>
                Essayer gratuitement pendant 3 jours
              </Link>
              <a href="#comment" className={buttonClass("secondary", "lg", "rounded-full")}>
                Voir comment ça marche
              </a>
            </div>
            <p className="mt-5 text-sm text-ink-faint">
              Rien n&apos;est débité pendant l&apos;essai. Disponible en Côte d&apos;Ivoire, au Sénégal, au Cameroun et dans 9
              autres pays de la zone FCFA.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 -z-0 overflow-hidden rounded-[1.4rem] bg-baobab-700 text-baobab-500 md:-inset-5">
              <Bogolan className="h-full w-full opacity-40" id="bogolan-hero" />
            </div>
            <ol className="relative rounded-panel bg-surface p-6 shadow-[0_30px_60px_-30px_rgba(7,58,44,0.55)] sm:p-7">
              <li className="mb-5 flex items-baseline justify-between gap-4 border-b border-line pb-4">
                <span className="text-sm font-semibold text-ink-soft">Commande #0142</span>
                <span className="tabular text-sm text-ink-faint">Aujourd&apos;hui</span>
              </li>
              {JOURNEY.map((step, i) => (
                <li key={step.label} className={`${styles.step} relative flex gap-4 pb-6 last:pb-0`} style={{ "--i": i } as CSSProperties}>
                  {i < JOURNEY.length - 1 ? (
                    <span className={`${styles.rail} absolute left-[0.6875rem] top-7 bottom-0 w-0.5 bg-baobab-100`} />
                  ) : null}
                  <span
                    className={`${styles.dot} relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${
                      i === JOURNEY.length - 1 ? "bg-karite-400" : "bg-baobab-700"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold text-ink">{step.label}</p>
                      <span className="tabular text-sm text-ink-faint">{step.time}</span>
                    </div>
                    <p
                      className={`mt-0.5 text-[0.95rem] ${
                        i === JOURNEY.length - 1 ? "text-lg font-bold text-karite-700" : "text-ink-soft"
                      }`}
                    >
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Comment ça marche : une vraie séquence, d'où la numérotation */}
        <section id="comment" className="border-t border-line bg-paper">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="max-w-[22ch] text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-[2.6rem]">
              De votre catalogue à l&apos;argent encaissé, sans changer d&apos;outil.
            </h2>
            <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, i) => (
                <li key={step.title} className="border-t-2 border-ink pt-5">
                  <span className="tabular text-sm font-bold text-baobab-700">Étape {i + 1}</span>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.02em]">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-soft">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Tarifs */}
        <section id="tarifs" className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-3xl font-bold tracking-[-0.03em] sm:text-[2.6rem]">Des tarifs en FCFA, sans surprise</h2>
            <p className="max-w-[44ch] text-ink-soft">
              Commencez par 3 jours gratuits sur le plan Business, puis gardez le plan qui vous convient. Aucune
              commission sur vos ventes.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {PLANS.map((plan) => {
              const featured = plan.id === TRIAL_PLAN;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-panel p-7 ${
                    featured ? "bg-baobab-900 text-white" : "border border-line bg-surface"
                  }`}
                >
                  <h3 className="text-lg font-bold">
                    {plan.name}
                    {featured ? <span className="ml-2 text-sm font-semibold text-karite-400">3 jours offerts</span> : null}
                  </h3>
                  <p className={featured ? "text-baobab-100" : "text-ink-soft"}>{plan.pitch}</p>
                  <p className="mt-6 flex items-baseline gap-1.5">
                    <span className="tabular text-4xl font-extrabold tracking-[-0.03em]">
                      {number(plan.price)}
                    </span>
                    <span className={featured ? "text-baobab-100" : "text-ink-soft"}>FCFA / mois</span>
                  </p>
                  <ul className={`mt-6 flex-1 space-y-2.5 ${featured ? "text-white" : "text-ink"}`}>
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <span className={`mt-2 size-1.5 shrink-0 rounded-full ${featured ? "bg-karite-400" : "bg-baobab-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/inscription"
                    className={buttonClass(featured ? "money" : "secondary", "md", "mt-8 rounded-full")}
                  >
                    Essayer gratuitement
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p>Fait pour les commerçants d&apos;Abidjan, Dakar, Douala, Cotonou, Lomé et d&apos;ailleurs.</p>
        </div>
      </footer>
    </div>
  );
}
