import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client — SERVER ONLY.
 * Bypasses RLS. Never import in "use client" files or expose to the browser.
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key) {
    const errorMsg = `Supabase credentials missing on server (url_present: ${!!url}, service_role_key_present: ${!!key}). Verify NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables.`;
    console.error("[supabase/server]", errorMsg);
    throw new Error(errorMsg);
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

