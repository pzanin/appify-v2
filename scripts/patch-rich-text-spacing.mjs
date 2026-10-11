import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`Missing ${label}`);
  return source.replace(before, after);
};

// types
{
  const path = 'src/types.ts';
  let s = fs.readFileSync(path, 'utf8');
  s = replaceOnce(s,
`    lineHeight?: number | string;\n    letterSpacing?: number | string;`,
`    lineHeight?: number | string;\n    paragraphSpacing?: number | string;\n    letterSpacing?: number | string;`,
'paragraphSpacing type');
  fs.writeFileSync(path, s);
}

// rich text sanitizer/normalizer
{
  const path = 'src/utils/richText.ts';
  let s = fs.readFileSync(path, 'utf8');
  s = replaceOnce(s,
`export function plainTextToRichHtml(value: unknown): string {\n  return escapeRichText(value).replace(/\\r?\\n/g, '<br>');\n}`,
`export function plainTextToRichHtml(value: unknown): string {\n  const lines = String(value ?? '').replace(/\\r\\n/g, '\\n').split('\\n');\n  return lines.map(line => \`<p>\${escapeRichText(line) || '<br>'}</p>\`).join('');\n}`,
'plain text paragraphs');
  s = replaceOnce(s,
`    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'u', 'span', 'br'],`,
`    ALLOWED_TAGS: ['strong', 'b', 'em', 'i', 'u', 'span', 'br', 'p', 'div'],`,
'allowed paragraph tags');
  s = replaceOnce(s,
`  root.querySelectorAll<HTMLElement>('*').forEach(element => {\n    if (element.tagName === 'SPAN') {`,
`  root.querySelectorAll<HTMLElement>('div').forEach(element => {\n    const paragraph = doc.createElement('p');\n    while (element.firstChild) paragraph.appendChild(element.firstChild);\n    element.replaceWith(paragraph);\n  });\n\n  root.querySelectorAll<HTMLElement>('*').forEach(element => {\n    if (element.tagName === 'SPAN') {`,
'normalize div paragraphs');
  s = replaceOnce(s,
`    } else {\n      element.removeAttribute('style');\n    }`,
`    } else {\n      element.removeAttribute('style');\n    }`,
'keep sanitizer stable');
  fs.writeFileSync(path, s);
}

// builder rendering/defaults
{
  const path = 'src/utils/builderHtml.ts';
  let s = fs.readFileSync(path, 'utf8');
  s = replaceOnce(s,
`      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };`,
`      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left', lineHeight: '1.6', paragraphSpacing: '12' };`,
'text defaults');
  s = replaceOnce(s,
`    fontSize: [10,72], titleFontSize: [12,96], titleFontWeight: [400,800], titleMarginBottom: [0,80],`,
`    fontSize: [10,72], lineHeight: [1,3], paragraphSpacing: [0,64], titleFontSize: [12,96], titleFontWeight: [400,800], titleMarginBottom: [0,80],`,
'line ranges');
  s = replaceOnce(s,
`.appify-builder-content img { max-width:100%; }`,
`.appify-builder-content img { max-width:100%; }\n.appify-rich-text p { margin:0; line-height:inherit; }\n.appify-rich-text p + p { margin-top:var(--appify-paragraph-spacing,12px); }`,
'rich text css');
  s = replaceOnce(s,
`      case 'text': {\n        const rich = p.richContent?.trim() ? sanitizeRichTextHtml(p.richContent) : plainTextToRichHtml(p.content);\n        return \`<p style="white-space:pre-wrap;margin:0;">\${rich}</p>\`;\n      }`,
`      case 'text': {\n        const rich = p.richContent?.trim() ? sanitizeRichTextHtml(p.richContent) : plainTextToRichHtml(p.content);\n        const lineHeight = Math.min(3, Math.max(1, Number(p.lineHeight) || 1.6));\n        const paragraphSpacing = Math.min(64, Math.max(0, Number(p.paragraphSpacing) || 0));\n        return \`<div class="appify-rich-text" style="white-space:pre-wrap;line-height:\${lineHeight};--appify-paragraph-spacing:\${paragraphSpacing}px;">\${rich}</div>\`;\n      }`,
'rich text render');
  fs.writeFileSync(path, s);
}

