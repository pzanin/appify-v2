export type AccessReleaseType = 'immediate' | 'drip' | 'locked' | 'upsell' | 'points';

export interface AccessRuleTarget {
  releaseType?: AccessReleaseType;
  dripDays?: number;
  checkoutUrl?: string | number;
  requiredPoints?: number;
}

export type AccessReason = 'allowed' | 'drip' | 'upsell' | 'points';

export interface AccessDecision {
  allowed: boolean;
  reason: AccessReason;
  unlockAt?: number;
  remainingDays?: number;
  requiredPoints?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function accessStartStorageKey(productId?: string, projectId?: number | null) {
  const scope = String(productId || projectId || 'preview').replace(/[^a-zA-Z0-9._:-]/g, '_');
  return `appify-access-start:${scope}`;
}

export function getOrCreateAccessStartedAt(
  productId?: string,
  projectId?: number | null,
  now = Date.now(),
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
) {
  const targetStorage = storage || (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return now;
  const key = accessStartStorageKey(productId, projectId);
  const existing = Number(targetStorage.getItem(key));
  if (Number.isFinite(existing) && existing > 0) return existing;
  targetStorage.setItem(key, String(now));
  return now;
}

export function evaluateAccessRule(
  target: AccessRuleTarget | null | undefined,
  accessStartedAt: number,
  now = Date.now(),
): AccessDecision {
  const releaseType = target?.releaseType || 'immediate';

  if (releaseType === 'immediate') return { allowed: true, reason: 'allowed' };

  if (releaseType === 'drip') {
    const days = Math.max(0, Math.floor(Number(target?.dripDays) || 0));
    const unlockAt = accessStartedAt + (days * DAY_MS);
    if (days === 0 || now >= unlockAt) return { allowed: true, reason: 'allowed', unlockAt, remainingDays: 0 };
    return {
      allowed: false,
      reason: 'drip',
      unlockAt,
      remainingDays: Math.max(1, Math.ceil((unlockAt - now) / DAY_MS)),
    };
  }

  if (releaseType === 'points') {
    return {
      allowed: false,
      reason: 'points',
      requiredPoints: Math.max(0, Math.floor(Number(target?.requiredPoints) || 0)),
    };
  }

  return { allowed: false, reason: 'upsell' };
}
