-- SÉRAINE DB Schema

-- profiles（auth.usersと連携）
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('admin', 'customer')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- 新規ユーザー登録時に自動でprofileを作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'customer', coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null,
  description text,
  ingredients text,
  image_urls text[] not null default '{}',
  stock integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- cart_items
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total integer not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_name text not null,
  shipping_postal_code text not null,
  shipping_address text not null,
  shipping_phone text not null,
  shipping_fee integer not null default 0,
  created_at timestamptz not null default now()
);

-- order_items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  price integer not null,
  created_at timestamptz not null default now()
);

-- order_payments
create table public.order_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  stripe_session_id text unique,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  created_at timestamptz not null default now()
);

-- reviews
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

-- site_settings
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- インデックス
create index idx_products_category on public.products(category_id);
create index idx_products_active on public.products(is_active);
create index idx_cart_items_user on public.cart_items(user_id);
create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_order_items_order on public.order_items(order_id);
create index idx_reviews_product on public.reviews(product_id);

-- RLS有効化
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_payments enable row level security;
alter table public.reviews enable row level security;
alter table public.site_settings enable row level security;

-- SECURITY DEFINER関数でadminチェック（RLS再帰回避）
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- RLSポリシー

-- profiles: 自分のプロフィールのみ読み書き可能
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- categories: 誰でも閲覧可能、管理者のみ変更可能
create policy "categories_select_all" on public.categories for select using (true);
create policy "categories_admin_all" on public.categories for all using (public.is_admin());

-- products: 公開商品は誰でも閲覧可能、管理者のみ変更可能
create policy "products_select_active" on public.products for select using (is_active = true);
create policy "products_select_admin" on public.products for select using (public.is_admin());
create policy "products_admin_all" on public.products for all using (public.is_admin());

-- cart_items: 自分のカートのみ
create policy "cart_items_own" on public.cart_items for all using (auth.uid() = user_id);

-- orders: 自分の注文のみ、管理者は全注文
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_admin_all" on public.orders for all using (public.is_admin());

-- order_items: 自分の注文の明細のみ、管理者は全て
create policy "order_items_select_own" on public.order_items for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "order_items_insert_own" on public.order_items for insert with check (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "order_items_admin_all" on public.order_items for all using (public.is_admin());

-- order_payments: 自分の注文の決済のみ、管理者は全て
create policy "order_payments_select_own" on public.order_payments for select using (
  exists (select 1 from public.orders where id = order_id and user_id = auth.uid())
);
create policy "order_payments_admin_all" on public.order_payments for all using (public.is_admin());

-- reviews: 誰でも閲覧可能、自分のレビューのみ作成・編集可能
create policy "reviews_select_all" on public.reviews for select using (true);
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);
create policy "reviews_admin_all" on public.reviews for all using (public.is_admin());

-- site_settings: 誰でも閲覧可能、管理者のみ変更可能
create policy "site_settings_select_all" on public.site_settings for select using (true);
create policy "site_settings_admin_all" on public.site_settings for all using (public.is_admin());
