import fs from 'node:fs';

const files = {
  builder: 'src/components/ModulesAndContent.tsx',
  html: 'src/utils/builderHtml.ts',
  types: 'src/types.ts',
};

const read = path => fs.readFileSync(path, 'utf8');
const write = (path, value) => fs.writeFileSync(path, value);

function replaceOnce(text, before, after, label) {
  if (text.includes(after)) {
    console.log(`Already applied: ${label}`);
    return text;
  }
  if (!text.includes(before)) throw new Error(`Expected source not found: ${label}`);
  console.log(`Applying: ${label}`);
  return text.replace(before, after);
}

let builder = read(files.builder);
let html = read(files.html);
let types = read(files.types);

html = replaceOnce(
  html,
  "case 'card': return { ...base, bgColor: 'transparent', padding: '0', title: 'Dica importante', content: 'Destaque aqui uma orientação, benefício ou informação importante.', cardIcon: 'none' as const, cardBgColor: '#f3f4f6', cardPadding: '20', borderRadius: '12', titleFontFamily: 'Syne', titleFontSize: '24', titleFontWeight: '700', titleMarginBottom: '8' };",
  "case 'card': return { ...base, bgColor: 'transparent', padding: '0', title: 'Dica importante', content: 'Destaque aqui uma orientação, benefício ou informação importante.', cardIcon: 'none' as const, cardBgColor: '#f3f4f6', cardPadding: '20', borderRadius: '12', cardBorderWidth: '0', cardBorderColor: '#e5e7eb', cardShadow: 'soft' as const, cardAccentSide: 'none' as const, cardAccentColor: '#6b8af0', cardAccentWidth: '4', titleFontFamily: 'Syne', titleFontSize: '24', titleFontWeight: '700', titleMarginBottom: '8' };",
  'card style defaults'
);

html = replaceOnce(
  html,
  "columnPadding: [0,48], cardPadding: [0,48], quoteSize: [10,72],",
  "columnPadding: [0,48], cardPadding: [0,48], cardBorderWidth: [0,12], cardAccentWidth: [0,16], quoteSize: [10,72],",
  'card style numeric normalization'
);

html = replaceOnce(
  html,
  "'columnBgColor','quoteColor','borderColor']",
  "'columnBgColor','quoteColor','borderColor','cardBorderColor','cardAccentColor']",
  'card color validation'
);

html = replaceOnce(
  html,
  "if (block.type === 'card' && !['none','check','star','arrow','dot'].includes(p.cardIcon || '')) p.cardIcon = 'none';",
  "if (block.type === 'card' && !['none','check','star','arrow','dot'].includes(p.cardIcon || '')) p.cardIcon = 'none';\n  if (block.type === 'card' && !['none','soft','medium','strong'].includes(p.cardShadow || '')) p.cardShadow = 'soft';\n  if (block.type === 'card' && !['none','left','right','top','bottom'].includes(p.cardAccentSide || '')) p.cardAccentSide = 'none';",
  'card enum validation'
);

html = replaceOnce(
  html,
  "const headingHtml = p.title?.trim() ? `<h3 style=\"${titleStyle}margin:0 0 ${tmb}px;overflow-wrap:anywhere;\">${escapeHtml(p.title)}</h3>` : '';\n        return `<div class=\"appify-builder-card\" style=\"background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:${p.borderRadius}px;max-width:100%;\">${iconHtml}${headingHtml}<p style=\"white-space:pre-wrap;margin:0;overflow-wrap:anywhere;\">${escapeHtml(p.content)}</p></div>`;",
  "const headingHtml = p.title?.trim() ? `<h3 style=\"${titleStyle}margin:0 0 ${tmb}px;overflow-wrap:anywhere;\">${escapeHtml(p.title)}</h3>` : '';\n        const shadow = p.cardShadow === 'none' ? 'none' : p.cardShadow === 'medium' ? '0 8px 24px rgba(15,23,42,.14)' : p.cardShadow === 'strong' ? '0 14px 36px rgba(15,23,42,.20)' : '0 4px 14px rgba(15,23,42,.10)';\n        const accentSide = p.cardAccentSide && p.cardAccentSide !== 'none' ? `border-${p.cardAccentSide}:${p.cardAccentWidth || 4}px solid ${p.cardAccentColor || '#6b8af0'};` : '';\n        return `<div class=\"appify-builder-card\" style=\"background:${p.cardBgColor};padding:${p.cardPadding}px;border:${p.cardBorderWidth || 0}px solid ${p.cardBorderColor || '#e5e7eb'};${accentSide}border-radius:${p.borderRadius}px;box-shadow:${shadow};max-width:100%;\">${iconHtml}${headingHtml}<p style=\"white-space:pre-wrap;margin:0;overflow-wrap:anywhere;\">${escapeHtml(p.content)}</p></div>`;",
  'inner card styling'
);

