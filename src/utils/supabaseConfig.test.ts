import assert from 'node:assert/strict';
import test from 'node:test';
import { isForbiddenSupabaseSecret, isSupportedSupabasePublicKey, normalizeSupabaseProjectUrl, testSupabasePublicConnection, validateSupabasePublicConfig } from './supabaseConfig';

const publishable = 'sb_publishable_abcdefghijklmnopqrstuvwxyz123456';
const secret = 'sb_secret_abcdefghijklmnopqrstuvwxyz123456';

function jwt(payload: Record<string, unknown>) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

test('Supabase URL normalization accepts HTTPS origins and rejects unsafe values', () => {
  assert.equal(normalizeSupabaseProjectUrl(' https://demo.supabase.co/path '), 'https://demo.supabase.co');
  assert.equal(normalizeSupabaseProjectUrl('http://demo.supabase.co'), null);
  assert.equal(normalizeSupabaseProjectUrl('https://user:pass@demo.supabase.co'), null);
  assert.equal(normalizeSupabaseProjectUrl('not-a-url'), null);
});

test('public key validation accepts publishable and legacy anon keys but rejects privileged keys', () => {
  assert.equal(isSupportedSupabasePublicKey(publishable), true);
  assert.equal(isForbiddenSupabaseSecret(secret), true);
  const anon = jwt({ role: 'anon', iss: 'supabase' });
  const serviceRole = jwt({ role: 'service_role', iss: 'supabase' });
  assert.equal(isSupportedSupabasePublicKey(anon), true);
  assert.equal(isSupportedSupabasePublicKey(serviceRole), false);
  assert.equal(isForbiddenSupabaseSecret(serviceRole), true);
});

test('configuration validation blocks secret keys and incomplete public configuration', () => {
  assert.equal(validateSupabasePublicConfig('https://demo.supabase.co', publishable), null);
  assert.match(validateSupabasePublicConfig('', publishable) || '', /Project URL/);
  assert.match(validateSupabasePublicConfig('https://demo.supabase.co', secret) || '', /Secret Key/);
  assert.match(validateSupabasePublicConfig('https://demo.supabase.co', 'wrong') || '', /Publishable Key/);
});

test('connection test calls Auth settings with apikey and handles success and unauthorized responses', async t => {
  const requests: Array<{ url: string; key: string | null }> = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    requests.push({ url: String(input), key: headers.get('apikey') });
    return new Response('{}', { status: 200 });
  });
  assert.deepEqual(await testSupabasePublicConnection('https://demo.supabase.co', publishable), { ok: true, message: 'Conexão com o Supabase confirmada.' });
  assert.equal(requests[0].url, 'https://demo.supabase.co/auth/v1/settings');
  assert.equal(requests[0].key, publishable);
});
