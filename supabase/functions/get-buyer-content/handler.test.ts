import assert from 'node:assert/strict';
import test from 'node:test';
import { createBuyerContentHandler } from './handler.ts';

const productId = '2ae26932-ade3-4a2d-9f36-f55d00c057fc';
const token = 'a'.repeat(32);
const makeRequest = (body: unknown, authorization = `Bearer ${token}`) => new Request(
  'https://example.supabase.co/functions/v1/get-buyer-content',
  { method: 'POST', headers: { authorization, 'content-type': 'application/json' }, body: JSON.stringify(body) },
);

test('issues a short-lived URL only after the verified email has entitlement', async () => {
  const calls: unknown[] = [];
  const handler = createBuyerContentHandler({
    async verifiedEmail(receivedToken) { assert.equal(receivedToken, token); return ' Buyer@Example.COM '; },
    async hasActiveEntitlement(id, email) { calls.push([id, email]); return true; },
    async createSignedContentUrl(id, ttl) { calls.push([id, ttl]); return 'https://storage.example/signed-content'; },
  });
  const response = await handler(makeRequest({ productId }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { url: 'https://storage.example/signed-content', expiresIn: 120 });
  assert.deepEqual(calls, [[productId, 'buyer@example.com'], [productId, 120]]);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('does not sign content when the product is not entitled', async () => {
  let signed = false;
  const handler = createBuyerContentHandler({
    async verifiedEmail() { return 'buyer@example.com'; },
    async hasActiveEntitlement() { return false; },
    async createSignedContentUrl() { signed = true; return 'https://storage.example/signed-content'; },
  });
  assert.equal((await handler(makeRequest({ productId }))).status, 403);
  assert.equal(signed, false);
});

test('rejects unverified email, invalid product IDs and absent sessions', async () => {
  const handler = createBuyerContentHandler({
    async verifiedEmail() { return null; },
    async hasActiveEntitlement() { throw new Error('must not reach lookup'); },
    async createSignedContentUrl() { throw new Error('must not sign'); },
  });
  assert.equal((await handler(makeRequest({ productId }))).status, 401);
  assert.equal((await handler(makeRequest({ productId: 'wrong' }))).status, 400);
  assert.equal((await handler(makeRequest({ productId }, ''))).status, 401);
});

test('fails closed and hides signing or backend failures', async () => {
  const handler = createBuyerContentHandler({
    async verifiedEmail() { return 'buyer@example.com'; },
    async hasActiveEntitlement() { return true; },
    async createSignedContentUrl() { throw new Error('private storage error'); },
  });
  const response = await handler(makeRequest({ productId }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'content_unavailable' });
});

test('CORS permits Supabase client headers without credentialed requests', async () => {
  const handler = createBuyerContentHandler({
    async verifiedEmail() { return null; },
    async hasActiveEntitlement() { return false; },
    async createSignedContentUrl() { throw new Error('must not be called'); },
  });
  const response = await handler(new Request('https://example.supabase.co/functions/v1/get-buyer-content', {
    method: 'OPTIONS', headers: { origin: 'https://buyer.example', 'access-control-request-method': 'POST' },
  }));
  assert.equal(response.status, 204);
  assert.match(response.headers.get('access-control-allow-headers') || '', /x-client-info/);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});
