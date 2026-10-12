import { describe, expect, it } from 'vitest';
import { accessStartStorageKey, evaluateAccessRule, getOrCreateAccessStartedAt } from './accessRules';

describe('access rules', () => {
  it('allows immediate content', () => {
    expect(evaluateAccessRule({ releaseType: 'immediate' }, 1000, 1000).allowed).toBe(true);
  });

  it('locks drip content until its release date', () => {
    const day = 24 * 60 * 60 * 1000;
    const result = evaluateAccessRule({ releaseType: 'drip', dripDays: 3 }, 1000, 1000 + day);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('drip');
    expect(result.remainingDays).toBe(2);
  });

  it('releases drip content when the interval is complete', () => {
    const day = 24 * 60 * 60 * 1000;
    expect(evaluateAccessRule({ releaseType: 'drip', dripDays: 3 }, 1000, 1000 + 3 * day).allowed).toBe(true);
  });

  it('treats zero-day drip as immediately available', () => {
    expect(evaluateAccessRule({ releaseType: 'drip', dripDays: 0 }, 1000, 1000).allowed).toBe(true);
  });

  it('blocks upsell and legacy locked content', () => {
    expect(evaluateAccessRule({ releaseType: 'upsell' }, 1000, 1000).reason).toBe('upsell');
    expect(evaluateAccessRule({ releaseType: 'locked' }, 1000, 1000).reason).toBe('upsell');
  });

  it('persists the first access timestamp once per product', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    expect(getOrCreateAccessStartedAt('product-a', 1, 1000, storage)).toBe(1000);
    expect(getOrCreateAccessStartedAt('product-a', 1, 9000, storage)).toBe(1000);
    expect(values.get(accessStartStorageKey('product-a', 1))).toBe('1000');
  });
});
