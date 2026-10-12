import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Legacy environment support remains for older development setups.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabasePublishableKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY
  || (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Singleton client for general app persistence.
 * Only a public/publishable key may be used in browser code.
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabasePublishableKey || 'placeholder'
);

/**
 * Factory function for testing or specific public configurations.
 */
export function getSupabaseClient(url: string, publishableKey: string) {
  if (!url || !publishableKey) return null;

  // If credentials match the singleton, return it.
  if (url === supabaseUrl && publishableKey === supabasePublishableKey) return supabase;

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}

/**
 * Resets the cached connection (kept for compatibility).
 */
export function resetClient() {
  client = null;
}
