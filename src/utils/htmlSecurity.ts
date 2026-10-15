import DOMPurify from 'dompurify';

export const LINK_BRIDGE = "document.addEventListener('click',function(event){if(!event.isTrusted)return;var link=event.target.closest&&event.target.closest('a[href]');if(!link)return;event.preventDefault();var value=link.getAttribute('href');try{var url=new URL(value);if(url.protocol!=='https:'&&url.protocol!=='mailto:')return;if(url.username||url.password)return;if(parent!==window)parent.postMessage({type:'appify:external-link',url:url.href},'*');else window.open(url.href,'_blank','noopener,noreferrer');}catch(e){}});";
export const VIDEO_BRIDGE = "document.addEventListener('click',function(event){if(!event.isTrusted)return;var target=event.target;var trigger=target&&target.closest&&target.closest('[data-appify-youtube]');if(!trigger)return;event.preventDefault();var id=trigger.getAttribute('data-appify-youtube')||'';if(!/^[A-Za-z0-9_-]{6,}$/.test(id))return;var rect=trigger.getBoundingClientRect();if(parent!==window)parent.postMessage({type:'appify:youtube-play',id:id,title:trigger.getAttribute('data-title')||'Vídeo',rect:{top:rect.top,left:rect.left,width:rect.width,height:rect.height}},'*');});";
export const AUDIO_BRIDGE = "(function(){function bind(){document.querySelectorAll('audio').forEach(function(audio){if(audio.dataset.appifyAudioBound)return;audio.dataset.appifyAudioBound='1';var src=audio.currentSrc||audio.querySelector('source')?.src||audio.src||'';if(!src||!src.startsWith('appify-asset:'))return;fetch(src).then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.blob();}).then(function(blob){var url=URL.createObjectURL(blob);audio.src=url;audio.load();audio.addEventListener('loadedmetadata',function(){console.log('[Appify Audio] blob pronto',audio.duration);},{once:true});}).catch(function(err){var box=document.createElement('div');box.style.cssText='margin-top:8px;padding:8px 10px;border-radius:8px;background:#fff3cd;color:#574200;font:12px/1.4 sans-serif;word-break:break-word';box.textContent='Audio unavailable · '+(err&&err.message?err.message:'unknown error')+' · '+src;audio.insertAdjacentElement('afterend',box);});});}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();})();";
import { AUDIO_BRIDGE_HASH, LINK_BRIDGE_HASH, VIDEO_BRIDGE_HASH } from './securityPolicies';
export { AUDIO_BRIDGE_HASH, LINK_BRIDGE_HASH, VIDEO_BRIDGE_HASH } from './securityPolicies';
export const IMPORTED_HTML_CSP = `default-src 'none'; script-src '${LINK_BRIDGE_HASH}' '${VIDEO_BRIDGE_HASH}' '${AUDIO_BRIDGE_HASH}'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src https: data:; media-src 'self' https: data: blob: appify-asset:; frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https:; connect-src appify-asset:; object-src 'none'; base-uri 'none'; form-action 'none'`;
const SAFE_IMPORTED_URI = /^(?:(?:https?|mailto|data|appify-asset):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i;

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
    ALLOWED_URI_REGEXP: SAFE_IMPORTED_URI,
  });
  const doc = new DOMParser().parseFromString(clean, 'text/html');
  doc.querySelectorAll('iframe').forEach(frame => {
    const url = safeEmbedUrl(frame.getAttribute('src') || '');
    if (!url) { frame.remove(); return; }
    frame.src = url;
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const trustedVideoFrame = ['youtube.com', 'youtube-nocookie.com', 'player.vimeo.com'].includes(hostname);
    frame.setAttribute('sandbox', trustedVideoFrame ? 'allow-scripts allow-same-origin allow-presentation' : 'allow-scripts');
    frame.setAttribute('referrerpolicy', trustedVideoFrame ? 'strict-origin-when-cross-origin' : 'no-referrer');
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
