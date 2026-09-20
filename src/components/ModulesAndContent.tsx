import React, { useRef, useState } from 'react';
import { 
  ArrowLeft, Check, LayoutGrid, Columns, Grid, Image as ImageIcon, 
  Quote, Zap, Type, AlignLeft, Link as LinkIcon, Minus, 
  SeparatorHorizontal, Trash2, Layers, Video, Globe, Code, Upload, Eye
} from 'lucide-react';
import { SubModule, BuilderBlock } from '../types';
import { GOOGLE_FONTS } from '../constants';
import { useAppStore } from '../store/useAppStore';
import { prepareResponsiveHtml } from '../utils/htmlContent';

interface ModulesAndContentProps { 
  submodule: SubModule; 
  onSave: (html: string, builderData: BuilderBlock[], htmlMode?: 'visual' | 'code') => void; 
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
  const [viewMode, setViewMode] = useState<'visual' | 'code'>(submodule.htmlMode || 'visual');
  const [submoduleName, setSubmoduleName] = useState(submodule.name || '');
  
  // Content Type & URL state
  const [contentType, setContentType] = useState<'web' | 'html' | 'youtube' | 'vimeo' | 'panda'>(submodule.contentType || 'html');
  const [contentUrl, setContentUrl] = useState(submodule.contentUrl || '');
  const [contentHtml, setContentHtml] = useState(
    submodule.customHtml || (submodule.htmlMode === 'code' ? submodule.contentHtml || submodule.content_html || '' : '')
  );
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
        gamificationConfig: {
          timeGateSeconds,
          enableCelebration
        }
      });
      onSave(finalHtml, finalBlocks, contentType === 'html' ? viewMode : undefined);
    }
  };

  const generateId = () => 'mod_' + Math.random().toString(36).substr(2, 9);

  const getDefaultProps = (type: string, subtype?: string) => {
    const base = { bgColor: '#ffffff', padding: '20', align: 'left', fontFamily: 'DM Sans', fontSize: '16', color: '#333333' };
    switch(type) {
      case 'header': return { ...base, title: 'Título Principal', subtitle: 'Subtítulo da página', fontSize: '32', align: 'center', padding: '40', titleFontSize: '32', titleFontWeight: '700', titleMarginBottom: '8' };
      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };
      case 'image': return { ...base, src: '', alt: 'Imagem', width: '100', align: 'center', imgHeight: 'auto', imgBorderRadius: '0', imgObjectFit: 'cover' as const };
      case 'link': return { ...base, text: 'Clique aqui', url: 'https://', style: 'button', buttonColor: '#6b8af0', buttonTextColor: '#ffffff', align: 'center' };
      case 'spacer': return { ...base, height: '40', bgColor: 'transparent', align: 'left' };
      case 'divider': return { ...base, dividerColor: '#e5e7eb', thickness: '1', padding: '10', align: 'center' };
      case 'container':
        switch(subtype) {
          case 'hero': return { ...base, bgColor: '#6b8af0', padding: '80', align: 'center', title: 'Bem-vindo ao seu site', subtitle: 'Descrição principal em destaque', titleColor: '#ffffff', subtitleColor: '#e0e7ff', fontSize: '48', titleFontSize: '48', titleFontWeight: '700', titleMarginBottom: '16' };
          case 'twoColumn': return { ...base, bgColor: '#f3f4f6', padding: '40', leftTitle: 'Coluna Esquerda', leftText: 'Texto descritivo aqui', rightTitle: 'Coluna Direita', rightText: 'Outro texto descritivo', columnBgColor: '#ffffff', columnPadding: '24', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };
          case 'threeColumn': return { ...base, bgColor: '#ffffff', padding: '40', col1Title: 'Card 1', col1Text: 'Descrição do primeiro card', col2Title: 'Card 2', col2Text: 'Descrição do segundo card', col3Title: 'Card 3', col3Text: 'Descrição do terceiro card', cardBgColor: '#f3f4f6', cardPadding: '24', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };
          case 'imageText': return { ...base, bgColor: '#ffffff', padding: '40', imageSrc: '', imageAlt: 'Imagem', title: 'Título com imagem', text: 'Texto descritivo ao lado da imagem', imagePosition: 'left', imageWidth: '100', imageHeight: 'auto', imageBorderRadius: '8', imageObjectFit: 'cover' as const, titleFontSize: '24', titleFontWeight: '700', titleMarginBottom: '12' };
          case 'testimonial': return { ...base, bgColor: '#f9fafb', padding: '40', quote: '"Este é um depoimento incrível sobre nosso produto ou serviço."', author: 'Nome do Cliente', role: 'Cargo/Empresa', quoteColor: '#6b8af0', quoteSize: '18' };
          case 'cta': return { ...base, bgColor: '#111118', padding: '60', align: 'center', title: 'Pronto para começar?', subtitle: 'Faça uma ação agora mesmo', titleColor: '#ffffff', subtitleColor: '#d1d5db', buttonText: 'Clique aqui', buttonColor: '#6b8af0', buttonTextColor: '#ffffff', titleFontSize: '36', titleFontWeight: '700', titleMarginBottom: '12' };
        }
    }
    return base;
  };

  const addBlock = (type: string, subtype?: string) => { const newBlock = { id: generateId(), type, subtype: subtype || null, props: getDefaultProps(type, subtype) }; setBlocks([...blocks, newBlock]); setSelectedBlockId(newBlock.id); };
  const updateProp = <K extends keyof BuilderBlock['props']>(key: K, value: BuilderBlock['props'][K]) => { setBlocks(blocks.map(b => b.id === selectedBlockId ? { ...b, props: { ...b.props, [key]: value } } : b)); };
  const moveBlock = (id: string, dir: number) => { const idx = blocks.findIndex(b => b.id === id); const newIdx = idx + dir; if (newIdx < 0 || newIdx >= blocks.length) return; const newBlocks = [...blocks]; [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]]; setBlocks(newBlocks); };
  const deleteBlock = (id: string) => { setBlocks(blocks.filter(b => b.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };

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
      setContentHtml(importedHtml);
      setHasCustomHtml(true);
      setHtmlImportStatus(hasRelativeAssets
        ? `${file.name} importado. Atenção: arquivos locais referenciados por caminho relativo não foram incorporados.`
        : `${file.name} importado. Confira o preview antes de salvar.`);
      setViewMode('code');
    };
    reader.onerror = () => setHtmlImportStatus('Não foi possível ler o arquivo HTML.');
    reader.readAsText(file);
  };

  const safeLinkUrl = (value?: string) => {
    const url = value?.trim() || '#';
    return /^(https?:\/\/|mailto:|tel:|#|\/)/i.test(url) ? url : '#';
  };

  const getBlockInnerHtml = (mod: BuilderBlock) => {
    const p = mod.props;
    // Helper: resolve title styling
    const tfs = p.titleFontSize || p.fontSize || '32';
    const tfw = p.titleFontWeight || '700';
    const tmb = p.titleMarginBottom || '8';
    // Helper: resolve image styling for standalone image block
    const imgH = p.imgHeight && p.imgHeight !== 'auto' ? `height:${p.imgHeight}px;` : 'height:auto;';
    const imgR = `border-radius:${p.imgBorderRadius || 0}px;`;
    const imgF = `object-fit:${p.imgObjectFit || 'cover'};`;
    // Helper: resolve image styling for imageText container
    const itImgW = p.imageWidth ? `width:${p.imageWidth}%;` : 'max-width:100%;';
    const itImgH = p.imageHeight && p.imageHeight !== 'auto' ? `height:${p.imageHeight}px;` : 'height:auto;';
    const itImgR = `border-radius:${p.imageBorderRadius || 8}px;`;
    const itImgF = `object-fit:${p.imageObjectFit || 'cover'};`;

    switch(mod.type) {
      case 'header': return `<h1 style="font-size:${tfs}px;font-weight:${tfw};margin:0 0 ${tmb}px;">${p.title}</h1><p style="font-size:${parseInt(String(tfs))*0.5}px;opacity:0.7;margin:0;">${p.subtitle}</p>`;
      case 'text': return `<p style="margin:0;">${p.content}</p>`;
      case 'image': return p.src ? `<img src="${p.src}" alt="${p.alt}" style="max-width:${p.width}%;${imgH}${imgR}${imgF}display:${p.align==='center'?'block':'inline-block'};margin:${p.align==='center'?'0 auto':p.align==='right'?'0 0 0 auto':'0'};">` : `<div style="border:2px dashed #ccc;padding:40px;text-align:center;color:#999;border-radius:8px;">Clique para adicionar imagem</div>`;
      case 'link': {
        const href = safeLinkUrl(p.url);
        const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return p.style === 'button' ? `<a href="${href}"${external} style="display:inline-block;background:${p.buttonColor};color:${p.buttonTextColor};padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:${p.fontSize}px;">${p.text}</a>` : `<a href="${href}"${external} style="color:${p.buttonColor};text-decoration:underline;font-size:${p.fontSize}px;">${p.text}</a>`;
      }
      case 'spacer': return `<div style="height:${p.height}px;"></div>`;
      case 'divider': return `<hr style="border:none;border-top:${p.thickness}px solid ${p.dividerColor};margin:0;">`;
      case 'container':
        switch(mod.subtype) {
          case 'hero': return `<h1 style="font-size:${tfs}px;font-weight:${tfw};color:${p.titleColor};margin:0 0 ${tmb}px;">${p.title}</h1><p style="font-size:${parseInt(String(tfs))*0.4}px;color:${p.subtitleColor};margin:0;">${p.subtitle}</p>`;
          case 'twoColumn': return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;"><div style="background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:8px;"><h3 style="margin:0 0 ${tmb}px;font-weight:${tfw};font-size:${tfs}px;">${p.leftTitle}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.leftText}</p></div><div style="background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:8px;"><h3 style="margin:0 0 ${tmb}px;font-weight:${tfw};font-size:${tfs}px;">${p.rightTitle}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.rightText}</p></div></div>`;
          case 'threeColumn': return `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;"><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:8px;"><h3 style="margin:0 0 ${tmb}px;font-weight:${tfw};font-size:${tfs}px;">${p.col1Title}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.col1Text}</p></div><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:8px;"><h3 style="margin:0 0 ${tmb}px;font-weight:${tfw};font-size:${tfs}px;">${p.col2Title}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.col2Text}</p></div><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:8px;"><h3 style="margin:0 0 ${tmb}px;font-weight:${tfw};font-size:${tfs}px;">${p.col3Title}</h3><p style="margin:0;font-size:14px;line-height:1.6;">${p.col3Text}</p></div></div>`;
          case 'imageText': {
            const imgHtml = p.imageSrc ? `<img src="${p.imageSrc}" alt="${p.imageAlt}" style="${itImgW}${itImgH}${itImgR}${itImgF}">` : `<div style="background:#e5e7eb;height:300px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Clique para adicionar imagem</div>`;
            const titleH = `<h3 style="margin:0 0 ${tmb}px;font-weight:${tfw};font-size:${tfs}px;">${p.title}</h3>`;
            return p.imagePosition === 'left' ? `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;"><div>${imgHtml}</div><div>${titleH}<p style="margin:0;line-height:1.8;">${p.text}</p></div></div>` : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;"><div>${titleH}<p style="margin:0;line-height:1.8;">${p.text}</p></div><div>${imgHtml}</div></div>`;
          }
          case 'testimonial': return `<div style="background:${p.bgColor};padding:${p.padding}px;border-radius:12px;border-left:4px solid ${p.quoteColor};"><p style="font-size:${p.quoteSize}px;font-style:italic;margin:0 0 16px;line-height:1.8;color:${p.color};">${p.quote}</p><p style="margin:0 0 4px;font-weight:700;color:${p.color};">${p.author}</p><p style="margin:0;font-size:14px;color:#6b7280;">${p.role}</p></div>`;
          case 'cta': return `<h2 style="font-size:${tfs}px;font-weight:${tfw};color:${p.titleColor};margin:0 0 ${tmb}px;">${p.title}</h2><p style="font-size:18px;color:${p.subtitleColor};margin:0 0 24px;">${p.subtitle}</p><a href="#" style="display:inline-block;background:${p.buttonColor};color:${p.buttonTextColor};padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px;">${p.buttonText}</a>`;
        }
    }
    return '';
  };

  const generateHTML = () => {
    const bodyHTML = blocks.map(mod => {
      const p = mod.props;
      const wrapStyle = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;`;
      const inner = sanitizeHtml(getBlockInnerHtml(mod));
      return `<section style="${wrapStyle}">${inner}</section>`;
    }).join('\n');
    
    const uniqueFonts = Array.from(new Set<string>(
      blocks.map(b => b.props.fontFamily).filter((font): font is string => typeof font === 'string' && font.length > 0)
    ));
    const fontLinks = uniqueFonts.map(font => {
      const fontName = font.replace(/\s+/g, '+');
      return `<link href="https://fonts.googleapis.com/css2?family=${fontName}:wght@400;600;700;800&display=swap" rel="stylesheet">`;
    }).join('\n');

    return `<div class="v-generated-content custom-html-container">\n${fontLinks}\n${bodyHTML}\n</div>`;
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
                  <div className="vpb-html-editor-heading">
                    <div className="vpb-lib-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Code size={16} /> HTML personalizado</div>
                    <input ref={htmlFileInputRef} type="file" accept=".html,.htm,text/html" hidden onChange={handleHtmlImport} />
                    <button type="button" className="btn-ghost" onClick={() => htmlFileInputRef.current?.click()}>
                      <Upload size={15} /> Importar .html
                    </button>
                  </div>
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
                      <iframe
                        title="Preview do HTML personalizado"
                        srcDoc={prepareResponsiveHtml(contentHtml)}
                        sandbox="allow-scripts allow-same-origin"
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

                  {selectedBlock.type === 'image' && (
                    <>
                      <label className="vpb-label">Upload de Imagem</label>
                      <input type="file" className="vpb-input" accept="image/*" onChange={e => handleImageUpload(e, 'src')} />
                      {selectedBlock.props.src && (
                        <div style={{ marginBottom: '12px', borderRadius: String(selectedBlock.props.imgBorderRadius || 0) + 'px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={selectedBlock.props.src as string} alt="preview" style={{ width: '100%', maxHeight: '120px', objectFit: (selectedBlock.props.imgObjectFit || 'cover') as any }} />
                        </div>
                      )}
                      <label className="vpb-label">Largura ({selectedBlock.props.width || 100}%)</label>
                      <input type="range" min="10" max="100" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.width || 100} onChange={e => updateProp('width', e.target.value)} />
                      <label className="vpb-label">Altura (px) — "auto" = proporcional</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="number" className="vpb-input" style={{ flex: 1, marginBottom: 0 }} placeholder="auto" value={selectedBlock.props.imgHeight === 'auto' ? '' : selectedBlock.props.imgHeight || ''} onChange={e => updateProp('imgHeight', e.target.value ? e.target.value : 'auto')} />
                        <button type="button" onClick={() => updateProp('imgHeight', 'auto')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: selectedBlock.props.imgHeight === 'auto' ? 'var(--accent)' : 'var(--surface)', color: selectedBlock.props.imgHeight === 'auto' ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Auto</button>
                      </div>
                      <label className="vpb-label">Arredondamento ({selectedBlock.props.imgBorderRadius || 0}px)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="range" min="0" max="200" style={{ flex: 1, accentColor: 'var(--accent)' }} value={selectedBlock.props.imgBorderRadius || 0} onChange={e => updateProp('imgBorderRadius', e.target.value)} />
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

                  {selectedBlock.type === 'link' && (
                    <>
                      <label className="vpb-label">Texto do Botão / Link</label>
                      <input className="vpb-input" value={selectedBlock.props.text || ''} onChange={e => updateProp('text', e.target.value)} />
                      <label className="vpb-label">URL de Destino</label>
                      <input className="vpb-input" placeholder="https://..." value={selectedBlock.props.url || ''} onChange={e => updateProp('url', e.target.value)} />
                      <label className="vpb-label">Estilo</label>
                      <select className="vpb-input" value={selectedBlock.props.style || 'button'} onChange={e => updateProp('style', e.target.value)}>
                        <option value="button">Botão</option>
                        <option value="link">Link com sublinhado</option>
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
                      <label className="vpb-label">Altura ({selectedBlock.props.height || 40}px)</label>
                      <input type="range" min="8" max="200" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.height || 40} onChange={e => updateProp('height', e.target.value)} />
                    </>
                  )}

                  {selectedBlock.type === 'divider' && (
                    <>
                      <label className="vpb-label">Espessura ({selectedBlock.props.thickness || 1}px)</label>
                      <input type="range" min="1" max="8" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.thickness || 1} onChange={e => updateProp('thickness', e.target.value)} />
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
                    </>
                  )}

                  {selectedBlock.type === 'container' && selectedBlock.subtype === 'imageText' && (
                    <>
                      <label className="vpb-label">Upload de Imagem</label>
                      <input type="file" className="vpb-input" accept="image/*" onChange={e => handleImageUpload(e, 'imageSrc')} />
                      {selectedBlock.props.imageSrc && (
                        <div style={{ marginBottom: '12px', borderRadius: String(selectedBlock.props.imageBorderRadius || 8) + 'px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={selectedBlock.props.imageSrc as string} alt="preview" style={{ width: '100%', maxHeight: '100px', objectFit: (selectedBlock.props.imageObjectFit || 'cover') as any }} />
                        </div>
                      )}
                      <label className="vpb-label">Largura da Imagem ({selectedBlock.props.imageWidth || 100}%)</label>
                      <input type="range" min="10" max="100" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.imageWidth || 100} onChange={e => updateProp('imageWidth', e.target.value)} />
                      <label className="vpb-label">Altura (px)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="number" className="vpb-input" style={{ flex: 1, marginBottom: 0 }} placeholder="auto" value={selectedBlock.props.imageHeight === 'auto' ? '' : selectedBlock.props.imageHeight || ''} onChange={e => updateProp('imageHeight', e.target.value ? e.target.value : 'auto')} />
                        <button type="button" onClick={() => updateProp('imageHeight', 'auto')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: selectedBlock.props.imageHeight === 'auto' ? 'var(--accent)' : 'var(--surface)', color: selectedBlock.props.imageHeight === 'auto' ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>Auto</button>
                      </div>
                      <label className="vpb-label">Arredondamento ({selectedBlock.props.imageBorderRadius || 8}px)</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                        <input type="range" min="0" max="200" style={{ flex: 1, accentColor: 'var(--accent)' }} value={selectedBlock.props.imageBorderRadius || 8} onChange={e => updateProp('imageBorderRadius', e.target.value)} />
                        <button type="button" onClick={() => updateProp('imageBorderRadius', '999')} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: String(selectedBlock.props.imageBorderRadius) === '999' ? 'var(--accent)' : 'var(--surface)', color: String(selectedBlock.props.imageBorderRadius) === '999' ? 'white' : 'var(--muted)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}>⬤ Círculo</button>
                      </div>
                      <label className="vpb-label">Preenchimento</label>
                      <select className="vpb-input" value={selectedBlock.props.imageObjectFit || 'cover'} onChange={e => updateProp('imageObjectFit', e.target.value as any)}>
                        <option value="cover">Cobrir (Cover)</option>
                        <option value="contain">Conter (Contain)</option>
                        <option value="fill">Esticar (Fill)</option>
                      </select>
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
                      <input type="number" className="vpb-input" value={selectedBlock.props.quoteSize || 18} onChange={e => updateProp('quoteSize', e.target.value)} />
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

                {/* ── ESTILOS GLOBAIS DO BLOCO ── */}
                <div className="vpb-prop-group">
                  <span className="vpb-lib-label">Estilos do Bloco</span>

                  <label className="vpb-label">Fonte</label>
                  <select className="vpb-input" value={selectedBlock.props.fontFamily || 'DM Sans'} onChange={e => updateProp('fontFamily', e.target.value)}>
                    {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>

                  <label className="vpb-label">Tamanho da Fonte ({selectedBlock.props.fontSize || 16}px)</label>
                  <input type="range" min="10" max="72" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.fontSize || 16} onChange={e => updateProp('fontSize', e.target.value)} />

                  <label className="vpb-label">Cor do Texto</label>
                  <div className="vpb-color-row">
                    <input type="color" className="vpb-color-picker" value={selectedBlock.props.color || '#333333'} onChange={e => updateProp('color', e.target.value)} />
                    <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.color || '#333333'} onChange={e => updateProp('color', e.target.value)} />
                  </div>

                  <label className="vpb-label">Cor de Fundo</label>
                  <div className="vpb-color-row">
                    <input type="color" className="vpb-color-picker" value={selectedBlock.props.bgColor || '#ffffff'} onChange={e => updateProp('bgColor', e.target.value)} />
                    <input className="vpb-input" style={{ flex: 1, marginBottom: 0 }} value={selectedBlock.props.bgColor || '#ffffff'} onChange={e => updateProp('bgColor', e.target.value)} />
                  </div>

                  <label className="vpb-label">Padding ({selectedBlock.props.padding || 20}px)</label>
                  <input type="range" min="0" max="120" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.padding || 20} onChange={e => updateProp('padding', e.target.value)} />

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

                {/* ── TÍTULO AVANÇADO ── */}
                {(selectedBlock.type === 'header' || (selectedBlock.type === 'container' && ['hero', 'cta', 'twoColumn', 'threeColumn', 'imageText'].includes(selectedBlock.subtype || ''))) && (
                  <div className="vpb-prop-group">
                    <span className="vpb-lib-label">Título Avançado</span>

                    <label className="vpb-label">Tamanho do Título ({selectedBlock.props.titleFontSize || selectedBlock.props.fontSize || 32}px)</label>
                    <input type="range" min="12" max="96" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.titleFontSize || selectedBlock.props.fontSize || 32} onChange={e => updateProp('titleFontSize', e.target.value)} />

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

                    <label className="vpb-label">Espaçamento Inferior ({selectedBlock.props.titleMarginBottom || 8}px)</label>
                    <input type="range" min="0" max="80" style={{ width: '100%', accentColor: 'var(--accent)' }} value={selectedBlock.props.titleMarginBottom || 8} onChange={e => updateProp('titleMarginBottom', e.target.value)} />
                  </div>
                )}
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
