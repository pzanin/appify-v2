import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Columns, Grid, Image as ImageIcon, LayoutGrid, Link as LinkIcon, Minus, PanelsTopLeft, Rows3, SeparatorHorizontal, Sparkles, SquareStack, Type, Video as VideoIcon } from 'lucide-react';
import type { AdvancedLayout, BuilderBlock, CardItem, CarouselItem, EntryAnimation as EntryAnimationType, SubModule } from '../types';
import { useAppStore } from '../store/useAppStore';
import { AccordionBlock } from './AccordionBlock';
import { TabsBlock } from './TabsBlock';
import { VideoEmbed } from './VideoEmbed';
import { CardsBlock } from './CardsBlock';
import { CarouselBlock } from './CarouselBlock';
import { AdvancedLayoutBlock } from './AdvancedLayoutBlock';
import { EntryAnimation } from './EntryAnimation';
import { renderAccordionHtml, renderTabsHtml, animationDataAttributes, interactiveBlocksCss, interactiveBlocksScript } from '../utils/interactiveBlocks';
import { renderCardsHtml, renderCarouselHtml, advancedBlocksCss, advancedBlocksJs } from '../utils/advancedBlocks';
import { buildVideoEmbedUrl, detectVideoProvider } from '../utils/mediaEmbed';

interface Props {
  submodule: SubModule;
  onSave: (html: string, builderData: BuilderBlock[], htmlMode?: 'visual' | 'code') => void;
  onClose: () => void;
}

const uid = (prefix = 'blk') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const esc = (value = '') => value.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch] as string));

const sampleAccordion = () => [
  { id: uid('acc'), title: 'Pergunta ou tópico 1', content: 'Conteúdo do primeiro item.' },
  { id: uid('acc'), title: 'Pergunta ou tópico 2', content: 'Conteúdo do segundo item.' },
];
const sampleTabs = () => [
  { id: uid('tab'), label: 'Visão geral', content: 'Conteúdo da primeira aba.' },
  { id: uid('tab'), label: 'Detalhes', content: 'Conteúdo da segunda aba.' },
];
const sampleCards = (): CardItem[] => [
  { id: uid('card'), title: 'Card 1', text: 'Descrição do primeiro card.', badge: 'Destaque', image: '', buttonText: 'Saiba mais', buttonUrl: '' },
  { id: uid('card'), title: 'Card 2', text: 'Descrição do segundo card.', badge: '', image: '', buttonText: '', buttonUrl: '' },
];
const sampleCarousel = (): CarouselItem[] => [
  { id: uid('slide'), title: 'Slide 1', text: 'Descrição do primeiro slide.', image: '', buttonText: '', buttonUrl: '' },
  { id: uid('slide'), title: 'Slide 2', text: 'Descrição do segundo slide.', image: '', buttonText: '', buttonUrl: '' },
];

