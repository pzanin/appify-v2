import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';
import { clearCustomerProfile, customerEntryStorageKey, customerProfileStorageKey, customerStorageScope, readCustomerProfile, resetCustomerProductData, writeCustomerProfile } from './customerStorage';
import { progressStorageKey } from './lessonProgress';
import { activityStorageKey } from './activityStorage';

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

test('published customer data is scoped by authenticated buyer without using the profile email', () => {
  storage.clear();
  const config = { ...INITIAL_PWA_CONFIG, productId: 'shared-product' };
  const buyerOne = customerProfileStorageKey(config, false, null, 'auth-user-one');
  const buyerTwo = customerProfileStorageKey(config, false, null, 'auth-user-two');
  const buyerOneProgress = progressStorageKey(config, false, null, 'auth-user-one');
  const buyerTwoProgress = progressStorageKey(config, false, null, 'auth-user-two');
  const buyerOneActivity = activityStorageKey(config, false, null, 4, 9, 'auth-user-one');
  const buyerTwoActivity = activityStorageKey(config, false, null, 4, 9, 'auth-user-two');

  assert.notEqual(buyerOne, buyerTwo);
  assert.notEqual(buyerOneProgress, buyerTwoProgress);
  assert.notEqual(buyerOneActivity, buyerTwoActivity);
  writeCustomerProfile(storage, buyerOne, { name: 'Buyer One', email: 'profile-contact@example.com' });
  assert.equal(readCustomerProfile(storage, buyerTwo).name, '');
  assert.match(buyerOne, /auth-user-one/);
  assert.doesNotMatch(buyerOne, /profile-contact@example\.com/);
});

test('desktop preview identity stays stable even when a legacy project receives a regenerated product id', () => {
  const before = { ...INITIAL_PWA_CONFIG, appName: 'Legacy project', productId: 'generated-a' };
  const after = { ...before, productId: 'generated-b' };
  assert.equal(customerProfileStorageKey(before, true, 123), customerProfileStorageKey(after, true, 123));
  assert.notEqual(customerProfileStorageKey(before, false, null), customerProfileStorageKey(after, false, null));
});

test('preview progress and activities share the same project scope used by reset', () => {
  storage.clear();
  const config = { ...INITIAL_PWA_CONFIG, appName: 'Preview', productId: 'generated-a' };
  const changed = { ...config, productId: 'generated-b' };
  const projectId = 77;
  const scope = customerStorageScope(config, true, projectId);
  const progress = progressStorageKey(config, true, projectId);
  const activity = activityStorageKey(config, true, projectId, 1, 2);
  assert.equal(progress, `appify-lesson-progress:v1:${scope}`);
  assert.equal(progress, progressStorageKey(changed, true, projectId));
  assert.equal(activity, `appify-activity:v1:${scope}:1:2`);
  storage.setItem(customerProfileStorageKey(config, true, projectId), '{}');
  storage.setItem(customerEntryStorageKey(config, true, projectId), 'done');
  storage.setItem(progress, '{}');
  storage.setItem(activity, '{}');
  assert.equal(resetCustomerProductData(storage, config, true, projectId), 4);
  assert.equal(storage.getItem(customerProfileStorageKey(config, true, projectId)), null);
  assert.equal(storage.getItem(customerEntryStorageKey(config, true, projectId)), null);
  assert.equal(storage.getItem(progress), null);
  assert.equal(storage.getItem(activity), null);
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

test('reset removes only runtime data for the selected product and mode', () => {
  storage.clear();
  const config = { ...INITIAL_PWA_CONFIG, productId: 'reset-product' };
  const other = { ...INITIAL_PWA_CONFIG, productId: 'other-product' };
  const scope = customerStorageScope(config, false, null);
  storage.setItem(customerProfileStorageKey(config, false, null), '{}');
  storage.setItem(customerEntryStorageKey(config, false, null), 'done');
  storage.setItem(`appify-lesson-progress:v1:${scope}`, '{}');
  storage.setItem(`appify-activity:v1:${scope}:1:2`, '{}');
  storage.setItem(customerProfileStorageKey(config, true, 7), '{}');
  storage.setItem(customerProfileStorageKey(other, false, null), '{}');

  assert.equal(resetCustomerProductData(storage, config, false, null), 4);
  assert.equal(storage.getItem(customerProfileStorageKey(config, false, null)), null);
  assert.equal(storage.getItem(customerEntryStorageKey(config, false, null)), null);
  assert.equal(storage.getItem(`appify-lesson-progress:v1:${scope}`), null);
  assert.equal(storage.getItem(`appify-activity:v1:${scope}:1:2`), null);
  assert.notEqual(storage.getItem(customerProfileStorageKey(config, true, 7)), null);
  assert.notEqual(storage.getItem(customerProfileStorageKey(other, false, null)), null);
});
