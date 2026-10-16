import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';
import { clearCustomerProfile, customerProfileStorageKey, readCustomerProfile, writeCustomerProfile } from './customerStorage';

const dom = new JSDOM('', { url: 'https://appify.test/' });
const storage = dom.window.localStorage;

test('customer profile is isolated by product identity and preview mode', () => {
  storage.clear();
  const first = { ...INITIAL_PWA_CONFIG, appName: 'One', productId: 'product-one' };
  const second = { ...INITIAL_PWA_CONFIG, appName: 'Two', productId: 'product-two' };
  const firstCustomerKey = customerProfileStorageKey(first, false, null);
  const firstPreviewKey = customerProfileStorageKey(first, true, 42);
  const secondCustomerKey = customerProfileStorageKey(second, false, null);
  assert.notEqual(firstCustomerKey, firstPreviewKey);
  assert.notEqual(firstCustomerKey, secondCustomerKey);

  writeCustomerProfile(storage, firstCustomerKey, { name: 'Paulo', email: 'paulo@example.com' });
  assert.equal(readCustomerProfile(storage, firstCustomerKey).name, 'Paulo');
  assert.equal(readCustomerProfile(storage, secondCustomerKey).name, '');
});

test('customer profile survives reload-like reads and trims bounded fields', () => {
  storage.clear();
  const config = { ...INITIAL_PWA_CONFIG, productId: 'persistent-product' };
  const key = customerProfileStorageKey(config, false, null);
  const saved = writeCustomerProfile(storage, key, { name: '  Jane Doe  ', email: '  jane@example.com  ' });
  assert.equal(saved.name, 'Jane Doe');
  assert.equal(saved.email, 'jane@example.com');
  assert.ok(saved.updatedAt > 0);
  assert.deepEqual(readCustomerProfile(storage, key), saved);
});

test('invalid storage content fails closed and profile can be cleared', () => {
  storage.clear();
  const config = { ...INITIAL_PWA_CONFIG, productId: 'safe-product' };
  const key = customerProfileStorageKey(config, false, null);
  storage.setItem(key, '{broken');
  assert.deepEqual(readCustomerProfile(storage, key), { name: '', email: '', updatedAt: 0 });
  writeCustomerProfile(storage, key, { name: 'A', email: 'a@example.com' });
  clearCustomerProfile(storage, key);
  assert.equal(storage.getItem(key), null);
});
