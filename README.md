# OneShop

Plateforme e-commerce, dans l'esprit de Shopify, pour les commerçants d'Afrique francophone (zone FCFA).
Chaque commerçant crée sa boutique en ligne ; ses clients commandent et paient à la livraison.

Contenu de cette version :

- **Page d'accueil** avec les tarifs.
- **Inscription en deux étapes** : création de la boutique, puis carte bancaire pour démarrer
  **3 jours d'essai gratuit sur le plan Business**. Il n'y a pas de plan gratuit.
- **Abonnements** Basic, Pro et Business, payés par carte, en FCFA. Le commerçant peut changer de plan, remplacer
  sa carte ou arrêter l'abonnement. En cas d'échec de paiement, sa boutique se ferme aux clients jusqu'au règlement.
- **Boutique en ligne publique** (`/boutique/[adresse]`) : catalogue, fiche produit, panier, commande avec
  paiement à la livraison, page de confirmation qui suit l'avancement de la commande.
- **Tableau de bord du commerçant** :
  - accueil : parcours des commandes (à confirmer, confirmée, en livraison, livrée et payée), argent encaissé, taux de refus ;
  - commandes : celles de la boutique en ligne arrivent automatiquement, et une commande prise par téléphone peut
    être saisie à la main ; changement de statut et bon de livraison à imprimer ;
  - produits : photo, prix, stock, limite de produits selon le plan ;
  - paramètres de la boutique, abonnement.

> **Paiement simulé.** Les abonnements passent par un prestataire fictif ([lib/billing/provider.ts](lib/billing/provider.ts)).
> Cartes de test : `4242 4242 4242 4242` (acceptée), `4000 0000 0000 0002` (refusée),
> `4000 0000 0000 9995` (acceptée, mais les paiements mensuels échouent). Pour passer en production, il faut
> implémenter l'interface `BillingProvider` avec un vrai prestataire et ses champs de carte hébergés.

## Stack

- Next.js 16 (App Router, Cache Components, Server Actions), React 19, TypeScript
- Tailwind CSS 4
- Supabase : Postgres, authentification, stockage des photos

## Mise en route

1. **Créez un projet Supabase** sur [supabase.com](https://supabase.com).
2. **Créez la base** : dans Supabase > SQL Editor, exécutez dans l'ordre
   [0001_init.sql](supabase/migrations/0001_init.sql) puis
   [0002_abonnements_vitrine.sql](supabase/migrations/0002_abonnements_vitrine.sql).
3. **Configurez l'application** :
   ```bash
   cp .env.example .env.local
   ```
   Renseignez `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` et `SUPABASE_SECRET_KEY`
   (Supabase > Project Settings > API). La clé secrète sert uniquement côté serveur, pour enregistrer les abonnements.
4. **Autorisez le lien de confirmation** : dans Supabase > Authentication > URL Configuration, ajoutez
   `http://localhost:3000/auth/confirm` aux Redirect URLs.
5. **Lancez** :
   ```bash
   npm install
   npm run dev
   ```
   puis ouvrez http://localhost:3000.

> Pour tester sans recevoir d'email, désactivez « Confirm email » dans Supabase > Authentication > Providers > Email :
> l'inscription mène alors directement à la création de la boutique.

## Organisation du code

| Dossier | Rôle |
| --- | --- |
| `app/page.tsx` | Page d'accueil |
| `app/(auth)/` | Connexion et inscription |
| `app/onboarding/` | Création de la boutique, puis démarrage de l'essai (carte bancaire) |
| `app/dashboard/` | Tableau de bord : accueil, commandes, produits, boutique, abonnement |
| `app/boutique/[slug]/` | Boutique en ligne publique : catalogue, produit, panier, commande |
| `lib/dal.ts` | Lecture des données du commerçant : chaque fonction revérifie la session et l'abonnement |
| `lib/storefront.ts` | Lecture publique d'une boutique, mise en cache et invalidée à chaque modification |
| `lib/actions/` | Server Actions : écritures, chacune revérifie la session |
| `lib/billing/` | Cartes, prestataire de paiement (simulé), cycle de vie des abonnements |
| `lib/domain.ts` | Pays, statuts de commande, plans et durée d'essai |
| `proxy.ts` | Rafraîchissement de la session et redirections |
| `supabase/migrations/` | Schéma SQL, règles RLS, fonctions de commande et de boutique publique |

## Règles métier

- Les montants sont des entiers en FCFA (pas de centimes).
- Une commande réserve le stock dès sa création. Le stock est remis en vente si la commande est annulée ou refusée.
- Une boutique est visible et accepte des commandes tant que son abonnement est en essai ou à jour.
- Le commerçant peut lire son abonnement mais pas le modifier : seules les fonctions serveur (clé secrète) écrivent
  dans la table `subscriptions`.
- Chaque commerçant ne voit que sa boutique (règles RLS de Postgres). Les clients n'accèdent qu'aux informations
  publiques, via des fonctions SQL dédiées.
