import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const anonKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const anonKey = anonKeyMatch ? anonKeyMatch[1].trim() : "";

const supabase = createClient(url, anonKey);

const PRODUCT_SELECT = `
  id, name, slug, description, short_description, price, compare_at_price, category_id,
  sku, materials, care_instructions, personalization_available,
  is_featured, is_new, is_best_seller, active, tags, rating, review_count, 
  offer_enabled, offer_end_at, created_at, updated_at,
  categories ( slug ),
  images:product_images ( url, alt_text, position ),
  variants:product_variants ( id, label, price_override ),
  inventory ( stock, variant_id )
`;

async function testSearch(q: string) {
  const lower = q.toLowerCase();
  
  // Current ilike approach
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true)
    .or(`name.ilike.%${lower}%,description.ilike.%${lower}%,short_description.ilike.%${lower}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(`  Search "${q}" -> ERROR: ${error.message}`);
  } else {
    const names = data?.map(p => p.name) || [];
    console.log(`  Search "${q}" -> ${data?.length} results: [${names.join(", ")}]`);
  }
}

async function run() {
  console.log("--- SEARCH TESTS ---");
  
  const queries = [
    "gaming",
    "gmaing",
    "console",
    "daisy",
    "cloud",
    "bouquet",
    "heart",
    "keychain",
    "tulip",
    "clip",
    "charm",
    "pastel",
  ];
  
  for (const q of queries) {
    await testSearch(q);
  }
}

run().catch(console.error);
