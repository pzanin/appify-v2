import { sanitizeImportedHtml, IMPORTED_HTML_CSP, LINK_BRIDGE, VIDEO_BRIDGE } from './htmlSecurity';
const RESPONSIVE_STYLE = `
<style id="appify-responsive-html">
  html, body {
    width: 100% !important;
    max-width: 100vw !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow-x: hidden !important;
    box-sizing: border-box;
    font-family: sans-serif;
  }
  *, *::before, *::after {
    box-sizing: border-box;
    min-width: 0;
  }
  body * {
    max-width: 100%;
  }
  img:not(.appify-sized-image), video, audio, canvas, svg {
    max-width: 100% !important;
    height: auto !important;
  }
  iframe {
    width: 100% !important;
    max-width: 100% !important;
    border: 0;
  }
  table {
    display: block;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: auto;
    border-collapse: collapse;
    -webkit-overflow-scrolling: touch;
  }
  pre, code {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  @media (max-width: 600px) {
    [style*="grid-template-columns"] {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    [style*="display:grid"], [style*="display: grid"] {
      grid-template-columns: minmax(0, 1fr) !important;
    }
    [style*="display:flex"], [style*="display: flex"] {
      flex-wrap: wrap !important;
    }
    [style*="width:"] {
      max-width: 100% !important;
    }
  }
  ::-webkit-scrollbar { width: 0; height: 0; }
</style>`;

const VIEWPORT_META = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">';

export function prepareResponsiveHtml(html: string): string {
  const source = html?.trim() || '<p style="text-align:center;font-family:sans-serif;opacity:.5;padding:20px;">Nenhum conteúdo definido.</p>';
  const doc = new DOMParser().parseFromString(sanitizeImportedHtml(source, true), 'text/html');
  doc.querySelector('#appify-responsive-html')?.remove();
  doc.head.innerHTML = `<meta http-equiv="Content-Security-Policy" content="${IMPORTED_HTML_CSP}">${VIEWPORT_META}${RESPONSIVE_STYLE}` + doc.head.innerHTML;
  const linkScript = doc.createElement('script');
  linkScript.textContent = LINK_BRIDGE;
  doc.body.appendChild(linkScript);
  const videoScript = doc.createElement('script');
  videoScript.textContent = VIDEO_BRIDGE;
  doc.body.appendChild(videoScript);
  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`;
}
