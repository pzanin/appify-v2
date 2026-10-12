import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_PWA_CONFIG } from '../constants';
import { customerAuthIsEnabled, getCustomerAuthClient, requestCustomerOtp, verifyCustomerOtp } from './customerAuth';

const publicKey = 'sb_publishable_abcdefghijklmnopqrstuvwxyz123456';
const config = {
  ...INITIAL_PWA_CONFIG,
  appName: 'Produto Teste',
  productId: 'product-test',
  backendProvider: 'supabase' as const,
  customerAuthEnabled: true,
  supabaseUrl: 'https://demo.supabase.co',
  supabasePublishableKey: publicKey,
};

test('customer auth is opt-in and requires Supabase backend', () => {
  assert.equal(customerAuthIsEnabled(INITIAL_PWA_CONFIG), false);
  assert.equal(customerAuthIsEnabled({ ...config, customerAuthEnabled: false }), false);
  assert.equal(customerAuthIsEnabled({ ...config, backendProvider: 'none' }), false);
  assert.equal(customerAuthIsEnabled(config), true);
});

test('email OTP request never auto-creates unknown users', async t => {
  const client = getCustomerAuthClient(config)!;
  let captured: any = null;
  t.mock.method(client.auth, 'signInWithOtp', async options => {
    captured = options;
    return { data: { user: null, session: null }, error: null } as any;
  });
  const result = await requestCustomerOtp(config, ' Buyer@Example.com ');
  assert.equal(result.ok, true);
  assert.equal(captured.email, 'buyer@example.com');
  assert.equal(captured.options.shouldCreateUser, false);
});

test('OTP verification returns a session only after successful verification', async t => {
  const client = getCustomerAuthClient(config)!;
  const session = { user: { id: 'user-1' } } as any;
  let captured: any = null;
  t.mock.method(client.auth, 'verifyOtp', async options => {
    captured = options;
    return { data: { user: session.user, session }, error: null } as any;
  });
  const result = await verifyCustomerOtp(config, 'buyer@example.com', '123456');
  assert.equal(result.ok, true);
  assert.equal(result.session, session);
  assert.equal(captured.type, 'email');
  assert.equal(captured.token, '123456');
});