// editor interaction and controls
{
  const path = 'src/components/ModulesAndContent.tsx';
  let s = fs.readFileSync(path, 'utf8');
  s = replaceOnce(s,
`  const applyRichTextCommand = (command: 'bold' | 'italic' | 'underline' | 'foreColor', value?: string) => {\n    const editor = richTextEditorRef.current;\n    const range = richTextSelectionRef.current;\n    if (!editor || !range) return;\n    editor.focus();\n    const selection = window.getSelection();\n    selection?.removeAllRanges();\n    selection?.addRange(range);\n    document.execCommand('styleWithCSS', false, 'true');\n    document.execCommand(command, false, value);\n    rememberRichTextSelection();\n    syncRichTextEditor();\n  };`,
`  const applyRichTextCommand = (command: 'bold' | 'italic' | 'underline' | 'foreColor', value?: string) => {\n    const editor = richTextEditorRef.current;\n    const savedRange = richTextSelectionRef.current;\n    if (!editor || !savedRange || savedRange.collapsed || !editor.contains(savedRange.commonAncestorContainer)) return;\n\n    const range = savedRange.cloneRange();\n    const wrapper = command === 'bold'\n      ? document.createElement('strong')\n      : command === 'italic'\n        ? document.createElement('em')\n        : command === 'underline'\n          ? document.createElement('u')\n          : document.createElement('span');\n    if (command === 'foreColor') {\n      const color = value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#333333';\n      wrapper.style.color = color;\n    }\n\n    try {\n      wrapper.appendChild(range.extractContents());\n      range.insertNode(wrapper);\n      const selection = window.getSelection();\n      const nextRange = document.createRange();\n      nextRange.selectNodeContents(wrapper);\n      selection?.removeAllRanges();\n      selection?.addRange(nextRange);\n      richTextSelectionRef.current = nextRange.cloneRange();\n      syncRichTextEditor();\n    } catch {\n      richTextSelectionRef.current = null;\n    }\n  };`,
'direct rich text command');

  s = replaceOnce(s,
`                      <div\n                        key={selectedBlock.id}\n                        ref={richTextEditorRef}\n                        className="vpb-textarea"`,
`                      <style>{\`.appify-rich-editor p{margin:0;line-height:inherit}.appify-rich-editor p+p{margin-top:\${Number(selectedBlock.props.paragraphSpacing ?? 12)}px}\`}</style>\n                      <div\n                        key={selectedBlock.id}\n                        ref={richTextEditorRef}\n                        className="vpb-textarea appify-rich-editor"`,
'editor paragraph css');

  s = replaceOnce(s,
`                        onBlur={syncRichTextEditor}\n                        style={{ minHeight: '120px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}`,
`                        onBlur={syncRichTextEditor}\n                        onInput={syncRichTextEditor}\n                        style={{ minHeight: '120px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: Number(selectedBlock.props.lineHeight ?? 1.6) }}`,
'editor live sync');

  s = replaceOnce(s,
`                      <p className="vpb-html-help">Selecione uma palavra ou trecho no campo acima e aplique negrito, itálico, sublinhado ou cor. A formatação é sanitizada antes de salvar.</p>`,
`                      <label className="vpb-label" htmlFor="text-line-height">Altura entre linhas</label>\n                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>\n                        <input id="text-line-height" type="range" min="1" max="3" step="0.1" style={{ flex: 1, accentColor: 'var(--accent)' }} value={selectedBlock.props.lineHeight ?? 1.6} onChange={e => updateProp('lineHeight', e.target.value)} />\n                        <input type="number" className="vpb-input" style={{ width: '72px', marginBottom: 0 }} min="1" max="3" step="0.1" value={selectedBlock.props.lineHeight ?? 1.6} onChange={e => updateProp('lineHeight', e.target.value)} />\n                      </div>\n                      <label className="vpb-label" htmlFor="text-paragraph-spacing" style={{ marginTop: '12px' }}>Espaço entre parágrafos (px)</label>\n                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>\n                        <input id="text-paragraph-spacing" type="range" min="0" max="64" step="1" style={{ flex: 1, accentColor: 'var(--accent)' }} value={selectedBlock.props.paragraphSpacing ?? 12} onChange={e => updateProp('paragraphSpacing', e.target.value)} />\n                        <input type="number" className="vpb-input" style={{ width: '72px', marginBottom: 0 }} min="0" max="64" step="1" value={selectedBlock.props.paragraphSpacing ?? 12} onChange={e => updateProp('paragraphSpacing', e.target.value)} />\n                      </div>\n                      <p className="vpb-html-help">Selecione uma palavra ou trecho no campo acima e aplique negrito, itálico, sublinhado ou cor. Enter cria um novo parágrafo; o espaço entre parágrafos e a altura entre linhas podem ser ajustados separadamente.</p>`,
'line and paragraph controls');

  fs.writeFileSync(path, s);
}

console.log('Rich text selection and spacing patch applied.');
