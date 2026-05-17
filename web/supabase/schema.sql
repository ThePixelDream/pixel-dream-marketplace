-- Supabase schema for The Pixel Dream (MVP)
-- Run in Supabase SQL editor.

-- 1) Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  referred_by_code text null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read/update their own profile (but cannot change role or referral once set)
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
);

-- 2) Affiliates
create table if not exists public.affiliates (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text unique not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'rejected')),
  stripe_account_id text null,
  created_at timestamptz not null default now()
);

alter table public.affiliates enable row level security;

-- Anyone can read active affiliate codes for validation
create policy "affiliates_select_active"
on public.affiliates for select
using (status = 'active');

-- Only admins can manage affiliates (you'll set role=admin in profiles manually at first)
create policy "affiliates_admin_all"
on public.affiliates for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 3) Trigger: create profile on signup and persist referral code from auth metadata once
create or replace function public.handle_new_user()
returns trigger as $$
declare
  ref_code text;
begin
  ref_code := nullif(new.raw_user_meta_data->>'referred_by_code', '');

  insert into public.profiles (id, referred_by_code)
  values (new.id, ref_code)
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- 4) Prevent users from changing referred_by_code after set (optional strictness)
create or replace function public.prevent_referral_change()
returns trigger as $$
begin
  if old.referred_by_code is not null and new.referred_by_code is distinct from old.referred_by_code then
    raise exception 'referred_by_code is immutable once set';
  end if;
  if new.role is distinct from old.role and not exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ) then
    raise exception 'role can only be changed by admin';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_referral_change on public.profiles;
create trigger prevent_referral_change
before update on public.profiles
for each row execute procedure public.prevent_referral_change();

-- 5) Products (public catalog)
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price_cents integer not null default 0,
  currency text not null default 'usd',
  active boolean not null default true,
  cover_image_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute procedure public.set_updated_at();

alter table public.products enable row level security;

-- Anyone can read active products
create policy "products_select_active"
on public.products for select
using (active = true);

-- Admin can manage products
create policy "products_admin_all"
on public.products for all
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
)
with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- 6) Orders + entitlements (digital goods)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'coinbase')),
  provider_ref text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  currency text not null default 'usd',
  total_cents integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  qty integer not null default 1,
  unit_price_cents integer not null default 0
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id),
  order_id uuid not null references public.orders (id) on delete cascade,
  granted_at timestamptz not null default now(),
  unique (user_id, product_id)
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.entitlements enable row level security;

-- Users can read their own orders/items/entitlements
create policy "orders_select_own"
on public.orders for select
using (auth.uid() = user_id);

create policy "order_items_select_own"
on public.order_items for select
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy "entitlements_select_own"
on public.entitlements for select
using (auth.uid() = user_id);

-- Admin can read all
create policy "orders_admin_select"
on public.orders for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "entitlements_admin_select"
on public.entitlements for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 7) Affiliate commissions (created by webhooks/server using service role)
create table if not exists public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  affiliate_user_id uuid not null references auth.users (id) on delete cascade,
  amount_cents integer not null default 0,
  status text not null default 'pending' check (status in ('pending', 'available', 'paid', 'void')),
  stripe_transfer_id text null,
  created_at timestamptz not null default now()
);

alter table public.affiliate_commissions enable row level security;

create policy "affiliate_commissions_select_own"
on public.affiliate_commissions for select
using (auth.uid() = affiliate_user_id);

create policy "affiliate_commissions_admin_select"
on public.affiliate_commissions for select
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

