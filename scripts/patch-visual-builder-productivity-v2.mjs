import fs from 'node:fs';

const files = {
  builder: 'src/components/ModulesAndContent.tsx',
  html: 'src/utils/builderHtml.ts',
  types: 'src/types.ts',
  progress: 'src/hooks/useLessonProgress.ts',
  runtime: 'src/components/PWARuntime.tsx',
};

const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, fs.readFileSync(path, 'utf8')]));

function replaceOnce(text, before, after, label) {
  if (text.includes(after)) {
    console.log(`Already applied: ${label}`);
    return text;
  }
  if (!text.includes(before)) throw new Error(`Expected source not found: ${label}`);
  console.log(`Applying: ${label}`);
  return text.replace(before, after);
}

let builder = source.builder;
let html = source.html;
let types = source.types;
let progress = source.progress;
let runtime = source.runtime;

builder = replaceOnce(
  builder,
  "  const addBlock = (type: string, subtype?: string) => { const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype,storageConfig.language) }; setBlocks(current => [...current, newBlock]); setSelectedBlockId(newBlock.id); };",
  `  const addBlock = (type: string, subtype?: string) => {
    const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype,storageConfig.language) };
    setBlocks(current => {
      if (!selectedBlockId) return [...current, newBlock];
      const selectedIndex = current.findIndex(block => block.id === selectedBlockId);
      if (selectedIndex < 0) return [...current, newBlock];
      const next = [...current];
      next.splice(selectedIndex + 1, 0, newBlock);
      return next;
    });
    setSelectedBlockId(newBlock.id);
  };`,
  'insert block below selection'
);

builder = replaceOnce(
  builder,
  `                <button className="vpb-module-btn" onClick={() => addBlock('text')}><AlignLeft className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Parágrafo longo</div></div></button>`,
  `                <button className="vpb-module-btn" onClick={() => addBlock('text')}><AlignLeft className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Parágrafo longo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('html')}><Code className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Código / HTML</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Trecho HTML seguro</div></div></button>`,
  'safe HTML block button'
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
                      <label className="vpb-label">HTML seguro</label>
                      <textarea className="vpb-textarea" rows={10} spellCheck={false} style={{ fontFamily: 'monospace', fontSize: '12px' }} value={selectedBlock.props.content || ''} onChange={e => updateProp('content', e.target.value)} />
                      <p className="vpb-html-help">Scripts, eventos inline e conteúdo inseguro são removidos. Para JavaScript, use o modo Código HTML da aula com “Interativo isolado”.</p>
                    </>
                  )}`,
  'safe HTML block editor'
);

builder = replaceOnce(
  builder,
  `                        fontFamily: '\${mod.props.fontFamily}', sans-serif`, color: mod.props.color, fontSize: \`\${mod.props.fontSize}px\`,
                        lineHeight: 1.6, marginTop:\`\${mod.props.marginTop || 0}px\`, marginBottom:\`\${mod.props.marginBottom || 0}px\`
                      }}`,
  `                        fontFamily: '\${mod.props.fontFamily}', sans-serif`, color: mod.props.color, fontSize: \`\${mod.props.fontSize}px\`,
                        lineHeight: 1.6, marginTop:\`\${mod.props.marginTop || 0}px\`, marginBottom:\`\${mod.props.marginBottom || 0}px\`,
                        border: \`\${mod.props.borderWidth || 0}px solid \${mod.props.borderColor || '#e5e7eb'}\`,
                        borderRadius: \`\${mod.props.borderRadius || 0}px\`
                      }}`,
  'preview block border'
);

builder = replaceOnce(
  builder,
  `                  <label className="vpb-label">Alinhamento</label>
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                    {(['left', 'center', 'right'] as const).map(a => (`,
  `                  <label className="vpb-label">Contorno do bloco (px)</label>
                  <input type="number" className="vpb-input" min="0" max="12" value={selectedBlock.props.borderWidth ?? 0} onChange={e => updateProp('borderWidth', e.target.value)} />
                  <label className="vpb-label">Cor do contorno</label>
                  <div className="vpb-color-row">
                    <input type="color" className="vpb-color-picker" value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />
                    <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.borderColor || '#e5e7eb'} onChange={e => updateProp('borderColor', e.target.value)} />
                  </div>
                  <label className="vpb-label">Arredondamento externo (px)</label>
                  <input type="number" className="vpb-input" min="0" max="200" value={selectedBlock.props.borderRadius ?? 0} onChange={e => updateProp('borderRadius', e.target.value)} />

                  <label className="vpb-label">Alinhamento</label>
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                    {(['left', 'center', 'right', 'justify'] as const).map(a => (`,
  'border controls and justify option'
);

builder = replaceOnce(
  builder,
  `{a === 'left' ? '◀ Esq' : a === 'center' ? '● Centro' : 'Dir ▶'}`,
  `{a === 'left' ? '◀ Esq' : a === 'center' ? '● Centro' : a === 'right' ? 'Dir ▶' : '☰ Just.'}`,
  'justify label'
);

html = replaceOnce(
  html,
  "    const base = { bgColor: '#ffffff', padding: '20', align: 'left', fontFamily: 'DM Sans', fontSize: '16', color: '#333333', gap: '16', borderRadius: '8' };",
  "    const base = { bgColor: '#ffffff', padding: '20', align: 'left', fontFamily: 'DM Sans', fontSize: '16', color: '#333333', gap: '16', borderRadius: '8', borderWidth: '0', borderColor: '#e5e7eb' };",
  'builder border defaults'
);

