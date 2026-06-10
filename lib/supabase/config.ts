export function isSupabaseConfigured() {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.STORAGE_SUPABASE_URL) &&
      (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.STORAGE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.STORAGE_SUPABASE_ANON_KEY),
  );
}

export function getSupabaseUrl() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.STORAGE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL or STORAGE_SUPABASE_URL is not configured.",
    );
  }

  return supabaseUrl;
}

export function getSupabasePublishableKey() {
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.STORAGE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.STORAGE_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, STORAGE_SUPABASE_PUBLISHABLE_KEY, or STORAGE_SUPABASE_ANON_KEY is not configured.",
    );
  }

  return supabaseKey;
}

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
    return vercelUrl.startsWith("http")
      ? vercelUrl.replace(/\/$/, "")
      : `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}
