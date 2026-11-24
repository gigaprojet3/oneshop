-- OneShop : abonnements payants, boutique en ligne publique, commandes passées par les clients.
-- À exécuter dans Supabase > SQL Editor, après 0001_init.sql.

-- ---------------------------------------------------------------------------
-- Boutique : numéro de contact (plus de WhatsApp), le plan passe dans l'abonnement
-- ---------------------------------------------------------------------------
alter table public.shops rename column whatsapp to phone;
alter table public.shops add column email text;
alter table public.shops drop column plan;

-- ---------------------------------------------------------------------------
-- Abonnements
-- Lecture seule pour le commerçant : seules les fonctions serveur (clé secrète)
-- ou les webhooks du prestataire de paiement peuvent les modifier.
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  shop_id              uuid not null unique references public.shops (id) on delete cascade,
  plan                 text not null check (plan in ('basic', 'pro', 'business')),
  status               text not null check (status in ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at        timestamptz,
  current_period_end   timestamptz not null,
  cancel_at_period_end boolean not null default false,
  provider             text not null default 'simulation',
  provider_customer_id text,
  card_brand           text,
  card_last4           text check (card_last4 ~ '^[0-9]{4}$'),
  card_exp_month       smallint,
  card_exp_year        smallint,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions: lecture par le propriétaire" on public.subscriptions
  for select to authenticated
  using (public.owns_shop(shop_id));

-- Une boutique est ouverte au public tant que son abonnement (ou son essai) est en cours.
create function public.shop_is_open(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions s
    where s.shop_id = target and s.status in ('trialing', 'active')
  );
$$;

-- ---------------------------------------------------------------------------
-- Commandes : origine « boutique en ligne » ou « saisie manuelle »
-- ---------------------------------------------------------------------------
drop function public.create_order(uuid, text, text, text, text, text, text, public.order_source, integer, jsonb);

alter table public.orders alter column source drop default;
create type public.order_source_v2 as enum ('boutique', 'manuelle');
alter table public.orders
  alter column source type public.order_source_v2
  using (case when source::text = 'boutique' then 'boutique' else 'manuelle' end)::public.order_source_v2;
drop type public.order_source;
alter type public.order_source_v2 rename to order_source;
alter table public.orders alter column source set default 'boutique';

alter table public.orders add column customer_email text;
-- Identifiant non devinable pour la page de confirmation envoyée au client
alter table public.orders add column public_token uuid not null unique default gen_random_uuid();

-- ---------------------------------------------------------------------------
-- Logique commune de création de commande (non appelable directement)
-- ---------------------------------------------------------------------------
create function public.insert_order_internal(
  p_shop_id uuid,
  p_source public.order_source,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_city text,
  p_district text,
  p_landmark text,
  p_note text,
  p_delivery_fee integer,
  p_items jsonb
) returns public.orders
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
  v_number integer;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Ajoutez au moins un produit' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Trop de produits dans une seule commande' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_shop_id::text));
  select coalesce(max(number), 0) + 1 into v_number from public.orders where shop_id = p_shop_id;

  insert into public.orders (shop_id, number, source, customer_name, customer_phone, customer_email,
                             city, district, landmark, note, delivery_fee)
  values (p_shop_id, v_number, p_source, p_customer_name, p_customer_phone, nullif(p_customer_email, ''),
          p_city, nullif(p_district, ''), nullif(p_landmark, ''), nullif(p_note, ''), greatest(p_delivery_fee, 0))
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 999 then
      raise exception 'Quantité invalide' using errcode = '22023';
    end if;

    select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid and shop_id = p_shop_id
      for update;
    if not found then
      raise exception 'Un produit de la commande n''existe plus' using errcode = '22023';
    end if;
    if p_source = 'boutique' and not v_product.is_active then
      raise exception '« % » n''est plus en vente', v_product.name using errcode = '22023';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (% restant)', v_product.name, v_product.stock using errcode = '22023';
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;
    insert into public.order_items (order_id, product_id, name, unit_price, quantity)
      values (v_order.id, v_product.id, v_product.name, v_product.price, v_qty);
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  update public.orders
    set subtotal = v_subtotal, total = v_subtotal + delivery_fee
    where id = v_order.id
    returning * into v_order;

  return v_order;
