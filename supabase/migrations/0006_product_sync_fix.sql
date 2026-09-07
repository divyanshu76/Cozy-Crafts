-- Migration 0006: Product Sync Fix
-- This migration ensures that the offer_enabled and offer_end_at columns exist
-- in the products table. These were requested by the storefront queries but
-- were missing from the production database.

ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_enabled boolean not null default false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_end_at timestamptz;