html = replaceOnce(
  html,
  "const style = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;margin-top:${p.marginTop || 0}px;margin-bottom:${p.marginBottom || 0}px;border:${p.borderWidth || 0}px solid ${p.borderColor || '#e5e7eb'};border-radius:${p.borderRadius || 0}px;`;",
  "const outerBorderWidth = block.type === 'card' ? 0 : (p.borderWidth || 0);\n    const style = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;margin-top:${p.marginTop || 0}px;margin-bottom:${p.marginBottom || 0}px;border:${outerBorderWidth}px solid ${p.borderColor || '#e5e7eb'};border-radius:${block.type === 'card' ? 0 : (p.borderRadius || 0)}px;`;",
  'disable outer card border in export'
);

types = replaceOnce(
  types,
  "cardPadding?: string | number;",
  "cardPadding?: string | number;\n    cardBorderWidth?: string | number;\n    cardBorderColor?: string;\n    cardShadow?: 'none' | 'soft' | 'medium' | 'strong';\n    cardAccentSide?: 'none' | 'left' | 'right' | 'top' | 'bottom';\n    cardAccentColor?: string;\n    cardAccentWidth?: string | number;",
  'card style types'
);

builder = replaceOnce(
  builder,
  "border: `${mod.props.borderWidth || 0}px solid ${mod.props.borderColor || '#e5e7eb'}`,\n                        borderRadius: `${mod.props.borderRadius || 0}px`",
  "border: `${mod.type === 'card' ? 0 : (mod.props.borderWidth || 0)}px solid ${mod.props.borderColor || '#e5e7eb'}`,\n                        borderRadius: `${mod.type === 'card' ? 0 : (mod.props.borderRadius || 0)}px`",
  'disable outer card border in preview'
);

