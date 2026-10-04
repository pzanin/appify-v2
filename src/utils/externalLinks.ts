// Shared by the renderer and main process. Never pass unchecked protocols to the OS.
export function normalizeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 4096 || /[\u0000-\u0020\u007f]/.test(value) || /%0[ad]/i.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.username || url.password) return null;
    if (url.protocol === 'https:' && url.hostname) return url.href;
    if (url.protocol === 'mailto:' && /^[^?@]+@[^?@]+/.test(url.pathname)) return url.href;
  } catch { /* Invalid input stays blocked. */ }
  return null;
}

export function openExternalLink(value: unknown): void {
  const url = normalizeExternalUrl(value);
  if (!url) return;
  if (window.appifyDesktop) {
    void window.appifyDesktop.links.openExternal(url).catch(() => {
      console.warn('[Appify] Não foi possível abrir o link externo.');
    });
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
