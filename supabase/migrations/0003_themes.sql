-- OneShop : thèmes de boutique personnalisables, prix barré des produits.
-- À exécuter dans Supabase > SQL Editor, après 0002_abonnements_vitrine.sql.

-- ---------------------------------------------------------------------------
-- Thème de la boutique : modèle, couleurs, polices et sections de la page d'accueil.
-- Validé par l'application (lib/theme/schema.ts) ; null = modèle par défaut.
-- Le commerçant le modifie via la règle RLS « shops: propriétaire ».
-- ---------------------------------------------------------------------------
alter table public.shops add column theme jsonb;
alter table public.shops add constraint shops_theme_size
  check (theme is null or (jsonb_typeof(theme) = 'object' and pg_column_size(theme) <= 100000));

-- ---------------------------------------------------------------------------
-- Prix barré : prix « avant » affiché à côté du prix de vente
-- ---------------------------------------------------------------------------
alter table public.products add column compare_at_price integer;
alter table public.products add constraint products_compare_at_price
  check (compare_at_price is null or compare_at_price > price);

-- ---------------------------------------------------------------------------
-- Boutique en ligne : les lectures publiques renvoient aussi le thème et le prix barré
-- ---------------------------------------------------------------------------
drop function public.storefront_shop(text);
create function public.storefront_shop(p_slug text)
returns table (id uuid, name text, slug text, description text, city text, country text,
               currency text, phone text, email text, default_delivery_fee integer, theme jsonb)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.slug, s.description, s.city, s.country, s.currency, s.phone, s.email,
         s.default_delivery_fee, s.theme
  from public.shops s
  where s.slug = p_slug and public.shop_is_open(s.id);
$$;

drop function public.storefront_products(text);
create function public.storefront_products(p_slug text)
returns table (id uuid, name text, description text, price integer, compare_at_price integer,
               stock integer, image_path text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name, p.description, p.price, p.compare_at_price, p.stock, p.image_path
  from public.products p
  join public.shops s on s.id = p.shop_id
  where s.slug = p_slug and p.is_active and public.shop_is_open(s.id)
  order by p.created_at desc;
$$;
