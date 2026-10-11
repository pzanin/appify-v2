import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`Missing ${label}`);
  return source.replace(before, after);
};

const builderPath = 'src/components/ModulesAndContent.tsx';
let builder = fs.readFileSync(builderPath, 'utf8');

builder = replaceOnce(
  builder,
  "  const richTextEditorRef = useRef<HTMLDivElement>(null);\n  const richTextSelectionRef = useRef<Range | null>(null);",
  "  const richTextEditorRef = useRef<HTMLDivElement>(null);\n  const richTextSelectionRef = useRef<Range | null>(null);\n  const [richTextColor, setRichTextColor] = useState('#333333');",
  'rich text refs'
);

builder = replaceOnce(
  builder,
  `                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>Cor\n                          <input type=\"color\" aria-label=\"Cor do texto selecionado\" defaultValue=\"#333333\" onMouseDown={rememberRichTextSelection} onChange={e => applyRichTextCommand('foreColor', e.target.value)} />\n                        </label>`,
  `                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)' }}>Cor\n                          <input type=\"color\" aria-label=\"Escolher cor do texto\" value={richTextColor} onMouseDown={rememberRichTextSelection} onChange={e => setRichTextColor(e.target.value)} />\n                        </label>\n                        <button type=\"button\" className=\"btn-ghost\" style={{ minWidth: '72px' }} onMouseDown={e => { e.preventDefault(); applyRichTextCommand('foreColor', richTextColor); }} title=\"Aplicar a cor escolhida ao trecho selecionado\">Aplicar cor</button>`,
  'color picker'
);

builder = replaceOnce(
  builder,
  "                      <style>{`.appify-rich-editor p{margin:0;line-height:inherit}.appify-rich-editor p+p{margin-top:${Number(selectedBlock.props.paragraphSpacing ?? 12)}px}`}</style>",
  "                      <style>{`.appify-rich-editor p{margin:0 0 ${Number(selectedBlock.props.paragraphSpacing ?? 12)}px;line-height:inherit}.appify-rich-editor p:last-child{margin-bottom:0}`}</style>",
  'editor paragraph css'
);

builder = replaceOnce(
  builder,
  "                      <p className=\"vpb-html-help\">Selecione uma palavra ou trecho no campo acima e aplique negrito, itálico, sublinhado ou cor. Enter cria um novo parágrafo; o espaço entre parágrafos e a altura entre linhas podem ser ajustados separadamente.</p>",
  "                      <p className=\"vpb-html-help\">Selecione uma palavra ou trecho, escolha a cor e clique em “Aplicar cor”. Enter cria um novo parágrafo; o espaço entre parágrafos e a altura entre linhas podem ser ajustados separadamente.</p>",
  'rich text help'
);

fs.writeFileSync(builderPath, builder);

const htmlPath = 'src/utils/builderHtml.ts';
let html = fs.readFileSync(htmlPath, 'utf8');
html = replaceOnce(
  html,
  ".appify-rich-text p { margin:0; line-height:inherit; }\n.appify-rich-text p + p { margin-top:var(--appify-paragraph-spacing,12px); }",
  ".appify-rich-text p { margin:0 0 var(--appify-paragraph-spacing,12px); line-height:inherit; }\n.appify-rich-text p:last-child { margin-bottom:0; }",
  'export paragraph css'
);
fs.writeFileSync(htmlPath, html);

console.log('Rich text color and paragraph spacing patch applied.');
