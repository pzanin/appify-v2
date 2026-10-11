import fs from 'node:fs';

const identityPath = 'src/components/IdentityConfigurator.tsx';
let identity = fs.readFileSync(identityPath, 'utf8');
identity = identity.replace('if (banners.length >= 3) return;', 'if (banners.length >= 5) return;');
identity = identity.replace('{(pwaConfig.banners || []).length} / 3', '{(pwaConfig.banners || []).length} / 5');
identity = identity.replaceAll('(pwaConfig.banners || []).length >= 3', '(pwaConfig.banners || []).length >= 5');
fs.writeFileSync(identityPath, identity);

const typesPath = 'src/types.ts';
let types = fs.readFileSync(typesPath, 'utf8');
if (!types.includes('col1BgColor?:')) {
  types = types.replace(
    '    col1Title?: string;\n    col1Text?: string;',
    '    col1Title?: string;\n    col1Text?: string;\n    col1BgColor?: string;'
  );
  types = types.replace(
    '    col2Title?: string;\n    col2Text?: string;',
    '    col2Title?: string;\n    col2Text?: string;\n    col2BgColor?: string;'
  );
  types = types.replace(
    '    col3Title?: string;\n    col3Text?: string;',
    '    col3Title?: string;\n    col3Text?: string;\n    col3BgColor?: string;'
  );
}
fs.writeFileSync(typesPath, types);

const builderPath = 'src/utils/builderHtml.ts';
let builder = fs.readFileSync(builderPath, 'utf8');

builder = builder.replace(
  "case 'threeColumn': return { ...base, gap: '14', bgColor: '#ffffff', padding: '20', col1Title: 'Card 1', col1Text: 'Descrição do primeiro card', col2Title: 'Card 2', col2Text: 'Descrição do segundo card', col3Title: 'Card 3', col3Text: 'Descrição do terceiro card', cardBgColor: '#f3f4f6', cardPadding: '18', titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };",
  "case 'threeColumn': return { ...base, gap: '14', bgColor: '#ffffff', padding: '20', col1Title: 'Card 1', col1Text: 'Descrição do primeiro card', col1BgColor: '#f3f4f6', col2Title: 'Card 2', col2Text: 'Descrição do segundo card', col2BgColor: '#f3f4f6', col3Title: 'Card 3', col3Text: 'Descrição do terceiro card', col3BgColor: '#f3f4f6', cardBgColor: '#f3f4f6', cardPadding: '18', cardBorderWidth: '0', cardBorderColor: '#e5e7eb', cardShadow: 'soft' as const, titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };"
);

builder = builder.replace(
  "for (const key of ['bgColor','color','titleColor','subtitleColor','buttonColor','buttonTextColor','dividerColor','cardBgColor','columnBgColor','quoteColor','borderColor','cardBorderColor','cardAccentColor'])",
  "for (const key of ['bgColor','color','titleColor','subtitleColor','buttonColor','buttonTextColor','dividerColor','cardBgColor','columnBgColor','col1BgColor','col2BgColor','col3BgColor','quoteColor','borderColor','cardBorderColor','cardAccentColor'])"
);

