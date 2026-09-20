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
  img, video, audio, canvas, svg {
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
  const hasHtmlDocument = /<html[\s>]/i.test(source);

  if (!hasHtmlDocument) {
    return `<!DOCTYPE html><html><head>${VIEWPORT_META}${RESPONSIVE_STYLE}</head><body>${source}</body></html>`;
  }

  let result = source;
  if (!/<meta[^>]+name=["']viewport["']/i.test(result)) {
    result = /<head[\s>]/i.test(result)
      ? result.replace(/<head([^>]*)>/i, `<head$1>${VIEWPORT_META}`)
      : result.replace(/<html([^>]*)>/i, `<html$1><head>${VIEWPORT_META}</head>`);
  }

  if (!result.includes('id="appify-responsive-html"')) {
    result = /<\/head>/i.test(result)
      ? result.replace(/<\/head>/i, `${RESPONSIVE_STYLE}</head>`)
      : result.replace(/<body([^>]*)>/i, `<body$1>${RESPONSIVE_STYLE}`);
  }

  return result;
}
