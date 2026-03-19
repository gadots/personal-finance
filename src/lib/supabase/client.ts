import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseConfig, supabaseConfig } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  if (!hasSupabaseConfig) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
}
