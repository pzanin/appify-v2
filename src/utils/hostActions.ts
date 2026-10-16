export type HostAction = 'copy' | 'print' | 'download';

export interface HostActionRequest {
  type: 'appify:host-action';
  action: HostAction;
  value: string;
  targetId: string;
}

const SAFE_TARGET = /^[A-Za-z0-9._:-]{0,80}$/;
const SAFE_ASSET_PATH = /^\/assets\/(documents|files)\/[A-Za-z0-9][A-Za-z0-9._-]{0,158}$/;

export function parseHostActionRequest(value: unknown): HostActionRequest | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  if (source.type !== 'appify:host-action') return null;
  if (source.action !== 'copy' && source.action !== 'print' && source.action !== 'download') return null;
  if (typeof source.value !== 'string' || source.value.length > 20_000) return null;
  if (typeof source.targetId !== 'string' || !SAFE_TARGET.test(source.targetId)) return null;
  return {
    type: 'appify:host-action',
    action: source.action,
    value: source.value,
    targetId: source.targetId,
  };
}

export function normalizeHostDownloadUrl(value: string, baseUrl: string) {
  if (!value || value.length > 4096 || /[\u0000-\u0020\u007f]/.test(value) || /%0[ad]/i.test(value)) return null;
  try {
    const base = new URL(baseUrl);
    const url = new URL(value, base);
    if (url.username || url.password) return null;
    if (url.origin === base.origin && SAFE_ASSET_PATH.test(url.pathname)) return { url: url.href, local: true } as const;
    if (url.protocol === 'https:' && url.hostname) return { url: url.href, local: false } as const;
  } catch { /* Invalid values remain blocked. */ }
  return null;
}

export async function copyCustomerText(value: string) {
  const text = value.slice(0, 20_000);
  if (!text) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* Fall through to the compatibility path. */ }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
