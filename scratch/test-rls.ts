import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase.rpc("exec_sql", { query: "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('inventory', 'products');" });
  if (error) {
    console.log("RPC Error, trying via query...");
  }
  console.log("Data:", data);
}

main();
