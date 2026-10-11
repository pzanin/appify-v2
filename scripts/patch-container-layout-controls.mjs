import fs from 'node:fs';

const typesPath = 'src/types.ts';
let types = fs.readFileSync(typesPath, 'utf8');
if (!types.includes("columnRatio?:")) {
  types = types.replace("    columnAlign?: 'start' | 'center' | 'end' | 'stretch';", "    columnAlign?: 'start' | 'center' | 'end' | 'stretch';\n    columnRatio?: '50-50' | '60-40' | '40-60' | '70-30' | '30-70';\n    reverseColumns?: boolean;\n    mobileOrder?: 'normal' | 'reverse';");
}
fs.writeFileSync(typesPath, types);

const builderPath = 'src/utils/builderHtml.ts';
let builder = fs.readFileSync(builderPath, 'utf8');

builder = builder.replace(
  "case 'twoColumn': return { ...base, bgColor: '#f3f4f6', padding: '24', leftTitle: 'Coluna Esquerda', leftText: 'Texto descritivo aqui', rightTitle: 'Coluna Direita', rightText: 'Outro texto descritivo', columnBgColor: '#ffffff', columnPadding: '20', titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };",
  "case 'twoColumn': return { ...base, bgColor: '#f3f4f6', padding: '24', leftTitle: 'Coluna Esquerda', leftText: 'Texto descritivo aqui', rightTitle: 'Coluna Direita', rightText: 'Outro texto descritivo', columnBgColor: '#ffffff', columnPadding: '20', columnRatio: '50-50' as const, reverseColumns: false, mobileOrder: 'normal' as const, titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };"
);

if (!builder.includes("p.columnRatio = '50-50'")) {
  builder = builder.replace(
    "  if (!['start','center','end','stretch'].includes(p.columnAlign || '')) p.columnAlign='start';",
    "  if (!['start','center','end','stretch'].includes(p.columnAlign || '')) p.columnAlign='start';\n  if (!['50-50','60-40','40-60','70-30','30-70'].includes(p.columnRatio || '50-50')) p.columnRatio = '50-50';\n  if (!['normal','reverse'].includes(p.mobileOrder || 'normal')) p.mobileOrder = 'normal';"
  );
}

builder = builder.replace(
  "@container appify-blocks (max-width:600px) {\n  .appify-builder-content .appify-builder-grid { grid-template-columns:minmax(0,1fr) !important; }\n}",
  "@container appify-blocks (max-width:600px) {\n  .appify-builder-content .appify-builder-grid { grid-template-columns:minmax(0,1fr) !important; }\n  .appify-builder-content .appify-builder-grid.appify-mobile-reverse > :first-child { order:2; }\n  .appify-builder-content .appify-builder-grid.appify-mobile-reverse > :last-child { order:1; }\n}"
);

const oldTwo = "          case 'twoColumn': return `<div class=\"appify-builder-grid\" style=\"display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:${p.gap}px;align-items:${p.columnAlign};\"><div style=\"background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;\"><h3 style=\"${titleStyle}margin:0 0 ${tmb}px;\">${escapeHtml(p.leftTitle)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">${escapeHtml(p.leftText)}</p></div><div style=\"background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;\"><h3 style=\"${titleStyle}margin:0 0 ${tmb}px;\">${escapeHtml(p.rightTitle)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">${escapeHtml(p.rightText)}</p></div></div>`;";
const newTwo = [
  "          case 'twoColumn': {",
  "            const ratios: Record<string,string> = { '50-50':'1fr 1fr', '60-40':'3fr 2fr', '40-60':'2fr 3fr', '70-30':'7fr 3fr', '30-70':'3fr 7fr' };",
  "            const columns = [",
  "              { title:p.leftTitle, text:p.leftText },",
  "              { title:p.rightTitle, text:p.rightText }",
  "            ];",
  "            if (p.reverseColumns) columns.reverse();",
  "            const mobileClass = p.mobileOrder === 'reverse' ? ' appify-mobile-reverse' : '';",
  "            const html = columns.map(column => `<div style=\"background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;\"><h3 style=\"${titleStyle}margin:0 0 ${tmb}px;\">${escapeHtml(column.title)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">${escapeHtml(column.text)}</p></div>`).join('');",
  "            return `<div class=\"appify-builder-grid${mobileClass}\" style=\"display:grid;grid-template-columns:${ratios[p.columnRatio || '50-50'] || ratios['50-50']};gap:${p.gap}px;align-items:${p.columnAlign};\">${html}</div>`;",
  "          }"
].join('\n');
if (!builder.includes(oldTwo)) throw new Error('twoColumn renderer anchor not found');
builder = builder.replace(oldTwo, newTwo);
fs.writeFileSync(builderPath, builder);

