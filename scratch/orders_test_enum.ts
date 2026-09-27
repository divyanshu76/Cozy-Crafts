import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const url = urlMatch ? urlMatch[1].trim() : "";
const key = keyMatch ? keyMatch[1].trim() : "";

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .rpc('get_enum_values', { enum_name: 'order_status' });
    
  if (error) {
     const { data: qData, error: qError } = await supabase.from('orders').select('status').limit(1);
     console.log("Try checking if we can see any order status:", qError);
  }
}
run();
