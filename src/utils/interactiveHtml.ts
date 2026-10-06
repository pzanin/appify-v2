import type { HtmlExecutionMode } from '../types';

const SAFE_IFRAME_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'vimeo.com',
  'player.vimeo.com',
  'google.com',
  'www.google.com',
  'pandavideo.com',
];

function isTrustedIframeSource(src: string): boolean {
  try {
    const url = new URL(src, window.location.origin);
    return SAFE_IFRAME_HOSTS.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
  } catch {
    return false;
  }
}

export function sanitizeStaticHtml(html: string): string {
  if (typeof window === 'undefined' || !html) return html || '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const forbiddenTags = ['script', 'object', 'embed', 'link', 'style', 'base'];

  forbiddenTags.forEach(tag => {
    doc.querySelectorAll(tag).forEach(el => el.remove());
  });

  doc.querySelectorAll('iframe').forEach(iframe => {
    const src = iframe.getAttribute('src') || '';
    if (!isTrustedIframeSource(src)) {
      iframe.remove();
      return;
    }
    iframe.setAttribute('width', '100%');
    iframe.style.maxWidth = '100%';
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  });

  doc.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim().toLowerCase();

      if (name.startsWith('on')) el.removeAttribute(attr.name);
      if (['href', 'src', 'action', 'formaction'].includes(name) && value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

export function buildSandboxDocument(html: string): string {
  if (!html) return '<!doctype html><html><body></body></html>';

  const hasDocument = /<html[\s>]/i.test(html);
  const bridge = `
<script>
(() => {
  const reportHeight = () => {
    const height = Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0,
      document.documentElement.offsetHeight,
      document.body ? document.body.offsetHeight : 0
    );
    parent.postMessage({ type: 'appify:sandbox-height', height }, '*');
  };
  window.addEventListener('load', reportHeight);
  window.addEventListener('resize', reportHeight);
  new MutationObserver(reportHeight).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  setTimeout(reportHeight, 50);
})();
</script>`;

  if (hasDocument) {
    return html.includes('</body>') ? html.replace('</body>', `${bridge}</body>`) : `${html}${bridge}`;
  }

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>html,body{margin:0;padding:0;max-width:100%;overflow-x:hidden;}*,*:before,*:after{box-sizing:border-box;}img,video,svg,canvas{max-width:100%;}</style>
</head>
<body>${html}${bridge}</body>
</html>`;
}

export function iframeSandboxPermissions(mode: HtmlExecutionMode): string | undefined {
  if (mode !== 'sandbox') return undefined;
  // Intentionally omits allow-same-origin so imported code cannot reach the host DOM,
  // localStorage, cookies, Electron context, or Appify internals.
  return 'allow-scripts allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox';
}
