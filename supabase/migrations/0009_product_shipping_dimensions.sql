-- Migration 0009: Product Shipping Dimensions
--
-- Add physical dimensions and weight to products for accurate courier API integration (e.g., Shiprocket).
-- IF NOT EXISTS makes this safe to run multiple times (idempotent).
-- NOT NULL + DEFAULT means existing rows are backfilled immediately — no data loss.
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight  numeric(10,2) NOT NULL DEFAULT 0.2;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length  numeric(10,2) NOT NULL DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS breadth numeric(10,2) NOT NULL DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height  numeric(10,2) NOT NULL DEFAULT 5;
