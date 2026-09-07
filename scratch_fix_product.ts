import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : "";

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function run() {
  // Fix the Gmaing Console product with clean, real product content
  const { data: updated, error } = await supabase
    .from("products")
    .update({
      short_description: "A compact gaming console for on-the-go gaming fun.",
      description: "The Gaming Console is a compact and lightweight device designed for portable gaming. Featuring a responsive joystick and multiple game modes, it's perfect for casual gaming sessions at home or on the go. Comes with a rechargeable battery and a selection of pre-loaded classic games.",
    })
    .eq("slug", "gmaing-console")
    .select("id, name, slug, short_description, description");

  if (error) {
    console.error("Failed to update product:", error);
  } else {
    console.log("Updated product:", updated?.[0]?.name);
    console.log("Short desc:", updated?.[0]?.short_description);
    console.log("Desc (first 100 chars):", updated?.[0]?.description?.substring(0, 100));
  }
}

run().catch(console.error);
