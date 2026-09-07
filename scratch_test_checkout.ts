import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const anonKeyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const anonKey = anonKeyMatch ? anonKeyMatch[1].trim() : "";

const supabase = createClient(url, anonKey);

async function run() {
  // Get a real product ID for testing
  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("slug", "pastel-daisy-keychain")
    .single();

  if (!product) {
    console.error("Product not found!");
    return;
  }

  console.log(`Testing COD checkout with product: ${product.name} (${product.id})`);

  const body = {
    items: [{ productId: product.id, quantity: 1 }],
    paymentMethod: "COD",
    address: {
      fullName: "Test User",
      phone: "9876543210",
      email: "test@cozycrafttest.com",
      addressLine: "123 Test Street",
      city: "Mumbai",
      state: "Maharashtra",
      pinCode: "400001",
    },
  };

  console.log("\nSending POST /api/checkout/create-order ...");
  const res = await fetch("http://localhost:3000/api/checkout/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (res.ok) {
    console.log("\n✅ CHECKOUT SUCCESS!");
    console.log("  Order Number:", data.publicOrderNumber);
    console.log("  Payment Method:", data.paymentMethod);
    console.log("  Subtotal:", data.subtotal);
    console.log("  Shipping:", data.shippingFee);
    console.log("  Total:", data.total);

    // Verify order in Supabase
    const serviceKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    const serviceKey = serviceKeyMatch ? serviceKeyMatch[1].trim() : "";
    const supabaseService = createClient(url, serviceKey, { auth: { persistSession: false } });

    const { data: orders } = await supabaseService
      .from("orders")
      .select("id, public_order_number, status, payment_method, total")
      .eq("public_order_number", data.publicOrderNumber);

    console.log("\n  Supabase order record:", JSON.stringify(orders?.[0], null, 2));

    // Cleanup test order
    if (orders?.[0]?.id) {
      await supabaseService.from("orders").delete().eq("id", orders[0].id);
      console.log("\n  Cleaned up test order.");
    }
  } else {
    console.error("\n❌ CHECKOUT FAILED!");
    console.error("  HTTP Status:", res.status);
    console.error("  Error:", JSON.stringify(data, null, 2));
  }
}

run().catch(console.error);
