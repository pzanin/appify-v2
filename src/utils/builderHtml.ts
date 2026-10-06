import type { BuilderBlock } from '../types';
import { GOOGLE_FONTS } from '../constants';
import { sanitizeImportedHtml } from './htmlSecurity';
import { normalizeExternalUrl } from './externalLinks';
import { detectYouTubeAspectRatio, extractYouTubeId, getYouTubePoster } from './cleanVideo';

export function safeLinkUrl(value?: string): string {
  const raw = value?.trim() || '';
  const candidate = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:[/?#].*)?$/i.test(raw) ? `https://${raw}` : raw;
  return normalizeExternalUrl(candidate) || '#';
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}

export const getDefaultProps = (type: string, subtype?: string) => {
    const base = { bgColor: '#ffffff', padding: '20', align: 'left', fontFamily: 'DM Sans', fontSize: '16', color: '#333333', gap: '16', borderRadius: '8' };
    switch(type) {
      case 'header': return { ...base, title: 'Título Principal', subtitle: 'Subtítulo da página', align: 'center', padding: '40', titleFontFamily: 'Syne', titleFontSize: '32', titleFontWeight: '700', titleMarginBottom: '8' };
      case 'text': return { ...base, content: 'Digite seu texto aqui. Este é um parágrafo de exemplo que pode ser editado.', align: 'left' };
      case 'image': return { ...base, src: '', alt: 'Imagem', width: '100', align: 'center', imgHeight: 'auto', imgBorderRadius: '0', imgObjectFit: 'cover' as const };
      case 'video': return { ...base, url: '', videoAspectRatio: 'auto' as const, videoTitle: 'Vídeo', align: 'center', padding: '0', bgColor: 'transparent', borderRadius: '16' };
      case 'link': return { ...base, borderRadius: '6', text: 'Clique aqui', url: 'https://', style: 'button', buttonColor: '#6b8af0', buttonTextColor: '#ffffff', align: 'center' };
      case 'spacer': return { ...base, height: '40', bgColor: 'transparent', padding: '0', align: 'left' };
      case 'divider': return { ...base, dividerColor: '#e5e7eb', thickness: '1', padding: '10', align: 'center' };
      case 'container':
        switch(subtype) {
          case 'hero': return { ...base, bgColor: '#6b8af0', padding: '60', align: 'center', title: 'Bem-vindo ao seu site', subtitle: 'Descrição principal em destaque', titleColor: '#ffffff', subtitleColor: '#e0e7ff', titleFontFamily: 'Syne', titleFontSize: '42', titleFontWeight: '700', titleMarginBottom: '16' };
          case 'oneColumn': return { ...base, title:'Título da seção', text:'Escreva o conteúdo desta seção.', columnBgColor:'#f3f4f6', columnPadding:'20', titleFontFamily:'Syne', titleFontSize:'24', titleFontWeight:'700', titleMarginBottom:'12' };
          case 'twoColumn': return { ...base, bgColor: '#f3f4f6', padding: '24', leftTitle: 'Coluna Esquerda', leftText: 'Texto descritivo aqui', rightTitle: 'Coluna Direita', rightText: 'Outro texto descritivo', columnBgColor: '#ffffff', columnPadding: '20', titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };
          case 'threeColumn': return { ...base, gap: '14', bgColor: '#ffffff', padding: '20', col1Title: 'Card 1', col1Text: 'Descrição do primeiro card', col2Title: 'Card 2', col2Text: 'Descrição do segundo card', col3Title: 'Card 3', col3Text: 'Descrição do terceiro card', cardBgColor: '#f3f4f6', cardPadding: '18', titleFontFamily: 'Syne', titleFontSize: '18', titleFontWeight: '700', titleMarginBottom: '12' };
          case 'imageText': return { ...base, gap: '24', bgColor: '#ffffff', padding: '24', imageSrc: '', imageAlt: 'Imagem', title: 'Título com imagem', text: 'Texto descritivo ao lado da imagem', imagePosition: 'left', imageWidth: '100', imageHeight: 'auto', imageBorderRadius: '8', imageObjectFit: 'cover' as const, titleFontFamily: 'Syne', titleFontSize: '24', titleFontWeight: '700', titleMarginBottom: '12' };
          case 'testimonial': return { ...base, bgColor: '#f9fafb', padding: '40', quote: '"Este é um depoimento incrível sobre nosso produto ou serviço."', author: 'Nome do Cliente', role: 'Cargo/Empresa', quoteColor: '#6b8af0', quoteSize: '18' };
          case 'cta': return { ...base, borderRadius: '6', bgColor: '#111118', padding: '48', align: 'center', title: 'Pronto para começar?', subtitle: 'Faça uma ação agora mesmo', titleColor: '#ffffff', subtitleColor: '#d1d5db', buttonText: 'Clique aqui', url: 'https://', buttonColor: '#6b8af0', buttonTextColor: '#ffffff', titleFontFamily: 'Syne', titleFontSize: '36', titleFontWeight: '700', titleMarginBottom: '12' };
        }
    }
    return base;
};

export function normalizedBlockProps(block: BuilderBlock): BuilderBlock['props'] {
  const p: BuilderBlock['props'] = { ...getDefaultProps(block.type, block.subtype || undefined), ...block.props };
  const ranges: Record<string, [number, number]> = {
    fontSize: [10,72], titleFontSize: [12,96], titleFontWeight: [400,800], titleMarginBottom: [0,80],
    maxWidth: [0,1600], marginTop: [0,200], marginBottom: [0,200], padding: [0,120], gap: [0,64], borderRadius: [0,200], width: [10,100], imageWidth: [10,100],
    imgBorderRadius: [0,999], imageBorderRadius: [0,999], height: [0,200], thickness: [1,8],
    columnPadding: [0,48], cardPadding: [0,48], quoteSize: [10,72],
  };
  const values = p as Record<string, unknown>;
  const defaults = getDefaultProps(block.type, block.subtype || undefined) as Record<string, unknown>;
  for (const [key, [min,max]] of Object.entries(ranges)) {
    if (values[key] === undefined) continue;
    const number = Number(values[key]);
    values[key] = String(Number.isFinite(number) && values[key] !== '' ? Math.min(max, Math.max(min,number)) : defaults[key] ?? min);
  }
  for (const key of ['imgHeight', 'imageHeight']) {
    const number = Number(values[key]);
    values[key] = values[key] !== 'auto' && values[key] !== '' && Number.isFinite(number) && number > 0 ? String(Math.min(2000,number)) : 'auto';
  }
  for (const key of ['fontFamily', 'titleFontFamily']) {
    if (values[key] && !GOOGLE_FONTS.includes(String(values[key]))) values[key] = 'DM Sans';
  }
  for (const key of ['bgColor','color','titleColor','subtitleColor','buttonColor','buttonTextColor','dividerColor','cardBgColor','columnBgColor','quoteColor']) {
    if (values[key] && !/^(#[a-f0-9]{3,8}|transparent)$/i.test(String(values[key]))) values[key] = defaults[key] || '#333333';
  }
  if (!['left','center','right'].includes(p.align || '')) p.align = 'left';
  if (!['start','center','end','stretch'].includes(p.columnAlign || '')) p.columnAlign='start';
  if (!['auto','16:9','9:16'].includes(p.videoAspectRatio || 'auto')) p.videoAspectRatio = 'auto';
  return p;
}

export const BUILDER_CSS = `
.appify-builder-document { container-type:inline-size; container-name:appify-blocks; width:100%; padding:0; }
.appify-builder-block, .appify-builder-content, .appify-builder-content * { box-sizing:border-box; min-width:0; }
.appify-builder-content { padding:0; overflow-wrap:anywhere; }
.appify-builder-content img { max-width:100%; }
@container appify-blocks (max-width:600px) {
  .appify-builder-content .appify-builder-grid { grid-template-columns:minmax(0,1fr) !important; }
}
`;

export function builderFontLinks(blocks: BuilderBlock[]): string {
  const fonts = new Set(blocks.flatMap(block => {
    const p = normalizedBlockProps(block);
    return [p.fontFamily, p.titleFontFamily];
  }).filter((font): font is string => !!font));
  return [...fonts].map(font => `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g,'+')}:wght@400;600;700;800&amp;display=swap" rel="stylesheet">`).join('');
}

export const getBlockInnerHtml = (mod: BuilderBlock) => {
    const p = normalizedBlockProps(mod);
    const tfs = p.titleFontSize || p.fontSize || '32';
    const tfw = p.titleFontWeight || '700';
    const tmb = p.titleMarginBottom ?? '8';
    const tff = p.titleFontFamily || p.fontFamily || 'DM Sans';
    const titleStyle = `font-family:'${tff}',sans-serif;font-size:${tfs}px;font-weight:${tfw};`;
    const imgH = p.imgHeight && p.imgHeight !== 'auto' ? `height:${p.imgHeight}px;` : 'height:auto;';
    const imgR = `border-radius:${p.imgBorderRadius || 0}px;`;
    const imgF = `object-fit:${p.imgObjectFit || 'cover'};`;
    const itImgW = p.imageWidth ? `width:${p.imageWidth}%;` : 'max-width:100%;';
    const itImgH = p.imageHeight && p.imageHeight !== 'auto' ? `height:${p.imageHeight}px;` : 'height:auto;';
    const itImgR = `border-radius:${p.imageBorderRadius ?? 8}px;`;
    const itImgF = `object-fit:${p.imageObjectFit || 'cover'};`;

    switch(mod.type) {
      case 'header': return `<h1 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.title)}</h1><p style="white-space:pre-wrap;opacity:0.7;margin:0;">${escapeHtml(p.subtitle)}</p>`;
      case 'text': return `<p style="white-space:pre-wrap;margin:0;">${escapeHtml(p.content)}</p>`;
      case 'image': return p.src ? `<img class="appify-sized-image" src="${escapeHtml(p.src)}" alt="${escapeHtml(p.alt)}" style="width:${p.width || 100}% !important;max-width:100%;${imgH}${imgR}${imgF}display:${p.align==='center'?'block':'inline-block'};margin:${p.align==='center'?'0 auto':p.align==='right'?'0 0 0 auto':'0'};">` : `<div style="border:2px dashed #ccc;padding:40px;text-align:center;color:#999;border-radius:${p.borderRadius}px;">Clique para adicionar imagem</div>`;
      case 'video': {
        const url = String(p.url || '').trim();
        const id = extractYouTubeId(url);
        if (!id) return `<div style="border:2px dashed #ccc;padding:36px 20px;text-align:center;color:#777;border-radius:${p.borderRadius}px;background:#f8fafc;">Cole uma URL válida do YouTube ou Shorts nas propriedades do bloco.</div>`;
        const autoRatio = detectYouTubeAspectRatio(url);
        const ratio = p.videoAspectRatio === 'auto' ? autoRatio : (p.videoAspectRatio || autoRatio);
        const ratioCss = ratio === '9:16' ? '9 / 16' : '16 / 9';
        const maxWidth = ratio === '9:16' ? '360px' : '100%';
        const poster = getYouTubePoster(url) || '';
        const title = escapeHtml(p.videoTitle || 'Vídeo');
        const posterStyle = poster ? `background:linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.25)),url('${escapeHtml(poster)}') center/cover no-repeat;` : 'background:linear-gradient(135deg,#161b22,#0b1117);';
        return `<div class="appify-clean-video" style="position:relative;width:100%;max-width:${maxWidth};margin:0 auto;aspect-ratio:${ratioCss};border-radius:${p.borderRadius}px;overflow:hidden;background:#000;box-shadow:0 10px 30px rgba(0,0,0,.18);"><a href="#video" role="button" aria-label="Reproduzir ${title}" data-appify-youtube="${escapeHtml(id)}" data-title="${title}" style="position:absolute;inset:0;display:grid;place-items:center;width:100%;height:100%;border:0;padding:0;cursor:pointer;text-decoration:none;${posterStyle}"><span style="width:68px;height:68px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.94);color:#111827;font-size:30px;line-height:1;box-shadow:0 10px 30px rgba(0,0,0,.28);padding-left:4px;">▶</span></a></div>`;
      }
      case 'link': {
        const href = safeLinkUrl(p.url);
        const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return p.style === 'button' ? `<a href="${escapeHtml(href)}"${external} style="display:inline-block;background:${p.buttonColor};color:${p.buttonTextColor};padding:12px 24px;border-radius:${p.borderRadius}px;max-width:100%;overflow-wrap:anywhere;white-space:normal;text-decoration:none;font-weight:600;font-size:${p.fontSize}px;">${escapeHtml(p.text)}</a>` : `<a href="${escapeHtml(href)}"${external} style="color:${p.buttonColor};text-decoration:underline;font-size:${p.fontSize}px;">${escapeHtml(p.text)}</a>`;
      }
      case 'spacer': return `<div style="height:${p.height}px;"></div>`;
      case 'divider': return `<hr style="border:none;border-top:${p.thickness}px solid ${p.dividerColor};margin:0;">`;
      case 'container':
        switch(mod.subtype) {
          case 'oneColumn': return `<div style="background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;"><h2 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.title)}</h2><p style="white-space:pre-wrap;margin:0;line-height:1.6;">${escapeHtml(p.text)}</p></div>`;
          case 'hero': return `<h1 style="${titleStyle}color:${p.titleColor};margin:0 0 ${tmb}px;">${escapeHtml(p.title)}</h1><p style="white-space:pre-wrap;color:${p.subtitleColor};margin:0;">${escapeHtml(p.subtitle)}</p>`;
          case 'twoColumn': return `<div class="appify-builder-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:${p.gap}px;align-items:${p.columnAlign};"><div style="background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;"><h3 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.leftTitle)}</h3><p style="white-space:pre-wrap;margin:0;line-height:1.6;">${escapeHtml(p.leftText)}</p></div><div style="background:${p.columnBgColor};padding:${p.columnPadding}px;border-radius:${p.borderRadius}px;"><h3 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.rightTitle)}</h3><p style="white-space:pre-wrap;margin:0;line-height:1.6;">${escapeHtml(p.rightText)}</p></div></div>`;
          case 'threeColumn': return `<div class="appify-builder-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:${p.gap}px;align-items:${p.columnAlign};"><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:${p.borderRadius}px;"><h3 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.col1Title)}</h3><p style="white-space:pre-wrap;margin:0;line-height:1.6;">${escapeHtml(p.col1Text)}</p></div><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:${p.borderRadius}px;"><h3 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.col2Title)}</h3><p style="white-space:pre-wrap;margin:0;line-height:1.6;">${escapeHtml(p.col2Text)}</p></div><div style="background:${p.cardBgColor};padding:${p.cardPadding}px;border-radius:${p.borderRadius}px;"><h3 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.col3Title)}</h3><p style="white-space:pre-wrap;margin:0;line-height:1.6;">${escapeHtml(p.col3Text)}</p></div></div>`;
          case 'imageText': {
            const imgHtml = p.imageSrc ? `<img class="appify-sized-image" src="${escapeHtml(p.imageSrc)}" alt="${escapeHtml(p.imageAlt)}" style="${itImgW}${itImgH}${itImgR}${itImgF}">` : `<div style="background:#e5e7eb;height:300px;border-radius:${p.borderRadius}px;display:flex;align-items:center;justify-content:center;color:#9ca3af;">Clique para adicionar imagem</div>`;
            const titleH = `<h3 style="${titleStyle}margin:0 0 ${tmb}px;">${escapeHtml(p.title)}</h3>`;
            return p.imagePosition === 'left' ? `<div class="appify-builder-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:${p.gap}px;align-items:center;"><div>${imgHtml}</div><div>${titleH}<p style="white-space:pre-wrap;margin:0;line-height:1.8;">${escapeHtml(p.text)}</p></div></div>` : `<div class="appify-builder-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:${p.gap}px;align-items:center;"><div>${titleH}<p style="white-space:pre-wrap;margin:0;line-height:1.8;">${escapeHtml(p.text)}</p></div><div>${imgHtml}</div></div>`;
          }
          case 'testimonial': return `<div style="padding-left:20px;border-left:4px solid ${p.quoteColor};"><p style="white-space:pre-wrap;font-size:${p.quoteSize}px;font-style:italic;margin:0 0 16px;line-height:1.8;color:${p.color};">${escapeHtml(p.quote)}</p><p style="white-space:pre-wrap;margin:0 0 4px;font-weight:700;color:${p.color};">${escapeHtml(p.author)}</p><p style="white-space:pre-wrap;margin:0;font-size:14px;color:#6b7280;">${escapeHtml(p.role)}</p></div>`;
          case 'cta': {
            const href = safeLinkUrl(p.url);
            const external = /^https?:\/\//i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<h2 style="${titleStyle}color:${p.titleColor};margin:0 0 ${tmb}px;">${escapeHtml(p.title)}</h2><p style="white-space:pre-wrap;color:${p.subtitleColor};margin:0 0 24px;">${escapeHtml(p.subtitle)}</p><a href="${escapeHtml(href)}"${external} style="display:inline-block;background:${p.buttonColor};color:${p.buttonTextColor};padding:14px 32px;border-radius:${p.borderRadius}px;max-width:100%;overflow-wrap:anywhere;white-space:normal;text-decoration:none;font-weight:600;">${escapeHtml(p.buttonText)}</a>`;
          }
        }
    }
    return '';
  };

export function generateBuilderHtml(blocks: BuilderBlock[]): string {
  const sections = blocks.map(block => {
    const p = normalizedBlockProps(block);
    const style = `background:${p.bgColor};padding:${p.padding}px;text-align:${p.align};font-family:'${p.fontFamily}',sans-serif;color:${p.color};font-size:${p.fontSize}px;line-height:1.6;margin-top:${p.marginTop || 0}px;margin-bottom:${p.marginBottom || 0}px;`;
    return `<section class="appify-builder-block" style="${escapeHtml(style)}"><div class="appify-builder-content" style="${p.maxWidth && Number(p.maxWidth)>0 ? `max-width:${p.maxWidth}px;margin-left:auto;margin-right:auto;` : ''}">${sanitizeImportedHtml(getBlockInnerHtml(block))}</div></section>`;
  }).join('\n');
  return `${builderFontLinks(blocks)}<style>${BUILDER_CSS}</style><div class="appify-builder-document">${sections}</div>`;
}

export function reorderBlocks(blocks: BuilderBlock[], id: string, direction: number): BuilderBlock[] {
  const index = blocks.findIndex(block => block.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= blocks.length) return blocks;
  const result = [...blocks];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
