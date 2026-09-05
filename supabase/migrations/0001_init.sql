-- ============================================================
-- CozyCraft — initial schema
-- Run in Supabase SQL editor or via: supabase db push
-- ============================================================

-- Enums
create type order_status as enum (
  'PENDING_PAYMENT','PAYMENT_FAILED','PAID','CONFIRMED','PROCESSING',
  'PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED'
);
create type payment_status as enum ('PENDING','AUTHORIZED','CAPTURED','FAILED','REFUNDED');
create type review_status as enum ('pending','approved','rejected');
create type coupon_discount_type as enum ('percentage','fixed');

-- ============================================================
-- Storefront tables (public read via RLS)
-- ============================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  category_id uuid references categories(id),
  sku text unique,
  materials text[],
  care_instructions text,
  personalization_available boolean not null default false,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_best_seller boolean not null default false,
  active boolean not null default true,
  tags text[],
  rating numeric(3,2) not null default 0,
  review_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  url text not null,
  alt_text text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,
  price_override numeric(10,2),
  sku text unique,
  created_at timestamptz not null default now()
);

create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  stock int not null default 0,
  updated_at timestamptz not null default now(),
  unique (product_id, variant_id)
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  order_id uuid,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  body text not null,
  image_url text,
  verified boolean not null default false,
  status review_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Order & payment tables (no public access — service role only)
-- ============================================================

-- "customers" = order-contact record, not a login account
create table customers (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  full_name text,
  created_at timestamptz not null default now()
);
create index on customers (email);
create index on customers (phone);

create table addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  full_name text not null,
  phone text not null,
  address_line text not null,
  city text not null,
  state text not null,
  pin_code text not null,
  country text not null default 'India',
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  public_order_number text unique not null,
  customer_id uuid references customers(id),
  status order_status not null default 'PENDING_PAYMENT',
  payment_status payment_status not null default 'PENDING',
  subtotal numeric(10,2) not null,
  discount numeric(10,2) not null default 0,
  shipping_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  currency text not null default 'INR',
  shipping_address_snapshot jsonb not null,
  tracking_number text,
  courier text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on orders (public_order_number);
create index on orders (customer_id);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),
  variant_id uuid references product_variants(id),
  product_name_snapshot text not null,
  product_image_snapshot text,
  unit_price_snapshot numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  razorpay_order_id text not null,
  razorpay_payment_id text unique,
  razorpay_signature text,
  amount numeric(10,2) not null,
  currency text not null default 'INR',
  status payment_status not null default 'PENDING',
  raw_webhook_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on payments (razorpay_order_id);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discount_type coupon_discount_type not null,
  discount_value numeric(10,2) not null,
  min_order_amount numeric(10,2) not null default 0,
  max_uses int,
  used_count int not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Guest wishlist keyed by a client-generated session UUID stored in localStorage.
-- Migration path to real accounts: add nullable customer_id column and backfill later.
create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (session_id, product_id)
);

-- ============================================================
-- Order number sequence (atomic, date-keyed)
-- ============================================================

create table order_number_sequences (
  date_key text primary key,
  last_value int not null default 0
);

create or replace function next_order_number() returns text as $$
declare
  today_key text := to_char(now(), 'YYYYMMDD');
  next_val int;
begin
  insert into order_number_sequences (date_key, last_value)
  values (today_key, 1)
  on conflict (date_key)
  do update set last_value = order_number_sequences.last_value + 1
  returning last_value into next_val;

  return 'CC-' || today_key || '-' || lpad(next_val::text, 4, '0');
end;
$$ language plpgsql;

-- ============================================================
-- Admin profiles (linked to Supabase Auth)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer', -- 'admin' | 'customer'
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- Storefront tables — public read-only
alter table products enable row level security;
alter table categories enable row level security;
alter table product_images enable row level security;
alter table product_variants enable row level security;
alter table reviews enable row level security;

create policy "Public can read active products"
  on products for select using (active = true);

create policy "Public can read categories"
  on categories for select using (true);

create policy "Public can read product images"
  on product_images for select using (true);

create policy "Public can read variants"
  on product_variants for select using (true);

create policy "Public can read approved reviews"
  on reviews for select using (status = 'approved');

-- Order/payment tables — NO public policies.
-- Only accessible via service-role key in API routes.
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table customers enable row level security;
alter table addresses enable row level security;
alter table coupons enable row level security;
alter table wishlist_items enable row level security;
alter table profiles enable row level security;

create policy "Admins can read their own profile"
  on profiles for select using (auth.uid() = id);
