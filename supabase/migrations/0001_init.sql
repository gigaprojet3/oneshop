-- OneShop : schéma initial
-- À exécuter dans Supabase > SQL Editor (ou via `supabase db push`).

-- ---------------------------------------------------------------------------
-- Boutiques
-- ---------------------------------------------------------------------------
create table public.shops (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null unique references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 60),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  country     text not null,                 -- code ISO : CI, SN, CM…
  currency    text not null check (currency in ('XOF', 'XAF')),
  city        text not null,
  whatsapp    text not null,
  description text,
  default_delivery_fee integer not null default 0 check (default_delivery_fee >= 0),
  plan        text not null default 'gratuit' check (plan in ('gratuit', 'pro', 'business')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------------
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 120),
  description text,
  price       integer not null check (price >= 0),   -- en FCFA, pas de centimes
  stock       integer not null default 0 check (stock >= 0),
  image_path  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index products_shop_idx on public.products (shop_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Commandes (paiement à la livraison)
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'nouvelle',      -- reçue, pas encore confirmée par téléphone
  'confirmee',     -- client joint, commande confirmée
  'en_livraison',  -- remise au livreur
  'livree',        -- livrée et payée en espèces
  'refusee',       -- refusée à la livraison
  'annulee'        -- annulée avant livraison
);

create type public.order_source as enum (
  'whatsapp', 'facebook', 'instagram', 'tiktok', 'telephone', 'boutique', 'autre'
);

create table public.orders (
  id             uuid primary key default gen_random_uuid(),
  shop_id        uuid not null references public.shops (id) on delete cascade,
  number         integer not null,
  status         public.order_status not null default 'nouvelle',
  source         public.order_source not null default 'whatsapp',
  customer_name  text not null,
  customer_phone text not null,
  city           text not null,
  district       text,             -- quartier / commune
  landmark       text,             -- point de repère pour le livreur
  note           text,
  subtotal       integer not null default 0,
  delivery_fee   integer not null default 0 check (delivery_fee >= 0),
  total          integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (shop_id, number)
);
create index orders_shop_idx on public.orders (shop_id, created_at desc);
create index orders_status_idx on public.orders (shop_id, status);

create table public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders (id) on delete cascade,
  product_id  uuid references public.products (id) on delete set null,
  name        text not null,        -- copie du nom au moment de la commande
  unit_price  integer not null check (unit_price >= 0),
  quantity    integer not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- Horodatage automatique
-- ---------------------------------------------------------------------------
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Sécurité : chaque commerçant ne voit que sa boutique
-- ---------------------------------------------------------------------------
create function public.owns_shop(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shops where id = target and owner_id = (select auth.uid())
  );
$$;

alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "shops: propriétaire" on public.shops
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "products: propriétaire" on public.products
  for all to authenticated
  using (public.owns_shop(shop_id))
  with check (public.owns_shop(shop_id));

create policy "orders: propriétaire" on public.orders
  for all to authenticated
  using (public.owns_shop(shop_id))
  with check (public.owns_shop(shop_id));

create policy "order_items: propriétaire" on public.order_items
  for all to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and public.owns_shop(o.shop_id)))
  with check (exists (select 1 from public.orders o where o.id = order_id and public.owns_shop(o.shop_id)));

-- ---------------------------------------------------------------------------
-- Création d'une commande en une transaction :
-- numérotation, calcul des totaux à partir des prix en base, décrément du stock.
-- items = [{ "product_id": "...", "quantity": 2 }, ...]
-- ---------------------------------------------------------------------------
create function public.create_order(
  p_shop_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_city text,
  p_district text,
  p_landmark text,
  p_note text,
  p_source public.order_source,
  p_delivery_fee integer,
  p_items jsonb
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_order_id uuid;
  v_number integer;
  v_subtotal integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
begin
  if not public.owns_shop(p_shop_id) then
    raise exception 'Boutique introuvable' using errcode = '42501';
  end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Ajoutez au moins un produit' using errcode = '22023';
  end if;

  -- Verrou par boutique pour une numérotation sans doublon
  perform pg_advisory_xact_lock(hashtext(p_shop_id::text));
  select coalesce(max(number), 0) + 1 into v_number from public.orders where shop_id = p_shop_id;

  insert into public.orders (shop_id, number, source, customer_name, customer_phone, city, district, landmark, note, delivery_fee)
  values (p_shop_id, v_number, p_source, p_customer_name, p_customer_phone, p_city,
          nullif(p_district, ''), nullif(p_landmark, ''), nullif(p_note, ''), greatest(p_delivery_fee, 0))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 then
      raise exception 'Quantité invalide' using errcode = '22023';
    end if;

    select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid and shop_id = p_shop_id
      for update;
    if not found then
      raise exception 'Produit introuvable' using errcode = '22023';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (% restant)', v_product.name, v_product.stock using errcode = '22023';
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;
    insert into public.order_items (order_id, product_id, name, unit_price, quantity)
      values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty);
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  update public.orders
    set subtotal = v_subtotal, total = v_subtotal + delivery_fee
    where id = v_order_id;

  return v_order_id;
end $$;

-- ---------------------------------------------------------------------------
-- Remise en stock quand une commande est annulée ou refusée
-- (et nouveau retrait si elle est réactivée)
-- ---------------------------------------------------------------------------
create function public.restock_on_status_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  was_void boolean := old.status in ('annulee', 'refusee');
  is_void  boolean := new.status in ('annulee', 'refusee');
begin
  if is_void and not was_void then
    update public.products p set stock = p.stock + i.quantity
      from public.order_items i
      where i.order_id = new.id and i.product_id = p.id;
  elsif was_void and not is_void then
    update public.products p set stock = p.stock - i.quantity
      from public.order_items i
      where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end $$;

create trigger orders_restock after update of status on public.orders
  for each row when (old.status is distinct from new.status)
  execute function public.restock_on_status_change();

-- ---------------------------------------------------------------------------
-- Stockage des photos produits : dossier = id de la boutique
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 4194304,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "product-images: envoi par le propriétaire" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.owns_shop(((storage.foldername(name))[1])::uuid));

create policy "product-images: suppression par le propriétaire" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.owns_shop(((storage.foldername(name))[1])::uuid));
