import DOMPurify from 'dompurify';

export const LINK_BRIDGE = "document.addEventListener('click',function(event){if(!event.isTrusted)return;var link=event.target.closest&&event.target.closest('a[href]');if(!link)return;event.preventDefault();var value=link.getAttribute('href');try{var url=new URL(value);if(url.protocol!=='https:'&&url.protocol!=='mailto:')return;if(url.username||url.password)return;if(parent!==window)parent.postMessage({type:'appify:external-link',url:url.href},'*');else window.open(url.href,'_blank','noopener,noreferrer');}catch(e){}});";
import { LINK_BRIDGE_HASH } from './securityPolicies';
export { LINK_BRIDGE_HASH } from './securityPolicies';
export const IMPORTED_HTML_CSP = `default-src 'none'; script-src '${LINK_BRIDGE_HASH}'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; media-src https: data:; frame-src https:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;

function normalizeYouTubeEmbed(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (!['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host)) return null;

  let id = '';
  if (host === 'youtu.be') {
    id = url.pathname.split('/').filter(Boolean)[0] || '';
  } else {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') id = parts[1] || '';
    if (!id) id = url.searchParams.get('v') || '';
  }

  if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
  const params = new URLSearchParams({
    rel: '0',
    playsinline: '1',
    controls: '0',
    fs: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

export function safeEmbedUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return undefined;
    const youtube = normalizeYouTubeEmbed(url);
    return youtube || url.href;
  } catch { /* Invalid/relative/protocol URLs are blocked. */ }
  return undefined;
}

export function sanitizeImportedHtml(source: string, wholeDocument = false): string {
  const purifier = typeof DOMPurify.sanitize === 'function' ? DOMPurify : DOMPurify(window);
  const clean = purifier.sanitize(source, {
    WHOLE_DOCUMENT: wholeDocument,
    USE_PROFILES: { html: true },
    ADD_TAGS: ['link', 'style', 'iframe'],
    FORBID_TAGS: ['script', 'base', 'meta', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', ...(!wholeDocument ? ['style', 'link'] : [])],
    FORBID_ATTR: ['srcdoc', 'action', 'formaction'],
  });
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  doc.querySelectorAll('iframe').forEach(frame => {
    const url = safeEmbedUrl(frame.getAttribute('src') || '');
    if (!url) { frame.remove(); return; }
    frame.src = url;
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('referrerpolicy', 'no-referrer');
  });
  doc.querySelectorAll('link').forEach(link => {
    const url = safeEmbedUrl(link.getAttribute('href') || '');
    if (!url || new URL(url).hostname !== 'fonts.googleapis.com' || link.rel !== 'stylesheet') link.remove();
  });
  doc.querySelectorAll('a').forEach(link => {
    link.setAttribute('rel', 'noopener noreferrer');
    if (/^(https:|mailto:)/i.test(link.getAttribute('href') || '')) link.setAttribute('target', '_blank');
  });
  return wholeDocument ? `<!DOCTYPE html>${doc.documentElement.outerHTML}` : doc.body.innerHTML;
}
