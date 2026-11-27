# OneShop

Plateforme e-commerce, dans l'esprit de Shopify, pour les commerçants d'Afrique francophone (zone FCFA).
Chaque commerçant crée sa boutique en ligne ; ses clients commandent et paient à la livraison.

Contenu de cette version :

- **Page d'accueil** avec les tarifs.
- **Inscription en deux étapes** : création de la boutique, puis carte bancaire pour démarrer
  **3 jours d'essai gratuit sur le plan Business**. Il n'y a pas de plan gratuit.
- **Abonnements** Basic, Pro et Business, payés par carte, en FCFA. Le commerçant peut changer de plan, remplacer
  sa carte ou arrêter l'abonnement. En cas d'échec de paiement, sa boutique se ferme aux clients jusqu'au règlement.
- **Boutique en ligne publique**, sur son propre sous-domaine (`chez-awa.oneshop.com`) : catalogue, fiche produit, panier, commande avec
  paiement à la livraison, page de confirmation qui suit l'avancement de la commande.
- **Modèles de boutique** (Tableau de bord > Apparence) : deux modèles, Impact (énergique, pour vendre vite depuis
  les publicités) et Écrin (raffiné, pour la beauté, la mode, les bijoux). Couleur, police, fond, forme des boutons
  et bandeau d'annonce réglables ; la page d'accueil se compose de sections à ajouter, réordonner, masquer et
  modifier, avec un aperçu en direct sur ordinateur et mobile. Les produits peuvent avoir un prix barré.
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
   [0002_abonnements_vitrine.sql](supabase/migrations/0002_abonnements_vitrine.sql), puis
   [0003_themes.sql](supabase/migrations/0003_themes.sql).
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

## Sous-domaines des boutiques

Avec `NEXT_PUBLIC_ROOT_DOMAIN`, chaque boutique est servie sur `<adresse>.<domaine>`. Le proxy
([proxy.ts](proxy.ts)) réécrit ces requêtes vers `app/boutique/[slug]/` sans changer l'adresse affichée, et redirige
les anciens liens `/boutique/<adresse>` vers le sous-domaine. Sans la variable, les boutiques restent sous
`/boutique/<adresse>`.

- **En local** : `NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000`, puis ouvrez `http://<adresse>.localhost:3000`.
  Chrome, Edge et Firefox résolvent `*.localhost` sans configuration.
- **En production** (ex. `oneshop.com`) : `NEXT_PUBLIC_ROOT_DOMAIN=oneshop.com`, et faites pointer le domaine **et**
  le joker `*.oneshop.com` vers l'hébergement. Sur Vercel, ajoutez les deux domaines au projet ; le joker demande
  d'utiliser les serveurs DNS de Vercel, qui délivrent alors le certificat HTTPS de chaque sous-domaine.
- Certains sous-domaines (`www`, `app`, `api`, `admin`…) sont réservés au site : la liste est dans
  [lib/store-url.ts](lib/store-url.ts).

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
| `lib/theme/` | Modèles, sections et leurs réglages (`schema.ts`), couleurs et polices d'une boutique |
| `components/storefront/` | Cadre et sections de la boutique, partagés par la boutique et l'aperçu de l'éditeur |
| `lib/store-url.ts` | Adresses des boutiques (sous-domaine ou `/boutique/[slug]`) |
| `proxy.ts` | Sous-domaines des boutiques, rafraîchissement de la session et redirections |
| `supabase/migrations/` | Schéma SQL, règles RLS, fonctions de commande et de boutique publique |

## Règles métier

- Les montants sont des entiers en FCFA (pas de centimes).
- Une commande réserve le stock dès sa création. Le stock est remis en vente si la commande est annulée ou refusée.
- Une boutique est visible et accepte des commandes tant que son abonnement est en essai ou à jour.
- Le commerçant peut lire son abonnement mais pas le modifier : seules les fonctions serveur (clé secrète) écrivent
  dans la table `subscriptions`.
- Chaque commerçant ne voit que sa boutique (règles RLS de Postgres). Les clients n'accèdent qu'aux informations
  publiques, via des fonctions SQL dédiées.
