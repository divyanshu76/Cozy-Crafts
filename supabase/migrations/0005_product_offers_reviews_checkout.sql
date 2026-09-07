-- Migration 0005: Product Offers & Reviews

-- Add offer settings to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_enabled boolean not null default false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS offer_end_at timestamptz;
