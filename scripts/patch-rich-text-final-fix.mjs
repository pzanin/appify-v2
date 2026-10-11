import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`Missing ${label}`);
  return source.replace(before, after);
};

const builderPath = 'src/components/ModulesAndContent.tsx';
let builder = fs.readFileSync(builderPath, 'utf8');

builder = replaceOnce(
  builder,
  "  const richTextEditorRef = useRef<HTMLDivElement>(null);\n  const richTextSelectionRef = useRef<Range | null>(null);\n  const [richTextColor, setRichTextColor] = useState('#333333');",
  "  const richTextEditorRef = useRef<HTMLDivElement>(null);\n  const richTextSelectionRef = useRef<Range | null>(null);\n  const richTextColorRef = useRef('#333333');",
  'rich text color state'
);

builder = replaceOnce(
  builder,
  `                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>Cor\n                          <input type="color" aria-label="Escolher cor do texto" value={richTextColor} onMouseDown={rememberRichTextSelection} onChange={e => setRichTextColor(e.target.value)} />\n                        </label>\n                        <button type="button" className="btn-ghost" style={{ minWidth: '72px' }} onMouseDown={e => { e.preventDefault(); applyRichTextCommand('foreColor', richTextColor); }} title="Aplicar a cor escolhida ao trecho selecionado">Aplicar cor</button>`,
  `                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>Cor\n                          <input type="color" aria-label="Escolher cor do texto" defaultValue="#333333" onMouseDown={rememberRichTextSelection} onInput={e => { richTextColorRef.current = e.currentTarget.value; }} onChange={e => { richTextColorRef.current = e.currentTarget.value; }} />\n                        </label>\n                        <button type="button" className="btn-ghost" style={{ minWidth: '72px' }} onMouseDown={e => { e.preventDefault(); applyRichTextCommand('foreColor', richTextColorRef.current); }} title="Aplicar a cor escolhida ao trecho selecionado">Aplicar cor</button>`,
  'color controls'
);

builder = replaceOnce(
  builder,
  "                      <style>{`.appify-rich-editor p{margin:0 0 ${Number(selectedBlock.props.paragraphSpacing ?? 12)}px;line-height:inherit}.appify-rich-editor p:last-child{margin-bottom:0}`}</style>",
  "                      <style>{`.appify-rich-editor>p,.appify-rich-editor>div{margin:0 0 ${Number(selectedBlock.props.paragraphSpacing ?? 12)}px;line-height:inherit}.appify-rich-editor>p:last-child,.appify-rich-editor>div:last-child{margin-bottom:0}`}</style>",
  'paragraph editor css'
);

fs.writeFileSync(builderPath, builder);

const richPath = 'src/utils/richText.ts';
let rich = fs.readFileSync(richPath, 'utf8');
rich = replaceOnce(
  rich,
  "      if (color && /^(#[0-9a-f]{3,8}|rgb\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*\\))$/i.test(color)) {\n        element.style.color = color;\n      }",
  "      if (color && /^(#[0-9a-f]{3,8}|rgba?\\(\\s*\\d{1,3}\\s*,\\s*\\d{1,3}\\s*,\\s*\\d{1,3}(?:\\s*,\\s*(?:0|1|0?\\.\\d+))?\\s*\\))$/i.test(color)) {\n        element.style.color = color;\n      }",
  'rich text color sanitizer'
);
fs.writeFileSync(richPath, rich);

console.log('Final rich text fix applied.');