html = replaceOnce(
  html,
  "      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };",
  "      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };\n      case 'html': return { ...base, content: '<div style=\"padding:16px;background:#f8fafc;border-radius:12px;\">Seu HTML seguro aqui</div>', align: 'left' };",
  'safe HTML defaults'
);

html = replaceOnce(
  html,
  "    maxWidth: [0,1600], marginTop: [0,200], marginBottom: [0,200], padding: [0,120], gap: [0,64], borderRadius: [0,200], width: [10,100], imageWidth: [10,100], videoWidth: [10,100],",
  "    maxWidth: [0,1600], marginTop: [0,200], marginBottom: [0,200], padding: [0,120], gap: [0,64], borderRadius: [0,200], borderWidth: [0,12], width: [10,100], imageWidth: [10,100], videoWidth: [10,100],",
  'border width normalization'
);

html = replaceOnce(
  html,
  "  for (const key of ['bgColor','color','titleColor','subtitleColor','buttonColor','buttonTextColor','dividerColor','cardBgColor','columnBgColor','quoteColor']) {",
  "  for (const key of ['bgColor','color','titleColor','subtitleColor','buttonColor','buttonTextColor','dividerColor','cardBgColor','columnBgColor','quoteColor','borderColor']) {",
  'border color validation'
);

html = replaceOnce(
  html,
  "  if (!['left','center','right'].includes(p.align || '')) p.align = 'left';",
  "  if (!['left','center','right','justify'].includes(p.align || '')) p.align = 'left';",
  'justify normalization'
);

html = replaceOnce(
  html,
  "      case 'text': return `<p style=\"white-space:pre-wrap;margin:0;\">${escapeHtml(p.content)}</p>`;",
  "      case 'text': return `<p style=\"white-space:pre-wrap;margin:0;\">${escapeHtml(p.content)}</p>`;\n      case 'html': return sanitizeImportedHtml(String(p.content || ''));",
  'safe HTML rendering'
);

html = replaceOnce(
  html,
  "    const style = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;margin-top:${p.marginTop || 0}px;margin-bottom:${p.marginBottom || 0}px;`;",
  "    const style = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;margin-top:${p.marginTop || 0}px;margin-bottom:${p.marginBottom || 0}px;border:${p.borderWidth || 0}px solid ${p.borderColor || '#e5e7eb'};border-radius:${p.borderRadius || 0}px;`;",
  'export block border'
);

types = replaceOnce(
  types,
  "    color?: string;\n    fontSize?: string | number;",
  "    color?: string;\n    borderWidth?: string | number;\n    borderColor?: string;\n    fontSize?: string | number;",
  'border types'
);

progress = replaceOnce(
  progress,
  `    complete:(moduleId:number,lessonId:number)=>{
      const id=lessonKey(moduleId,lessonId);
      if(latest.current.value.completed.includes(id))return false;
      save({...latest.current.value,completed:[...latest.current.value.completed,id]});return true;
    }`,
  `    complete:(moduleId:number,lessonId:number)=>{
      const id=lessonKey(moduleId,lessonId);
      if(latest.current.value.completed.includes(id))return false;
      save({...latest.current.value,completed:[...latest.current.value.completed,id]});return true;
    },
    uncomplete:(moduleId:number,lessonId:number)=>{
      const id=lessonKey(moduleId,lessonId);
      if(!latest.current.value.completed.includes(id))return false;
      save({...latest.current.value,completed:latest.current.value.completed.filter(item=>item!==id)});return true;
    }`,
  'reversible lesson progress'
);

runtime = replaceOnce(
  runtime,
  `  const handleSimulateCompletion = () => {
    if (canCompleteLesson && !isCurrentLessonCompleted && selectedMockupModuleId !== null && selectedMockupSubmoduleId !== null && learning.complete(selectedMockupModuleId,selectedMockupSubmoduleId)) {`,
  `  const handleSimulateCompletion = () => {
    if (isCurrentLessonCompleted && selectedMockupModuleId !== null && selectedMockupSubmoduleId !== null) {
      learning.uncomplete(selectedMockupModuleId,selectedMockupSubmoduleId);
      setCanCompleteLesson(true);
      return;
    }
    if (canCompleteLesson && selectedMockupModuleId !== null && selectedMockupSubmoduleId !== null && learning.complete(selectedMockupModuleId,selectedMockupSubmoduleId)) {`,
  'completion toggle handler'
);

runtime = replaceOnce(
  runtime,
  `                              <div className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full transition-all text-green-500 bg-green-500/10">
                                <div style={{ background: '#22c55e', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  <Check size={12} strokeWidth={4} />
                                </div>
                                <span>{t('app.modules.completed_status')}</span>
                              </div>`,
  `                              <button type="button" onClick={handleSimulateCompletion} className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full transition-all text-green-500 bg-green-500/10" style={{ border: 'none', cursor: 'pointer' }} title="Marcar como não concluída">
                                <div style={{ background: '#22c55e', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  <Check size={12} strokeWidth={4} />
                                </div>
                                <span>{t('app.modules.completed_status')}</span>
                              </button>`,
  'completed status button'
);

for (const [key, path] of Object.entries(files)) fs.writeFileSync(path, { builder, html, types, progress, runtime }[key]);
console.log('Visual Builder productivity v2 patch complete.');
