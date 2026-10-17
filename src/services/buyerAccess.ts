import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { LoadedProtectedContent } from '../utils/protectedContentRuntime';
import { parseProtectedContentPackage } from '../utils/protectedContentRuntime';

export interface BuyerAccessConfig {
  productId: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createBuyerAccessClient(config: BuyerAccessConfig): SupabaseClient | null {
  try {
    const url = new URL(config.supabaseUrl);
    if (!PRODUCT_ID.test(config.productId) || url.protocol !== 'https:' || !/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname)
      || url.pathname !== '/' || url.search || url.hash || !config.supabaseAnonKey.trim()) return null;
    return createClient(url.origin, config.supabaseAnonKey.trim(), {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce', storageKey: `appify-buyer-session:${config.productId}` },
      global: { headers: { 'X-Client-Info': 'appify-buyer-access' } },
    });
  } catch {
    return null;
  }
}

export async function requestBuyerEmailCode(client: SupabaseClient, email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('invalid_email');
  const { error } = await client.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: true } });
  if (error) throw new Error('email_unavailable');
}

export async function verifyBuyerEmailCode(client: SupabaseClient, email: string, token: string): Promise<string> {
  const normalized = email.trim().toLowerCase();
  const code = token.replace(/\s/g, '');
  if (!/^[0-9]{6,8}$/.test(code)) throw new Error('invalid_code');
  const { data, error } = await client.auth.verifyOtp({ email: normalized, token: code, type: 'email' });
  if (error || !data.user?.id) throw new Error('verification_unavailable');
  return data.user.id;
}

interface EdgeFunctionClient {
  functions: { invoke(name: string, options: { body: { productId: string } }): Promise<{ data: unknown; error: unknown }> };
}

export async function checkBuyerEntitlement(client: EdgeFunctionClient, productId: string): Promise<boolean> {
  const result = await client.functions.invoke('validate-buyer-access', { body: { productId } });
  if (result.error || !result.data || typeof result.data !== 'object') throw new Error('access_unavailable');
  return (result.data as Record<string, unknown>).hasAccess === true;
}

export async function fetchEntitledContent(client: EdgeFunctionClient, config: BuyerAccessConfig, fetcher: typeof fetch = fetch): Promise<LoadedProtectedContent> {
  if (!await checkBuyerEntitlement(client, config.productId)) throw new Error('access_denied');

  const result = await client.functions.invoke('get-buyer-content', { body: { productId: config.productId } });
  const urlValue = result.data && typeof result.data === 'object' ? (result.data as Record<string, unknown>).url : null;
  if (result.error || typeof urlValue !== 'string') throw new Error('content_unavailable');
  let contentUrl: URL;
  let baseUrl: URL;
  try {
    baseUrl = new URL(config.supabaseUrl);
    contentUrl = new URL(urlValue);
  } catch {
    throw new Error('content_unavailable');
  }
  const expectedPath = `/storage/v1/object/sign/appify-protected-products/products/${config.productId.toLowerCase()}/protected-content.zip`;
  if (contentUrl.protocol !== 'https:' || contentUrl.origin !== baseUrl.origin || contentUrl.pathname !== expectedPath
    || !contentUrl.searchParams.has('token') || [...contentUrl.searchParams.keys()].some(key => !['token','download'].includes(key))) {
    throw new Error('content_unavailable');
  }
  const response = await fetcher(contentUrl.href, { method: 'GET', cache: 'no-store', credentials: 'omit', redirect: 'error' });
  if (!response.ok) throw new Error('content_unavailable');
  const blob = await response.blob();
  return parseProtectedContentPackage(blob, config.productId);
}
