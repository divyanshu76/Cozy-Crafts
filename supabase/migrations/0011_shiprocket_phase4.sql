-- ============================================================
-- CozyCraft migration 0011 — Shiprocket Phase 4 Logistics
-- ============================================================

alter table orders add column if not exists shiprocket_courier_id text;
alter table orders add column if not exists shiprocket_label_url text;
alter table orders add column if not exists shiprocket_manifest_url text;
alter table orders add column if not exists shiprocket_pickup_scheduled_date timestamptz;
