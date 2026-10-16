export type CustomerAssetKind = 'audio' | 'documents' | 'files';

const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,158}$/;

export function customerAssetPath(kind: CustomerAssetKind, filename: string) {
  if (!SAFE_FILENAME.test(filename)) return undefined;
  return `assets/${kind}/${filename}`;
}

export function customerWebAssetUrl(kind: CustomerAssetKind, filename: string, baseUrl: string) {
  const path = customerAssetPath(kind, filename);
  if (!path) return undefined;
  try {
    return new URL(`./${path}`, baseUrl).href;
  } catch {
    return undefined;
  }
}

export function customerDesktopAssetUrl(kind: CustomerAssetKind, filename: string, projectId: number | null) {
  const path = customerAssetPath(kind, filename);
  if (!path || !projectId) return undefined;
  return `appify-asset://project/${projectId}/${kind}/${encodeURIComponent(filename)}`;
}