end $$;

revoke execute on function public.insert_order_internal from public, anon, authenticated;

-- Commande saisie par le commerçant depuis son tableau de bord
create function public.create_order(
  p_shop_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_city text,
  p_district text,
  p_landmark text,
  p_note text,
  p_delivery_fee integer,
  p_items jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_order public.orders;
begin
  if not public.owns_shop(p_shop_id) then
    raise exception 'Boutique introuvable' using errcode = '42501';
  end if;
  v_order := public.insert_order_internal(p_shop_id, 'manuelle', p_customer_name, p_customer_phone, p_customer_email,
                                          p_city, p_district, p_landmark, p_note, p_delivery_fee, p_items);
  return v_order.id;
end $$;

revoke execute on function public.create_order from public, anon;
grant execute on function public.create_order to authenticated;

-- ---------------------------------------------------------------------------
-- Boutique en ligne : lectures publiques (colonnes choisies, boutiques ouvertes)
-- ---------------------------------------------------------------------------
create function public.storefront_shop(p_slug text)
returns table (id uuid, name text, slug text, description text, city text, country text,
               currency text, phone text, email text, default_delivery_fee integer)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, s.slug, s.description, s.city, s.country, s.currency, s.phone, s.email, s.default_delivery_fee
  from public.shops s
  where s.slug = p_slug and public.shop_is_open(s.id);
$$;

create function public.storefront_products(p_slug text)
returns table (id uuid, name text, description text, price integer, stock integer, image_path text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.name, p.description, p.price, p.stock, p.image_path
  from public.products p
  join public.shops s on s.id = p.shop_id
  where s.slug = p_slug and p.is_active and public.shop_is_open(s.id)
  order by p.created_at desc;
$$;

-- Commande passée par un client sur la boutique en ligne (paiement à la livraison)
create function public.place_storefront_order(
  p_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_city text,
  p_district text,
  p_landmark text,
  p_note text,
  p_items jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_shop public.shops;
  v_order public.orders;
begin
  select * into v_shop from public.shops where slug = p_slug;
  if not found or not public.shop_is_open(v_shop.id) then
    raise exception 'Cette boutique n''accepte pas de commandes pour le moment' using errcode = '22023';
  end if;
  if char_length(coalesce(p_customer_name, '')) < 2 or char_length(coalesce(p_customer_phone, '')) < 8
     or char_length(coalesce(p_city, '')) < 2 then
    raise exception 'Coordonnées de livraison incomplètes' using errcode = '22023';
  end if;

  v_order := public.insert_order_internal(v_shop.id, 'boutique', left(p_customer_name, 80), left(p_customer_phone, 30),
                                          left(p_customer_email, 120), left(p_city, 80), left(p_district, 80),
                                          left(p_landmark, 200), left(p_note, 500), v_shop.default_delivery_fee, p_items);
  return v_order.public_token;
end $$;

-- Récapitulatif affiché au client après sa commande
create function public.storefront_order(p_token uuid)
returns table (number integer, status public.order_status, customer_name text, city text, district text,
               subtotal integer, delivery_fee integer, total integer, created_at timestamptz,
               items jsonb, shop_name text, shop_slug text, shop_phone text)
language sql stable security definer set search_path = '' as $$
  select o.number, o.status, o.customer_name, o.city, o.district, o.subtotal, o.delivery_fee, o.total, o.created_at,
         coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit_price', i.unit_price))
                   from public.order_items i where i.order_id = o.id), '[]'::jsonb),
         s.name, s.slug, s.phone
  from public.orders o
  join public.shops s on s.id = o.shop_id
  where o.public_token = p_token;
$$;
