import { createClient } from "@supabase/supabase-js";

/**
 * Anon-key Supabase client — safe in browser ("use client") code.
 * Respects Row Level Security. Never use this to access orders/payments/etc.
 */
export const supabaseBrowserClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
