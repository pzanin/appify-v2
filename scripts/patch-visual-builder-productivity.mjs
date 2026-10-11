import fs from 'node:fs';

const builderPath = 'src/components/ModulesAndContent.tsx';
const typesPath = 'src/types.ts';

let builder = fs.readFileSync(builderPath, 'utf8');
let types = fs.readFileSync(typesPath, 'utf8');

function replaceOnce(source, oldText, newText, label) {
  if (!source.includes(oldText)) {
    if (source.includes(newText)) {
      console.log(`Already applied: ${label}`);
      return source;
    }
    throw new Error(`Could not find expected source for: ${label}`);
  }
  console.log(`Applying: ${label}`);
  return source.replace(oldText, newText);
}

builder = replaceOnce(
  builder,
  "const base = { bgColor: '#ffffff', padding: '20', align: 'left', fontFamily: 'DM Sans', fontSize: '16', color: '#333333' };",
  "const base = { bgColor: '#ffffff', padding: '20', align: 'left', fontFamily: 'DM Sans', fontSize: '16', color: '#333333', borderWidth: '0', borderColor: '#e5e7eb', borderRadius: '0' };",
  'default border properties'
);

builder = replaceOnce(
  builder,
  "  const addBlock = (type: string, subtype?: string) => { const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype) }; setBlocks([...blocks, newBlock]); setSelectedBlockId(newBlock.id); };",
  `  const addBlock = (type: string, subtype?: string) => {
    const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype) };
    setBlocks(currentBlocks => {
      if (!selectedBlockId) return [...currentBlocks, newBlock];
      const selectedIndex = currentBlocks.findIndex(block => block.id === selectedBlockId);
      if (selectedIndex === -1) return [...currentBlocks, newBlock];
      const nextBlocks = [...currentBlocks];
      nextBlocks.splice(selectedIndex + 1, 0, newBlock);
      return nextBlocks;
    });
    setSelectedBlockId(newBlock.id);
  };`,
  'insert new block below selected block'
);

builder = replaceOnce(
  builder,
  "      const wrapStyle = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;`;",
  "      const wrapStyle = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;border:${p.borderWidth || 0}px solid ${p.borderColor || '#e5e7eb'};border-radius:${p.borderRadius || 0}px;`;",
  'export border styles'
);

builder = replaceOnce(
  builder,
  "                        lineHeight: 1.6\n                      }}",
  "                        lineHeight: 1.6,\n                        border: `${mod.props.borderWidth || 0}px solid ${mod.props.borderColor || '#e5e7eb'}`,\n                        borderRadius: `${mod.props.borderRadius || 0}px`\n                      }}",
  'preview border styles'
);

builder = replaceOnce(
  builder,
  "                    {(['left', 'center', 'right'] as const).map(a => (",
  "                    {(['left', 'center', 'right', 'justify'] as const).map(a => (",
  'justify alignment option'
);

builder = replaceOnce(
  builder,
  "                        {a === 'left' ? '◀ Esq' : a === 'center' ? '● Centro' : 'Dir ▶'}",
  "                        {a === 'left' ? '◀ Esq' : a === 'center' ? '● Centro' : a === 'right' ? 'Dir ▶' : '☰ Just.'}",
  'justify alignment label'
);

builder = replaceOnce(
  builder,
  `                  <label className="vpb-label">Padding ({selectedBlock.props.padding || 20}px)</label>
                  <input type="range" min="0" max="120" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.padding || 20} onChange={e => updateProp('padding', e.target.value)} />

                  <label className="vpb-label">Alinhamento</label>`,
  `                  <label className="vpb-label">Padding ({selectedBlock.props.padding || 20}px)</label>
                  <input type="range" min="0" max="120" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.padding || 20} onChange={e => updateProp('padding', e.target.value)} />

                  <label className="vpb-label">Contorno ({selectedBlock.props.borderWidth || 0}px)</label>
                  <input type="range" min="0" max="12" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.borderWidth || 0} onChange={e => updateProp('borderWidth', e.target.value)} />

                  <label className="vpb-label">Cor do Contorno</label>
                  <div className="vpb-color-row">
                    <input type="color" className="vpb-color-picker" value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />
                    <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />
                  </div>

                  <label className="vpb-label">Arredondamento do Bloco ({selectedBlock.props.borderRadius || 0}px)</label>
                  <input type="range" min="0" max="48" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.borderRadius || 0} onChange={e => updateProp('borderRadius', e.target.value)} />

                  <label className="vpb-label">Alinhamento</label>`,
  'border controls'
);

types = replaceOnce(
  types,
  "    color?: string;\n    fontSize?: string | number;",
  "    color?: string;\n    borderWidth?: string | number;\n    borderColor?: string;\n    borderRadius?: string | number;\n    fontSize?: string | number;",
  'builder border types'
);

fs.writeFileSync(builderPath, builder);
fs.writeFileSync(typesPath, types);
console.log('Visual Builder productivity patch complete.');
