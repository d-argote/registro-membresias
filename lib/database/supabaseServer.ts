import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client for server-side use.
 * Uses the service role key to bypass RLS when available,
 * otherwise falls back to the anon key.
 * Must only be called from Server Actions or API routes.
 */
export function getServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        ...(process.env.SUPABASE_SERVICE_ROLE_KEY
          ? {}
          : { "x-client-info": "server-action" }),
      },
    },
  });
}
