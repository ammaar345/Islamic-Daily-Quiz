import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client. Only created when env vars are present.
 * Until then the app runs in demo mode (local progress via store).
 *
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in `.env.local`
 * to enable real auth + server-persisted progress.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient(url, anon) : null;
export const isSupabaseConfigured = Boolean(url && anon);
