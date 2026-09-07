-- Migration 0003: Product Management Enhancements

-- 1. Add short_description to products (nullable to support existing records)
ALTER TABLE products ADD COLUMN short_description text;

-- 2. Enable RLS on inventory
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- 3. Add public read policy for inventory
CREATE POLICY "Public read access" ON inventory FOR SELECT USING (true);
