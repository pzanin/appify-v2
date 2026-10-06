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
import { builderAudioSource, readAudioFile } from '../utils/builderAudio';

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
  const [audioImportStatus, setAudioImportStatus] = useState<{ blockId: string; message: string; kind: 'loading' | 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>(submodule.htmlMode || 'visual');
  const [submoduleName, setSubmoduleName] = useState(submodule.name || '');

  // Content Type & URL state
  const [contentType, setContentType] = useState<'web' | 'html' | 'youtube' | 'vimeo' | 'panda'>(submodule.contentType || 'html');
  const [contentUrl, setContentUrl] = useState(submodule.contentUrl || '');
  const [contentHtml, setContentHtml] = useState(
    submodule.customHtml || (submodule.htmlMode === 'code' ? submodule.contentHtml || submodule.content_html || '' : '')
  );
  const [htmlInteractive,setHtmlInteractive] = useState(submodule.htmlInteractive === true);
  const [hasCustomHtml, setHasCustomHtml] = useState(Boolean(submodule.customHtml || submodule.htmlMode === 'code'));
  const [htmlImportStatus, setHtmlImportStatus] = useState('');
  const htmlFileInputRef = useRef<HTMLInputElement>(null);

  // Gamification local state
  const [timeGateSeconds, setTimeGateSeconds] = useState(submodule.gamificationConfig?.timeGateSeconds || 0);
  const [enableCelebration, setEnableCelebration] = useState(submodule.gamificationConfig?.enableCelebration ?? true);

  // Sync state with submodule prop when it changes
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
    } else {
      finalHtml = ''; // Will be rendered based on URL/Type in the phone mockup
      finalBlocks = [];
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
        content: contentType === 'html' ? finalHtml : '', // Legacy sync
        builderData: finalBlocks,
        htmlMode: contentType === 'html' ? viewMode : undefined,
        htmlInteractive: contentType === 'html' && viewMode === 'code' && htmlInteractive,
        gamificationConfig: {
          timeGateSeconds,
          enableCelebration
        }
      });
      onSave(finalHtml, finalBlocks, contentType === 'html' ? viewMode : undefined);
    }
  };

  const generateId = () => 'mod_' + Math.random().toString(36).substr(2, 9);


  const addBlock = (type: string, subtype?: string) => { const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype) }; setBlocks(current => [...current, newBlock]); setSelectedBlockId(newBlock.id); };
  const updateProp = <K extends keyof BuilderBlock['props']>(key: K, value: BuilderBlock['props'][K]) => { setBlocks(current => current.map(b => b.id === selectedBlockId ? { ...b, props: { ...b.props, [key]: value } } : b)); };
  const moveBlock = (id: string, dir: number) => setBlocks(current => reorderBlocks(current, id, dir));
  const duplicateBlock = (id: string) => {
    const newId = generateId();
    setBlocks(current => current.flatMap(block => block.id === id ? [block, { ...block, id: newId, props: { ...block.props } }] : [block]));
    setSelectedBlockId(newId);
  };
  const deleteBlock = (id: string) => { setBlocks(current => current.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, propKey: any) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { updateProp(propKey, ev.target?.result); }; reader.readAsDataURL(file); };

  const handleHtmlImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      setHtmlImportStatus('Escolha um arquivo .html ou .htm.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setHtmlImportStatus('O arquivo é maior que 5 MB. Reduza-o antes de importar.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const importedHtml = typeof reader.result === 'string' ? reader.result : '';
      const hasRelativeAssets = /(?:src|href)=["'](?!https?:|data:|#|mailto:|tel:|\/)[^"']+/i.test(importedHtml);
      setContentHtml(normalizeHtmlPaste(importedHtml));
      setHasCustomHtml(true);
      setHtmlImportStatus(hasRelativeAssets
        ? `${file.name} importado. Atenção: arquivos locais referenciados por caminho relativo não foram incorporados.`
        : `${file.name} importado. Confira o preview antes de salvar.`);
      setViewMode('code');
    };
    reader.onerror = () => setHtmlImportStatus('Não foi possível ler o arquivo HTML.');
    reader.readAsText(file);
  };

  const generateHTML = () => generateBuilderHtml(blocks);

  const rawSelectedBlock = blocks.find(b => b.id === selectedBlockId);
  const selectedBlock = rawSelectedBlock ? { ...rawSelectedBlock, props: normalizedBlockProps(rawSelectedBlock) } : undefined;

  React.useEffect(() => {
    const holder = document.createElement('div');
    holder.innerHTML = builderFontLinks(blocks);
    const links = Array.from(holder.querySelectorAll('link'));
    links.forEach(link => document.head.appendChild(link));
    return () => links.forEach(link => link.remove());
  }, [blocks.map(block => `${block.props.fontFamily}/${block.props.titleFontFamily}`).join('|')]);

  return (
    <div className="vpb-overlay" style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <header className="vpb-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-ghost" onClick={onClose}><ArrowLeft size={16} /> Voltar</button>
          <span style={{ fontFamily: 'Syne', fontWeight: 600, fontSize: '15px' }}>{submoduleName}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {contentType === 'html' && (
            <div style={{ background: 'var(--surface)', padding: '4px', borderRadius: '8px', display: 'flex', gap: '4px', marginRight: '16px' }}>
              <button
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', background: viewMode === 'visual' ? 'var(--accent)' : 'transparent', color: viewMode === 'visual' ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setViewMode('visual')}
              >
                Visual
              </button>
              <button
                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', border: 'none', background: viewMode === 'code' ? 'var(--accent)' : 'transparent', color: viewMode === 'code' ? 'white' : 'var(--text)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => {
                  if (viewMode === 'visual' && !hasCustomHtml) setContentHtml(generateHTML());
                  setViewMode('code');
                }}
              >
                Código HTML
              </button>
            </div>
          )}
          <div className="vpb-header-actions">
            <button className="btn-primary" onClick={handleSave}>
              <Check size={16} /> Salvar Aula
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </header>

      <style>{BUILDER_CSS}</style>
      <div className="vpb-body">
        {contentType === 'html' && viewMode === 'visual' ? (
          <>
            <aside className="vpb-sidebar">
              <div className="vpb-sidebar-title">Adicionar Bloco</div>
              <div className="vpb-lib-group">
                <div className="vpb-lib-label">Containers</div>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'hero')}><LayoutGrid className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Hero</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Destaque com fundo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'oneColumn')}><LayoutGrid className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>1 Coluna</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Seção de título e texto</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'twoColumn')}><Columns className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>2 Colunas</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Layout lado a lado</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'threeColumn')}><Grid className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>3 Colunas</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Grade com 3 cards</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'imageText')}><ImageIcon className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Imagem + Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Img descritiva</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'testimonial')}><Quote className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Depoimento</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Card citação</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'cta')}><Zap className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>CTA</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Call to action</div></div></button>
              </div>

              <div className="vpb-lib-group">
                <div className="vpb-lib-label">Elementos</div>
                <button className="vpb-module-btn" onClick={() => addBlock('header')}><Type className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Cabeçalho</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Título e Subtítulo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('text')}><AlignLeft className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Texto</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Parágrafo longo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('list')}><Check className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Lista com ícones</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Benefícios ou passos</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('card')}><Layers className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Card / Destaque</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Dica ou informação importante</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('accordion')}><ArrowDown className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Acordeão</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Seção que abre e fecha</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('audio')}><Layers className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Áudio</div><div style={{fontSize:'10px',color:'var(--muted)'}}>MP3, M4A ou link externo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('image')}><ImageIcon className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Imagem</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Upload direto</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('video')}><Video className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Vídeo</div><div style={{fontSize:'10px',color:'var(--muted)'}}>YouTube ou Shorts</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('link')}><LinkIcon className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Botão / Link</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Link externo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('spacer')}><Minus className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Espaçador</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Espaço invisível</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('divider')}><SeparatorHorizontal className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Divisor</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Linha horizontal</div></div></button>
              </div>
            </aside>

            <main className="vpb-canvas-area" onClick={() => setSelectedBlockId(null)} style={{ background: 'var(--bg)', minHeight: '100%', position: 'relative' }}>
              {hasCustomHtml && contentHtml.trim() && (
                <div className="vpb-html-preserved-note">
                  O HTML personalizado está preservado no modo Código e não será convertido em blocos visuais.
                </div>
              )}
              {blocks.length === 0 ? (
                <div className="empty-state" style={{ margin: 'auto' }}>
                  <Layers size={48} color="var(--muted)" style={{ marginBottom: 16 }} />
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Comece a construir</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Clique num módulo à esquerda para adicionar blocos visuais.</div>
                </div>
              ) : (
                <div className="vpb-canvas-paper appify-builder-document">
                  {blocks.map((block, index) => { const mod = { ...block, props: normalizedBlockProps(block) }; return (
                    <div
                      key={mod.id}
                      className={`appify-builder-block vpb-block-wrapper ${mod.id === selectedBlockId ? 'selected' : ''}`}
                      style={{
                        background: mod.props.bgColor, padding: `${mod.props.padding}px`, textAlign: mod.props.align as any,
                        fontFamily: `'${mod.props.fontFamily}', sans-serif`, color: mod.props.color, fontSize: `${mod.props.fontSize}px`,
                        lineHeight: 1.6, marginTop:`${mod.props.marginTop || 0}px`, marginBottom:`${mod.props.marginBottom || 0}px`
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedBlockId(mod.id); }}
                    >
                      <div className="appify-builder-content" style={{maxWidth:mod.props.maxWidth && Number(mod.props.maxWidth)>0?`${mod.props.maxWidth}px`:undefined,marginLeft:mod.props.maxWidth?'auto':undefined,marginRight:mod.props.maxWidth?'auto':undefined}} onClick={e => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }} dangerouslySetInnerHTML={{ __html: sanitizeImportedHtml(getBlockInnerHtml(mod)) }} />
                      <div className="vpb-block-actions">
                        <button type="button" className="vpb-action-btn" aria-label="Mover bloco para cima" title="Mover para cima" disabled={index === 0} onClick={(e) => { e.stopPropagation(); moveBlock(mod.id, -1); }}><ArrowUp size={14} /></button>
                        <button type="button" className="vpb-action-btn" aria-label="Mover bloco para baixo" title="Mover para baixo" disabled={index === blocks.length - 1} onClick={(e) => { e.stopPropagation(); moveBlock(mod.id, 1); }}><ArrowDown size={14} /></button>
                        <button type="button" className="vpb-action-btn" aria-label="Duplicar bloco" title="Duplicar bloco" onClick={(e) => { e.stopPropagation(); duplicateBlock(mod.id); }}><Copy size={14} /></button>
                        <button type="button" className="vpb-action-btn delete" aria-label="Excluir bloco" title="Excluir bloco" onClick={(e) => { e.stopPropagation(); deleteBlock(mod.id); }}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ); })}
                </div>
              )}
            </main>
          </>
        ) : (
          <main className="vpb-canvas-area" style={{ width: '100%', padding: '24px', background: 'var(--bg)', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              {contentType === 'html' ? (
                <div className="vpb-lib-group" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div className="vpb-html-editor-heading">
                    <div className="vpb-lib-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Code size={16} /> HTML personalizado</div>
                    <input ref={htmlFileInputRef} type="file" accept=".html,.htm,text/html" hidden onChange={handleHtmlImport} />
                    <button type="button" className="btn-ghost" onClick={() => htmlFileInputRef.current?.click()}>
                      <Upload size={15} /> Importar .html
                    </button>
                  </div>
                  <label className="vpb-label" htmlFor="html-execution-mode">Tipo de HTML</label>
                  <select id="html-execution-mode" className="vpb-input" value={htmlInteractive?'interactive':'static'} onChange={e=>setHtmlInteractive(e.target.value==='interactive')}>
                    <option value="static">Estático — textos, imagens e links</option>
                    <option value="interactive">Interativo isolado — timers, exercícios e quizzes locais</option>
                  </select>
                  <p className="vpb-html-help">{htmlInteractive?'Executa JavaScript inline na atividade, sem acesso aos projetos, rede, cookies ou armazenamento. Tailwind padrão e cores/fontes de theme.extend são convertidos em CSS local. Outras bibliotecas externas não são executadas.':'Scripts e controles interativos são removidos. Para exercícios com JavaScript, selecione Interativo isolado.'}</p>
                  {htmlInteractive && interactiveWarnings(contentHtml).map(warning=><p key={warning} className="vpb-html-import-status">{warning}</p>)}
                  <button type="button" className="btn-ghost" onClick={()=>setContentHtml(normalizeHtmlPaste(contentHtml))}>Limpar formatação de código copiado</button>
                  {htmlImportStatus && <div className="vpb-html-import-status">{htmlImportStatus}</div>}
                  <div className="vpb-html-code-layout">
                    <div>
                      <textarea
                        className="vpb-textarea vpb-html-code-input"
                        value={contentHtml}
                        onChange={(e) => { setContentHtml(e.target.value); setHasCustomHtml(true); setHtmlImportStatus(''); }}
                        placeholder="Cole seu HTML aqui ou use Importar .html"
                        spellCheck={false}
                      />
                      <p className="vpb-html-help">O código é mantido como HTML e não é convertido em blocos. O Appify aplica apenas uma camada responsiva no preview e no PWA.</p>
                    </div>
                    <div className="vpb-html-preview-panel">
                      <div className="vpb-html-preview-title"><Eye size={14} /> Preview mobile</div>
                      <HtmlFrame
                        interactive={htmlInteractive}
                        title="Preview do HTML personalizado"
                        html={contentHtml}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--surface2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--accent)' }}>
                    {contentType === 'web' ? <Globe size={40} /> : <Video size={40} />}
                  </div>
                  <h2 style={{ fontFamily: 'Syne', fontSize: '24px', marginBottom: '8px' }}>Configuração de {contentType === 'web' ? 'Página Externa' : 'Vídeo'}</h2>
                  <p style={{ color: 'var(--muted)', marginBottom: '32px' }}>Insira a URL abaixo para carregar o conteúdo automaticamente no app.</p>

                  <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: '20px', border: '1px solid var(--border)', textAlign: 'left' }}>
                    <label className="vpb-label" style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>URL do Conteúdo</label>
                    <input
                      type="text"
                      className="vpb-input"
                      style={{ height: '48px', fontSize: '15px', background: 'var(--surface2)' }}
                      placeholder={contentType === 'web' ? "https://seusite.com/pagina" : "https://youtube.com/watch?v=..."}
                      value={contentUrl}
                      onChange={(e) => setContentUrl(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px', padding: '12px', background: 'rgba(107,138,240,0.05)', borderRadius: '12px', border: '1px solid rgba(107,138,240,0.1)' }}>
                      <Zap size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', color: 'var(--text)', margin: 0, lineHeight: 1.5 }}>
                        {contentType === 'web'
                          ? "Este link será aberto dentro do app usando um componente de WebView seguro."
                          : "O player de vídeo será otimizado automaticamente para a melhor experiência mobile."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        <aside className="vpb-sidebar-right">
          <div className="vpb-sidebar-title">Propriedades da Aula</div>
          <div style={{ padding: '24px 16px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label className="vpb-label">Título da Aula</label>
              <input
                type="text"
                className="vpb-input"
                value={submoduleName}
                onChange={(e) => setSubmoduleName(e.target.value)}
                placeholder="Ex: Introdução ao Módulo"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="vpb-label">Tipo de Conteúdo</label>
              <select
                className="vpb-input"
                value={contentType}
                onChange={(e) => setContentType(e.target.value as any)}
                style={{ cursor: 'pointer', fontWeight: 600 }}
              >
                <option value="html">HTML Nativo (Editor Visual)</option>
                <option value="web">Página Web (URL Externa)</option>
                <option value="youtube">Vídeo: YouTube</option>
                <option value="vimeo">Vídeo: Vimeo</option>
                <option value="panda">Vídeo: Panda Video</option>
              </select>
            </div>

            {selectedBlock && contentType === 'html' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {/* ── CONTEÚDO DO BLOCO ── */}
                <div className="vpb-prop-group">
                  <span className="vpb-lib-label">Conteúdo do Bloco</span>

                  {selectedBlock.type === 'header' && (
                    <>
                      <label className="vpb-label">Título</label>
                      <input className="vpb-input" value={selectedBlock.props.title || ''} onChange={e => updateProp('title', e.target.value)} />
                      <label className="vpb-label">Subtítulo</label>
                      <input className="vpb-input" value={selectedBlock.props.subtitle || ''} onChange={e => updateProp('subtitle', e.target.value)} />
                    </>
                  )}

                  {selectedBlock.type === 'text' && (
                    <>
                      <label className="vpb-label">Texto</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.content || ''} onChange={e => updateProp('content', e.target.value)} />
                    </>
                  )}

                  {selectedBlock.type === 'audio' && (
                    <>
                      <label className="vpb-label" htmlFor="audio-title">Título do áudio (opcional)</label>
                      <input id="audio-title" className="vpb-input" value={selectedBlock.props.title ?? ''} onChange={e => updateProp('title', e.target.value)} />
                      <label className="vpb-label" htmlFor="audio-mode">Origem do áudio</label>
                      <select id="audio-mode" className="vpb-input" value={selectedBlock.props.audioMode || 'file'} onChange={e => { updateProp('audioMode', e.target.value as BuilderBlock['props']['audioMode']); setAudioImportStatus(null); }}>
                        <option value="file">Enviar arquivo MP3 ou M4A</option>
                        <option value="url">Link HTTPS externo</option>
                      </select>
                      {selectedBlock.props.audioMode === 'url' ? <>
                        <label className="vpb-label" htmlFor="audio-url">Link direto para o áudio</label>
                        <input id="audio-url" className="vpb-input" placeholder="https://seusite.com/audio.mp3" value={selectedBlock.props.url || ''} onChange={e => updateProp('url', e.target.value)} />
                        {!builderAudioSource(selectedBlock.props) && <p className="vpb-html-help">Informe um link HTTPS direto para o arquivo de áudio. Links de páginas do YouTube, Spotify ou Google Drive não são links diretos de áudio.</p>}
                      </> : <>
                        <label className="vpb-label" htmlFor="audio-file">Arquivo MP3 ou M4A (até 5 MB)</label>
                        <input id="audio-file" className="vpb-input" type="file" onChange={async e => {
                          const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
                          const blockId = selectedBlock.id;
                          setAudioImportStatus({ blockId, message: 'Lendo áudio…', kind: 'loading' });
                          try { const source = await readAudioFile(file); updateProp('audioData', source); updateProp('audioFileName', file.name); setAudioImportStatus({ blockId, message: 'Áudio incorporado ao projeto. O player está disponível no preview.', kind: 'success' }); }
                          catch (error) { setAudioImportStatus({ blockId, message: error instanceof Error ? error.message : 'Não foi possível importar o áudio.', kind: 'error' }); }
                        }} />
                        {selectedBlock.props.audioFileName && <p className="vpb-html-help">{selectedBlock.props.audioFileName} <button type="button" className="btn-ghost" onClick={() => { updateProp('audioData', ''); updateProp('audioFileName', ''); setAudioImportStatus(null); }}>Remover áudio</button></p>}
                        <p className="vpb-html-help">O arquivo acompanha o PWA exportado e aumenta o tamanho do projeto. Para áudios maiores ou muitos arquivos, prefira links externos.</p>
                      </>}
                      {audioImportStatus?.blockId === selectedBlock.id && <p className="vpb-html-help" role={audioImportStatus.kind === 'error' ? 'alert' : 'status'} style={{ color: audioImportStatus.kind === 'error' ? '#f87171' : undefined, fontWeight: 600 }}>{audioImportStatus.message}</p>}
                    </>
                  )}

                  {selectedBlock.type === 'accordion' && (
                    <>
                      <label className="vpb-label" htmlFor="accordion-title">Título da seção</label>
                      <input id="accordion-title" className="vpb-input" placeholder="Detalhes" value={selectedBlock.props.title ?? ''} onChange={e => updateProp('title', e.target.value)} />
                      <label className="vpb-label" htmlFor="accordion-content">Texto da seção</label>
                      <textarea id="accordion-content" className="vpb-textarea" rows={5} value={selectedBlock.props.content ?? ''} onChange={e => updateProp('content', e.target.value)} />
                      <label className="vpb-label" htmlFor="accordion-open">Estado inicial</label>
                      <select id="accordion-open" className="vpb-input" value={selectedBlock.props.accordionOpen === true ? 'open' : 'closed'} onChange={e => updateProp('accordionOpen', e.target.value === 'open')}>
                        <option value="closed">Fechado</option>
                        <option value="open">Aberto</option>
                      </select>
                      <label className="vpb-label" htmlFor="accordion-background">Cor do fundo da seção</label>
                      <div className="vpb-color-row">
                        <input id="accordion-background" type="color" className="vpb-color-picker" value={selectedBlock.props.cardBgColor === 'transparent' ? '#ffffff' : selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />
                        <input className="vpb-input" aria-label="Código da cor do fundo da seção" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />
                      </div>
                      <label className="vpb-label" htmlFor="accordion-padding">Espaço interno da seção (px)</label>
                      <input id="accordion-padding" type="number" className="vpb-input" min="0" max="48" step="1" value={selectedBlock.props.cardPadding ?? 16} onChange={e => { if (e.target.value !== '') updateProp('cardPadding', String(Math.min(48, Math.max(0, Number(e.target.value))))); }} />
                      <label className="vpb-label" htmlFor="accordion-radius">Bordas arredondadas (px)</label>
                      <input id="accordion-radius" type="number" className="vpb-input" min="0" max="200" step="1" value={selectedBlock.props.borderRadius ?? 8} onChange={e => { if (e.target.value !== '') updateProp('borderRadius', String(Math.min(200, Math.max(0, Number(e.target.value))))); }} />
                      <p className="vpb-html-help">Cada bloco cria uma seção. Adicione ou duplique o bloco para criar outras. Clique no título no preview para abrir e fechar.</p>
                    </>
                  )}

                  {selectedBlock.type === 'card' && (
                    <>
                      <label className="vpb-label" htmlFor="card-title">Título do card</label>
                      <input id="card-title" className="vpb-input" value={selectedBlock.props.title ?? ''} onChange={e => updateProp('title', e.target.value)} />
                      <label className="vpb-label" htmlFor="card-content">Texto do card</label>
                      <textarea id="card-content" className="vpb-textarea" rows={5} value={selectedBlock.props.content ?? ''} onChange={e => updateProp('content', e.target.value)} />
                      <label className="vpb-label" htmlFor="card-icon">Ícone (opcional)</label>
                      <select id="card-icon" className="vpb-input" value={selectedBlock.props.cardIcon || 'none'} onChange={e => updateProp('cardIcon', e.target.value as BuilderBlock['props']['cardIcon'])}>
                        <option value="none">Sem ícone</option>
                        <option value="check">✓ Check</option>
                        <option value="star">★ Estrela</option>
                        <option value="arrow">→ Seta</option>
                        <option value="dot">• Ponto</option>
                      </select>
                      <label className="vpb-label" htmlFor="card-background">Cor do fundo do card</label>
                      <div className="vpb-color-row">
                        <input id="card-background" type="color" className="vpb-color-picker" value={selectedBlock.props.cardBgColor === 'transparent' ? '#ffffff' : selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />
                        <input className="vpb-input" aria-label="Código da cor do fundo do card" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />
                      </div>
                      <label className="vpb-label" htmlFor="card-padding">Espaço interno do card (px)</label>
                      <input id="card-padding" type="number" className="vpb-input" min="0" max="48" step="1" value={selectedBlock.props.cardPadding ?? 20} onChange={e => { if (e.target.value !== '') updateProp('cardPadding', String(Math.min(48, Math.max(0, Number(e.target.value))))); }} />
                      <label className="vpb-label" htmlFor="card-radius">Bordas arredondadas (px)</label>
                      <input id="card-radius" type="number" className="vpb-input" min="0" max="200" step="1" value={selectedBlock.props.borderRadius ?? 12} onChange={e => { if (e.target.value !== '') updateProp('borderRadius', String(Math.min(200, Math.max(0, Number(e.target.value))))); }} />
                    </>
                  )}

                  {selectedBlock.type === 'list' && (
                    <>
                      <label className="vpb-label" htmlFor="list-items">Itens da lista (um por linha)</label>
                      <textarea id="list-items" className="vpb-textarea" rows={6} value={selectedBlock.props.content ?? ''} onChange={e => updateProp('content', e.target.value)} />
                      <label className="vpb-label" htmlFor="list-icon">Ícone</label>
                      <select id="list-icon" className="vpb-input" value={selectedBlock.props.listIcon || 'check'} onChange={e => updateProp('listIcon', e.target.value as BuilderBlock['props']['listIcon'])}>
                        <option value="check">✓ Check</option>
                        <option value="star">★ Estrela</option>
                        <option value="arrow">→ Seta</option>
                        <option value="dot">• Ponto</option>
                      </select>
                      <label className="vpb-label" htmlFor="list-icon-color">Cor do ícone</label>
                      <div className="vpb-color-row">
                        <input id="list-icon-color" type="color" className="vpb-color-picker" value={selectedBlock.props.listIconColor || '#6b8af0'} onChange={e => updateProp('listIconColor', e.target.value)} />
                        <input className="vpb-input" aria-label="Código da cor do ícone" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.listIconColor || '#6b8af0'} onChange={e => updateProp('listIconColor', e.target.value)} />
                      </div>
                      <label className="vpb-label" htmlFor="list-gap">Espaçamento entre itens (px)</label>
                      <input id="list-gap" type="number" className="vpb-input" min="0" max="64" step="1" value={selectedBlock.props.gap ?? 12} onChange={e => { if (e.target.value !== '') updateProp('gap', String(Math.min(64, Math.max(0, Number(e.target.value))))); }} />
                    </>
                  )}

                  {selectedBlock.type === 'image' && (
                    <>
                      <label className="vpb-label">Upload de Imagem</label>
                      <input type="file" className="vpb-input" accept="image/*" onChange={e => handleImageUpload(e, 'src')} />
                      {selectedBlock.props.src && (
                        <div style={{ marginBottom: '12px', borderRadius: String(selectedBlock.props.imgBorderRadius ?? 0) + 'px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={selectedBlock.props.src as string} alt="preview" style={{ width: '100%', maxHeight: '120px', objectFit: (selectedBlock.props.imgObjectFit || 'cover') as any }} />
                        </div>
                      )}
                      <label className="vpb-label">Largura ({selectedBlock.props.width ?? 100}%)</label>
                      <input type="range" min="10" max="100" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.width ?? 100} onChange={e => updateProp('width', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Largura da imagem em porcentagem" min="10" max="100" step="1" value={selectedBlock.props.width ?? 100} onChange={e => { if (e.target.value !== '') updateProp('width', String(Math.min(100, Math.max(10, Number(e.target.value))))); } } />
                      <label className="vpb-label">Altura (px) — "auto" = proporcional</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="number" className="vpb-input" style={{ flex: 1, marginBottom: 0 }} placeholder="auto" value={selectedBlock.props.imgHeight === 'auto' ? '' : selectedBlock.props.imgHeight || ''} onChange={e => updateProp('imgHeight', e.target.value ? e.target.value : 'auto')} />
                        <button type="button" onClick={() => updateProp('imgHeight', 'auto')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: selectedBlock.props.imgHeight === 'auto' ? 'var(--accent)' : 'var(--surface)', color: selectedBlock.props.imgHeight === 'auto' ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Auto</button>
                      </div>
                      <label className="vpb-label">Arredondamento ({selectedBlock.props.imgBorderRadius ?? 0}px)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="range" min="0" max="200" style={{ flex: 1, accentColor: 'var(--accent)' }} value={selectedBlock.props.imgBorderRadius ?? 0} onChange={e => updateProp('imgBorderRadius', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Arredondamento da imagem em pixels" min="0" max="200" step="1" value={selectedBlock.props.imgBorderRadius ?? 0} onChange={e => { if (e.target.value !== '') updateProp('imgBorderRadius', String(Math.min(200, Math.max(0, Number(e.target.value))))); } } />
                        <button type="button" onClick={() => updateProp('imgBorderRadius', '999')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: String(selectedBlock.props.imgBorderRadius) === '999' ? 'var(--accent)' : 'var(--surface)', color: String(selectedBlock.props.imgBorderRadius) === '999' ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>⬤ Círculo</button>
                      </div>
                      <label className="vpb-label">Preenchimento</label>
                      <select className="vpb-input" value={selectedBlock.props.imgObjectFit || 'cover'} onChange={e => updateProp('imgObjectFit', e.target.value as any)}>
                        <option value="cover">Cobrir (Cover)</option>
                        <option value="contain">Conter (Contain)</option>
                        <option value="fill">Esticar (Fill)</option>
                      </select>
                      <label className="vpb-label">Texto Alternativo</label>
                      <input className="vpb-input" value={selectedBlock.props.alt || ''} onChange={e => updateProp('alt', e.target.value)} />
                    </>
                  )}

                  {selectedBlock.type === 'video' && (
                    <>
                      <label className="vpb-label">URL do YouTube / Shorts</label>
                      <input className="vpb-input" placeholder="https://youtube.com/watch?v=..." value={selectedBlock.props.url || ''} onChange={e => updateProp('url', e.target.value)} />
                      <label className="vpb-label">Título acessível</label>
                      <input className="vpb-input" value={selectedBlock.props.videoTitle || 'Vídeo'} onChange={e => updateProp('videoTitle', e.target.value)} />
                      <label className="vpb-label">Capa personalizada (opcional)</label>
                      <input type="file" className="vpb-input" accept="image/*" onChange={e => handleImageUpload(e, 'videoPoster')} />
                      {selectedBlock.props.videoPoster && (
                        <>
                          <div style={{ marginBottom: '8px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <img src={selectedBlock.props.videoPoster as string} alt="Capa personalizada do vídeo" style={{ width: '100%', maxHeight: '120px', objectFit: 'cover', display: 'block' }} />
                          </div>
                          <button type="button" className="btn-ghost" style={{ marginBottom: '12px' }} onClick={() => updateProp('videoPoster', '')}>Usar capa automática do YouTube</button>
                        </>
                      )}
                      <label className="vpb-label">Largura ({selectedBlock.props.videoWidth ?? 100}%)</label>
                      <input type="range" min="10" max="100" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.videoWidth ?? 100} onChange={e => updateProp('videoWidth', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Largura do vídeo em porcentagem" min="10" max="100" step="1" value={selectedBlock.props.videoWidth ?? 100} onChange={e => { if (e.target.value !== '') updateProp('videoWidth', String(Math.min(100, Math.max(10, Number(e.target.value))))); } } />
                      <label className="vpb-label">Proporção</label>
                      <select className="vpb-input" value={selectedBlock.props.videoAspectRatio || 'auto'} onChange={e => updateProp('videoAspectRatio', e.target.value as 'auto' | '16:9' | '9:16')}>
                        <option value="auto">Automática</option>
                        <option value="16:9">Horizontal 16:9</option>
                        <option value="9:16">Vertical 9:16</option>
                      </select>
                      <label className="vpb-label">Arredondamento ({selectedBlock.props.borderRadius ?? 16}px)</label>
                      <input type="range" min="0" max="48" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.borderRadius ?? 16} onChange={e => updateProp('borderRadius', e.target.value)} />
                      <label className="vpb-label">Legenda abaixo do vídeo (opcional)</label>
                      <textarea className="vpb-textarea" placeholder="Ex: Assista antes de continuar para a próxima etapa." value={selectedBlock.props.videoCaption || ''} onChange={e => updateProp('videoCaption', e.target.value)} />
                      <p className="vpb-html-help">Sem capa personalizada, o Appify usa automaticamente a miniatura do YouTube. O player continua sendo carregado somente após o clique no play.</p>
                    </>
                  )}

                  {selectedBlock.type === 'link' && (
                    <>
                      <label className="vpb-label">Texto do Botão / Link</label>
                      <input className="vpb-input" value={selectedBlock.props.text || ''} onChange={e => updateProp('text', e.target.value)} />
                      <label className="vpb-label">URL de Destino</label>
                      <input className="vpb-input" placeholder="https://..." value={selectedBlock.props.url || ''} onChange={e => updateProp('url', e.target.value)} />
                      <label className="vpb-label">Estilo</label>
                      <select className="vpb-input" value={selectedBlock.props.style || 'button'} onChange={e => updateProp('style', e.target.value)}>
                        <option value="button">Preenchido</option>
                        <option value="outline">Contorno</option>
                        <option value="link">Link com sublinhado</option>
                      </select>
                      <label className="vpb-label">Tamanho do botão</label>
                      <select className="vpb-input" value={selectedBlock.props.buttonSize || 'medium'} onChange={e => updateProp('buttonSize', e.target.value as BuilderBlock['props']['buttonSize'])}>
                        <option value="small">Pequeno</option>
                        <option value="medium">Médio</option>
                        <option value="large">Grande</option>
                      </select>
                      <label className="vpb-label">Largura</label>
                      <select className="vpb-input" value={selectedBlock.props.buttonWidth || 'auto'} onChange={e => updateProp('buttonWidth', e.target.value as BuilderBlock['props']['buttonWidth'])}>
                        <option value="auto">Automática</option>
                        <option value="full">100% da largura</option>
                      </select>
                      <label className="vpb-label">Cor do Botão</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.buttonColor || '#6b8af0'} onChange={e => updateProp('buttonColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.buttonColor || '#6b8af0'} onChange={e => updateProp('buttonColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Cor do Texto do Botão</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.buttonTextColor || '#ffffff'} onChange={e => updateProp('buttonTextColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.buttonTextColor || '#ffffff'} onChange={e => updateProp('buttonTextColor', e.target.value)} />
                      </div>
                    </>
                  )}

                  {selectedBlock.type === 'spacer' && (
                    <>
                      <label className="vpb-label">Altura ({selectedBlock.props.height ?? 40}px)</label>
                      <input type="range" min="8" max="200" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.height ?? 40} onChange={e => updateProp('height', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Altura do espaçador em pixels" min="8" max="200" step="1" value={selectedBlock.props.height ?? 40} onChange={e => { if (e.target.value !== '') updateProp('height', String(Math.min(200, Math.max(8, Number(e.target.value))))); } } />
                    </>
                  )}

                  {selectedBlock.type === 'divider' && (
                    <>
                      <label className="vpb-label">Espessura ({selectedBlock.props.thickness ?? 1}px)</label>
                      <input type="range" min="1" max="8" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.thickness ?? 1} onChange={e => updateProp('thickness', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Espessura do divisor em pixels" min="1" max="8" step="1" value={selectedBlock.props.thickness ?? 1} onChange={e => { if (e.target.value !== '') updateProp('thickness', String(Math.min(8, Math.max(1, Number(e.target.value))))); } } />
                      <label className="vpb-label">Cor da Linha</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.dividerColor || '#e5e7eb'} onChange={e => updateProp('dividerColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.dividerColor || '#e5e7eb'} onChange={e => updateProp('dividerColor', e.target.value)} />
                      </div>
                    </>
                  )}

                  {/* Container subtypes */}
                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'hero' && (
                    <>
                      <label className="vpb-label">Título</label>
                      <input className="vpb-input" value={selectedBlock.props.title || ''} onChange={e => updateProp('title', e.target.value)} />
                      <label className="vpb-label">Subtítulo</label>
                      <input className="vpb-input" value={selectedBlock.props.subtitle || ''} onChange={e => updateProp('subtitle', e.target.value)} />
                      <label className="vpb-label">Cor do Título</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.titleColor || '#ffffff'} onChange={e => updateProp('titleColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.titleColor || '#ffffff'} onChange={e => updateProp('titleColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Cor do Subtítulo</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.subtitleColor || '#e0e7ff'} onChange={e => updateProp('subtitleColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.subtitleColor || '#e0e7ff'} onChange={e => updateProp('subtitleColor', e.target.value)} />
                      </div>
                    </>
                  )}

                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'oneColumn' && <>
                    <label className="vpb-label">Título da seção</label><input className="vpb-input" value={selectedBlock.props.title || ''} onChange={e=>updateProp('title',e.target.value)}/>
                    <label className="vpb-label">Texto da seção</label><textarea className="vpb-textarea" value={selectedBlock.props.text || ''} onChange={e=>updateProp('text',e.target.value)}/>
                    <label className="vpb-label">Cor do card</label><input type="color" className="vpb-color-input" value={selectedBlock.props.columnBgColor || '#f3f4f6'} onChange={e=>updateProp('columnBgColor',e.target.value)}/>
                    <label className="vpb-label">Espaço interno do card (px)</label><input type="number" className="vpb-input" min="0" max="48" value={selectedBlock.props.columnPadding ?? 20} onChange={e=>updateProp('columnPadding',e.target.value)}/>
                  </>}
                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'twoColumn' && (
                    <>
                      <label className="vpb-label">Título Esquerda</label>
                      <input className="vpb-input" value={selectedBlock.props.leftTitle || ''} onChange={e => updateProp('leftTitle', e.target.value)} />
                      <label className="vpb-label">Texto Esquerda</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.leftText || ''} onChange={e => updateProp('leftText', e.target.value)} />
                      <label className="vpb-label">Título Direita</label>
                      <input className="vpb-input" value={selectedBlock.props.rightTitle || ''} onChange={e => updateProp('rightTitle', e.target.value)} />
                      <label className="vpb-label">Texto Direita</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.rightText || ''} onChange={e => updateProp('rightText', e.target.value)} />
                      <label className="vpb-label">Cor de Fundo das Colunas</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.columnBgColor || '#ffffff'} onChange={e => updateProp('columnBgColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.columnBgColor || '#ffffff'} onChange={e => updateProp('columnBgColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Espaço Interno das Colunas ({selectedBlock.props.columnPadding ?? 20}px)</label>
                      <input type="range" min="8" max="48" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.columnPadding ?? 20} onChange={e => updateProp('columnPadding', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Espaço interno das colunas em pixels" min="8" max="48" step="1" value={selectedBlock.props.columnPadding ?? 20} onChange={e => { if (e.target.value !== '') updateProp('columnPadding', String(Math.min(48, Math.max(8, Number(e.target.value))))); } } />
                    </>
                  )}

                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'threeColumn' && (
                    <>
                      <label className="vpb-label">Card 1 — Título</label>
                      <input className="vpb-input" value={selectedBlock.props.col1Title || ''} onChange={e => updateProp('col1Title', e.target.value)} />
                      <label className="vpb-label">Card 1 — Texto</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.col1Text || ''} onChange={e => updateProp('col1Text', e.target.value)} />
                      <label className="vpb-label">Card 2 — Título</label>
                      <input className="vpb-input" value={selectedBlock.props.col2Title || ''} onChange={e => updateProp('col2Title', e.target.value)} />
                      <label className="vpb-label">Card 2 — Texto</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.col2Text || ''} onChange={e => updateProp('col2Text', e.target.value)} />
                      <label className="vpb-label">Card 3 — Título</label>
                      <input className="vpb-input" value={selectedBlock.props.col3Title || ''} onChange={e => updateProp('col3Title', e.target.value)} />
                      <label className="vpb-label">Card 3 — Texto</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.col3Text || ''} onChange={e => updateProp('col3Text', e.target.value)} />
                      <label className="vpb-label">Cor de Fundo dos Cards</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.cardBgColor || '#f3f4f6'} onChange={e => updateProp('cardBgColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Espaço Interno dos Cards ({selectedBlock.props.cardPadding ?? 18}px)</label>
                      <input type="range" min="8" max="48" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.cardPadding ?? 18} onChange={e => updateProp('cardPadding', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Espaço interno dos cards em pixels" min="8" max="48" step="1" value={selectedBlock.props.cardPadding ?? 18} onChange={e => { if (e.target.value !== '') updateProp('cardPadding', String(Math.min(48, Math.max(8, Number(e.target.value))))); } } />
                    </>
                  )}

                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'imageText' && (
                    <>
                      <label className="vpb-label">Upload de Imagem</label>
                      <input type="file" className="vpb-input" accept="image/*" onChange={e => handleImageUpload(e, 'imageSrc')} />
                      {selectedBlock.props.imageSrc && (
                        <div style={{ marginBottom: '12px', borderRadius: String(selectedBlock.props.imageBorderRadius ?? 8) + 'px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={selectedBlock.props.imageSrc as string} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: (selectedBlock.props.imageObjectFit || 'cover') as any }} />
                        </div>
                      )}
                      <label className="vpb-label">Largura da Imagem ({selectedBlock.props.imageWidth ?? 100}%)</label>
                      <input type="range" min="10" max="100" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.imageWidth ?? 100} onChange={e => updateProp('imageWidth', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Largura da imagem em porcentagem" min="10" max="100" step="1" value={selectedBlock.props.imageWidth ?? 100} onChange={e => { if (e.target.value !== '') updateProp('imageWidth', String(Math.min(100, Math.max(10, Number(e.target.value))))); } } />
                      <label className="vpb-label">Altura (px)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="number" className="vpb-input" style={{ flex: 1, marginBottom: 0 }} placeholder="auto" value={selectedBlock.props.imageHeight === 'auto' ? '' : selectedBlock.props.imageHeight || ''} onChange={e => updateProp('imageHeight', e.target.value ? e.target.value : 'auto')} />
                        <button type="button" onClick={() => updateProp('imageHeight', 'auto')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: selectedBlock.props.imageHeight === 'auto' ? 'var(--accent)' : 'var(--surface)', color: selectedBlock.props.imageHeight === 'auto' ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Auto</button>
                      </div>
                      <label className="vpb-label">Arredondamento ({selectedBlock.props.imageBorderRadius ?? 8}px)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="range" min="0" max="200" style={{ flex: 1, accentColor: 'var(--accent)' }} value={selectedBlock.props.imageBorderRadius ?? 8} onChange={e => updateProp('imageBorderRadius', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Arredondamento da imagem em pixels" min="0" max="200" step="1" value={selectedBlock.props.imageBorderRadius ?? 8} onChange={e => { if (e.target.value !== '') updateProp('imageBorderRadius', String(Math.min(200, Math.max(0, Number(e.target.value))))); } } />
                        <button type="button" onClick={() => updateProp('imageBorderRadius', '999')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: String(selectedBlock.props.imageBorderRadius) === '999' ? 'var(--accent)' : 'var(--surface)', color: String(selectedBlock.props.imageBorderRadius) === '999' ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>⬤ Círculo</button>
                      </div>
                      <label className="vpb-label">Preenchimento</label>
                      <select className="vpb-input" value={selectedBlock.props.imageObjectFit || 'cover'} onChange={e => updateProp('imageObjectFit', e.target.value as any)}>
                        <option value="cover">Cobrir (Cover)</option>
                        <option value="contain">Conter (Contain)</option>
                        <option value="fill">Esticar (Fill)</option>
                      </select>
                      <label className="vpb-label">Texto Alternativo da Imagem</label>
                      <input className="vpb-input" value={selectedBlock.props.imageAlt || ''} onChange={e => updateProp('imageAlt', e.target.value)} />
                      <label className="vpb-label">Posição da Imagem</label>
                      <select className="vpb-input" value={selectedBlock.props.imagePosition || 'left'} onChange={e => updateProp('imagePosition', e.target.value)}>
                        <option value="left">Esquerda</option>
                        <option value="right">Direita</option>
                      </select>
                      <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }} />
                      <label className="vpb-label">Título</label>
                      <input className="vpb-input" value={selectedBlock.props.title || ''} onChange={e => updateProp('title', e.target.value)} />
                      <label className="vpb-label">Texto</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.text || ''} onChange={e => updateProp('text', e.target.value)} />
                    </>
                  )}

                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'testimonial' && (
                    <>
                      <label className="vpb-label">Citação</label>
                      <textarea className="vpb-textarea" value={selectedBlock.props.quote || ''} onChange={e => updateProp('quote', e.target.value)} />
                      <label className="vpb-label">Nome do Autor</label>
                      <input className="vpb-input" value={selectedBlock.props.author || ''} onChange={e => updateProp('author', e.target.value)} />
                      <label className="vpb-label">Cargo / Empresa</label>
                      <input className="vpb-input" value={selectedBlock.props.role || ''} onChange={e => updateProp('role', e.target.value)} />
                      <label className="vpb-label">Cor da Citação</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.quoteColor || '#6b8af0'} onChange={e => updateProp('quoteColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.quoteColor || '#6b8af0'} onChange={e => updateProp('quoteColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Tamanho da Citação (px)</label>
                      <input type="number" className="vpb-input" value={selectedBlock.props.quoteSize ?? 18} onChange={e => updateProp('quoteSize', e.target.value)} />
                    </>
                  )}

                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'cta' && (
                    <>
                      <label className="vpb-label">Título</label>
                      <input className="vpb-input" value={selectedBlock.props.title || ''} onChange={e => updateProp('title', e.target.value)} />
                      <label className="vpb-label">Subtítulo</label>
                      <input className="vpb-input" value={selectedBlock.props.subtitle || ''} onChange={e => updateProp('subtitle', e.target.value)} />
                      <label className="vpb-label">Texto do Botão</label>
                      <input className="vpb-input" value={selectedBlock.props.buttonText || ''} onChange={e => updateProp('buttonText', e.target.value)} />
                      <label className="vpb-label">Link do Botão</label>
                      <input className="vpb-input" placeholder="https://..." value={selectedBlock.props.url || ''} onChange={e => updateProp('url', e.target.value)} />
                      <label className="vpb-label">Cor do Título</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.titleColor || '#ffffff'} onChange={e => updateProp('titleColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.titleColor || '#ffffff'} onChange={e => updateProp('titleColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Cor do Subtítulo</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.subtitleColor || '#d1d5db'} onChange={e => updateProp('subtitleColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.subtitleColor || '#d1d5db'} onChange={e => updateProp('subtitleColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Cor do Botão</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.buttonColor || '#6b8af0'} onChange={e => updateProp('buttonColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.buttonColor || '#6b8af0'} onChange={e => updateProp('buttonColor', e.target.value)} />
                      </div>
                      <label className="vpb-label">Cor do Texto do Botão</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.buttonTextColor || '#ffffff'} onChange={e => updateProp('buttonTextColor', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.buttonTextColor || '#ffffff'} onChange={e => updateProp('buttonTextColor', e.target.value)} />
                      </div>
                    </>
                  )}
                </div>

                {(selectedBlock.type === 'link' || selectedBlock.subtype === 'cta') && (
                  <div className="vpb-prop-group">
                    <button type="button" className="btn-ghost" disabled={safeLinkUrl(selectedBlock.props.url) === '#'} onClick={() => openExternalLink(safeLinkUrl(selectedBlock.props.url))}>Testar link no navegador</button>
                    {safeLinkUrl(selectedBlock.props.url) === '#' && <p className="vpb-html-help">Informe um endereço HTTPS válido ou um e-mail com mailto:. Links inválidos não serão abertos.</p>}
                  </div>
                )}
                {(selectedBlock.type === 'link' || ['oneColumn','twoColumn','threeColumn','cta','imageText'].includes(selectedBlock.subtype || '')) && (
                  <div className="vpb-prop-group">
                    {(selectedBlock.type === 'link' || ['oneColumn','twoColumn','threeColumn','cta'].includes(selectedBlock.subtype || '')) && <>
                      <label className="vpb-label">Arredondamento dos cards / botão (px)</label>
                      <input type="number" className="vpb-input" min="0" max="200" value={selectedBlock.props.borderRadius ?? 8} onChange={e => updateProp('borderRadius', e.target.value)} />
                    </>}
                    {['twoColumn', 'threeColumn', 'imageText'].includes(selectedBlock.subtype || '') && <>
                      <label className="vpb-label">Espaço entre colunas (px)</label>
                      <input type="number" className="vpb-input" min="0" max="64" value={selectedBlock.props.gap ?? 16} onChange={e => updateProp('gap', e.target.value)} />
                      <p className="vpb-html-help">No celular, as colunas ficam uma abaixo da outra para facilitar a leitura.</p>
                    </>}
                  </div>
                )}

                {selectedBlock.type === 'container' && <div className="vpb-prop-group">
                  <span className="vpb-lib-label">Layout da seção</span>
                  <label className="vpb-label">Largura máxima do conteúdo (px) — 0 = toda a largura</label>
                  <input aria-label="Largura máxima do conteúdo" type="number" className="vpb-input" min="0" max="1600" value={selectedBlock.props.maxWidth ?? 0} onChange={e=>updateProp('maxWidth',e.target.value)}/>
                  {(['marginTop','marginBottom'] as const).map((prop,index)=><React.Fragment key={prop}><label className="vpb-label">{index===0?'Margem acima':'Margem abaixo'} (px)</label><input aria-label={index===0?'Margem acima':'Margem abaixo'} type="number" className="vpb-input" min="0" max="200" value={selectedBlock.props[prop] ?? 0} onChange={e=>updateProp(prop,e.target.value)}/></React.Fragment>)}
                  {['twoColumn','threeColumn'].includes(selectedBlock.subtype || '') && <><label className="vpb-label">Alinhamento vertical dos cards</label><select className="vpb-input" value={selectedBlock.props.columnAlign || 'start'} onChange={e=>updateProp('columnAlign',e.target.value)}><option value="start">Topo</option><option value="center">Centro</option><option value="end">Base</option><option value="stretch">Mesma altura</option></select></>}
                </div>}

                {/* ── TÍTULO AVANÇADO ── */}
                {(selectedBlock.type === 'header' || selectedBlock.type === 'card' || selectedBlock.type === 'accordion' || selectedBlock.type === 'audio' || (selectedBlock.type === 'container' && ['oneColumn', 'hero', 'cta', 'twoColumn', 'threeColumn', 'imageText'].includes(selectedBlock.subtype || ''))) && (
                  <div className="vpb-prop-group">
                    <span className="vpb-lib-label">Estilo dos Títulos</span>

                    <label className="vpb-label">Fonte do Título</label>
                    <select className="vpb-input" value={selectedBlock.props.titleFontFamily || selectedBlock.props.fontFamily || 'DM Sans'} onChange={e => updateProp('titleFontFamily', e.target.value)}>
                      {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    <label className="vpb-label">Tamanho do Título ({selectedBlock.props.titleFontSize ?? 32}px)</label>
                    <input type="range" min="12" max="96" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.titleFontSize ?? 32} onChange={e => updateProp('titleFontSize', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Tamanho do título em pixels" min="12" max="96" step="1" value={selectedBlock.props.titleFontSize ?? 32} onChange={e => { if (e.target.value !== '') updateProp('titleFontSize', String(Math.min(96, Math.max(12, Number(e.target.value))))); } } />

                    <label className="vpb-label">Peso da Fonte</label>
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                      {([{ v: '400', l: 'Normal' }, { v: '600', l: 'Semi' }, { v: '700', l: 'Negrito' }, { v: '800', l: 'Extra' }] as const).map(w => (
                        <button
                          key={w.v}
                          type="button"
                          onClick={() => updateProp('titleFontWeight', w.v)}
                          style={{
                            flex: 1, padding: '6px 2px', borderRadius: '6px', border: 'none',
                            background: String(selectedBlock.props.titleFontWeight || '700') === w.v ? 'var(--accent)' : 'transparent',
                            color: String(selectedBlock.props.titleFontWeight || '700') === w.v ? 'white' : 'var(--muted)',
                            cursor: 'pointer', fontWeight: parseInt(w.v), fontSize: '10px', transition: 'all 0.2s'
                          }}
                        >
                          {w.l}
                        </button>
                      ))}
                    </div>

                    <label className="vpb-label">Espaçamento Inferior ({selectedBlock.props.titleMarginBottom ?? 8}px)</label>
                    <input type="range" min="0" max="80" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.titleMarginBottom ?? 8} onChange={e => updateProp('titleMarginBottom', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Espaçamento inferior do título em pixels" min="0" max="80" step="1" value={selectedBlock.props.titleMarginBottom ?? 8} onChange={e => { if (e.target.value !== '') updateProp('titleMarginBottom', String(Math.min(80, Math.max(0, Number(e.target.value))))); } } />
                  </div>
                )}

                {/* ── ESTILOS GLOBAIS DO BLOCO ── */}
                <div className="vpb-prop-group">
                  <span className="vpb-lib-label">Estilos do Bloco</span>

                  {!['image', 'video', 'spacer', 'divider'].includes(selectedBlock.type) && (
                    <>
                      <label className="vpb-label">Fonte do Texto / Subtítulo</label>
                      <select className="vpb-input" value={selectedBlock.props.fontFamily || 'DM Sans'} onChange={e => updateProp('fontFamily', e.target.value)}>
                        {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>

                      <label className="vpb-label">Tamanho do Texto ({selectedBlock.props.fontSize ?? 16}px)</label>
                      <input type="range" min="10" max="72" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.fontSize ?? 16} onChange={e => updateProp('fontSize', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Tamanho do texto em pixels" min="10" max="72" step="1" value={selectedBlock.props.fontSize ?? 16} onChange={e => { if (e.target.value !== '') updateProp('fontSize', String(Math.min(72, Math.max(10, Number(e.target.value))))); } } />

                      <label className="vpb-label">Cor do Texto</label>
                      <div className="vpb-color-row">
                        <input type="color" className="vpb-color-picker" value={selectedBlock.props.color || '#333333'} onChange={e => updateProp('color', e.target.value)} />
                        <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.color || '#333333'} onChange={e => updateProp('color', e.target.value)} />
                      </div>
                    </>
                  )}

                  <label className="vpb-label">Cor de Fundo</label>
                  <div className="vpb-color-row">
                    <input type="color" className="vpb-color-picker" value={selectedBlock.props.bgColor === 'transparent' ? '#ffffff' : selectedBlock.props.bgColor || '#ffffff'} onChange={e => updateProp('bgColor', e.target.value)} />
                    <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.bgColor || '#ffffff'} onChange={e => updateProp('bgColor', e.target.value)} />
                  </div>

                  <label className="vpb-label">Padding ({selectedBlock.props.padding ?? 20}px)</label>
                  <input type="range" min="0" max="120" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.padding ?? 20} onChange={e => updateProp('padding', e.target.value)} />
                      <input type="number" className="vpb-input" aria-label="Espaço interno do bloco em pixels" min="0" max="120" step="1" value={selectedBlock.props.padding ?? 20} onChange={e => { if (e.target.value !== '') updateProp('padding', String(Math.min(120, Math.max(0, Number(e.target.value))))); } } />

                  <label className="vpb-label">Alinhamento</label>
                  <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }}>
                    {(['left', 'center', 'right'] as const).map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => updateProp('align', a)}
                        style={{
                          flex: 1, padding: '6px', borderRadius: '6px', border: 'none',
                          background: selectedBlock.props.align === a ? 'var(--accent)' : 'transparent',
                          color: selectedBlock.props.align === a ? 'white' : 'var(--muted)',
                          cursor: 'pointer', fontWeight: 600, fontSize: '11px', transition: 'all 0.2s'
                        }}
                      >
                        {a === 'left' ? '◀ Esq' : a === 'center' ? '● Centro' : 'Dir ▶'}
                      </button>
                    ))}
                  </div>
                </div>


              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[var(--border)]">
              <div className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Gamificação & Anti-Cheat</div>
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold" style={{ color: 'var(--text)' }}>Trava de Tempo</label>
                    <span className="text-[10px] font-mono bg-[var(--surface2)] px-1.5 py-0.5 rounded text-[var(--accent)]">{timeGateSeconds}s</span>
                  </div>
                  <input
                    type="number"
                    className="vpb-input !mb-0"
                    placeholder="Ex: 30"
                    value={timeGateSeconds}
                    onChange={(e) => setTimeGateSeconds(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-[10px] text-[var(--muted)] mt-1.5 leading-relaxed">Segundos obrigatórios para validar a conclusão da aula.</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--surface2)] rounded-xl border border-[var(--border)]">
                  <div>
                    <label className="block text-xs font-bold" style={{ color: 'var(--text)' }}>Confetes ao Concluir</label>
                    <p className="text-[10px] text-[var(--muted)]">Efeito visual de celebração.</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={enableCelebration}
                      onChange={(e) => setEnableCelebration(e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
