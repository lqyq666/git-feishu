import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./env";
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY_NOT_CONFIGURED");
  return createClient(getSupabasePublicConfig().url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
