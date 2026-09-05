-- ============================================================
-- CozyCraft — Demo seed data
-- Run AFTER 0001_init.sql
-- ============================================================

-- Categories
insert into categories (slug, name, description) values
  ('keychains', 'Keychains', 'Cute companions for your everyday carry.'),
  ('flower-bouquets', 'Flower Bouquets', 'Everlasting blooms made with pipe cleaners.'),
  ('hair-accessories', 'Hair Accessories', 'Clips, bands, and bows to complete your look.'),
  ('charms', 'Charms', 'Tiny trinkets for phones, bags, or wherever.'),
  ('gift-bundles', 'Gift Bundles', 'Curated sets for the perfect little present.'),
  ('personalized-gifts', 'Personalized Gifts', 'Make it theirs with a special touch.');

-- Products
with cat_keychains as (select id from categories where slug = 'keychains'),
     cat_bouquets  as (select id from categories where slug = 'flower-bouquets'),
     cat_hair      as (select id from categories where slug = 'hair-accessories'),
     cat_charms    as (select id from categories where slug = 'charms')
insert into products
  (name, slug, description, price, compare_at_price, category_id,
   materials, care_instructions, personalization_available,
   is_featured, is_new, is_best_seller, active, tags, rating, review_count)
values
  (
    'Pastel Daisy Keychain',
    'pastel-daisy-keychain',
    'A soft, fluffy pipe-cleaner daisy keychain to brighten up your keys or backpack. Each petal is shaped by hand, so tiny variations are part of its charm.',
    90.00, 120.00,
    (select id from cat_keychains),
    array['Soft pipe cleaners','Metal keyring'],
    'Keep away from moisture. Fluff gently if flattened.',
    false, true, false, true, true,
    array['daisy','pastel','fluffy'],
    4.8, 24
  ),
  (
    'Mini Tulip Bouquet',
    'mini-tulip-bouquet',
    'A tiny bundle of handmade pipe-cleaner tulips that will never wilt. Perfect for a small desk or as a thoughtful little gift.',
    150.00, null,
    (select id from cat_bouquets),
    array['Pipe cleaners','Floral tape','Ribbon'],
    'Keep away from direct sunlight to avoid fading.',
    true, true, true, false, true,
    array['tulip','pink','desk'],
    5.0, 12
  ),
  (
    'Cloud Hair Clip',
    'cloud-hair-clip',
    'A fluffy little cloud for your hair. Light, comfortable, and handcrafted with care.',
    60.00, null,
    (select id from cat_hair),
    array['Plush fabric','Metal snap clip'],
    'Spot clean only.',
    false, false, false, true, true,
    array['cloud','white','clip'],
    4.5, 45
  ),
  (
    'Initial Heart Charm',
    'initial-heart-charm',
    'A tiny resin heart charm with a custom initial. A perfect small personalized gift.',
    110.00, null,
    (select id from cat_charms),
    array['Resin','Gold-plated jump ring'],
    'Avoid contact with harsh chemicals.',
    true, false, true, false, true,
    array['heart','resin','initial'],
    0, 0
  );

-- Product images (placeholder SVG — replace with real Supabase Storage URLs)
insert into product_images (product_id, url, alt_text, position)
select p.id, '/products/placeholder.svg', p.name || ' image', 0
from products p;

-- Inventory (stock matching original data)
insert into inventory (product_id, stock)
values
  ((select id from products where slug = 'pastel-daisy-keychain'), 15),
  ((select id from products where slug = 'mini-tulip-bouquet'), 8),
  ((select id from products where slug = 'cloud-hair-clip'), 30),
  ((select id from products where slug = 'initial-heart-charm'), 20);
