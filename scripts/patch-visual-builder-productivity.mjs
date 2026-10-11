import fs from 'node:fs';

const builderPath = 'src/components/ModulesAndContent.tsx';
const runtimePath = 'src/components/PWARuntime.tsx';
const typesPath = 'src/types.ts';

let builder = fs.readFileSync(builderPath, 'utf8');
let runtime = fs.readFileSync(runtimePath, 'utf8');
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
  "      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };",
  `      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };
      case 'html': return { ...base, content: '<div style="padding:16px;border-radius:12px;background:#f8fafc;">Seu HTML seguro aqui</div>', align: 'left' };`,
  'safe html block defaults'
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
  "      case 'text': return `<p style=\"margin:0;\">${p.content}</p>`;",
  `      case 'text': return \`<p style="margin:0;">\${p.content}</p>\`;
      case 'html': return sanitizeHtml(String(p.content || ''));`,
  'safe html block rendering'
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
  `                <button className="vpb-module-btn" onClick={() => addBlock('text')}><AlignLeft className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Parágrafo longo</div></div></button>`,
  `                <button className="vpb-module-btn" onClick={() => addBlock('text')}><AlignLeft className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Parágrafo longo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('html')}><Code className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Código / HTML</div><div style={{fontSize:'10px',color:'var(--muted)'}}>HTML seguro sem JavaScript</div></div></button>`,
  'safe html element button'
);

builder = replaceOnce(
  builder,
  `                  {selectedBlock.type === 'text' && (
                    <>
                      <label className="vpb-label">Texto</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.content || ''} onChange={e => updateProp('content', e.target.value)} />
                    </>
                  )}`,
  `                  {selectedBlock.type === 'text' && (
                    <>
                      <label className="vpb-label">Texto</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.content || ''} onChange={e => updateProp('content', e.target.value)} />
                    </>
                  )}

                  {selectedBlock.type === 'html' && (
                    <>
                      <label className="vpb-label">Código HTML Seguro</label>
                      <textarea
                        className="vpb-textarea"
                        style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '12px' }}
                        value={selectedBlock.props.content || ''}
                        onChange={e => updateProp('content', e.target.value)}
                        placeholder="<div style='padding:16px'>Seu HTML aqui...</div>"
                      />
                      <p style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: 1.5, marginTop: '-4px', marginBottom: '12px' }}>
                        Scripts, eventos JavaScript e recursos inseguros são removidos automaticamente. CSS inline é permitido.
                      </p>
                    </>
                  )}`,
  'safe html block editor'
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

runtime = replaceOnce(
  runtime,
  `  const handleSimulateCompletion = () => {
    if (canCompleteLesson && !isCurrentLessonCompleted) {
      setIsCurrentLessonCompleted(true);
      setMockProgressPercentage(100);
      if (selectedMockupSubmodule?.gamificationConfig?.enableCelebration ?? true) {
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 3500);
      }
    }
  };`,
  `  const handleSimulateCompletion = () => {
    if (isCurrentLessonCompleted) {
      setIsCurrentLessonCompleted(false);
      setMockProgressPercentage(0);
      return;
    }

    if (canCompleteLesson) {
      setIsCurrentLessonCompleted(true);
      setMockProgressPercentage(100);
      if (selectedMockupSubmodule?.gamificationConfig?.enableCelebration ?? true) {
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 3500);
      }
    }
  };`,
  'reversible lesson completion state'
);

runtime = replaceOnce(
  runtime,
  `                              <div className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full transition-all text-green-500 bg-green-500/10">
                                <div style={{ background: '#22c55e', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  <Check size={12} strokeWidth={4} />
                                </div>
                                <span>{t('app.modules.completed_status', 'Concluída')}</span>
                              </div>`,
  `                              <button
                                type="button"
                                onClick={handleSimulateCompletion}
                                aria-pressed="true"
                                className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full transition-all text-green-500 bg-green-500/10"
                                style={{ border: 'none', cursor: 'pointer' }}
                              >
                                <div style={{ background: '#22c55e', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  <Check size={12} strokeWidth={4} />
                                </div>
                                <span>{t('app.modules.completed_status', 'Concluída')}</span>
                              </button>`,
  'completed pill can be unchecked'
);

fs.writeFileSync(builderPath, builder);
fs.writeFileSync(runtimePath, runtime);
fs.writeFileSync(typesPath, types);
console.log('Visual Builder productivity patch complete.');
