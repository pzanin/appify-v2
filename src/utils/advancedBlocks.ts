import { CardItem, CarouselItem } from '../types';

const esc = (value = '') => value.replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[ch] as string));

export function renderCardsHtml(items: CardItem[], columns = 2, gap = 16, radius = 14) {
  const cards = (items || []).map(item => `<article class="appify-card">${item.image ? `<img src="${esc(item.image)}" alt="">` : ''}<div class="appify-card-body">${item.badge ? `<span class="appify-card-badge">${esc(item.badge)}</span>` : ''}<h3>${esc(item.title)}</h3><p>${esc(item.text)}</p>${item.buttonText && item.buttonUrl ? `<a href="${esc(item.buttonUrl)}" target="_blank" rel="noopener noreferrer">${esc(item.buttonText)}</a>` : ''}</div></article>`).join('');
  return `<div class="appify-cards" style="--appify-card-columns:${columns};--appify-card-gap:${gap}px;--appify-card-radius:${radius}px">${cards}</div>`;
}

export function renderCarouselHtml(items: CarouselItem[], autoplay = false, intervalMs = 5000, showDots = true, showArrows = true) {
  const slides = (items || []).map((item, i) => `<article class="appify-carousel-slide${i === 0 ? ' is-active' : ''}">${item.image ? `<img src="${esc(item.image)}" alt="">` : ''}${item.title || item.text || item.buttonText ? `<div class="appify-carousel-copy">${item.title ? `<h3>${esc(item.title)}</h3>` : ''}${item.text ? `<p>${esc(item.text)}</p>` : ''}${item.buttonText && item.buttonUrl ? `<a href="${esc(item.buttonUrl)}" target="_blank" rel="noopener noreferrer">${esc(item.buttonText)}</a>` : ''}</div>` : ''}</article>`).join('');
  const dots = showDots ? `<div class="appify-carousel-dots">${(items || []).map((_, i) => `<button type="button" data-index="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}</div>` : '';
  return `<div class="appify-carousel" data-autoplay="${autoplay}" data-interval="${Math.max(2000, intervalMs)}"><div class="appify-carousel-track">${slides}</div>${showArrows ? '<button class="appify-carousel-prev" type="button" aria-label="Anterior">‹</button><button class="appify-carousel-next" type="button" aria-label="Próximo">›</button>' : ''}${dots}</div>`;
}

export const advancedBlocksCss = `
.appify-cards{display:grid;grid-template-columns:repeat(var(--appify-card-columns,2),minmax(0,1fr));gap:var(--appify-card-gap,16px)}
.appify-card{overflow:hidden;border:1px solid rgba(127,127,127,.2);border-radius:var(--appify-card-radius,14px);min-width:0}.appify-card img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}.appify-card-body{padding:16px}.appify-card-body h3{margin:0 0 6px}.appify-card-body p{margin:0;line-height:1.55}.appify-card-badge{font-size:10px;font-weight:800;opacity:.65;display:inline-block;margin-bottom:6px}
.appify-carousel{position:relative}.appify-carousel-track{position:relative;overflow:hidden;border-radius:14px}.appify-carousel-slide{display:none;position:relative;aspect-ratio:16/9;background:rgba(127,127,127,.08)}.appify-carousel-slide.is-active{display:block}.appify-carousel-slide img{width:100%;height:100%;object-fit:cover;display:block}.appify-carousel-copy{position:absolute;left:0;right:0;bottom:0;padding:40px 18px 18px;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.72))}.appify-carousel-copy h3{margin:0 0 6px}.appify-carousel-copy p{margin:0}.appify-carousel-prev,.appify-carousel-next{position:absolute;top:50%;transform:translateY(-50%);z-index:2;width:34px;height:34px;border:0;border-radius:999px;background:rgba(0,0,0,.45);color:#fff;font-size:22px}.appify-carousel-prev{left:10px}.appify-carousel-next{right:10px}.appify-carousel-dots{display:flex;justify-content:center;gap:6px;margin-top:10px}.appify-carousel-dots button{width:7px;height:7px;padding:0;border:0;border-radius:999px;background:currentColor;opacity:.25}.appify-carousel-dots button.is-active{width:18px;opacity:.8}
@media(max-width:640px){.appify-cards{grid-template-columns:1fr!important}}
`;

export const advancedBlocksJs = `
document.querySelectorAll('.appify-carousel').forEach(function(root){
  var slides=Array.from(root.querySelectorAll('.appify-carousel-slide')); if(slides.length<1)return;
  var dots=Array.from(root.querySelectorAll('.appify-carousel-dots button')); var i=0;
  function show(n){i=(n+slides.length)%slides.length;slides.forEach(function(s,x){s.classList.toggle('is-active',x===i)});dots.forEach(function(d,x){d.classList.toggle('is-active',x===i)})}
  var prev=root.querySelector('.appify-carousel-prev');var next=root.querySelector('.appify-carousel-next');
  if(prev)prev.addEventListener('click',function(){show(i-1)}); if(next)next.addEventListener('click',function(){show(i+1)}); dots.forEach(function(d,x){d.addEventListener('click',function(){show(x)})}); show(0);
  if(root.dataset.autoplay==='true'&&slides.length>1){setInterval(function(){show(i+1)},Math.max(2000,Number(root.dataset.interval)||5000))}
});
`;
