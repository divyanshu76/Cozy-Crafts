-- ============================================================
-- CozyCraft migration 0002 — shipping & status history
-- Run AFTER 0001_init.sql
-- ============================================================

-- ── 1. Rebuild order_status: remove shipping-only values ──────────────────
-- Step 1: cast existing column to text so we can drop the old type
alter table orders alter column status type text;

-- Step 2: drop old enum
drop type if exists order_status cascade;

-- Step 3: create the narrower business-only enum
create type order_status as enum (
  'PENDING_PAYMENT',
  'PAYMENT_FAILED',
  'PAID',
  'CONFIRMED',
  'PROCESSING',
  'CANCELLED',
  'REFUNDED'
);

-- Step 4: remap any rows that used the old shipping-only values
-- (safe no-op if DB is empty; handles existing data if already populated)
update orders set status = 'PROCESSING'
  where status in ('PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED');

-- Step 5: cast back to the new enum
alter table orders alter column status type order_status using status::order_status;
alter table orders alter column status set default 'PENDING_PAYMENT';

-- ── 2. New shipping_status enum + column ─────────────────────────────────
create type shipping_status as enum (
  'NOT_SHIPPED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RTO_INITIATED',
  'RTO_DELIVERED',
  'LOST_OR_DAMAGED',
  'CANCELLED'
);

alter table orders add column if not exists shipping_status shipping_status not null default 'NOT_SHIPPED';

-- ── 3. Shiprocket columns on orders ──────────────────────────────────────
alter table orders add column if not exists shiprocket_order_id text;
alter table orders add column if not exists shiprocket_shipment_id text;
alter table orders add column if not exists awb_number text;
alter table orders add column if not exists courier_name text;
alter table orders add column if not exists estimated_delivery_date date;

-- ── 4. Status history — audit log for ALL three status types ─────────────
create type status_type as enum ('order_status', 'payment_status', 'shipping_status');

create table if not exists order_status_history (
  id           uuid        primary key default gen_random_uuid(),
  order_id     uuid        not null references orders(id) on delete cascade,
  status_type  status_type not null,
  old_value    text,
  new_value    text        not null,
  -- source: 'razorpay_webhook' | 'shiprocket_webhook' | 'admin_manual' | 'system'
  source       text        not null,
  changed_by   uuid        references profiles(id),
  created_at   timestamptz not null default now()
);

create index if not exists idx_order_status_history_order_id
  on order_status_history (order_id, created_at);

-- ── 5. Shared idempotency ledger for ALL webhooks ─────────────────────────
create table if not exists webhook_events (
  id           uuid        primary key default gen_random_uuid(),
  -- source: 'razorpay' | 'shiprocket'
  source       text        not null,
  event_id     text        not null,
  payload      jsonb       not null,
  processed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (source, event_id)
);

-- ── 6. Shiprocket auth token cache (single-row) ───────────────────────────
-- Token is valid ~240 hours per Shiprocket docs; we cache with a 220h TTL.
create table if not exists shiprocket_auth_cache (
  id         int         primary key default 1,
  token      text        not null,
  expires_at timestamptz not null,
  constraint single_row check (id = 1)
);

-- ── 7. Email send log ─────────────────────────────────────────────────────
create type email_status as enum ('pending', 'sent', 'failed');

create table if not exists email_log (
  id                 uuid         primary key default gen_random_uuid(),
  order_id           uuid         references orders(id) on delete cascade,
  -- trigger: ORDER_CONFIRMED | ORDER_PACKED | ORDER_SHIPPED |
  --          ORDER_OUT_FOR_DELIVERY | ORDER_DELIVERED |
  --          PAYMENT_FAILED | ORDER_CANCELLED | REFUND_INITIATED
  trigger            text         not null,
  status             email_status not null default 'pending',
  resend_message_id  text,
  error              text,
  attempts           int          not null default 0,
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now()
);

create index if not exists idx_email_log_order_id on email_log (order_id);
create index if not exists idx_email_log_status   on email_log (status) where status = 'failed';

-- ── 8. log_status_change() helper ────────────────────────────────────────
-- Call this RPC from every place a status is written instead of writing
-- to orders directly and remembering to log separately.
create or replace function log_status_change(
  p_order_id   uuid,
  p_status_type status_type,
  p_old_value  text,
  p_new_value  text,
  p_source     text,
  p_changed_by uuid default null
) returns void as $$
begin
  insert into order_status_history
    (order_id, status_type, old_value, new_value, source, changed_by)
  values
    (p_order_id, p_status_type, p_old_value, p_new_value, p_source, p_changed_by);
end;
$$ language plpgsql;
