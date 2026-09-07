import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRODUCT_SELECT = `
  id, name, slug,
  inventory ( stock, variant_id ),
  images:product_images ( url, position )
`;

async function main() {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("active", true);

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

main();