function defaultProps(type: string, subtype?: string): BuilderBlock['props'] {
  const base: BuilderBlock['props'] = { bgColor: '#ffffff', color: '#1f2937', padding: 20, align: 'left', fontSize: 16, entryAnimation: 'none', animationDurationMs: 500, animationDelayMs: 0, animationOnce: true };
  if (type === 'header') return { ...base, title: 'Título principal', subtitle: 'Subtítulo da seção', titleFontSize: 32, titleFontWeight: 700 };
  if (type === 'text') return { ...base, content: 'Digite seu texto aqui.' };
  if (type === 'image') return { ...base, src: '', alt: 'Imagem', width: 100, imgBorderRadius: 12 };
  if (type === 'link') return { ...base, text: 'Clique aqui', url: 'https://', buttonColor: '#6b8af0', buttonTextColor: '#ffffff' };
  if (type === 'divider') return { ...base, dividerColor: '#e5e7eb', thickness: 1, padding: 12 };
  if (type === 'spacer') return { ...base, height: 40, bgColor: 'transparent' };
  if (type === 'video') return { ...base, videoProvider: 'youtube', videoUrl: '', videoAspectRatio: '16:9', videoThumbnail: '', videoAutoplay: false, videoLoop: false, videoMuted: false, videoControls: true, videoBorderRadius: 14, videoWidth: 100 };
  if (type === 'accordion') return { ...base, accordionItems: sampleAccordion(), accordionAllowMultiple: false };
  if (type === 'tabs') return { ...base, tabs: sampleTabs(), tabsActiveIndex: 0 };
  if (type === 'cards') return { ...base, cards: sampleCards(), cardLayout: 'grid', cardColumns: 2, cardGap: 16, cardRadius: 14 };
  if (type === 'carousel') return { ...base, carouselItems: sampleCarousel(), carouselAutoplay: false, carouselIntervalMs: 5000, carouselShowDots: true, carouselShowArrows: true, carouselAspectRatio: '16:9' };
  if (type === 'container') {
    if (subtype === 'oneColumn') return { ...base, title: 'Título da seção', text: 'Conteúdo da seção em uma única coluna.', containerMaxWidth: 760, align: 'left' };
    if (subtype === 'twoColumn') return { ...base, leftTitle: 'Coluna esquerda', leftText: 'Texto da esquerda', rightTitle: 'Coluna direita', rightText: 'Texto da direita', columnBgColor: '#f8fafc', columnPadding: 20 };
    if (subtype === 'threeColumn') return { ...base, col1Title: 'Card 1', col1Text: 'Texto 1', col2Title: 'Card 2', col2Text: 'Texto 2', col3Title: 'Card 3', col3Text: 'Texto 3', cardBgColor: '#f8fafc', cardPadding: 18 };
    const layout = (subtype || 'feature-split') as AdvancedLayout;
    return { ...base, advancedLayout: layout, eyebrow: 'Destaque', title: 'Título da seção', text: 'Explique aqui o benefício, etapa ou conceito principal.', imageSrc: '', buttonText: 'Saiba mais', buttonUrl: '', layoutGap: 20, reverseMobile: false };
  }
  return base;
}

function renderLegacy(block: BuilderBlock) {
  const p = block.props;
  switch (block.type) {
    case 'header': return <><h2 style={{ margin: 0, fontSize: Number(p.titleFontSize || 32), fontWeight: Number(p.titleFontWeight || 700) }}>{p.title}</h2>{p.subtitle && <p style={{ margin: '8px 0 0', opacity: .72 }}>{p.subtitle}</p>}</>;
    case 'text': return <p style={{ margin: 0, lineHeight: 1.65 }}>{p.content}</p>;
    case 'image': return p.src ? <img src={p.src} alt={p.alt || ''} style={{ width: `${p.width || 100}%`, maxWidth: '100%', borderRadius: Number(p.imgBorderRadius || 0), display: 'block', margin: p.align === 'center' ? '0 auto' : undefined }} /> : <div style={{ padding: 36, border: '1px dashed #cbd5e1', borderRadius: 12, textAlign: 'center', opacity: .65 }}>Imagem</div>;
    case 'link': return <a href={p.url || '#'} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: p.buttonColor || '#6b8af0', color: p.buttonTextColor || '#fff', padding: '12px 20px', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>{p.text}</a>;
    case 'divider': return <hr style={{ border: 0, borderTop: `${Number(p.thickness || 1)}px solid ${p.dividerColor || '#e5e7eb'}` }} />;
    case 'spacer': return <div style={{ height: Number(p.height || 40) }} />;
    case 'container': {
      if (block.subtype === 'oneColumn') return <div style={{ maxWidth: Number(p.containerMaxWidth || 760), margin: '0 auto' }}><h2>{p.title}</h2><p>{p.text}</p></div>;
      if (block.subtype === 'twoColumn') return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 16 }}><div><h3>{p.leftTitle}</h3><p>{p.leftText}</p></div><div><h3>{p.rightTitle}</h3><p>{p.rightText}</p></div></div>;
      if (block.subtype === 'threeColumn') return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 14 }}>{[[p.col1Title,p.col1Text],[p.col2Title,p.col2Text],[p.col3Title,p.col3Text]].map((x,i)=><div key={i} style={{ padding: 16, border: '1px solid rgba(127,127,127,.18)', borderRadius: 12 }}><h3>{x[0]}</h3><p>{x[1]}</p></div>)}</div>;
      return <AdvancedLayoutBlock layout={(p.advancedLayout || block.subtype || 'feature-split') as AdvancedLayout} title={p.title} text={p.text} image={p.imageSrc} eyebrow={p.eyebrow} buttonText={p.buttonText} buttonUrl={p.buttonUrl} gap={Number(p.layoutGap || 20)} reverseMobile={!!p.reverseMobile} />;
    }
    default: return null;
  }
}

