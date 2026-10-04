import type JSZip from 'jszip';

export const EXPORT_SECURITY_MESSAGE = 'Exportação bloqueada: remova credenciais privadas do projeto ou do template. Use apenas configurações públicas no PWA.';

function privateField(name: string) {
  const normalized = name.replace(/[^a-z0-9]/gi, '').toLowerCase();
  return /(?:secret|privatekey|servicekey|servicerole|password|passwd|credential|accesstoken|refreshtoken|authorization)/.test(normalized);
}

export function containsPrivateCredential(text: string): boolean {
  if (/-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----|\bsb_secret_[a-z0-9_-]+|\bsk-(?:proj-|ant-)?[a-z0-9_-]{16,}|\b(?:ghp_|github_pat_)[a-z0-9_]{20,}|\bAKIA[A-Z0-9]{16}\b/i.test(text)) return true;
  for (const match of text.matchAll(/(SERVICE_ROLE_KEY|PRIVATE_KEY|API_SECRET|CLIENT_SECRET|API_KEY|ACCESS_TOKEN|PASSWORD)["']?\s*[=:]\s*["']([a-z0-9_\-/.+]{8,})["']/gi)) {
    // Library event-name constants (access_token: "access_token") are not credentials.
    if (match[1].toLowerCase() !== match[2].toLowerCase()) return true;
  }
  if (/(?:^|[\s>])(?:SERVICE_ROLE_KEY|PRIVATE_KEY|API_SECRET|CLIENT_SECRET|API_KEY|ACCESS_TOKEN|PASSWORD)\s*=\s*[a-z0-9_\-/.+]{8,}/i.test(text)) return true;
  for (const match of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(atob(match[1].replace(/-/g, '+').replace(/_/g, '/')));
      // The legacy public Supabase key is the sole JWT credential allowed in a public ZIP.
      if (payload.role !== 'anon' || typeof payload.iss !== 'string' || !payload.iss.includes('supabase')) return true;
    } catch { return true; }
  }
  return false;
}

export function assertPublicExport(value: unknown): void {
  if (typeof value === 'string') {
    if (containsPrivateCredential(value)) throw new Error(EXPORT_SECURITY_MESSAGE);
    return;
  }
  if (Array.isArray(value)) { value.forEach(assertPublicExport); return; }
  if (value && typeof value === 'object') {
    for (const [name, item] of Object.entries(value)) {
      if (privateField(name) && item !== '' && item !== null && item !== undefined && item !== false) throw new Error(EXPORT_SECURITY_MESSAGE);
      assertPublicExport(item);
    }
  }
}

export function isAllowedExportPath(name: string): boolean {
  return /^(?:app-data\.json|index\.html|manifest\.json|sw\.js|_redirects|_headers|(?:icon-192x192|icon-512x512|apple-touch-icon)\.png|pages\/|pages\/lesson-\d+-\d+\.html|assets\/|assets\/[a-z0-9][a-z0-9._-]*\.(?:js|css))$/i.test(name);
}

export async function assertSafeArchive(zip: JSZip): Promise<void> {
  for (const entry of Object.values(zip.files)) {
    if (!isAllowedExportPath(entry.name)) throw new Error(EXPORT_SECURITY_MESSAGE);
    if (!entry.dir && /\.(?:html|json|js|css)$/.test(entry.name)) assertPublicExport(await entry.async('string'));
  }
}
