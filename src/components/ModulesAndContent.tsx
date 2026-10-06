import React, { useRef, useState } from 'react';
import {
  ArrowLeft, Check, LayoutGrid, Columns, Grid, Image as ImageIcon,
  Quote, Zap, Type, AlignLeft, Link as LinkIcon, Minus,
  SeparatorHorizontal, Trash2, Layers, Video, Globe, Code, Upload, Eye, ArrowUp, ArrowDown, Copy
} from 'lucide-react';
import { SubModule, BuilderBlock } from '../types';
import { GOOGLE_FONTS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { interactiveWarnings, normalizeHtmlPaste } from '../utils/interactiveHtml';
import { HtmlFrame } from './HtmlFrame';
import { sanitizeImportedHtml } from '../utils/htmlSecurity';
import { BUILDER_CSS, builderFontLinks, generateBuilderHtml, getBlockInnerHtml, getDefaultProps, normalizedBlockProps, reorderBlocks, safeLinkUrl } from '../utils/builderHtml';
import { openExternalLink } from '../utils/externalLinks';

interface ModulesAndContentProps {
  submodule: SubModule;
  onSave: (html: string, builderData: BuilderBlock[], htmlMode?: 'visual' | 'code') => void;
  onClose: () => void;
}

export function ModulesAndContent({ submodule, onSave, onClose }: ModulesAndContentProps) {
  const updateSubmoduleContent = useAppStore(state => state.updateSubmoduleContent);
  const editingSubmodule = useAppStore(state => state.editingSubmodule);

  const [blocks, setBlocks] = useState<BuilderBlock[]>(submodule.builder_data || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>(submodule.htmlMode || 'visual');
  const [submoduleName, setSubmoduleName] = useState(submodule.name || '');
  const [contentType, setContentType] = useState<'web' | 'html' | 'youtube' | 'vimeo' | 'panda'>(submodule.contentType || 'html');
  const [contentUrl, setContentUrl] = useState(submodule.contentUrl || '');
  const [contentHtml, setContentHtml] = useState(submodule.customHtml || (submodule.htmlMode === 'code' ? submodule.contentHtml || submodule.content_html || '' : ''));
  const [htmlInteractive,setHtmlInteractive] = useState(submodule.htmlInteractive === true);
  const [hasCustomHtml, setHasCustomHtml] = useState(Boolean(submodule.customHtml || submodule.htmlMode === 'code'));
  const [htmlImportStatus, setHtmlImportStatus] = useState('');
  const htmlFileInputRef = useRef<HTMLInputElement>(null);
  const [timeGateSeconds, setTimeGateSeconds] = useState(submodule.gamificationConfig?.timeGateSeconds || 0);
  const [enableCelebration, setEnableCelebration] = useState(submodule.gamificationConfig?.enableCelebration ?? true);

  React.useEffect(() => {
    setSubmoduleName(submodule.name || '');
    setBlocks(submodule.builder_data || []);
    setViewMode(submodule.htmlMode || 'visual');
    setHtmlInteractive(submodule.htmlInteractive === true);
    setContentType(submodule.contentType || 'html');
    setContentUrl(submodule.contentUrl || '');
    setContentHtml(submodule.customHtml || (submodule.htmlMode === 'code' ? submodule.contentHtml || submodule.content_html || '' : ''));
    setHasCustomHtml(Boolean(submodule.customHtml || submodule.htmlMode === 'code'));
    setHtmlImportStatus('');
    setTimeGateSeconds(submodule.gamificationConfig?.timeGateSeconds || 0);
    setEnableCelebration(submodule.gamificationConfig?.enableCelebration ?? true);
  }, [submodule]);

  const handleSave = () => {
    let finalHtml = '';
    let finalBlocks: BuilderBlock[] = [];
    if (contentType === 'html') {
      finalHtml = viewMode === 'visual' ? generateHTML() : contentHtml;
      finalBlocks = blocks;
    }
    if (editingSubmodule) {
      updateSubmoduleContent({
        modId: editingSubmodule.modId,
        subId: editingSubmodule.subId,
        name: submoduleName,
        contentType,
        contentUrl,
        contentHtml: contentType === 'html' ? finalHtml : '',
        customHtml: contentType === 'html' && hasCustomHtml ? contentHtml : '',
        content: contentType === 'html' ? finalHtml : '',
        builderData: finalBlocks,
        htmlMode: contentType === 'html' ? viewMode : undefined,
        htmlInteractive: contentType === 'html' && viewMode === 'code' && htmlInteractive,
        gamificationConfig: { timeGateSeconds, enableCelebration }
      });
      onSave(finalHtml, finalBlocks, contentType === 'html' ? viewMode : undefined);
    }
  };

  const generateId = () => 'mod_' + Math.random().toString(36).substr(2, 9);
  const addBlock = (type: string, subtype?: string) => { const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype) }; setBlocks(current => [...current, newBlock]); setSelectedBlockId(newBlock.id); };
  const updateProp = <K extends keyof BuilderBlock['props']>(key: K, value: BuilderBlock['props'][K]) => { setBlocks(current => current.map(b => b.id === selectedBlockId ? { ...b, props: { ...b.props, [key]: value } } : b)); };
  const moveBlock = (id: string, dir: number) => setBlocks(current => reorderBlocks(current, id, dir));
  const duplicateBlock = (id: string) => { const newId = generateId(); setBlocks(current => current.flatMap(block => block.id === id ? [block, { ...block, id: newId, props: { ...block.props } }] : [block])); setSelectedBlockId(newId); };
  const deleteBlock = (id: string) => { setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, propKey: any) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { updateProp(propKey, ev.target?.result); }; reader.readAsDataURL(file); };

  const handleHtmlImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
    if (!/\.html?$/i.test(file.name)) { setHtmlImportStatus('Escolha um arquivo .html ou .htm.'); return; }
    if (file.size > 5 * 1024 * 1024) { setHtmlImportStatus('O arquivo é maior que 5 MB. Reduza-o antes de importar.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const importedHtml = typeof reader.result === 'string' ? reader.result : '';
      const hasRelativeAssets = /(?:src|href)=["'](?!https?:|data:|#|mailto:|tel:|\/)[^"']+/i.test(importedHtml);
      setContentHtml(normalizeHtmlPaste(importedHtml)); setHasCustomHtml(true);
      setHtmlImportStatus(hasRelativeAssets ? `${file.name} importado. Atenção: arquivos locais referenciados por caminho relativo não foram incorporados.` : `${file.name} importado. Confira o preview antes de salvar.`);
      setViewMode('code');
    };
    reader.onerror = () => setHtmlImportStatus('Não foi possível ler o arquivo HTML.');
    reader.readAsText(file);
  };

  const generateHTML = () => generateBuilderHtml(blocks);
  const rawSelectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedBlock = rawSelectedBlock ? { ...rawSelectedBlock, props: normalizedBlockProps(rawSelectedBlock) } : undefined;

  React.useEffect(() => {
    const holder = document.createElement('div'); holder.innerHTML = builderFontLinks(blocks);
    const links = Array.from(holder.querySelectorAll('link')); links.forEach(link => document.head.appendChild(link));
    return () => links.forEach(link => link.remove());
  }, [blocks.map(block => `${block.props.fontFamily}/${block.props.titleFontFamily}`).join('|')]);

  return (
    <div className="vpb-overlay" style={{ position:'fixed', inset:0, zIndex:200, background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <header className="vpb-header">
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}><button className="btn-ghost" onClick={onClose}><ArrowLeft size={16}/> Voltar</button><span style={{ fontFamily:'Syne', fontWeight:600, fontSize:'15px' }}>{submoduleName}</span></div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {contentType === 'html' && <div style={{ background:'var(--surface)', padding:'4px', borderRadius:'8px', display:'flex', gap:'4px', marginRight:'16px' }}>
            <button style={{ padding:'6px 12px', fontSize:'12px', borderRadius:'6px', border:'none', background:viewMode==='visual'?'var(--accent)':'transparent', color:viewMode==='visual'?'white':'var(--text)', cursor:'pointer', fontWeight:600 }} onClick={()=>setViewMode('visual')}>Visual</button>
            <button style={{ padding:'6px 12px', fontSize:'12px', borderRadius:'6px', border:'none', background:viewMode==='code'?'var(--accent)':'transparent', color:viewMode==='code'?'white':'var(--text)', cursor:'pointer', fontWeight:600 }} onClick={()=>{ if(viewMode==='visual'&&!hasCustomHtml)setContentHtml(generateHTML()); setViewMode('code'); }}>Código HTML</button>
          </div>}
          <div className="vpb-header-actions"><button className="btn-primary" onClick={handleSave}><Check size={16}/> Salvar Aula</button><button className="btn-ghost" onClick={onClose}>Cancelar</button></div>
        </div>
      </header>
      <style>{BUILDER_CSS}</style>
      <div className="vpb-body">
        {contentType === 'html' && viewMode === 'visual' ? <>
          <aside className="vpb-sidebar">
            <div className="vpb-sidebar-title">Adicionar Bloco</div>
            <div className="vpb-lib-group"><div className="vpb-lib-label">Containers</div>
              <button className="vpb-module-btn" onClick={()=>addBlock('container','hero')}><LayoutGrid className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Hero</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Destaque com fundo</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('container','oneColumn')}><LayoutGrid className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>1 Coluna</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Seção de título e texto</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('container','twoColumn')}><Columns className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>2 Colunas</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Layout lado a lado</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('container','threeColumn')}><Grid className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>3 Colunas</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Grade com 3 cards</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('container','imageText')}><ImageIcon className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Imagem + Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Img descritiva</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('container','testimonial')}><Quote className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Depoimento</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Card citação</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('container','cta')}><Zap className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>CTA</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Call to action</div></div></button>
            </div>
            <div className="vpb-lib-group"><div className="vpb-lib-label">Elementos</div>
              <button className="vpb-module-btn" onClick={()=>addBlock('header')}><Type className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Cabeçalho</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Título e Subtítulo</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('text')}><AlignLeft className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Parágrafo longo</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('image')}><ImageIcon className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Imagem</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Upload direto</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('video')}><Video className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Vídeo</div><div style={{fontSize:'10px',color:'var(--muted)'}}>YouTube ou Shorts</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('link')}><LinkIcon className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Botão / Link</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Link externo</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('spacer')}><Minus className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Espaçador</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Espaço invisível</div></div></button>
              <button className="vpb-module-btn" onClick={()=>addBlock('divider')}><SeparatorHorizontal className="vpb-module-icon" size={16}/><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Divisor</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Linha horizontal</div></div></button>
            </div>
          </aside>
          <main className="vpb-canvas-area" onClick={()=>setSelectedBlockId(null)} style={{ background:'var(--bg)', minHeight:'100%', position:'relative' }}>
            {hasCustomHtml && contentHtml.trim() && <div className="vpb-html-preserved-note">O HTML personalizado está preservado no modo Código e não será convertido em blocos visuais.</div>}
            {blocks.length===0 ? <div className="empty-state" style={{margin:'auto'}}><Layers size={48} color="var(--muted)" style={{marginBottom:16}}/><div style={{fontSize:16,fontWeight:600}}>Comece a construir</div><div style={{fontSize:12,color:'var(--muted)'}}>Clique num módulo à esquerda para adicionar blocos visuais.</div></div> :
            <div className="vpb-canvas-paper appify-builder-document">{blocks.map((block,index)=>{const mod={...block,props:normalizedBlockProps(block)};return <div key={mod.id} className={`appify-builder-block vpb-block-wrapper ${mod.id===selectedBlockId?'selected':''}`} style={{background:mod.props.bgColor,padding:`${mod.props.padding}px`,textAlign:mod.props.align as any,fontFamily:`'${mod.props.fontFamily}', sans-serif`,color:mod.props.color,fontSize:`${mod.props.fontSize}px`,lineHeight:1.6,marginTop:`${mod.props.marginTop||0}px`,marginBottom:`${mod.props.marginBottom||0}px`}} onClick={e=>{e.stopPropagation();setSelectedBlockId(mod.id);}}><div className="appify-builder-content" style={{maxWidth:mod.props.maxWidth&&Number(mod.props.maxWidth)>0?`${mod.props.maxWidth}px`:undefined,marginLeft:mod.props.maxWidth?'auto':undefined,marginRight:mod.props.maxWidth?'auto':undefined}} onClick={e=>{if((e.target as HTMLElement).closest('a'))e.preventDefault();}} dangerouslySetInnerHTML={{__html:sanitizeImportedHtml(getBlockInnerHtml(mod))}}/><div className="vpb-block-actions"><button type="button" className="vpb-action-btn" disabled={index===0} onClick={e=>{e.stopPropagation();moveBlock(mod.id,-1);}}><ArrowUp size={14}/></button><button type="button" className="vpb-action-btn" disabled={index===blocks.length-1} onClick={e=>{e.stopPropagation();moveBlock(mod.id,1);}}><ArrowDown size={14}/></button><button type="button" className="vpb-action-btn" onClick={e=>{e.stopPropagation();duplicateBlock(mod.id);}}><Copy size={14}/></button><button type="button" className="vpb-action-btn delete" onClick={e=>{e.stopPropagation();deleteBlock(mod.id);}}><Trash2 size={14}/></button></div></div>})}</div>}
          </main>
        </> : <main className="vpb-canvas-area" style={{width:'100%',padding:'24px',background:'var(--bg)',overflowY:'auto'}}><div style={{maxWidth:'800px',margin:'0 auto',width:'100%'}}>{contentType==='html'?<div className="vpb-lib-group" style={{background:'var(--surface)',padding:'24px',borderRadius:'16px',border:'1px solid var(--border)'}}><div className="vpb-html-editor-heading"><div className="vpb-lib-label" style={{display:'flex',alignItems:'center',gap:'8px',margin:0}}><Code size={16}/> HTML personalizado</div><input ref={htmlFileInputRef} type="file" accept=".html,.htm,text/html" hidden onChange={handleHtmlImport}/><button type="button" className="btn-ghost" onClick={()=>htmlFileInputRef.current?.click()}><Upload size={15}/> Importar .html</button></div><label className="vpb-label">Tipo de HTML</label><select className="vpb-input" value={htmlInteractive?'interactive':'static'} onChange={e=>setHtmlInteractive(e.target.value==='interactive')}><option value="static">Estático — textos, imagens e links</option><option value="interactive">Interativo isolado — timers, exercícios e quizzes locais</option></select><p className="vpb-html-help">{htmlInteractive?'Executa JavaScript inline na atividade, sem acesso aos projetos, rede, cookies ou armazenamento.':'Scripts e controles interativos são removidos.'}</p>{htmlInteractive&&interactiveWarnings(contentHtml).map(w=><p key={w} className="vpb-html-import-status">{w}</p>)}<button type="button" className="btn-ghost" onClick={()=>setContentHtml(normalizeHtmlPaste(contentHtml))}>Limpar formatação de código copiado</button>{htmlImportStatus&&<div className="vpb-html-import-status">{htmlImportStatus}</div>}<div className="vpb-html-code-layout"><div><textarea className="vpb-textarea vpb-html-code-input" value={contentHtml} onChange={e=>{setContentHtml(e.target.value);setHasCustomHtml(true);setHtmlImportStatus('');}} spellCheck={false}/></div><div className="vpb-html-preview-panel"><div className="vpb-html-preview-title"><Eye size={14}/> Preview mobile</div><HtmlFrame interactive={htmlInteractive} title="Preview do HTML personalizado" html={contentHtml}/></div></div></div>:<div style={{textAlign:'center',padding:'60px 20px'}}><div style={{width:'80px',height:'80px',background:'var(--surface2)',borderRadius:'24px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',color:'var(--accent)'}}>{contentType==='web'?<Globe size={40}/>:<Video size={40}/>}</div><h2 style={{fontFamily:'Syne',fontSize:'24px',marginBottom:'8px'}}>Configuração de {contentType==='web'?'Página Externa':'Vídeo'}</h2><div style={{background:'var(--surface)',padding:'32px',borderRadius:'20px',border:'1px solid var(--border)',textAlign:'left'}}><label className="vpb-label">URL do Conteúdo</label><input className="vpb-input" value={contentUrl} onChange={e=>setContentUrl(e.target.value)}/></div></div>}</div></main>}

        <aside className="vpb-sidebar-right"><div className="vpb-sidebar-title">Propriedades da Aula</div><div style={{padding:'24px 16px'}}>
          <div style={{marginBottom:'24px'}}><label className="vpb-label">Título da Aula</label><input className="vpb-input" value={submoduleName} onChange={e=>setSubmoduleName(e.target.value)}/></div>
          <div style={{marginBottom:'24px'}}><label className="vpb-label">Tipo de Conteúdo</label><select className="vpb-input" value={contentType} onChange={e=>setContentType(e.target.value as any)}><option value="html">HTML Nativo (Editor Visual)</option><option value="web">Página Web (URL Externa)</option><option value="youtube">Vídeo: YouTube</option><option value="vimeo">Vídeo: Vimeo</option><option value="panda">Vídeo: Panda Video</option></select></div>
          {selectedBlock&&contentType==='html'&&<div className="animate-in fade-in slide-in-from-right-4 duration-300"><div className="vpb-prop-group"><span className="vpb-lib-label">Conteúdo do Bloco</span>
            {selectedBlock.type==='header'&&<><label className="vpb-label">Título</label><input className="vpb-input" value={selectedBlock.props.title||''} onChange={e=>updateProp('title',e.target.value)}/><label className="vpb-label">Subtítulo</label><input className="vpb-input" value={selectedBlock.props.subtitle||''} onChange={e=>updateProp('subtitle',e.target.value)}/></>}
            {selectedBlock.type==='text'&&<><label className="vpb-label">Texto</label><textarea className="vpb-textarea" value={selectedBlock.props.content||''} onChange={e=>updateProp('content',e.target.value)}/></>}
            {selectedBlock.type==='image'&&<><label className="vpb-label">Upload de Imagem</label><input type="file" className="vpb-input" accept="image/*" onChange={e=>handleImageUpload(e,'src')}/><label className="vpb-label">Largura ({selectedBlock.props.width??100}%)</label><input type="range" min="10" max="100" value={selectedBlock.props.width??100} onChange={e=>updateProp('width',e.target.value)}/></>}
            {selectedBlock.type==='video'&&<><label className="vpb-label">URL do YouTube / Shorts</label><input className="vpb-input" value={selectedBlock.props.url||''} onChange={e=>updateProp('url',e.target.value)}/><label className="vpb-label">Título acessível</label><input className="vpb-input" value={selectedBlock.props.videoTitle||'Vídeo'} onChange={e=>updateProp('videoTitle',e.target.value)}/><label className="vpb-label">Capa personalizada</label><input type="file" className="vpb-input" accept="image/*" onChange={e=>handleImageUpload(e,'videoPoster')}/><label className="vpb-label">Largura ({selectedBlock.props.videoWidth??100}%)</label><input type="range" min="10" max="100" value={selectedBlock.props.videoWidth??100} onChange={e=>updateProp('videoWidth',e.target.value)}/><label className="vpb-label">Proporção</label><select className="vpb-input" value={selectedBlock.props.videoAspectRatio||'auto'} onChange={e=>updateProp('videoAspectRatio',e.target.value as any)}><option value="auto">Automática</option><option value="16:9">Horizontal 16:9</option><option value="9:16">Vertical 9:16</option></select><label className="vpb-label">Legenda</label><textarea className="vpb-textarea" value={selectedBlock.props.videoCaption||''} onChange={e=>updateProp('videoCaption',e.target.value)}/></>}
            {selectedBlock.type==='link'&&<><label className="vpb-label">Texto do Botão / Link</label><input className="vpb-input" value={selectedBlock.props.text||''} onChange={e=>updateProp('text',e.target.value)}/><label className="vpb-label">URL de Destino</label><input className="vpb-input" value={selectedBlock.props.url||''} onChange={e=>updateProp('url',e.target.value)}/><label className="vpb-label">Estilo</label><select className="vpb-input" value={selectedBlock.props.style||'button'} onChange={e=>updateProp('style',e.target.value)}><option value="button">Preenchido</option><option value="outline">Contorno</option><option value="link">Link sublinhado</option></select><label className="vpb-label">Largura</label><select className="vpb-input" value={selectedBlock.props.buttonWidth||'auto'} onChange={e=>updateProp('buttonWidth',e.target.value as 'auto'|'full')}><option value="auto">Automática</option><option value="full">100% da largura</option></select><label className="vpb-label">Tamanho</label><select className="vpb-input" value={selectedBlock.props.buttonSize||'medium'} onChange={e=>updateProp('buttonSize',e.target.value as 'small'|'medium'|'large')}><option value="small">Pequeno</option><option value="medium">Médio</option><option value="large">Grande</option></select><label className="vpb-label">Cor principal</label><input type="color" className="vpb-color-picker" value={selectedBlock.props.buttonColor||'#6b8af0'} onChange={e=>updateProp('buttonColor',e.target.value)}/><label className="vpb-label">Cor do texto</label><input type="color" className="vpb-color-picker" value={selectedBlock.props.buttonTextColor||'#ffffff'} onChange={e=>updateProp('buttonTextColor',e.target.value)}/></>}
            {selectedBlock.type==='spacer'&&<><label className="vpb-label">Altura</label><input type="number" className="vpb-input" value={selectedBlock.props.height??40} onChange={e=>updateProp('height',e.target.value)}/></>}
            {selectedBlock.type==='divider'&&<><label className="vpb-label">Espessura</label><input type="number" className="vpb-input" value={selectedBlock.props.thickness??1} onChange={e=>updateProp('thickness',e.target.value)}/></>}
            {selectedBlock.type==='container'&&<><label className="vpb-label">Título</label><input className="vpb-input" value={selectedBlock.props.title||''} onChange={e=>updateProp('title',e.target.value)}/><label className="vpb-label">Texto / Subtítulo</label><textarea className="vpb-textarea" value={selectedBlock.props.text||selectedBlock.props.subtitle||''} onChange={e=>selectedBlock.subtype==='hero'||selectedBlock.subtype==='cta'?updateProp('subtitle',e.target.value):updateProp('text',e.target.value)}/></>}
          </div>
          {(selectedBlock.type==='link'||selectedBlock.subtype==='cta')&&<div className="vpb-prop-group"><button type="button" className="btn-ghost" disabled={safeLinkUrl(selectedBlock.props.url)==='#'} onClick={()=>openExternalLink(safeLinkUrl(selectedBlock.props.url))}>Testar link no navegador</button></div>}
          <div className="vpb-prop-group"><span className="vpb-lib-label">Estilos do Bloco</span>{!['image','video','spacer','divider'].includes(selectedBlock.type)&&<><label className="vpb-label">Fonte</label><select className="vpb-input" value={selectedBlock.props.fontFamily||'DM Sans'} onChange={e=>updateProp('fontFamily',e.target.value)}>{GOOGLE_FONTS.map(f=><option key={f}>{f}</option>)}</select><label className="vpb-label">Tamanho do Texto ({selectedBlock.props.fontSize??16}px)</label><input type="range" min="10" max="72" value={selectedBlock.props.fontSize??16} onChange={e=>updateProp('fontSize',e.target.value)}/></>}<label className="vpb-label">Cor de Fundo</label><input type="color" className="vpb-color-picker" value={selectedBlock.props.bgColor==='transparent'?'#ffffff':selectedBlock.props.bgColor||'#ffffff'} onChange={e=>updateProp('bgColor',e.target.value)}/><label className="vpb-label">Padding ({selectedBlock.props.padding??20}px)</label><input type="range" min="0" max="120" value={selectedBlock.props.padding??20} onChange={e=>updateProp('padding',e.target.value)}/><label className="vpb-label">Alinhamento</label><select className="vpb-input" value={selectedBlock.props.align||'left'} onChange={e=>updateProp('align',e.target.value)}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select>{(selectedBlock.type==='link'||selectedBlock.type==='video')&&<><label className="vpb-label">Arredondamento ({selectedBlock.props.borderRadius??8}px)</label><input type="range" min="0" max="48" value={selectedBlock.props.borderRadius??8} onChange={e=>updateProp('borderRadius',e.target.value)}/></>}</div>
          </div>}
          <div className="mt-8 pt-6 border-t border-[var(--border)]"><div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Gamificação & Anti-Cheat</div><label className="text-xs font-bold">Trava de Tempo</label><input type="number" className="vpb-input" value={timeGateSeconds} onChange={e=>setTimeGateSeconds(parseInt(e.target.value)||0)}/><label className="toggle-switch"><input type="checkbox" checked={enableCelebration} onChange={e=>setEnableCelebration(e.target.checked)}/><span className="toggle-slider"></span></label></div>
        </div></aside>
      </div>
    </div>
  );
}