function BlockPreview({ block }: { block: BuilderBlock }) {
  const p = block.props;
  let content: React.ReactNode;
  if (block.type === 'video') content = <VideoEmbed url={p.videoUrl || ''} provider={p.videoProvider} aspectRatio={p.videoAspectRatio || '16:9'} thumbnail={p.videoThumbnail} autoplay={!!p.videoAutoplay} loop={!!p.videoLoop} muted={!!p.videoMuted} controls={p.videoControls !== false} borderRadius={p.videoBorderRadius || 14} width={`${p.videoWidth || 100}%`} />;
  else if (block.type === 'accordion') content = <AccordionBlock items={p.accordionItems || []} allowMultiple={!!p.accordionAllowMultiple} />;
  else if (block.type === 'tabs') content = <TabsBlock tabs={p.tabs || []} initialIndex={Number(p.tabsActiveIndex || 0)} />;
  else if (block.type === 'cards') content = <CardsBlock items={p.cards || []} layout={p.cardLayout || 'grid'} columns={(Number(p.cardColumns || 2) as 1|2|3)} gap={Number(p.cardGap || 16)} borderRadius={Number(p.cardRadius || 14)} />;
  else if (block.type === 'carousel') content = <CarouselBlock items={p.carouselItems || []} autoplay={!!p.carouselAutoplay} intervalMs={Number(p.carouselIntervalMs || 5000)} showDots={p.carouselShowDots !== false} showArrows={p.carouselShowArrows !== false} aspectRatio={p.carouselAspectRatio || '16:9'} />;
  else content = renderLegacy(block);

  return <EntryAnimation animation={p.entryAnimation || 'none'} durationMs={Number(p.animationDurationMs || 500)} delayMs={Number(p.animationDelayMs || 0)} once={p.animationOnce !== false}>{content}</EntryAnimation>;
}

