import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { PwaConfig } from '../types';
import { normalizeSupabaseProjectUrl, validateSupabasePublicConfig } from '../utils/supabaseConfig';

export interface CustomerAuthResult {
  ok: boolean;
  message?: string;
  session?: Session | null;
}

const clients = new Map<string, SupabaseClient>();

export function customerAuthIsEnabled(config: PwaConfig) {
  return config.backendProvider === 'supabase' && config.customerAuthEnabled === true;
}

export function getCustomerAuthClient(config: PwaConfig): SupabaseClient | null {
  if (!customerAuthIsEnabled(config)) return null;
  const url = normalizeSupabaseProjectUrl(config.supabaseUrl || '');
  const key = (config.supabasePublishableKey || config.supabaseAnonKey || '').trim();
  if (!url || validateSupabasePublicConfig(url, key)) return null;

  const storageScope = (config.productId || config.appName || 'product').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cacheKey = `${url}:${storageScope}`;
  const existing = clients.get(cacheKey);
  if (existing) return existing;

  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: `appify-auth-${storageScope}`,
    },
  });
  clients.set(cacheKey, client);
  return client;
}

export async function readCustomerSession(config: PwaConfig): Promise<CustomerAuthResult> {
  const client = getCustomerAuthClient(config);
  if (!client) return { ok: false, message: 'auth_unavailable', session: null };
  try {
    const { data, error } = await client.auth.getSession();
    if (error) return { ok: false, message: 'session_error', session: null };
    return { ok: true, session: data.session };
  } catch {
    return { ok: false, message: 'session_error', session: null };
  }
}

export async function requestCustomerOtp(config: PwaConfig, email: string): Promise<CustomerAuthResult> {
  const client = getCustomerAuthClient(config);
  const normalizedEmail = email.trim().toLowerCase();
  if (!client || !normalizedEmail) return { ok: false, message: 'request_error' };
  try {
    const { error } = await client.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: false },
    });
    return error ? { ok: false, message: 'request_error' } : { ok: true };
  } catch {
    return { ok: false, message: 'request_error' };
  }
}

export async function verifyCustomerOtp(config: PwaConfig, email: string, token: string): Promise<CustomerAuthResult> {
  const client = getCustomerAuthClient(config);
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedToken = token.replace(/\D/g, '').slice(0, 8);
  if (!client || !normalizedEmail || normalizedToken.length < 6) return { ok: false, message: 'verify_error' };
  try {
    const { data, error } = await client.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: 'email',
    });
    if (error || !data.session) return { ok: false, message: 'verify_error', session: null };
    return { ok: true, session: data.session };
  } catch {
    return { ok: false, message: 'verify_error', session: null };
  }
}

export async function signOutCustomer(config: PwaConfig): Promise<boolean> {
  const client = getCustomerAuthClient(config);
  if (!client) return false;
  try {
    const { error } = await client.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}
