import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const anonKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : "";
const anonKey = anonKeyMatch ? anonKeyMatch[1].trim() : "";

console.log("URL:", url ? "found" : "MISSING");
console.log("Service Role Key:", serviceKey ? "found (length=" + serviceKey.length + ")" : "MISSING");
console.log("Anon Key:", anonKey ? "found" : "MISSING");

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function run() {
  console.log("\n--- CHECKOUT DIAGNOSTICS ---");

  // 1. Check next_order_number RPC
  console.log("\n[1] Testing next_order_number RPC...");
  const { data: orderNum, error: rpcError } = await supabase.rpc("next_order_number");
  if (rpcError) {
    console.error("   RPC ERROR:", rpcError.message, rpcError.code, rpcError.details);
  } else {
    console.log("   Order number generated:", orderNum);
  }

  // 2. Check orders table columns
  console.log("\n[2] Testing orders table insert (with payment_method and cod_fee)...");
  const { data: testOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      public_order_number: "TEST-" + Date.now(),
      customer_id: null,
      subtotal: 100,
      discount: 0,
      shipping_fee: 49,
      total: 149,
      shipping_address_snapshot: { fullName: "Test User", phone: "9999999999" },
      payment_method: "COD",
      cod_fee: 0,
    })
    .select()
    .single();

  if (orderError) {
    console.error("   ORDER INSERT ERROR:", JSON.stringify(orderError));
  } else {
    console.log("   Order inserted OK, id:", testOrder?.id);
    
    // 3. Test order_items insert
    console.log("\n[3] Testing order_items insert...");
    const { data: products } = await supabase
      .from("products")
      .select("id, name, price")
      .limit(1);
    
    if (products && products.length > 0) {
      const { error: itemError } = await supabase.from("order_items").insert({
        order_id: testOrder.id,
        product_id: products[0].id,
        product_name_snapshot: products[0].name,
        product_image_snapshot: null,
        unit_price_snapshot: products[0].price,
        quantity: 1,
        line_total: products[0].price,
      });
      if (itemError) {
        console.error("   ORDER_ITEMS INSERT ERROR:", JSON.stringify(itemError));
      } else {
        console.log("   Order items inserted OK");
      }
    }

    // 4. Test email_log insert
    console.log("\n[4] Testing email_log insert...");
    const { error: emailError } = await supabase.from("email_log").insert({
      order_id: testOrder.id,
      trigger: "ORDER_CONFIRMED",
      status: "pending",
    });
    if (emailError) {
      console.error("   EMAIL_LOG INSERT ERROR:", JSON.stringify(emailError));
    } else {
      console.log("   Email log inserted OK");
    }

    // 5. Cleanup test order
    console.log("\n[5] Cleaning up test order...");
    await supabase.from("orders").delete().eq("id", testOrder.id);
    console.log("   Cleaned up.");
  }

  // 6. Check customers table
  console.log("\n[6] Testing customers insert...");
  const { data: cust, error: custError } = await supabase
    .from("customers")
    .insert({ email: "test@test.com", phone: "9876543210", full_name: "Test" })
    .select()
    .single();
  if (custError) {
    console.error("   CUSTOMERS INSERT ERROR:", JSON.stringify(custError));
  } else {
    console.log("   Customer inserted OK, id:", cust?.id);
    await supabase.from("customers").delete().eq("id", cust.id);
    console.log("   Cleaned up customer.");
  }

  // 7. Check if payment_method column exists in orders
  console.log("\n[7] Checking orders table columns...");
  const { data: ordersCheck } = await supabase
    .from("orders")
    .select("payment_method, cod_fee")
    .limit(1);
  console.log("   Columns payment_method and cod_fee exist:", ordersCheck !== null ? "YES" : "NO");

  // 8. Fetch all products with descriptions
  console.log("\n[8] Checking product descriptions for prompt contamination...");
  const { data: allProds } = await supabase
    .from("products")
    .select("id, name, slug, description, short_description, active");
  for (const p of allProds || []) {
    const desc = (p.description || "") + " " + (p.short_description || "");
    const suspicious = /audit|act as|senior|ui\/ux|give me only|format exactly|prompt|instruction/i.test(desc);
    console.log(`   Product: "${p.name}" | Active: ${p.active} | Suspicious description: ${suspicious}`);
    if (suspicious) {
      console.log(`     !! Description (first 200 chars): ${desc.substring(0, 200)}`);
    }
  }
}

run().catch(console.error);
