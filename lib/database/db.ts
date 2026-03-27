import { createClient } from "@supabase/supabase-js";

// Singleton Database connector for Models
let serverClient: any = null;

export function getDbClient() {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    serverClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { ...(process.env.SUPABASE_SERVICE_ROLE_KEY ? {} : { "x-client-info": "server-action" }) } }
    });
  }
  return serverClient;
}
