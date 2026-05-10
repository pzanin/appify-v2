import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define values from environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/**
 * Singleton client for general app persistence
 */
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

/**
 * Factory function for testing or specific configurations (used in PublicationHub)
 */
export function getSupabaseClient(url: string, anonKey: string) {
  if (!url || !anonKey) return null;
  
  // If credentials match the singleton, return it
  if (url === supabaseUrl && anonKey === supabaseAnonKey) return supabase;

  // Otherwise create a temporary client (e.g. for testing connection with different credentials)
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    }
  });
}

/**
 * Resets the cached connection (not strictly needed but kept for compatibility)
 */
export function resetClient() {
  // No-op for the singleton exported above, but matches the interface expected by consumers
}
