export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "",
};

export const hasSupabaseConfig =
  supabaseConfig.url.length > 0 && supabaseConfig.anonKey.length > 0;