const oldThree = "          case 'threeColumn': return `<div class=\"appify-builder-grid\" style=\"display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${p.gap}px;align-items:${p.columnAlign};\"><div style=\"background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:${p.borderRadius}px;\"><h3 style=\"${titleStyle}margin:0 0 ${tmb}px;\">${escapeHtml(p.col1Title)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">${escapeHtml(p.col1Text)}</p></div><div style=\"background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:${p.borderRadius}px;\"><h3 style=\"${titleStyle}margin:0 0 ${tmb}px;\">${escapeHtml(p.col2Title)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">${escapeHtml(p.col2Text)}</p></div><div style=\"background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:${p.borderRadius}px;\"><h3 style=\"${titleStyle}margin:0 0 ${tmb}px;\">${escapeHtml(p.col3Title)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">${escapeHtml(p.col3Text)}</p></div></div>`;";
const newThree = `          case 'threeColumn': {\n            const shadow = p.cardShadow === 'none' ? 'none' : p.cardShadow === 'medium' ? '0 8px 24px rgba(15,23,42,.14)' : p.cardShadow === 'strong' ? '0 14px 36px rgba(15,23,42,.20)' : '0 4px 14px rgba(15,23,42,.10)';\n            const cardStyle = (background:string) => \`background:\${background};padding:\${p.cardPadding}px;border:\${p.cardBorderWidth || 0}px solid \${p.cardBorderColor || '#e5e7eb'};border-radius:\${p.borderRadius}px;box-shadow:\${shadow};\`;\n            return \`<div class=\"appify-builder-grid\" style=\"display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:\${p.gap}px;align-items:\${p.columnAlign};\"><div style=\"\${cardStyle(p.col1BgColor || p.cardBgColor || '#f3f4f6')}\"><h3 style=\"\${titleStyle}margin:0 0 \${tmb}px;\">\${escapeHtml(p.col1Title)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">\${escapeHtml(p.col1Text)}</p></div><div style=\"\${cardStyle(p.col2BgColor || p.cardBgColor || '#f3f4f6')}\"><h3 style=\"\${titleStyle}margin:0 0 \${tmb}px;\">\${escapeHtml(p.col2Title)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">\${escapeHtml(p.col2Text)}</p></div><div style=\"\${cardStyle(p.col3BgColor || p.cardBgColor || '#f3f4f6')}\"><h3 style=\"\${titleStyle}margin:0 0 \${tmb}px;\">\${escapeHtml(p.col3Title)}</h3><p style=\"white-space:pre-wrap;margin:0;line-height:1.6;\">\${escapeHtml(p.col3Text)}</p></div></div>\`;\n          }`;
if (builder.includes(oldThree)) builder = builder.replace(oldThree, newThree);
else if (!builder.includes("const cardStyle = (background:string)")) throw new Error('threeColumn render pattern not found');
fs.writeFileSync(builderPath, builder);

const editorPath = 'src/components/ModulesAndContent.tsx';
let editor = fs.readFileSync(editorPath, 'utf8');

const marker = `                      <label className=\"vpb-label\">Cor de Fundo dos Cards</label>\n                      <div className=\"vpb-color-row\">\n                        <input type=\"color\" className=\"vpb-color-picker\" value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />\n                        <input className=\"vpb-input\" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />\n                      </div>`;

const replacement = `                      <label className=\"vpb-label\">Cor padrão dos Cards</label>\n                      <div className=\"vpb-color-row\">\n                        <input type=\"color\" className=\"vpb-color-picker\" value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />\n                        <input className=\"vpb-input\" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />\n                      </div>\n                      <label className=\"vpb-label\">Cor do Card 1</label>\n                      <input type=\"color\" className=\"vpb-color-input\" value={selectedBlock.props.col1BgColor || selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('col1BgColor', e.target.value)} />\n                      <label className=\"vpb-label\">Cor do Card 2</label>\n                      <input type=\"color\" className=\"vpb-color-input\" value={selectedBlock.props.col2BgColor || selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('col2BgColor', e.target.value)} />\n                      <label className=\"vpb-label\">Cor do Card 3</label>\n                      <input type=\"color\" className=\"vpb-color-input\" value={selectedBlock.props.col3BgColor || selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('col3BgColor', e.target.value)} />`;
if (editor.includes(marker)) editor = editor.replace(marker, replacement);
else if (!editor.includes('Cor do Card 1')) throw new Error('threeColumn color UI pattern not found');

const paddingNeedle = `                      <input type=\"number\" className=\"vpb-input\" aria-label=\"Espaço interno dos cards em pixels\" min=\"8\" max=\"48\" step=\"1\" value={selectedBlock.props.cardPadding ?? 18} onChange={e => { if (e.target.value !== '') updateProp('cardPadding', String(Math.min(48, Math.max(8, Number(e.target.value))))); } } />`;
const paddingExtra = `${paddingNeedle}\n                      <label className=\"vpb-label\">Borda dos Cards (px)</label>\n                      <input type=\"number\" className=\"vpb-input\" min=\"0\" max=\"12\" step=\"1\" value={selectedBlock.props.cardBorderWidth ?? 0} onChange={e => updateProp('cardBorderWidth', e.target.value)} />\n                      <label className=\"vpb-label\">Cor da borda dos Cards</label>\n                      <div className=\"vpb-color-row\">\n                        <input type=\"color\" className=\"vpb-color-picker\" value={selectedBlock.props.cardBorderColor || '#e5e7eb'} onChange={e => updateProp('cardBorderColor', e.target.value)} />\n                        <input className=\"vpb-input\" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardBorderColor || '#e5e7eb'} onChange={e => updateProp('cardBorderColor', e.target.value)} />\n                      </div>\n                      <label className=\"vpb-label\">Sombra dos Cards</label>\n                      <select className=\"vpb-input\" value={selectedBlock.props.cardShadow || 'soft'} onChange={e => updateProp('cardShadow', e.target.value as BuilderBlock['props']['cardShadow'])}>\n                        <option value=\"none\">Sem sombra</option>\n                        <option value=\"soft\">Suave</option>\n                        <option value=\"medium\">Média</option>\n                        <option value=\"strong\">Forte</option>\n                      </select>\n                      <p className=\"vpb-html-help\">No celular, os 3 cards continuam empilhados para preservar a leitura.</p>`;
if (editor.includes(paddingNeedle) && !editor.includes('Sombra dos Cards')) editor = editor.replace(paddingNeedle, paddingExtra);
fs.writeFileSync(editorPath, editor);

console.log('Three-card styling and five-banner limit applied.');
