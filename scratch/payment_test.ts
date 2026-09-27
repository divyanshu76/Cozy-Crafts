import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const key = keyMatch ? keyMatch[1].trim() : "";

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from("orders").select("payment_method");
  console.log("Error:", error);
  const unique = Array.from(new Set(data?.map(d => d.payment_method)));
  console.log("Unique payment methods:", unique);
}
run();
