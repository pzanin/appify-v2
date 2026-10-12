import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { accessStartStorageKey, evaluateAccessRule, getOrCreateAccessStartedAt } from './accessRules';

describe('access rules', () => {
  it('allows immediate content', () => {
    assert.equal(evaluateAccessRule({ releaseType: 'immediate' }, 1000, 1000).allowed, true);
  });

  it('locks drip content until its release date', () => {
    const day = 24 * 60 * 60 * 1000;
    const result = evaluateAccessRule({ releaseType: 'drip', dripDays: 3 }, 1000, 1000 + day);
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'drip');
    assert.equal(result.remainingDays, 2);
  });

  it('releases drip content when the interval is complete', () => {
    const day = 24 * 60 * 60 * 1000;
    assert.equal(evaluateAccessRule({ releaseType: 'drip', dripDays: 3 }, 1000, 1000 + 3 * day).allowed, true);
  });

  it('treats zero-day drip as immediately available', () => {
    assert.equal(evaluateAccessRule({ releaseType: 'drip', dripDays: 0 }, 1000, 1000).allowed, true);
  });

  it('blocks upsell and legacy locked content', () => {
    assert.equal(evaluateAccessRule({ releaseType: 'upsell' }, 1000, 1000).reason, 'upsell');
    assert.equal(evaluateAccessRule({ releaseType: 'locked' }, 1000, 1000).reason, 'upsell');
  });

  it('persists the first access timestamp once per product', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    assert.equal(getOrCreateAccessStartedAt('product-a', 1, 1000, storage), 1000);
    assert.equal(getOrCreateAccessStartedAt('product-a', 1, 9000, storage), 1000);
    assert.equal(values.get(accessStartStorageKey('product-a', 1)), '1000');
  });
});
