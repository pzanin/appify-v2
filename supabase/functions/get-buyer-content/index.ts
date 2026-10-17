import { createClient } from 'npm:@supabase/supabase-js@2.105.4';
import { createBuyerContentHandler } from './handler.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const secretKeysText = Deno.env.get('SUPABASE_SECRET_KEYS');
const publishableKeysText = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

function defaultKey(value: string | undefined, legacy: string | undefined) {
  if (value) {
    try {
      const keys = JSON.parse(value) as Record<string, string>;
      if (typeof keys.default === 'string') return keys.default;
    } catch { /* Use the legacy environment key when available. */ }
  }
  return legacy;
}

const backendKey = defaultKey(secretKeysText, serviceRoleKey);
const publicKey = defaultKey(publishableKeysText, anonKey);
if (!supabaseUrl || !backendKey || !publicKey) {
  throw new Error('Supabase function configuration is incomplete');
}

const authClient = createClient(supabaseUrl, publicKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const adminClient = createClient(supabaseUrl, backendKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

Deno.serve(createBuyerContentHandler({
  async verifiedEmail(accessToken) {
    const { data, error } = await authClient.auth.getUser(accessToken);
    if (error || !data.user || !(data.user.email_confirmed_at || data.user.confirmed_at)) return null;
    return data.user.email ?? null;
  },
  async hasActiveEntitlement(productId, normalizedEmail) {
    const { data, error } = await adminClient.rpc('appify_has_active_entitlement', {
      p_product_id: productId,
      p_email_normalized: normalizedEmail,
    });
    if (error) throw new Error('Entitlement lookup failed');
    return data === true;
  },
  async createSignedContentUrl(productId, expiresInSeconds) {
    const objectPath = `products/${productId.toLowerCase()}/protected-content.zip`;
    const { data, error } = await adminClient.storage
      .from('appify-protected-products')
      .createSignedUrl(objectPath, expiresInSeconds);
    if (error || !data?.signedUrl) throw new Error('Protected product content unavailable');
    return data.signedUrl;
  },
}));
