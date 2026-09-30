create table public.products (
  id text primary key,
  name text not null,
  price_cents integer not null check (price_cents >= 0),
  active boolean not null default true
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  customer_name text not null,
  shipping_address jsonb not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  status text not null default 'confirmed' check (status in ('confirmed', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  unit_price_cents integer not null check (unit_price_cents >= 0),
  quantity integer not null check (quantity > 0)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;
create policy "Products are publicly readable" on public.products for select using (active = true);
create policy "Customers can view their own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Customers can view their order items" on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid()));

insert into public.products (id, name, price_cents) values
  ('arc-mug', 'Arc mug', 3200), ('loop-candle', 'Loop candle', 2600),
  ('grid-throw', 'Grid throw', 9800), ('form-vase', 'Form vase', 7400);
