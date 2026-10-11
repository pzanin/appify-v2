import DOMPurify from 'dompurify';

export function escapeRichText(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]!));
}

export function plainTextToRichHtml(value: unknown): string {
  const lines = String(value ?? '').replace(/\r\n/g, '\n').split('\n');
  return lines.map(line => `<p>${escapeRichText(line) || '<br>'}</p>`).join('');
}

export function sanitizeRichTextHtml(source: string): string {
  const purifier = typeof DOMPurify.sanitize === 'function' ? DOMPurify : DOMPurify(window);
  const clean = purifier.sanitize(source || '', {
    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'u', 'span', 'br', 'p', 'div'],
    ALLOWED_ATTR: ['style'],
  });

  const doc = new DOMParser().parseFromString(`<div>${clean}</div>`, 'text/html');
  const root = doc.body.firstElementChild as HTMLElement | null;
  if (!root) return '';

  root.querySelectorAll<HTMLElement>('div').forEach(element => {
    const paragraph = doc.createElement('p');
    while (element.firstChild) paragraph.appendChild(element.firstChild);
    element.replaceWith(paragraph);
  });

  root.querySelectorAll<HTMLElement>('*').forEach(element => {
    if (element.tagName === 'SPAN') {
      const color = element.style.color;
      element.removeAttribute('style');
      if (color && /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i.test(color)) {
        element.style.color = color;
      }
    } else {
      element.removeAttribute('style');
    }
    [...element.attributes].forEach(attr => {
      if (attr.name !== 'style') element.removeAttribute(attr.name);
    });
  });

  return root.innerHTML;
}
