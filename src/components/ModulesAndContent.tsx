import React, { useState } from 'react';
import { 
  ArrowLeft, Check, LayoutGrid, Columns, Grid, Image as ImageIcon, 
  Quote, Zap, Type, AlignLeft, Link as LinkIcon, Minus, 
  SeparatorHorizontal, Trash2, Layers, Video, Globe, Code
} from 'lucide-react';
import { SubModule, BuilderBlock } from '../types';
import { GOOGLE_FONTS } from '../constants';
import { useAppStore } from '../store/useAppStore';

interface ModulesAndContentProps { 
  submodule: SubModule; 
  onSave: (html: string, builderData: BuilderBlock[]) => void; 
  onClose: () => void; 
}

function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined' || !html) return html || '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const forbiddenTags = ['script', 'object', 'embed', 'link', 'style'];
  forbiddenTags.forEach(tag => {
    const elements = doc.querySelectorAll(tag);
    elements.forEach(el => el.remove());
  });

  const iframes = doc.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    const src = iframe.getAttribute('src') || '';
    const isTrusted = src.includes('youtube.com') || 
                      src.includes('youtu.be') || 
                      src.includes('vimeo.com') || 
                      src.includes('google.com/maps') ||
                      src.includes('player.vimeo.com') ||
                      src.includes('pandavideo.com');
    
    if (!isTrusted) {
      iframe.remove();
    } else {
      iframe.setAttribute('width', '100%');
      iframe.style.maxWidth = '100%';
    }
  });

  const allElements = doc.querySelectorAll('*');
  allElements.forEach(el => {
    const attributes = Array.from(el.attributes);
    attributes.forEach(attr => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      if ((name === 'href' || name === 'src' || name === 'action' || name === 'formaction') && 
          attr.value.toLowerCase().trim().startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

export function ModulesAndContent({ submodule, onSave, onClose }: ModulesAndContentProps) {
  const updateSubmoduleContent = useAppStore(state => state.updateSubmoduleContent);
  const editingSubmodule = useAppStore(state => state.editingSubmodule);
  
  const [blocks, setBlocks] = useState<BuilderBlock[]>(submodule.builder_data || []);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [submoduleName, setSubmoduleName] = useState(submodule.name || '');
  
  // Content Type & URL state
  const [contentType, setContentType] = useState<'web' | 'html' | 'youtube' | 'vimeo' | 'panda'>(submodule.contentType || 'html');
  const [contentUrl, setContentUrl] = useState(submodule.contentUrl || '');
  const [contentHtml, setContentHtml] = useState(submodule.contentHtml || submodule.content_html || '');
  
  // Gamification local state
  const [timeGateSeconds, setTimeGateSeconds] = useState(submodule.gamificationConfig?.timeGateSeconds || 0);
  const [enableCelebration, setEnableCelebration] = useState(submodule.gamificationConfig?.enableCelebration ?? true);

  // Sync state with submodule prop when it changes
  React.useEffect(() => {
    setSubmoduleName(submodule.name || '');
    setBlocks(submodule.builder_data || []);
    setContentType(submodule.contentType || 'html');
    setContentUrl(submodule.contentUrl || '');
    setContentHtml(submodule.contentHtml || submodule.content_html || '');
    setTimeGateSeconds(submodule.gamificationConfig?.timeGateSeconds || 0);
    setEnableCelebration(submodule.gamificationConfig?.enableCelebration ?? true);
  }, [submodule]);

  const handleSave = () => {
    let finalHtml = '';
    let finalBlocks: BuilderBlock[] = [];

    if (contentType === 'html') {
      finalHtml = viewMode === 'visual' ? generateHTML() : contentHtml;
      finalBlocks = viewMode === 'visual' ? blocks : [];
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
        content: contentType === 'html' ? finalHtml : '', // Legacy sync
        builderData: finalBlocks,
        gamificationConfig: {
          timeGateSeconds,
          enableCelebration
        }
      });
      onSave(finalHtml, finalBlocks);
    }
  };

  const generateId = () => 'mod_' + Math.random().toString(36).substr(2, 9);

  const getDefaultProps = (type: string, subtype?: string) => {
    const base = { bgColor: '#ffffff', padding: '20', align: 'left', fontFamily: 'DM Sans', fontSize: '16', color: '#333333' };
    switch(type) {
      case 'header': return { ...base, title: 'Título Principal', subtitle: 'Subtítulo da página', fontSize: '32', align: 'center', padding: '40' };
      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };
      case 'image': return { ...base, src: '', alt: 'Imagem', width: '100', align: 'center' };
      case 'link': return { ...base, text: 'Clique aqui', url: 'https://', style: 'button', buttonColor: '#6b8af0', buttonTextColor: '#ffffff', align: 'center' };
      case 'spacer': return { ...base, height: '40', bgColor: 'transparent', align: 'left' };
      case 'divider': return { ...base, dividerColor: '#e5e7eb', thickness: '1', padding: '10', align: 'center' };
      case 'container':
        switch(subtype) {
          case 'hero': return { ...base, bgColor: '#6b8af0', padding: '80', align: 'center', title: 'Bem-vindo ao seu site', subtitle: 'Descrição principal em destaque', titleColor: '#ffffff', subtitleColor: '#e0e7ff', fontSize: '48' };
          case 'twoColumn': return { ...base, bgColor: '#f3f4f6', padding: '40', leftTitle: 'Coluna Esquerda', leftText: 'Texto descritivo aqui', rightTitle: 'Coluna Direita', rightText: 'Outro texto descritivo', columnBgColor: '#ffffff', columnPadding: '24' };
          case 'threeColumn': return { ...base, bgColor: '#ffffff', padding: '40', col1Title: 'Card 1', col1Text: 'Descrição do primeiro card', col2Title: 'Card 2', col2Text: 'Descrição do segundo card', col3Title: 'Card 3', col3Text: 'Descrição do terceiro card', cardBgColor: '#f3f4f6', cardPadding: '24' };
          case 'imageText': return { ...base, bgColor: '#ffffff', padding: '40', imageSrc: '', imageAlt: 'Imagem', title: 'Título com imagem', text: 'Texto descritivo ao lado da imagem', imagePosition: 'left' };
          case 'testimonial': return { ...base, bgColor: '#f9fafb', padding: '40', quote: '"Este é um depoimento incrível sobre nosso produto ou serviço."', author: 'Nome do Cliente', role: 'Cargo/Empresa', quoteColor: '#6b8af0', quoteSize: '18' };
          case 'cta': return { ...base, bgColor: '#111118', padding: '60', align: 'center', title: 'Pronto para começar?', subtitle: 'Faça uma ação agora mesmo', titleColor: '#ffffff', subtitleColor: '#d1d5db', buttonText: 'Clique aqui', buttonColor: '#6b8af0', buttonTextColor: '#ffffff' };
        }
    }
    return base;
  };

  const addBlock = (type: string, subtype?: string) => { const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype) }; setBlocks([...blocks, newBlock]); setSelectedBlockId(newBlock.id); };
  const updateProp = <K extends keyof BuilderBlock['props']>(key: K, value: BuilderBlock['props'][K]) => { setBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, props: { ...b.props, [key]: value } } : b)); };
  const moveBlock = (id: string, dir: number) => { const idx = blocks.findIndex(b => b.id === id); const newIdx = idx + dir; if (newIdx < 0 || newIdx >= blocks.length) return; const newBlocks = [...blocks]; [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]]; setBlocks(newBlocks); };
  const deleteBlock = (id: string) => { setBlocks(blocks.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, propKey: any) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { updateProp(propKey, ev.target?.result); }; reader.readAsDataURL(file); };

  const getBlockInnerHtml = (mod: BuilderBlock) => {
    const p = mod.props;
    switch(mod.type) {
      case 'header': return `<h1 style="font-size:${p.fontSize}px;font-weight:700;margin:0 0 8px;">${p.title}</h1><p style="font-size:${parseInt(String(p.fontSize))*0.5}px;opacity:0.7;margin:0;">${p.subtitle}</p>`;
      case 'text': return `<p style="margin:0;">${p.content}</p>`;
      case 'image': return p.src ? `<img src="${p.src}" alt="${p.alt}" style="max-width:${p.width}%;height:auto;display:${p.align==='center'?'block':'inline-block'};margin:${p.align==='center'?'0 auto':p.align==='right'?'0 0 0 auto':'0'};">` : `<div style="border:2px dashed #ccc;padding:40px;text-align:center;color:#999;border-radius:8px;">Clique para adicionar imagem</div>`;
      case 'link': return p.style === 'button' ? `<a href="#" style="display:inline-block;background:${p.buttonColor};color:${p.buttonTextColor};padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:${p.fontSize}px;">${p.text}</a>` : `<a href="#" style="color:${p.buttonColor};text-decoration:underline;font-size:${p.fontSize}px;">${p.text}</a>`;
      case 'spacer': return `<div style="height:${p.height}px;"></div>`;
      case 'divider': return `<hr style="border:none;border-top:${p.thickness}px solid ${p.dividerColor};margin:0;">`;
      case 'container':
        switch(mod.subtype) {
          case 'hero': return `<h1 style="font-size:${p.fontSize}px;font-weight:700;color:${p.titleColor};margin:0 0 16px;">${p.title}</h1><p style="font-size:${parseInt(String(p.fontSize))*0.4}px;color:${p.subtitleColor};margin:0;">${p.subtitle}</p>`;
          case 'twoColumn': return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;"><div style="background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:8px;"><h3 style="margin:0 0 12px;font-weight:700;">${p.leftTitle}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.leftText}</p></div><div style="background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:8px;"><h3 style="margin:0 0 12px;font-weight:700;">${p.rightTitle}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.rightText}</p></div></div>`;
          case 'threeColumn': return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;"><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:8px;"><h3 style="margin:0 0 12px;font-weight:700;">${p.col1Title}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.col1Text}</p></div><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:8px;"><h3 style="margin:0 0 12px;font-weight:700;">${p.col2Title}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.col2Text}</p></div><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:8px;"><h3 style="margin:0 0 12px;font-weight:700;">${p.col3Title}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.col3Text}</p></div></div>`;
          case 'imageText': 
            const imgHtml = p.imageSrc ? `<img src="${p.imageSrc}" alt="${p.imageAlt}" style="max-width:100%;height:auto;border-radius:8px;">` : `<div style="background:#e5e7eb;height:300px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Clique para adicionar imagem</div>`;
            return p.imagePosition === 'left' ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;"><div>${imgHtml}</div><div><h3 style="margin:0 0 12px;font-weight:700;font-size:24px;">${p.title}</h3><p style="margin:0;line-height:1.8;">${p.text}</p></div></div>` : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;"><div><h3 style="margin:0 0 12px;font-weight:700;font-size:24px;">${p.title}</h3><p style="margin:0;line-height:1.8;">${p.text}</p></div><div>${imgHtml}</div></div>`;
          case 'testimonial': return `<div style="background:${p.bgColor};padding:${p.padding}px;border-radius:12px;border-left:4px solid ${p.quoteColor};"><p style="font-size:${p.quoteSize}px;font-style:italic;margin:0 0 16px;line-height:1.8;color:${p.color};">${p.quote}</p><p style="margin:0 0 4px;font-weight:700;color:${p.color};">${p.author}</p><p style="margin:0;font-size:14px;color:#6b7280;">${p.role}</p></div>`;
          case 'cta': return `<h2 style="font-size:36px;font-weight:700;color:${p.titleColor};margin:0 0 12px;">${p.title}</h2><p style="font-size:18px;color:${p.subtitleColor};margin:0 0 24px;">${p.subtitle}</p><a href="#" style="display:inline-block;background:${p.buttonColor};color:${p.buttonTextColor};padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">${p.buttonText}</a>`;
        }
    }
    return '';
  };

  const generateHTML = () => {
    const bodyHTML = blocks.map(mod => {
      const p = mod.props;
      const wrapStyle = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};`;
      const inner = sanitizeHtml(getBlockInnerHtml(mod)).replace(/href="#"/g, ''); 
      return `<section style="${wrapStyle}">${inner}</section>`;
    }).join('\n');
    return `<div class="v-generated-content custom-html-container">\n${bodyHTML}\n</div>`;
  };

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

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
                  if (viewMode === 'visual') setContentHtml(generateHTML());
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
      
      <div className="vpb-body">
        {contentType === 'html' && viewMode === 'visual' ? (
          <>
            <aside className="vpb-sidebar">
              <div className="vpb-sidebar-title">Adicionar Bloco</div>
              <div className="vpb-lib-group">
                <div className="vpb-lib-label">Containers</div>
                <button className="vpb-module-btn" onClick={() => addBlock('container', 'hero')}><LayoutGrid className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Hero</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Destaque com fundo</div></div></button>
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
                <button className="vpb-module-btn" onClick={() => addBlock('image')}><ImageIcon className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Imagem</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Upload direto</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('link')}><LinkIcon className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Botão / Link</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Link externo</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('spacer')}><Minus className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Espaçador</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Espaço invisível</div></div></button>
                <button className="vpb-module-btn" onClick={() => addBlock('divider')}><SeparatorHorizontal className="vpb-module-icon" size={16} /><div><div style={{fontSize:'12px',fontWeight:600,color:'var(--text)'}}>Divisor</div><div style={{fontSize:'10px',color:'var(--muted)'}}>Linha horizontal</div></div></button>
              </div>
            </aside>

            <main className="vpb-canvas-area" onClick={() => setSelectedBlockId(null)} style={{ background: '#ffffff', minHeight: '100%', position: 'relative' }}>
              {blocks.length === 0 ? (
                <div className="empty-state" style={{ margin: 'auto' }}>
                  <Layers size={48} color="var(--muted)" style={{ marginBottom: 16 }} />
                  <div style={{ fontSize: 16, fontWeight: 600 }}>Comece a construir</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>Clique num módulo à esquerda para adicionar blocos visuais.</div>
                </div>
              ) : (
                <div className="vpb-canvas-paper">
                  {blocks.map(mod => (
                    <div 
                      key={mod.id} 
                      className={`vpb-block-wrapper ${mod.id === selectedBlockId ? 'selected' : ''}`} 
                      style={{
                        background: mod.props.bgColor, padding: `${mod.props.padding}px`, textAlign: mod.props.align as any,
                        fontFamily: `'${mod.props.fontFamily}', sans-serif`, color: mod.props.color, fontSize: `${mod.props.fontSize}px`,
                        lineHeight: 1.6
                      }} 
                      onClick={(e) => { e.stopPropagation(); setSelectedBlockId(mod.id); }}
                    >
                      <div className="custom-html-container" dangerouslySetInnerHTML={{ __html: sanitizeHtml(getBlockInnerHtml(mod)) }} />
                      <div className="vpb-block-actions">
                        <div className="vpb-action-btn" onClick={(e) => { e.stopPropagation(); moveBlock(mod.id, -1); }}>↑</div>
                        <div className="vpb-action-btn" onClick={(e) => { e.stopPropagation(); moveBlock(mod.id, 1); }}>↓</div>
                        <div className="vpb-action-btn delete" onClick={(e) => { e.stopPropagation(); deleteBlock(mod.id); }}><Trash2 size={14}/></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        ) : (
          <main className="vpb-canvas-area" style={{ width: '100%', padding: '24px', background: 'var(--bg)', overflowY: 'auto' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
              {contentType === 'html' ? (
                <div className="vpb-lib-group" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div className="vpb-lib-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Code size={16} /> Editor HTML Direto</div>
                  <textarea 
                    className="vpb-textarea" 
                    style={{ height: '400px', fontFamily: 'monospace', fontSize: '13px', background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    placeholder="<div class='custom'>Seu código HTML aqui...</div>"
                  />
                  <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '12px' }}>Dica: Você pode usar classes como 'text-center', 'font-bold', etc. O CSS global do app será aplicado.</p>
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
                <div className="vpb-prop-group">
                  <span className="vpb-lib-label">Conteúdo do Bloco</span>
                  {selectedBlock.type === 'header' && (
                    <><label className="vpb-label">Título</label><input className="vpb-input" value={selectedBlock.props.title} onChange={e => updateProp('title', e.target.value)} />
                    <label className="vpb-label">Subtítulo</label><input className="vpb-input" value={selectedBlock.props.subtitle} onChange={e => updateProp('subtitle', e.target.value)} /></>
                  )}
                  {selectedBlock.type === 'text' && (
                    <><label className="vpb-label">Texto</label><textarea className="vpb-textarea" value={selectedBlock.props.content} onChange={e => updateProp('content', e.target.value)} /></>
                  )}
                  {selectedBlock.type === 'image' && (
                    <><label className="vpb-label">Upload</label><input type="file" className="vpb-input" accept="image/*" onChange={e => handleImageUpload(e, 'src')} />
                    <label className="vpb-label">Largura (%)</label><input type="range" min="10" max="100" className="vpb-input" value={selectedBlock.props.width} onChange={e => updateProp('width', e.target.value)} /></>
                  )}
                </div>
                {/* Outras props aqui seriam mantidas como no VisualPageBuilder original */}
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