builder = replaceOnce(
  builder,
  "<label className=\"vpb-label\" htmlFor=\"card-radius\">Bordas arredondadas (px)</label>\n                      <input id=\"card-radius\" type=\"number\" className=\"vpb-input\" min=\"0\" max=\"200\" step=\"1\" value={selectedBlock.props.borderRadius ?? 12} onChange={e => { if (e.target.value !== '') updateProp('borderRadius', String(Math.min(200, Math.max(0, Number(e.target.value))))); }} />",
  "<label className=\"vpb-label\" htmlFor=\"card-radius\">Bordas arredondadas (px)</label>\n                      <input id=\"card-radius\" type=\"number\" className=\"vpb-input\" min=\"0\" max=\"200\" step=\"1\" value={selectedBlock.props.borderRadius ?? 12} onChange={e => { if (e.target.value !== '') updateProp('borderRadius', String(Math.min(200, Math.max(0, Number(e.target.value))))); }} />\n                      <label className=\"vpb-label\" htmlFor=\"card-border-width\">Borda do card (px)</label>\n                      <input id=\"card-border-width\" type=\"number\" className=\"vpb-input\" min=\"0\" max=\"12\" step=\"1\" value={selectedBlock.props.cardBorderWidth ?? 0} onChange={e => updateProp('cardBorderWidth', e.target.value)} />\n                      <label className=\"vpb-label\" htmlFor=\"card-border-color\">Cor da borda</label>\n                      <div className=\"vpb-color-row\">\n                        <input id=\"card-border-color\" type=\"color\" className=\"vpb-color-picker\" value={selectedBlock.props.cardBorderColor || '#e5e7eb'} onChange={e => updateProp('cardBorderColor', e.target.value)} />\n                        <input className=\"vpb-input\" aria-label=\"Código da cor da borda do card\" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardBorderColor || '#e5e7eb'} onChange={e => updateProp('cardBorderColor', e.target.value)} />\n                      </div>\n                      <label className=\"vpb-label\" htmlFor=\"card-shadow\">Sombra</label>\n                      <select id=\"card-shadow\" className=\"vpb-input\" value={selectedBlock.props.cardShadow || 'soft'} onChange={e => updateProp('cardShadow', e.target.value as BuilderBlock['props']['cardShadow'])}>\n                        <option value=\"none\">Sem sombra</option>\n                        <option value=\"soft\">Suave</option>\n                        <option value=\"medium\">Média</option>\n                        <option value=\"strong\">Forte</option>\n                      </select>\n                      <label className=\"vpb-label\" htmlFor=\"card-accent-side\">Faixa de destaque</label>\n                      <select id=\"card-accent-side\" className=\"vpb-input\" value={selectedBlock.props.cardAccentSide || 'none'} onChange={e => updateProp('cardAccentSide', e.target.value as BuilderBlock['props']['cardAccentSide'])}>\n                        <option value=\"none\">Sem destaque</option>\n                        <option value=\"left\">Esquerda</option>\n                        <option value=\"right\">Direita</option>\n                        <option value=\"top\">Topo</option>\n                        <option value=\"bottom\">Base</option>\n                      </select>\n                      {selectedBlock.props.cardAccentSide !== 'none' && <>\n                        <label className=\"vpb-label\" htmlFor=\"card-accent-width\">Espessura do destaque (px)</label>\n                        <input id=\"card-accent-width\" type=\"number\" className=\"vpb-input\" min=\"1\" max=\"16\" step=\"1\" value={selectedBlock.props.cardAccentWidth ?? 4} onChange={e => updateProp('cardAccentWidth', e.target.value)} />\n                        <label className=\"vpb-label\" htmlFor=\"card-accent-color\">Cor do destaque</label>\n                        <div className=\"vpb-color-row\">\n                          <input id=\"card-accent-color\" type=\"color\" className=\"vpb-color-picker\" value={selectedBlock.props.cardAccentColor || '#6b8af0'} onChange={e => updateProp('cardAccentColor', e.target.value)} />\n                          <input className=\"vpb-input\" aria-label=\"Código da cor do destaque do card\" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardAccentColor || '#6b8af0'} onChange={e => updateProp('cardAccentColor', e.target.value)} />\n                        </div>\n                      </>}\n                      <p className=\"vpb-html-help\">Borda, sombra e faixa são aplicadas à caixa interna do Card/Destaque, não ao bloco externo.</p>",
  'card visual controls'
);

builder = replaceOnce(
  builder,
  "<label className=\"vpb-label\">Contorno do bloco (px)</label>\n                  <input type=\"number\" className=\"vpb-input\" min=\"0\" max=\"12\" value={selectedBlock.props.borderWidth ?? 0} onChange={e => updateProp('borderWidth', e.target.value)} />\n                  <label className=\"vpb-label\">Cor do contorno</label>\n                  <div className=\"vpb-color-row\">\n                    <input type=\"color\" className=\"vpb-color-picker\" value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />\n                    <input className=\"vpb-input\" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />\n                  </div>\n                  <label className=\"vpb-label\">Arredondamento externo (px)</label>\n                  <input type=\"number\" className=\"vpb-input\" min=\"0\" max=\"200\" value={selectedBlock.props.borderRadius ?? 0} onChange={e => updateProp('borderRadius', e.target.value)} />",
  "{selectedBlock.type !== 'card' && <>\n                    <label className=\"vpb-label\">Contorno do bloco (px)</label>\n                    <input type=\"number\" className=\"vpb-input\" min=\"0\" max=\"12\" value={selectedBlock.props.borderWidth ?? 0} onChange={e => updateProp('borderWidth', e.target.value)} />\n                    <label className=\"vpb-label\">Cor do contorno</label>\n                    <div className=\"vpb-color-row\">\n                      <input type=\"color\" className=\"vpb-color-picker\" value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />\n                      <input className=\"vpb-input\" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />\n                    </div>\n                    <label className=\"vpb-label\">Arredondamento externo (px)</label>\n                    <input type=\"number\" className=\"vpb-input\" min=\"0\" max=\"200\" value={selectedBlock.props.borderRadius ?? 0} onChange={e => updateProp('borderRadius', e.target.value)} />\n                  </>}",
  'hide generic outer border controls for card'
);

write(files.builder, builder);
write(files.html, html);
write(files.types, types);
console.log('Card highlight patch complete.');
