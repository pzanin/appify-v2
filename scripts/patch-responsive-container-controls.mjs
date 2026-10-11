import fs from 'node:fs';

const typesPath = 'src/types.ts';
let types = fs.readFileSync(typesPath, 'utf8');
if (!types.includes('contentWidth?:')) {
  types = types.replace("    maxWidth?: string | number;", "    maxWidth?: string | number;\n    contentWidth?: string | number;");
}
if (!types.includes('mobileColumns?:')) {
  types = types.replace("    mobileOrder?: 'normal' | 'reverse';", "    mobileOrder?: 'normal' | 'reverse';\n    mobileColumns?: 'stack' | 'keep';");
}
fs.writeFileSync(typesPath, types);

const builderPath = 'src/utils/builderHtml.ts';
let builder = fs.readFileSync(builderPath, 'utf8');

builder = builder.replace(
  "case 'oneColumn': return { ...base, title:'Título da seção', text:'Escreva o conteúdo desta seção.', columnBgColor:'#f3f4f6', columnPadding:'20', titleFontFamily:'Syne', titleFontSize:'24', titleFontWeight:'700', titleMarginBottom:'12' };",
  "case 'oneColumn': return { ...base, title:'Título da seção', text:'Escreva o conteúdo desta seção.', columnBgColor:'#f3f4f6', columnPadding:'20', contentWidth:'100', titleFontFamily:'Syne', titleFontSize:'24', titleFontWeight:'700', titleMarginBottom:'12' };"
);
builder = builder.replace(
  "case 'twoColumn': return { ...base, bgColor: '#f3f4f6', padding: '24', leftTitle: 'Coluna Esquerda', leftText: 'Texto descritivo aqui', rightTitle: 'Coluna Direita', rightText: 'Outro texto descritivo', columnBgColor: '#ffffff', columnPadding: '20', columnRatio: '50-50' as const, reverseColumns: false, mobileOrder: 'normal' as const, titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };",
  "case 'twoColumn': return { ...base, bgColor: '#f3f4f6', padding: '24', leftTitle: 'Coluna Esquerda', leftText: 'Texto descritivo aqui', rightTitle: 'Coluna Direita', rightText: 'Outro texto descritivo', columnBgColor: '#ffffff', columnPadding: '20', columnRatio: '50-50' as const, reverseColumns: false, mobileOrder: 'normal' as const, mobileColumns: 'stack' as const, titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };"
);
builder = builder.replace(
  "maxWidth: [0,1600], marginTop: [0,200]",
  "maxWidth: [0,1600], contentWidth: [50,100], marginTop: [0,200]"
);
if (!builder.includes("p.mobileColumns = 'stack'")) {
  builder = builder.replace(
    "  if (!['normal','reverse'].includes(p.mobileOrder || 'normal')) p.mobileOrder = 'normal';",
    "  if (!['normal','reverse'].includes(p.mobileOrder || 'normal')) p.mobileOrder = 'normal';\n  if (!['stack','keep'].includes(p.mobileColumns || 'stack')) p.mobileColumns = 'stack';"
  );
}
builder = builder.replace(
  "  .appify-builder-content .appify-builder-grid { grid-template-columns:minmax(0,1fr) !important; }",
  "  .appify-builder-content .appify-builder-grid:not(.appify-keep-columns) { grid-template-columns:minmax(0,1fr) !important; }"
);
builder = builder.replace(
  "case 'oneColumn': return `<div style=\"background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;\">",
  "case 'oneColumn': return `<div style=\"width:${p.contentWidth || 100}%;max-width:100%;margin-left:auto;margin-right:auto;background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;\">"
);
builder = builder.replace(
  "            const mobileClass = p.mobileOrder === 'reverse' ? ' appify-mobile-reverse' : '';",
  "            const mobileClass = p.mobileOrder === 'reverse' ? ' appify-mobile-reverse' : '';\n            const keepClass = p.mobileColumns === 'keep' ? ' appify-keep-columns' : '';"
);
builder = builder.replace(
  "class=\"appify-builder-grid${mobileClass}\"",
  "class=\"appify-builder-grid${mobileClass}${keepClass}\""
);
fs.writeFileSync(builderPath, builder);

const editorPath = 'src/components/ModulesAndContent.tsx';
let editor = fs.readFileSync(editorPath, 'utf8');

editor = editor.replace(
  /<label className="vpb-label">Presets de largura<\/label>[\s\S]*?<\/select>/,
  `<label className="vpb-label">Largura do conteúdo</label>\n                    <select className="vpb-input" value={String(selectedBlock.props.contentWidth ?? 100)} onChange={e => updateProp('contentWidth', e.target.value)}>\n                      <option value="100">100% — largura total</option>\n                      <option value="90">90%</option>\n                      <option value="80">80%</option>\n                      <option value="70">70%</option>\n                    </select>`
);

if (!editor.includes('Comportamento no celular')) {
  editor = editor.replace(
    `<label className="vpb-label">Ordem no celular</label>\n                      <select className="vpb-input" value={selectedBlock.props.mobileOrder || 'normal'} onChange={e => updateProp('mobileOrder', e.target.value as BuilderBlock['props']['mobileOrder'])}>\n                        <option value="normal">Manter ordem visual</option>\n                        <option value="reverse">Inverter ao empilhar</option>\n                      </select>`,
    `<label className="vpb-label">Ordem no celular</label>\n                      <select className="vpb-input" value={selectedBlock.props.mobileOrder || 'normal'} onChange={e => updateProp('mobileOrder', e.target.value as BuilderBlock['props']['mobileOrder'])}>\n                        <option value="normal">Manter ordem visual</option>\n                        <option value="reverse">Inverter ao empilhar</option>\n                      </select>\n                      <label className="vpb-label">Comportamento no celular</label>\n                      <select className="vpb-input" value={selectedBlock.props.mobileColumns || 'stack'} onChange={e => updateProp('mobileColumns', e.target.value as BuilderBlock['props']['mobileColumns'])}>\n                        <option value="stack">Empilhar — recomendado</option>\n                        <option value="keep">Manter 2 colunas</option>\n                      </select>`
  );
}
editor = editor.replace(
  'No celular as duas colunas continuam empilhadas. Você pode escolher qual conteúdo aparece primeiro.',
  'No celular, “Empilhar” é o modo recomendado. Se escolher “Manter 2 colunas”, as proporções 50/50, 70/30 etc. continuam visíveis.'
);
fs.writeFileSync(editorPath, editor);

console.log('Responsive container controls applied.');
