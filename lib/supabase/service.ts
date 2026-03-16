import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with service role key. Use only on the server (e.g. API routes).
 * Bypasses RLS; never expose this client to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceRoleKey);
}
