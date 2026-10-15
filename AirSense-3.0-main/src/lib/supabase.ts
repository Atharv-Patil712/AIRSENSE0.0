import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Auth and database features will not work.');
}

/**
 * createClient() throws "supabaseUrl is required." when handed undefined,
 * which crashed this module during import evaluation and left <div id="root">
 * empty — a blank white page before React could mount. Inert placeholder
 * credentials keep the client constructible without env vars; every network
 * call made through it fails gracefully into the existing demo-data
 * fallbacks. isSupabaseConfigured still reports whether real vars are set.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
