import { sanitizeImportedHtml } from './htmlSecurity';
import { openExternalLink } from './externalLinks';

export type HostAction = 'copy' | 'print' | 'download';

export interface HostActionRequest {
  type: 'appify:host-action';
  action: HostAction;
  value: string;
  targetId: string;
}

const SAFE_TARGET = /^[A-Za-z0-9._:-]{0,80}$/;
const SAFE_ASSET_TAIL = /^(documents|files)\/[A-Za-z0-9][A-Za-z0-9._-]{0,158}$/;

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
    if (url.origin === base.origin) {
      const assetRoot = new URL('./assets/', base).pathname;
      if (url.pathname.startsWith(assetRoot)) {
        const tail = decodeURIComponent(url.pathname.slice(assetRoot.length));
        if (SAFE_ASSET_TAIL.test(tail)) return { url: url.href, local: true } as const;
      }
    }
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

export function launchCustomerDownload(value: string, baseUrl: string) {
  const target = normalizeHostDownloadUrl(value, baseUrl);
  if (!target) return false;
  if (!target.local) {
    openExternalLink(target.url);
    return true;
  }
  const link = document.createElement('a');
  link.href = target.url;
  link.download = decodeURIComponent(new URL(target.url).pathname.split('/').pop() || 'material');
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  return true;
}

function escapePrintText(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

export function printCustomerHtml(html: string, language: string, title = '') {
  try {
    const parsed = new DOMParser().parseFromString(sanitizeImportedHtml(html, true), 'text/html');
    parsed.documentElement.lang = language || 'en';
    parsed.querySelectorAll('script,iframe,video,audio').forEach(element => element.remove());
    const printStyle = parsed.createElement('style');
    printStyle.textContent = '@page{margin:14mm}html,body{background:#fff!important;color:#111!important;max-width:none!important;overflow:visible!important}body{font-family:Arial,sans-serif;line-height:1.5}img{max-width:100%!important;height:auto!important}a{color:#111!important;text-decoration:underline}button,[data-appify-action]{display:none!important}';
    parsed.head.appendChild(printStyle);
    if (title) {
      const titleElement = parsed.createElement('title');
      titleElement.textContent = title.slice(0, 160);
      parsed.head.appendChild(titleElement);
    }
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-same-origin allow-modals');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.position = 'fixed';
    frame.style.width = '1px';
    frame.style.height = '1px';
    frame.style.opacity = '0';
    frame.style.pointerEvents = 'none';
    frame.style.left = '-10000px';
    frame.srcdoc = `<!DOCTYPE html>${parsed.documentElement.outerHTML}`;
    frame.onload = () => {
      const target = frame.contentWindow;
      if (!target) { frame.remove(); return; }
      target.focus();
      target.print();
      window.setTimeout(() => frame.remove(), 1500);
    };
    frame.onerror = () => frame.remove();
    document.body.appendChild(frame);
    return true;
  } catch {
    return false;
  }
}

export function hostActionLabel(action: HostAction) {
  if (action === 'print') return 'Print / Save PDF';
  if (action === 'copy') return 'Copy';
  return 'Download';
}

export function hostActionExample(action: HostAction) {
  const label = escapePrintText(hostActionLabel(action));
  return `<a href="#" data-appify-action="${action}">${label}</a>`;
}
