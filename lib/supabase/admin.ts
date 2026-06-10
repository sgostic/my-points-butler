import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "./config";

/* Service-role Supabase client. Bypasses Row Level Security, so it must NEVER
   be imported into client components or edge/browser code (the service-role key
   has no NEXT_PUBLIC_ prefix and is read from process.env at request time).
   Used only by app/api/track (Node runtime) to write the locked-down analytics
   tables. */
export function createAdminClient() {
  return createSupabaseClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
