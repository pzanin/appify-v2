import assert from 'node:assert/strict';
import test from 'node:test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createBuyerAccessClient, fetchEntitledContent, requestBuyerEmailCode, verifyBuyerEmailCode } from './buyerAccess';
import { createProtectedContentPackage } from '../utils/protectedContentPackage';

const productId = '2ae26932-ade3-4a2d-9f36-f55d00c057fc';
const supabaseUrl = 'https://opuemkiihsqrhfysqdcw.supabase.co';

test('buyer client rejects non-HTTPS and non-Supabase endpoints', () => {
  for (const url of ['http://opuemkiihsqrhfysqdcw.supabase.co', 'https://evil.example', 'https://opuemkiihsqrhfysqdcw.supabase.co/path']) {
    assert.equal(createBuyerAccessClient({ productId, supabaseUrl: url, supabaseAnonKey: 'sb_publishable_example' }), null);
  }
  assert.ok(createBuyerAccessClient({ productId, supabaseUrl, supabaseAnonKey: 'sb_publishable_example' }));
});

test('email OTP normalizes the purchase email and requires an 6–8 digit code', async () => {
  const calls: unknown[] = [];
  const client = { auth: {
    async signInWithOtp(input: unknown) { calls.push(['send', input]); return { error: null }; },
    async verifyOtp(input: unknown) { calls.push(['verify', input]); return { data: { user: { id: 'buyer-user-id' } }, error: null }; },
  } } as unknown as SupabaseClient;
  await requestBuyerEmailCode(client, ' Buyer@Example.com ');
  assert.equal(await verifyBuyerEmailCode(client, ' Buyer@Example.com ', '123 456'), 'buyer-user-id');
  assert.deepEqual(calls[0], ['send', { email: 'buyer@example.com', options: { shouldCreateUser: true } }]);
  assert.deepEqual(calls[1], ['verify', { email: 'buyer@example.com', token: '123456', type: 'email' }]);
  await assert.rejects(verifyBuyerEmailCode(client, 'buyer@example.com', 'bad'), /invalid_code/);
});

test('protected download requires server entitlement and a product-scoped Supabase signed URL', async () => {
  const archive = await createProtectedContentPackage({ productId, version: '1.0.0', language: 'en-US', modules: [], feedPosts: [], pushNotifications: [], async readAudio() { return new Uint8Array(); }, async readMaterial() { return new Uint8Array(); } });
  const calls: string[] = [];
  const client = { functions: { async invoke(name: string) {
    calls.push(name);
    return name === 'validate-buyer-access'
      ? { data: { hasAccess: true }, error: null }
      : { data: { url: `${supabaseUrl}/storage/v1/object/sign/appify-protected-products/products/${productId}/protected-content.zip?token=signed-token`, expiresIn: 120 }, error: null };
  } } };
  let requested = '';
  const loaded = await fetchEntitledContent(client, { productId, supabaseUrl, supabaseAnonKey: 'sb_publishable_test' }, async (input, init) => {
    requested = String(input);assert.equal(init?.credentials, 'omit');return new Response(archive);
  });
  assert.deepEqual(calls, ['validate-buyer-access', 'get-buyer-content']);
  assert.match(requested, /protected-content\.zip\?token=signed-token$/);
  assert.equal(loaded.productId, productId);

  const denied = { functions: { async invoke(name: string) { return name === 'validate-buyer-access' ? { data: { hasAccess: false }, error: null } : { data: null, error: null }; } } };
  await assert.rejects(fetchEntitledContent(denied, { productId, supabaseUrl, supabaseAnonKey: 'public' }, async () => { throw new Error('must not download'); }), /access_denied/);
});

test('protected package signed URL rejects another host even after entitlement response', async () => {
  const client = { functions: { async invoke(name: string) {
    return name === 'validate-buyer-access' ? { data: { hasAccess: true }, error: null }
      : { data: { url: `https://attacker.example/storage/v1/object/sign/appify-protected-products/products/${productId}/protected-content.zip?token=x` }, error: null };
  } } };
  await assert.rejects(fetchEntitledContent(client, { productId, supabaseUrl, supabaseAnonKey: 'public' }), /content_unavailable/);
});