const editorPath = 'src/components/ModulesAndContent.tsx';
let editor = fs.readFileSync(editorPath, 'utf8');
const anchor = `                      <label className="vpb-label">Espaço Interno das Colunas ({selectedBlock.props.columnPadding ?? 20}px)</label>\n                      <input type="range" min="8" max="48" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.columnPadding ?? 20} onChange={e => updateProp('columnPadding', e.target.value)} />\n                      <input type="number" className="vpb-input" aria-label="Espaço interno das colunas em pixels" min="8" max="48" step="1" value={selectedBlock.props.columnPadding ?? 20} onChange={e => { if (e.target.value !== '') updateProp('columnPadding', String(Math.min(48, Math.max(8, Number(e.target.value))))); } } />`;
const extra = `${anchor}\n                      <label className="vpb-label">Proporção das colunas</label>\n                      <select className="vpb-input" value={selectedBlock.props.columnRatio || '50-50'} onChange={e => updateProp('columnRatio', e.target.value as BuilderBlock['props']['columnRatio'])}>\n                        <option value="50-50">50 / 50</option>\n                        <option value="60-40">60 / 40</option>\n                        <option value="40-60">40 / 60</option>\n                        <option value="70-30">70 / 30</option>\n                        <option value="30-70">30 / 70</option>\n                      </select>\n                      <label className="vpb-label">Posição no desktop</label>\n                      <select className="vpb-input" value={selectedBlock.props.reverseColumns ? 'reverse' : 'normal'} onChange={e => updateProp('reverseColumns', e.target.value === 'reverse')}>\n                        <option value="normal">Esquerda → Direita</option>\n                        <option value="reverse">Inverter colunas</option>\n                      </select>\n                      <label className="vpb-label">Ordem no celular</label>\n                      <select className="vpb-input" value={selectedBlock.props.mobileOrder || 'normal'} onChange={e => updateProp('mobileOrder', e.target.value as BuilderBlock['props']['mobileOrder'])}>\n                        <option value="normal">Manter ordem visual</option>\n                        <option value="reverse">Inverter ao empilhar</option>\n                      </select>\n                      <p className="vpb-html-help">No celular as duas colunas continuam empilhadas. Você pode escolher qual conteúdo aparece primeiro.</p>`;
if (!editor.includes('Proporção das colunas')) {
  if (!editor.includes(anchor)) throw new Error('twoColumn controls anchor not found');
  editor = editor.replace(anchor, extra);
}

const layoutAnchor = `                  <label className="vpb-label">Largura máxima do conteúdo (px) — 0 = toda a largura</label>\n                  <input aria-label="Largura máxima do conteúdo" type="number" className="vpb-input" min="0" max="1600" value={selectedBlock.props.maxWidth ?? 0} onChange={e=>updateProp('maxWidth',e.target.value)}/>`;
const layoutExtra = `${layoutAnchor}\n                  {selectedBlock.subtype === 'oneColumn' && <>\n                    <label className="vpb-label">Presets de largura</label>\n                    <select className="vpb-input" value={['0','900','700','500'].includes(String(selectedBlock.props.maxWidth ?? 0)) ? String(selectedBlock.props.maxWidth ?? 0) : 'custom'} onChange={e => { if (e.target.value !== 'custom') updateProp('maxWidth', e.target.value); }}>\n                      <option value="0">Toda a largura</option>\n                      <option value="900">900 px — conteúdo amplo</option>\n                      <option value="700">700 px — leitura confortável</option>\n                      <option value="500">500 px — conteúdo estreito</option>\n                      <option value="custom" disabled>Personalizado</option>\n                    </select>\n                  </>}`;
if (!editor.includes('Presets de largura')) {
  if (!editor.includes(layoutAnchor)) throw new Error('layout maxWidth anchor not found');
  editor = editor.replace(layoutAnchor, layoutExtra);
}
fs.writeFileSync(editorPath, editor);

console.log('Container layout controls applied.');
