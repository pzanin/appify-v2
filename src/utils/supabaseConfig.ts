export type SupabaseConnectionState = 'idle' | 'testing' | 'success' | 'error';

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function normalizeSupabaseProjectUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (!url.hostname || url.hostname.includes(' ')) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function isSupportedSupabasePublicKey(value: string): boolean {
  const key = value.trim();
  if (/^sb_publishable_[A-Za-z0-9._-]{8,}$/.test(key)) return true;
  if (!key.startsWith('eyJ')) return false;
  const payload = decodeJwtPayload(key);
  return payload?.role === 'anon' && typeof payload?.iss === 'string' && payload.iss.includes('supabase');
}

export function isForbiddenSupabaseSecret(value: string): boolean {
  const key = value.trim();
  if (/^sb_secret_/i.test(key)) return true;
  if (!key.startsWith('eyJ')) return false;
  const payload = decodeJwtPayload(key);
  return payload?.role === 'service_role';
}

export function validateSupabasePublicConfig(urlValue: string, keyValue: string): string | null {
  if (!normalizeSupabaseProjectUrl(urlValue)) return 'Informe uma Project URL HTTPS válida do Supabase.';
  if (isForbiddenSupabaseSecret(keyValue)) return 'Não use Secret Key ou service_role. Use somente a Publishable Key.';
  if (!isSupportedSupabasePublicKey(keyValue)) return 'Informe uma Publishable Key válida (sb_publishable_...).';
  return null;
}

export async function testSupabasePublicConnection(urlValue: string, keyValue: string): Promise<{ ok: boolean; message: string }> {
  const validationError = validateSupabasePublicConfig(urlValue, keyValue);
  if (validationError) return { ok: false, message: validationError };

  const projectUrl = normalizeSupabaseProjectUrl(urlValue)!;
  const key = keyValue.trim();
  try {
    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: key,
        Accept: 'application/json',
      },
    });
    if (response.ok) return { ok: true, message: 'Conexão com o Supabase confirmada.' };
    if (response.status === 401 || response.status === 403) {
      return { ok: false, message: 'A URL respondeu, mas a Publishable Key não foi aceita.' };
    }
    return { ok: false, message: `O Supabase respondeu com status ${response.status}. Confira a configuração.` };
  } catch {
    return { ok: false, message: 'Não foi possível alcançar o Supabase. Confira a URL e sua conexão.' };
  }
}
