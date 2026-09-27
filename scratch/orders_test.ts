import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const key = keyMatch ? keyMatch[1].trim() : "";

const supabase = createClient(url, key);

async function run() {
  const VALID_STATUSES = [
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED"
  ];
  
  let query = supabase.from("orders").select("id, status");
  query = query.in("status", VALID_STATUSES);

  const { data, error } = await query;
  console.log("Error:", error);
  console.log("Count with in():", data?.length);
  
  const { data: allData } = await supabase.from("orders").select("status");
  console.log("Total Count without in():", allData?.length);
  
  // Try eq chaining? Wait, we can't chain eq for ORs.
  // Maybe in() expects a string in supabase-js? No, it expects an array.
}
run();