function basicHtml(block: BuilderBlock): string {
  const p = block.props;
  if (block.type === 'header') return `<h2>${esc(p.title || '')}</h2>${p.subtitle ? `<p>${esc(p.subtitle)}</p>` : ''}`;
  if (block.type === 'text') return `<p>${esc(p.content || '')}</p>`;
  if (block.type === 'image') return p.src ? `<img src="${esc(p.src)}" alt="${esc(p.alt || '')}" style="max-width:${Number(p.width || 100)}%;border-radius:${Number(p.imgBorderRadius || 0)}px">` : '';
  if (block.type === 'link') return `<a href="${esc(p.url || '#')}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${p.buttonColor || '#6b8af0'};color:${p.buttonTextColor || '#fff'};padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">${esc(p.text || 'Abrir')}</a>`;
  if (block.type === 'divider') return `<hr style="border:0;border-top:${Number(p.thickness || 1)}px solid ${p.dividerColor || '#e5e7eb'}">`;
  if (block.type === 'spacer') return `<div style="height:${Number(p.height || 40)}px"></div>`;
  if (block.type === 'accordion') return renderAccordionHtml(p.accordionItems || [], !!p.accordionAllowMultiple);
  if (block.type === 'tabs') return renderTabsHtml(p.tabs || [], Number(p.tabsActiveIndex || 0));
  if (block.type === 'cards') return renderCardsHtml(p.cards || [], Number(p.cardColumns || 2), Number(p.cardGap || 16), Number(p.cardRadius || 14));
  if (block.type === 'carousel') return renderCarouselHtml(p.carouselItems || [], !!p.carouselAutoplay, Number(p.carouselIntervalMs || 5000), p.carouselShowDots !== false, p.carouselShowArrows !== false);
  if (block.type === 'video') {
    const provider = p.videoProvider || detectVideoProvider(p.videoUrl || '');
    const src = buildVideoEmbedUrl(provider, p.videoUrl || '', { autoplay: !!p.videoAutoplay, loop: !!p.videoLoop, muted: !!p.videoMuted, controls: p.videoControls !== false });
    if (!src) return '';
    const ratio = p.videoAspectRatio === '9:16' ? '9/16' : p.videoAspectRatio === '1:1' ? '1/1' : '16/9';
    return provider === 'direct' ? `<video src="${esc(src)}" controls playsinline style="width:100%;aspect-ratio:${ratio};object-fit:cover;border-radius:${Number(p.videoBorderRadius || 14)}px"></video>` : `<iframe src="${esc(src)}" allowfullscreen loading="lazy" style="width:100%;aspect-ratio:${ratio};border:0;border-radius:${Number(p.videoBorderRadius || 14)}px"></iframe>`;
  }
  if (block.type === 'container') {
    if (block.subtype === 'oneColumn') return `<div style="max-width:${Number(p.containerMaxWidth || 760)}px;margin:0 auto"><h2>${esc(p.title || '')}</h2><p>${esc(p.text || '')}</p></div>`;
    if (block.subtype === 'twoColumn') return `<div class="appify-two"><div><h3>${esc(p.leftTitle || '')}</h3><p>${esc(p.leftText || '')}</p></div><div><h3>${esc(p.rightTitle || '')}</h3><p>${esc(p.rightText || '')}</p></div></div>`;
    if (block.subtype === 'threeColumn') return `<div class="appify-three">${[[p.col1Title,p.col1Text],[p.col2Title,p.col2Text],[p.col3Title,p.col3Text]].map(x=>`<div><h3>${esc(String(x[0]||''))}</h3><p>${esc(String(x[1]||''))}</p></div>`).join('')}</div>`;
    const image = p.imageSrc ? `<img src="${esc(p.imageSrc)}" alt="">` : '<div class="appify-media-placeholder"></div>';
    return `<section class="appify-advanced ${esc(String(p.advancedLayout || block.subtype || 'feature-split'))}"><div><small>${esc(p.eyebrow || '')}</small><h2>${esc(p.title || '')}</h2><p>${esc(p.text || '')}</p>${p.buttonText && p.buttonUrl ? `<a href="${esc(p.buttonUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.buttonText)}</a>` : ''}</div>${image}</section>`;
  }
  return '';
}

