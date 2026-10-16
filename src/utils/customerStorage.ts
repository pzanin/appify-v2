import type { PwaConfig } from '../types';

export type CustomerProfile = {
  name: string;
  email: string;
  updatedAt: number;
};

const EMPTY_PROFILE: CustomerProfile = { name: '', email: '', updatedAt: 0 };
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;

export function customerIdentity(config: PwaConfig, preview: boolean, projectId: number | null) {
  return config.productId || (preview ? `local-${projectId ?? config.appName}` : `legacy-${config.appName}`);
}

export function customerProfileStorageKey(config: PwaConfig, preview: boolean, projectId: number | null) {
  return `appify-customer-profile:v1:${preview ? 'preview' : 'customer'}:${encodeURIComponent(customerIdentity(config, preview, projectId))}`;
}

function normalizedText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export function normalizeCustomerProfile(value: unknown): CustomerProfile {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...EMPTY_PROFILE };
  const source = value as Record<string, unknown>;
  const updatedAt = typeof source.updatedAt === 'number' && Number.isFinite(source.updatedAt) && source.updatedAt >= 0 ? source.updatedAt : 0;
  return {
    name: normalizedText(source.name, MAX_NAME_LENGTH),
    email: normalizedText(source.email, MAX_EMAIL_LENGTH),
    updatedAt,
  };
}

export function readCustomerProfile(storage: Storage, key: string): CustomerProfile {
  try {
    const raw = storage.getItem(key);
    if (!raw || raw.length > 4096) return { ...EMPTY_PROFILE };
    return normalizeCustomerProfile(JSON.parse(raw));
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function writeCustomerProfile(storage: Storage, key: string, profile: Pick<CustomerProfile, 'name' | 'email'>): CustomerProfile {
  const normalized = normalizeCustomerProfile({ ...profile, updatedAt: Date.now() });
  storage.setItem(key, JSON.stringify(normalized));
  return normalized;
}

export function clearCustomerProfile(storage: Storage, key: string) {
  storage.removeItem(key);
}
