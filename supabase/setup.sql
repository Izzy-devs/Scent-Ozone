-- ONE-PASTE SETUP for the Scent Ozone demo (schema + demo data).
-- Supabase > SQL Editor > New query > paste all > Run.

-- Scent Ozone demo: full database setup.
-- Paste this whole file into Supabase > SQL Editor > New query > Run. Safe to re-run.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null default '',
  description text not null default '',
  price integer not null check (price >= 0),            -- whole naira
  category_id uuid references public.categories (id) on delete set null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_best_seller boolean not null default false,
  is_new_arrival boolean not null default false,
  is_sample boolean not null default false,              -- demo data; delete from admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_created_idx on public.products (created_at desc);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,                                   -- e.g. "100ml"
  price integer check (price >= 0),                      -- null = use product price
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  sort_order integer not null default 0
);
create index if not exists variants_product_idx on public.product_variants (product_id);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists images_product_idx on public.product_images (product_id);

create table if not exists public.store_settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'Scent Ozone',
  logo_url text,
  hero_image_url text,
  whatsapp_number text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  instagram_url text not null default '',
  tiktok_url text not null default '',
  telegram_url text not null default '',
  facebook_url text not null default '',
  delivery_info text not null default 'Delivery fees and timelines are confirmed after you place your order.',
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  bank_details text not null default '',
  enabled_payment_methods text[] not null default array['whatsapp'],
  announcement text not null default '',
  announcement_active boolean not null default false,
  testimonials jsonb not null default '[]'::jsonb,        -- [{name, quote}] genuine testimonials only
  updated_at timestamptz not null default now()
);
insert into public.store_settings (id) values (1) on conflict (id) do nothing;

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('SO-' || nextval('public.order_number_seq')),
  public_token uuid not null unique default gen_random_uuid(),  -- unguessable link for the customer
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  state text not null,
  city text not null,
  notes text,
  subtotal integer not null,
  delivery_fee integer not null default 0,
  total integer not null,
  payment_method text not null check (payment_method in ('paystack','flutterwave','bank_transfer','whatsapp')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','failed','refunded')),
  order_status text not null default 'pending' check (order_status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_reference text,
  payment_mode text not null default 'live' check (payment_mode in ('live','test')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name text not null,
  variant_label text,
  unit_price integer not null,
  quantity integer not null check (quantity > 0),
  line_total integer not null
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.store_settings;
create trigger settings_touch before update on public.store_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- order functions (service role only)
-- Prices and stock are always read from the database, never trusted from the browser.
create or replace function public.place_order(
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text,
  p_payment_mode text
)
returns table (order_id uuid, order_number text, public_token uuid, total integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_qty integer;
  v_price integer;
  v_label text;
  v_subtotal integer := 0;
  v_fee integer;
  v_order_id uuid;
  v_lines jsonb := '[]'::jsonb;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  select delivery_fee into v_fee from public.store_settings where id = 1;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 50 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select * into v_product from public.products
      where id = (v_item ->> 'product_id')::uuid for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if not v_product.is_available then
      raise exception 'UNAVAILABLE:%', v_product.name;
    end if;

    v_price := v_product.price;
    v_label := null;

    if (v_item ->> 'variant_id') is not null then
      select * into v_variant from public.product_variants
        where id = (v_item ->> 'variant_id')::uuid and product_id = v_product.id for update;
      if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
      if v_variant.stock_quantity < v_qty then
        raise exception 'OUT_OF_STOCK:%', v_product.name || ' (' || v_variant.label || ')';
      end if;
      v_price := coalesce(v_variant.price, v_product.price);
      v_label := v_variant.label;
      update public.product_variants set stock_quantity = stock_quantity - v_qty where id = v_variant.id;
    else
      if exists (select 1 from public.product_variants where product_id = v_product.id) then
        raise exception 'VARIANT_REQUIRED:%', v_product.name;
      end if;
      if v_product.stock_quantity < v_qty then
        raise exception 'OUT_OF_STOCK:%', v_product.name;
      end if;
      update public.products set stock_quantity = stock_quantity - v_qty where id = v_product.id;
    end if;

    v_subtotal := v_subtotal + v_price * v_qty;
    v_lines := v_lines || jsonb_build_object(
      'product_id', v_product.id, 'variant_id', v_item ->> 'variant_id',
      'name', v_product.name, 'label', v_label, 'price', v_price, 'qty', v_qty);
  end loop;

  insert into public.orders (customer_name, phone, email, address, state, city, notes,
                             subtotal, delivery_fee, total, payment_method, payment_mode)
  values (p_customer ->> 'name', p_customer ->> 'phone', nullif(p_customer ->> 'email', ''),
          p_customer ->> 'address', p_customer ->> 'state', p_customer ->> 'city',
          nullif(p_customer ->> 'notes', ''),
          v_subtotal, v_fee, v_subtotal + v_fee, p_payment_method, p_payment_mode)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_id, variant_id, product_name, variant_label,
                                  unit_price, quantity, line_total)
  select v_order_id, (l ->> 'product_id')::uuid, nullif(l ->> 'variant_id', '')::uuid,
         l ->> 'name', l ->> 'label', (l ->> 'price')::integer, (l ->> 'qty')::integer,
         (l ->> 'price')::integer * (l ->> 'qty')::integer
  from jsonb_array_elements(v_lines) l;

  return query
    select o.id, o.order_number, o.public_token, o.total from public.orders o where o.id = v_order_id;
end $$;

-- Cancelling an order puts its stock back. A cancelled order cannot be re-opened.
create or replace function public.update_order_status(p_order uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_old text;
begin
  select order_status into v_old from public.orders where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_old = 'cancelled' then raise exception 'ORDER_CANCELLED'; end if;
  if p_status = 'cancelled' then
    update public.products p set stock_quantity = p.stock_quantity + oi.quantity
      from public.order_items oi
      where oi.order_id = p_order and oi.product_id = p.id and oi.variant_id is null;
    update public.product_variants v set stock_quantity = v.stock_quantity + oi.quantity
      from public.order_items oi
      where oi.order_id = p_order and oi.variant_id = v.id;
  end if;
  update public.orders set order_status = p_status where id = p_order;
end $$;

revoke all on function public.place_order(jsonb, jsonb, text, text) from public, anon, authenticated;
revoke all on function public.update_order_status(uuid, text) from public, anon, authenticated;
grant execute on function public.place_order(jsonb, jsonb, text, text) to service_role;
grant execute on function public.update_order_status(uuid, text) to service_role;

-- ---------------------------------------------------------------- row level security
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- admin_users: a signed-in user may only see their own row. Nobody can write through the API.
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read" on public.admin_users for select to authenticated
  using (user_id = auth.uid());

-- Public catalogue: anyone can read, only admins can write.
do $$
declare t text;
begin
  foreach t in array array['products','product_variants','product_images','store_settings'] loop
    execute format('drop policy if exists "%1$s public read" on public.%1$s', t);
    execute format('create policy "%1$s public read" on public.%1$s for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "%1$s admin write" on public.%1$s', t);
    execute format('create policy "%1$s admin write" on public.%1$s for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select to anon, authenticated
  using (is_active or public.is_admin());
drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Orders: no public access at all. Customers create orders through the server (service role).
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "order_items admin read" on public.order_items;
create policy "order_items admin read" on public.order_items for select to authenticated using (public.is_admin());
drop policy if exists "newsletter admin read" on public.newsletter_subscribers;
create policy "newsletter admin read" on public.newsletter_subscribers for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------- storage (product photos, logo)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('store-media', 'store-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "store-media admin insert" on storage.objects;
create policy "store-media admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'store-media' and public.is_admin());
drop policy if exists "store-media admin update" on storage.objects;
create policy "store-media admin update" on storage.objects for update to authenticated
  using (bucket_id = 'store-media' and public.is_admin());
drop policy if exists "store-media admin delete" on storage.objects;
create policy "store-media admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'store-media' and public.is_admin());
-- Public files are served by the bucket's public URL; no public listing policy is created.


-- ================= DEMO DATA =================
-- DEMO DATA for the Scent Ozone presentation. Run after schema.sql (Supabase SQL Editor).
-- Safe by design: it only INSERTS rows that do not already exist (matched by slug) and never
-- updates or deletes your real products, orders or photos. Every product is flagged is_sample = true,
-- so the storefront labels it "Sample". Names, prices, stock and descriptions are NOT verified
-- inventory of any business. Product images are illustrations stored in public/samples.
-- To remove all demo products later:  delete from public.products where is_sample = true;

insert into public.categories (name, slug, description, sort_order) values
  ('Arabian Perfumes', 'arabian-perfumes', 'Oud, amber and musk from the Arabian tradition.', 1),
  ('Designer Fragrances', 'designer-fragrances', 'Designer houses and designer-inspired scents.', 2),
  ('Women''s Fragrances', 'womens-fragrances', 'Floral, fruity and gourmand scents for her.', 3),
  ('Men''s Fragrances', 'mens-fragrances', 'Woody, spicy and fresh scents for him.', 4),
  ('Unisex Fragrances', 'unisex-fragrances', 'Scents made to be worn by anyone.', 5),
  ('Body Sprays', 'body-sprays', 'Light everyday mists and body sprays.', 6)
on conflict (slug) do nothing;

with demo(slug, name, brand, descr, price, cat, stock, feat, best, fresh, ord) as (values
  ('lattafa-asad', 'Asad', 'Lattafa', 'Sample description: bold, warm and spicy with a smooth amber finish. For him. Replace with real details.', 38000, 'mens-fragrances', 14, false, true, false, 1),
  ('lattafa-khamrah', 'Khamrah', 'Lattafa', 'Sample description: rich gourmand warmth with cinnamon, dates and vanilla. Unisex. Replace with real details.', 45000, 'unisex-fragrances', 9, true, true, false, 2),
  ('lattafa-yara', 'Yara', 'Lattafa', 'Sample description: soft, creamy and sweet with a powdery pink glow. For her. Replace with real details.', 36000, 'womens-fragrances', 11, true, true, false, 3),
  ('lattafa-najdia', 'Najdia', 'Lattafa', 'Sample description: golden, smooth and elegant with a lasting dry down. Unisex. Replace with real details.', 42000, 'unisex-fragrances', 0, false, false, true, 4),
  ('afnan-9pm', '9PM', 'Afnan', 'Sample description: an after-dark scent that is sweet, spicy and confident. For him. Replace with real details.', 40000, 'mens-fragrances', 7, false, false, true, 5),
  ('armaf-club-de-nuit-intense-man', 'Club de Nuit Intense Man', 'Armaf', 'Sample description: crisp citrus opening over smoky woods. Designer-inspired. For him. Replace with real details.', 55000, 'designer-fragrances', 6, false, true, false, 6),
  ('maison-alhambra-jean-lowe-immortel', 'Jean Lowe Immortel', 'Maison Alhambra', 'Sample description: fresh, clean and modern with a polished finish. Designer-inspired. For him. Replace with real details.', 48000, 'designer-fragrances', 5, true, false, false, 7),
  ('lattafa-fakhar-black', 'Fakhar Black', 'Lattafa', 'Sample description: dark, fresh and refined with an aromatic edge. For him. Replace with real details.', 39000, 'mens-fragrances', 10, false, false, true, 8),
  ('afnan-supremacy-not-only-intense', 'Supremacy Not Only Intense', 'Afnan', 'Sample description: deep, fruity and woody with strong presence. For him. Replace with real details.', 52000, 'mens-fragrances', 4, false, false, false, 9),
  ('armaf-club-de-nuit-woman', 'Club de Nuit Woman', 'Armaf', 'Sample description: warm florals and soft spice with an elegant evening feel. For her. Replace with real details.', 50000, 'womens-fragrances', 8, false, false, false, 10),
  ('lattafa-badee-al-oud-oud-for-glory', 'Bade''e Al Oud Oud for Glory', 'Lattafa', 'Sample description: a dark, resinous oud with saffron warmth. Arabian. Unisex. Replace with real details.', 41000, 'arabian-perfumes', 12, true, false, false, 11),
  ('maison-alhambra-delilah', 'Delilah', 'Maison Alhambra', 'Sample description: juicy, floral and playful with a sweet finish. For her. Replace with real details.', 47000, 'womens-fragrances', 3, false, false, true, 12)
),
ins as (
  insert into public.products (slug, name, brand, description, price, category_id, stock_quantity, is_available,
                               is_featured, is_best_seller, is_new_arrival, is_sample, created_at)
  select d.slug, d.name, d.brand, d.descr, d.price, c.id, d.stock, true, d.feat, d.best, d.fresh, true,
         now() - (d.ord || ' hours')::interval
  from demo d join public.categories c on c.slug = d.cat
  on conflict (slug) do nothing
  returning id, slug
)
insert into public.product_images (product_id, url, sort_order, is_primary)
select ins.id, '/samples/' || ins.slug || '.svg', 0, true from ins;