export function ModulesAndContent({ submodule, onSave, onClose }: Props) {
  const updateSubmoduleContent = useAppStore(state => state.updateSubmoduleContent);
  const editingSubmodule = useAppStore(state => state.editingSubmodule);
  const [blocks, setBlocks] = useState<BuilderBlock[]>(submodule.builder_data || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState(submodule.name || '');
  const [contentType, setContentType] = useState(submodule.contentType || 'html');
  const [contentUrl, setContentUrl] = useState(submodule.contentUrl || '');
  const selected = useMemo(() => blocks.find(b => b.id === selectedId) || null, [blocks, selectedId]);

  const add = (type: string, subtype?: string) => {
    const block: BuilderBlock = { id: uid(), type, subtype: subtype || null, props: defaultProps(type, subtype) };
    setBlocks(prev => [...prev, block]);
    setSelectedId(block.id);
  };
  const update = (key: keyof BuilderBlock['props'], value: any) => setBlocks(prev => prev.map(b => b.id === selectedId ? { ...b, props: { ...b.props, [key]: value } } : b));
  const updateItem = (key: 'accordionItems'|'tabs'|'cards'|'carouselItems', index: number, field: string, value: any) => {
    const arr = [...(((selected?.props as any)?.[key] || []) as any[])];
    arr[index] = { ...arr[index], [field]: value };
    update(key, arr as any);
  };
  const removeItem = (key: 'accordionItems'|'tabs'|'cards'|'carouselItems', index: number) => update(key, (((selected?.props as any)?.[key] || []) as any[]).filter((_: any, i: number) => i !== index) as any);

  const generateHTML = () => {
    const body = blocks.map(block => {
      const p = block.props;
      const attrs = animationDataAttributes(p.entryAnimation || 'none', Number(p.animationDurationMs || 500), Number(p.animationDelayMs || 0), p.animationOnce !== false);
      return `<section ${attrs} style="background:${p.bgColor || '#fff'};color:${p.color || '#1f2937'};padding:${Number(p.padding || 0)}px;text-align:${p.align || 'left'}">${basicHtml(block)}</section>`;
    }).join('\n');
    const responsiveCss = `<style>*{box-sizing:border-box}.appify-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.appify-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.appify-advanced{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:center}.appify-advanced img,.appify-media-placeholder{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:16px;background:rgba(127,127,127,.08)}.appify-advanced.highlight-band{display:block;padding:24px;border:1px solid rgba(127,127,127,.18);border-radius:16px}.appify-advanced.media-stack{display:flex;flex-direction:column}.appify-advanced.media-stack img{aspect-ratio:16/9}@media(max-width:640px){.appify-two,.appify-three,.appify-advanced{grid-template-columns:1fr}}</style>`;
    return `${responsiveCss}${interactiveBlocksCss}<style>${advancedBlocksCss}</style><div class="v-generated-content">${body}</div>${interactiveBlocksScript}<script>${advancedBlocksJs}</script>`;
  };

  const save = () => {
    const html = contentType === 'html' ? generateHTML() : '';
    if (editingSubmodule) updateSubmoduleContent({ modId: editingSubmodule.modId, subId: editingSubmodule.subId, name, contentType: contentType as any, contentUrl, contentHtml: html, content: html, builderData: contentType === 'html' ? blocks : [], htmlMode: 'visual' });
    onSave(html, contentType === 'html' ? blocks : [], 'visual');
  };

  const commonButton: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontSize: 12, fontWeight: 700 };
  const label: React.CSSProperties = { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 6, display: 'block' };
  const input: React.CSSProperties = { width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text)', marginBottom: 10, fontSize: 12 };

  return <div className="vpb-overlay" style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
    <header className="vpb-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><button className="btn-ghost" onClick={onClose}><ArrowLeft size={16}/> Voltar</button><strong>{name}</strong><span style={{ fontSize: 10, color: 'var(--muted)' }}>Builder integrado</span></div>
      <button className="btn-primary" onClick={save}><Check size={16}/> Salvar Aula</button>
    </header>

    <div style={{ display: 'grid', gridTemplateColumns: '230px minmax(0,1fr) 300px', minHeight: 0, flex: 1 }}>
      <aside style={{ borderRight: '1px solid var(--border)', padding: 14, overflowY: 'auto' }}>
        <span style={label}>Containers</span>
        {[['1 Coluna','oneColumn',Rows3],['2 Colunas','twoColumn',Columns],['3 Colunas','threeColumn',Grid],['Feature Split','feature-split',LayoutGrid],['Media Stack','media-stack',SquareStack],['Highlight Band','highlight-band',Sparkles],['Masonry Lite','masonry-lite',PanelsTopLeft]].map(([txt,sub,Icon]: any)=><button key={sub} style={{...commonButton, marginBottom:6}} onClick={()=>add('container',sub)}><Icon size={14} style={{display:'inline',marginRight:8}}/>{txt}</button>)}
        <span style={{...label, marginTop: 16}}>Elementos</span>
        {[['Título','header',Type],['Texto','text',Rows3],['Imagem','image',ImageIcon],['Botão / Link','link',LinkIcon],['Vídeo','video',VideoIcon],['Accordion','accordion',Rows3],['Tabs','tabs',PanelsTopLeft],['Cards','cards',Grid],['Carrossel','carousel',SquareStack],['Divisor','divider',SeparatorHorizontal],['Espaçador','spacer',Minus]].map(([txt,type,Icon]: any)=><button key={type} style={{...commonButton, marginBottom:6}} onClick={()=>add(type)}><Icon size={14} style={{display:'inline',marginRight:8}}/>{txt}</button>)}
      </aside>

      <main style={{ overflowY: 'auto', padding: 22, background: 'var(--surface2)' }} onClick={()=>setSelectedId(null)}>
        <div style={{ maxWidth: 860, margin: '0 auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
          {contentType !== 'html' ? <div style={{ padding: 40 }}><h3>Conteúdo por URL</h3><input style={input} value={contentUrl} onChange={e=>setContentUrl(e.target.value)} placeholder="https://..."/></div> : blocks.length === 0 ? <div style={{ padding: 70, textAlign: 'center', color: 'var(--muted)' }}>Adicione um bloco à esquerda.</div> : blocks.map(block => <section key={block.id} onClick={e=>{e.stopPropagation();setSelectedId(block.id)}} style={{ position: 'relative', background: block.props.bgColor || '#fff', color: block.props.color || '#1f2937', padding: Number(block.props.padding || 0), textAlign: block.props.align as any, outline: block.id === selectedId ? '2px solid var(--accent)' : '1px solid transparent', outlineOffset: -2 }}><BlockPreview block={block}/><button onClick={e=>{e.stopPropagation();setBlocks(x=>x.filter(b=>b.id!==block.id));setSelectedId(null)}} style={{ position:'absolute', top:6,right:6,border:0,borderRadius:8,padding:'4px 7px',background:'rgba(0,0,0,.55)',color:'#fff',cursor:'pointer',fontSize:10 }}>Excluir</button></section>)}
        </div>
      </main>

      <aside style={{ borderLeft: '1px solid var(--border)', padding: 14, overflowY: 'auto' }}>
        <span style={label}>Aula</span>
        <input style={input} value={name} onChange={e=>setName(e.target.value)} />
        <select style={input} value={contentType} onChange={e=>setContentType(e.target.value as any)}><option value="html">HTML / Builder Visual</option><option value="web">Página Web</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="panda">Panda Video</option></select>
        {!selected ? <p style={{ fontSize: 12, color: 'var(--muted)' }}>Selecione um bloco para editar.</p> : <>
          <span style={{...label, marginTop: 14}}>Bloco selecionado</span>
          {selected.type === 'header' && <><input style={input} value={selected.props.title || ''} onChange={e=>update('title',e.target.value)}/><input style={input} value={selected.props.subtitle || ''} onChange={e=>update('subtitle',e.target.value)}/></>}
          {selected.type === 'text' && <textarea style={{...input,minHeight:90}} value={selected.props.content || ''} onChange={e=>update('content',e.target.value)}/>} 
          {selected.type === 'image' && <><input style={input} placeholder="URL da imagem" value={selected.props.src || ''} onChange={e=>update('src',e.target.value)}/><input style={input} placeholder="Alt" value={selected.props.alt || ''} onChange={e=>update('alt',e.target.value)}/></>}
          {selected.type === 'link' && <><input style={input} value={selected.props.text || ''} onChange={e=>update('text',e.target.value)}/><input style={input} value={selected.props.url || ''} onChange={e=>update('url',e.target.value)}/></>}
          {selected.type === 'video' && <><select style={input} value={selected.props.videoProvider || 'youtube'} onChange={e=>update('videoProvider',e.target.value)}><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option><option value="direct">MP4 / URL direta</option></select><input style={input} placeholder="URL do vídeo" value={selected.props.videoUrl || ''} onChange={e=>update('videoUrl',e.target.value)}/><select style={input} value={selected.props.videoAspectRatio || '16:9'} onChange={e=>update('videoAspectRatio',e.target.value)}><option>16:9</option><option>9:16</option><option>1:1</option></select><label style={{fontSize:12}}><input type="checkbox" checked={!!selected.props.videoAutoplay} onChange={e=>update('videoAutoplay',e.target.checked)}/> Autoplay</label><br/><label style={{fontSize:12}}><input type="checkbox" checked={selected.props.videoControls !== false} onChange={e=>update('videoControls',e.target.checked)}/> Controles</label></>}
          {selected.type === 'accordion' && <><label style={{fontSize:12}}><input type="checkbox" checked={!!selected.props.accordionAllowMultiple} onChange={e=>update('accordionAllowMultiple',e.target.checked)}/> Permitir múltiplos abertos</label>{(selected.props.accordionItems||[]).map((it,i)=><div key={it.id} style={{marginTop:10,padding:8,border:'1px solid var(--border)',borderRadius:8}}><input style={input} value={it.title} onChange={e=>updateItem('accordionItems',i,'title',e.target.value)}/><textarea style={input} value={it.content} onChange={e=>updateItem('accordionItems',i,'content',e.target.value)}/><button style={commonButton} onClick={()=>removeItem('accordionItems',i)}>Remover</button></div>)}<button style={{...commonButton,marginTop:8}} onClick={()=>update('accordionItems',[...(selected.props.accordionItems||[]),{id:uid('acc'),title:'Novo item',content:'Conteúdo'}])}>+ Item</button></>}
          {selected.type === 'tabs' && <>{(selected.props.tabs||[]).map((it,i)=><div key={it.id} style={{marginTop:10,padding:8,border:'1px solid var(--border)',borderRadius:8}}><input style={input} value={it.label} onChange={e=>updateItem('tabs',i,'label',e.target.value)}/><textarea style={input} value={it.content} onChange={e=>updateItem('tabs',i,'content',e.target.value)}/><button style={commonButton} onClick={()=>removeItem('tabs',i)}>Remover</button></div>)}<button style={{...commonButton,marginTop:8}} onClick={()=>update('tabs',[...(selected.props.tabs||[]),{id:uid('tab'),label:'Nova aba',content:'Conteúdo'}])}>+ Aba</button></>}
          {selected.type === 'cards' && <><select style={input} value={selected.props.cardLayout || 'grid'} onChange={e=>update('cardLayout',e.target.value)}><option value="grid">Grade</option><option value="horizontal">Horizontal</option><option value="compact">Compacto</option></select><select style={input} value={Number(selected.props.cardColumns || 2)} onChange={e=>update('cardColumns',Number(e.target.value))}><option value={1}>1 coluna</option><option value={2}>2 colunas</option><option value={3}>3 colunas</option></select>{(selected.props.cards||[]).map((it,i)=><div key={it.id} style={{marginTop:10,padding:8,border:'1px solid var(--border)',borderRadius:8}}><input style={input} placeholder="Título" value={it.title} onChange={e=>updateItem('cards',i,'title',e.target.value)}/><textarea style={input} placeholder="Texto" value={it.text} onChange={e=>updateItem('cards',i,'text',e.target.value)}/><input style={input} placeholder="Imagem URL" value={it.image || ''} onChange={e=>updateItem('cards',i,'image',e.target.value)}/><button style={commonButton} onClick={()=>removeItem('cards',i)}>Remover</button></div>)}<button style={{...commonButton,marginTop:8}} onClick={()=>update('cards',[...(selected.props.cards||[]),{id:uid('card'),title:'Novo card',text:'Descrição',image:'',badge:'',buttonText:'',buttonUrl:''}])}>+ Card</button></>}
          {selected.type === 'carousel' && <><label style={{fontSize:12}}><input type="checkbox" checked={!!selected.props.carouselAutoplay} onChange={e=>update('carouselAutoplay',e.target.checked)}/> Autoplay</label><select style={{...input,marginTop:8}} value={selected.props.carouselAspectRatio || '16:9'} onChange={e=>update('carouselAspectRatio',e.target.value)}><option>16:9</option><option>4:3</option><option>1:1</option><option>9:16</option></select>{(selected.props.carouselItems||[]).map((it,i)=><div key={it.id} style={{marginTop:10,padding:8,border:'1px solid var(--border)',borderRadius:8}}><input style={input} placeholder="Título" value={it.title || ''} onChange={e=>updateItem('carouselItems',i,'title',e.target.value)}/><textarea style={input} placeholder="Texto" value={it.text || ''} onChange={e=>updateItem('carouselItems',i,'text',e.target.value)}/><input style={input} placeholder="Imagem URL" value={it.image || ''} onChange={e=>updateItem('carouselItems',i,'image',e.target.value)}/><button style={commonButton} onClick={()=>removeItem('carouselItems',i)}>Remover</button></div>)}<button style={{...commonButton,marginTop:8}} onClick={()=>update('carouselItems',[...(selected.props.carouselItems||[]),{id:uid('slide'),title:'Novo slide',text:'Descrição',image:'',buttonText:'',buttonUrl:''}])}>+ Slide</button></>}
          {selected.type === 'container' && !['twoColumn','threeColumn'].includes(selected.subtype || '') && <><input style={input} placeholder="Título" value={selected.props.title || ''} onChange={e=>update('title',e.target.value)}/><textarea style={input} placeholder="Texto" value={selected.props.text || ''} onChange={e=>update('text',e.target.value)}/>{selected.subtype !== 'oneColumn' && <><input style={input} placeholder="Imagem URL" value={selected.props.imageSrc || ''} onChange={e=>update('imageSrc',e.target.value)}/><input style={input} placeholder="Eyebrow" value={selected.props.eyebrow || ''} onChange={e=>update('eyebrow',e.target.value)}/></>}</>}

          <span style={{...label, marginTop: 16}}>Aparência</span>
          <label style={{fontSize:11}}>Padding: {Number(selected.props.padding || 0)}px</label><input type="range" min={0} max={100} value={Number(selected.props.padding || 0)} onChange={e=>update('padding',Number(e.target.value))} style={{width:'100%'}}/>
          <label style={label}>Animação de entrada</label><select style={input} value={selected.props.entryAnimation || 'none'} onChange={e=>update('entryAnimation',e.target.value as EntryAnimationType)}><option value="none">Nenhuma</option><option value="fade">Fade</option><option value="fade-up">Fade Up</option><option value="fade-down">Fade Down</option><option value="slide-left">Slide Left</option><option value="slide-right">Slide Right</option><option value="zoom">Zoom</option></select>
          <label style={{fontSize:11}}>Duração: {Number(selected.props.animationDurationMs || 500)}ms</label><input type="range" min={150} max={1800} step={50} value={Number(selected.props.animationDurationMs || 500)} onChange={e=>update('animationDurationMs',Number(e.target.value))} style={{width:'100%'}}/>
          <label style={{fontSize:11}}>Delay: {Number(selected.props.animationDelayMs || 0)}ms</label><input type="range" min={0} max={1500} step={50} value={Number(selected.props.animationDelayMs || 0)} onChange={e=>update('animationDelayMs',Number(e.target.value))} style={{width:'100%'}}/>
          <label style={{fontSize:12}}><input type="checkbox" checked={selected.props.animationOnce !== false} onChange={e=>update('animationOnce',e.target.checked)}/> Executar uma vez</label>
        </>}
      </aside>
    </div>
  </div>;
}
