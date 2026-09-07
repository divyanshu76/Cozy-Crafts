import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : "";

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function run() {
  console.log("--- VERIFYING MIGRATION 0004 ---");
  
  const { data: testOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      public_order_number: "VERIFY-" + Date.now(),
      customer_id: null,
      subtotal: 100,
      discount: 0,
      shipping_fee: 49,
      total: 149,
      shipping_address_snapshot: { test: true },
      payment_method: "COD",
      cod_fee: 0,
    })
    .select()
    .single();

  if (orderError) {
    console.error("FAIL — Column still missing:", orderError.message);
    return;
  }
  
  console.log("OK — Orders insert with payment_method + cod_fee succeeded, id:", testOrder.id);
  await supabase.from("orders").delete().eq("id", testOrder.id);
  console.log("Cleanup done.");

  // Now check product descriptions again
  console.log("\n--- PRODUCT DESCRIPTION CHECK ---");
  const { data: prods } = await supabase
    .from("products")
    .select("id, name, slug, description, short_description, offer_enabled, offer_end_at");
  
  for (const p of prods || []) {
    const desc = (p.description || "") + " " + (p.short_description || "");
    const suspicious = /audit|act as|senior ui|give me only|format exactly|inspection|weaknesses|prompt/i.test(desc);
    console.log(`- "${p.name}" (${p.slug}): suspicious=${suspicious}, offer_enabled=${p.offer_enabled}, offer_end_at=${p.offer_end_at}`);
    if (suspicious) {
      console.log(`  SHORT DESC: ${(p.short_description || "").substring(0, 100)}`);
      console.log(`  DESC: ${(p.description || "").substring(0, 200)}`);
    }
  }
}

run().catch(console.error);
