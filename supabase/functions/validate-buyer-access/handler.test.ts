import assert from 'node:assert/strict';
import test from 'node:test';
import { createBuyerAccessHandler, normalizeBuyerEmail } from './handler.ts';

const productId = '2ae26932-ade3-4a2d-9f36-f55d00c057fc';
const token = 'a'.repeat(32);
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://example.supabase.co/functions/v1/validate-buyer-access', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

test('normalizes only the authenticated email value', () => {
  assert.equal(normalizeBuyerEmail('  Buyer@Example.COM '), 'buyer@example.com');
});

test('allows an active entitlement for the verified account email', async () => {
  let received: unknown[] = [];
  const handler = createBuyerAccessHandler({
    async verifiedEmail(receivedToken) { assert.equal(receivedToken, token); return ' Buyer@Example.COM '; },
    async hasActiveEntitlement(id, email) { received = [id, email]; return true; },
  });
  const response = await handler(request({ productId }));
  assert.equal(response.status, 200);
  assert.deepEqual(received, [productId, 'buyer@example.com']);
  assert.deepEqual(await response.json(), { hasAccess: true });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('returns no access for missing or revoked entitlement', async () => {
  const handler = createBuyerAccessHandler({
    async verifiedEmail() { return 'buyer@example.com'; },
    async hasActiveEntitlement() { return false; },
  });
  const response = await handler(request({ productId }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { hasAccess: false });
});

test('rejects unverified identities without looking up entitlements', async () => {
  let lookedUp = false;
  const handler = createBuyerAccessHandler({
    async verifiedEmail() { return null; },
    async hasActiveEntitlement() { lookedUp = true; return true; },
  });
  assert.equal((await handler(request({ productId }))).status, 401);
  assert.equal(lookedUp, false);
});

test('rejects malformed requests and missing bearer sessions', async () => {
  const handler = createBuyerAccessHandler({
    async verifiedEmail() { throw new Error('must not reach auth'); },
    async hasActiveEntitlement() { throw new Error('must not reach database'); },
  });
  assert.equal((await handler(request({ productId, email: 'spoof@example.com' }))).status, 400);
  assert.equal((await handler(request({ productId: 'not-a-uuid' }))).status, 400);
  const noToken = new Request('https://example.supabase.co/functions/v1/validate-buyer-access', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productId }),
  });
  assert.equal((await handler(noToken)).status, 401);
});

test('fails closed and hides backend errors', async () => {
  const handler = createBuyerAccessHandler({
    async verifiedEmail() { return 'buyer@example.com'; },
    async hasActiveEntitlement() { throw new Error('SQL details must stay private'); },
  });
  const response = await handler(request({ productId }));
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'access_unavailable' });
});

test('handles CORS preflight without cookies or credentialed CORS', async () => {
  const handler = createBuyerAccessHandler({
    async verifiedEmail() { return null; },
    async hasActiveEntitlement() { return false; },
  });
  const preflight = new Request('https://example.supabase.co/functions/v1/validate-buyer-access', {
    method: 'OPTIONS', headers: { origin: 'https://buyer.example', 'access-control-request-method': 'POST' },
  });
  const response = await handler(preflight);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://buyer.example');
  assert.match(response.headers.get('access-control-allow-headers') || '', /x-client-info/);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});
