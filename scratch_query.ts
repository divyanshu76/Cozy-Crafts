import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1] : "";
const key = keyMatch ? keyMatch[1] : "";

const supabase = createClient(url, key);

async function run() {
  console.log("--- FINAL DIAGNOSTICS ---");

  const PRODUCT_SELECT = `
    id, name, slug, description, short_description, price, compare_at_price, category_id,
    sku, materials, care_instructions, personalization_available,
    is_featured, is_new, is_best_seller, active, tags, rating, review_count, 
    created_at, updated_at,
    categories ( slug ),
    images:product_images ( url, alt_text, position ),
    variants:product_variants ( id, label, price_override ),
    inventory ( stock, variant_id )
  `;

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Test Query Error:", error);
  } else {
    console.log(`Test Query Success! Fetched ${data?.length} products using explicit select.`);
  }

  // Images
  const { count: imageCount } = await supabase.from("product_images").select("*", { count: 'exact', head: true });
  console.log(`Total Image Rows: ${imageCount}`);

  // Inventory
  const { count: invCount } = await supabase.from("inventory").select("*", { count: 'exact', head: true });
  console.log(`Total Inventory Rows: ${invCount}`);
}

run();
