import DOMPurify from 'dompurify';

export const LINK_BRIDGE = "document.addEventListener('click',function(event){if(!event.isTrusted)return;var link=event.target.closest&&event.target.closest('a[href]');if(!link)return;event.preventDefault();var value=link.getAttribute('href');try{var url=new URL(value);if(url.protocol!=='https:'&&url.protocol!=='mailto:')return;if(url.username||url.password)return;if(parent!==window)parent.postMessage({type:'appify:external-link',url:url.href},'*');else window.open(url.href,'_blank','noopener,noreferrer');}catch(e){}});";
import { LINK_BRIDGE_HASH } from './securityPolicies';
export { LINK_BRIDGE_HASH } from './securityPolicies';
export const IMPORTED_HTML_CSP = `default-src 'none'; script-src '${LINK_BRIDGE_HASH}'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; media-src https: data:; frame-src https:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`;

export function safeEmbedUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
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
  doc.querySelectorAll('a').forEach(link => { link.setAttribute('rel', 'noopener noreferrer'); });
  return wholeDocument ? `<!DOCTYPE html>${doc.documentElement.outerHTML}` : doc.body.innerHTML;
}
