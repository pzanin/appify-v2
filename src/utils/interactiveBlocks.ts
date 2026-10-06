import type { AccordionItem, EntryAnimation, TabItem } from '../types';

const esc = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export function renderAccordionHtml(items: AccordionItem[], allowMultiple = false): string {
  const rows = items.map((item, index) => `
    <div class="appify-accordion-item${index === 0 ? ' is-open' : ''}">
      <button type="button" class="appify-accordion-trigger" aria-expanded="${index === 0 ? 'true' : 'false'}">
        <span>${esc(item.title)}</span><span class="appify-accordion-icon">⌄</span>
      </button>
      <div class="appify-accordion-panel"><div>${esc(item.content)}</div></div>
    </div>`).join('');

  return `<div class="appify-accordion" data-multiple="${allowMultiple ? '1' : '0'}">${rows}</div>`;
}

export function renderTabsHtml(tabs: TabItem[], activeIndex = 0): string {
  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabs.length - 1, 0));
  const buttons = tabs.map((tab, index) => `<button type="button" class="appify-tab${index === safeIndex ? ' is-active' : ''}" data-tab-index="${index}">${esc(tab.label)}</button>`).join('');
  const panels = tabs.map((tab, index) => `<div class="appify-tab-panel${index === safeIndex ? ' is-active' : ''}" data-tab-panel="${index}">${esc(tab.content)}</div>`).join('');
  return `<div class="appify-tabs"><div class="appify-tab-list">${buttons}</div><div class="appify-tab-panels">${panels}</div></div>`;
}

export function animationDataAttributes(animation: EntryAnimation = 'none', durationMs = 500, delayMs = 0, once = true): string {
  return `data-entry-animation="${animation}" data-animation-duration="${Math.max(0, durationMs)}" data-animation-delay="${Math.max(0, delayMs)}" data-animation-once="${once ? '1' : '0'}"`;
}

export const interactiveBlocksCss = `<style>
.appify-accordion{display:grid;gap:10px}.appify-accordion-item{border:1px solid rgba(127,127,127,.22);border-radius:10px;overflow:hidden}.appify-accordion-trigger{width:100%;border:0;background:transparent;padding:15px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;text-align:left;font:inherit;font-weight:700}.appify-accordion-icon{transition:transform .2s ease}.appify-accordion-item.is-open .appify-accordion-icon{transform:rotate(180deg)}.appify-accordion-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .25s ease}.appify-accordion-item.is-open .appify-accordion-panel{grid-template-rows:1fr}.appify-accordion-panel>div{overflow:hidden;padding:0 16px}.appify-accordion-item.is-open .appify-accordion-panel>div{padding-bottom:16px}
.appify-tabs{border:1px solid rgba(127,127,127,.22);border-radius:10px;overflow:hidden}.appify-tab-list{display:flex;gap:4px;overflow-x:auto;padding:6px;border-bottom:1px solid rgba(127,127,127,.18)}.appify-tab{border:0;border-radius:7px;padding:10px 14px;background:transparent;font:inherit;font-weight:700;white-space:nowrap;cursor:pointer}.appify-tab.is-active{background:#6b8af0;color:#fff}.appify-tab-panel{display:none;padding:18px;line-height:1.65}.appify-tab-panel.is-active{display:block}
[data-entry-animation]{opacity:1;transform:none}[data-entry-animation].appify-anim-ready{opacity:0}[data-entry-animation="fade-up"].appify-anim-ready{transform:translateY(24px)}[data-entry-animation="fade-down"].appify-anim-ready{transform:translateY(-24px)}[data-entry-animation="slide-left"].appify-anim-ready{transform:translateX(36px)}[data-entry-animation="slide-right"].appify-anim-ready{transform:translateX(-36px)}[data-entry-animation="zoom"].appify-anim-ready{transform:scale(.94)}[data-entry-animation].appify-anim-visible{opacity:1!important;transform:none!important}
</style>`;

export const interactiveBlocksScript = `<script>(function(){
  document.querySelectorAll('.appify-accordion-trigger').forEach(function(btn){btn.addEventListener('click',function(){var item=btn.closest('.appify-accordion-item');var root=btn.closest('.appify-accordion');var open=item.classList.contains('is-open');if(root&&root.dataset.multiple!=='1'){root.querySelectorAll('.appify-accordion-item').forEach(function(row){row.classList.remove('is-open');var trigger=row.querySelector('.appify-accordion-trigger');if(trigger)trigger.setAttribute('aria-expanded','false');});}if(!open){item.classList.add('is-open');btn.setAttribute('aria-expanded','true');}else{item.classList.remove('is-open');btn.setAttribute('aria-expanded','false');}});});
  document.querySelectorAll('.appify-tabs').forEach(function(root){root.querySelectorAll('.appify-tab').forEach(function(btn){btn.addEventListener('click',function(){var index=btn.dataset.tabIndex;root.querySelectorAll('.appify-tab').forEach(function(x){x.classList.remove('is-active');});root.querySelectorAll('.appify-tab-panel').forEach(function(x){x.classList.remove('is-active');});btn.classList.add('is-active');var panel=root.querySelector('[data-tab-panel="'+index+'"]');if(panel)panel.classList.add('is-active');});});});
  var nodes=document.querySelectorAll('[data-entry-animation]:not([data-entry-animation="none"])');if(!('IntersectionObserver' in window)){nodes.forEach(function(n){n.classList.add('appify-anim-visible');});return;}var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;var el=entry.target;el.style.transition='opacity '+(Number(el.dataset.animationDuration)||500)+'ms ease-out, transform '+(Number(el.dataset.animationDuration)||500)+'ms ease-out';el.style.transitionDelay=(Number(el.dataset.animationDelay)||0)+'ms';el.classList.add('appify-anim-visible');if(el.dataset.animationOnce==='1')observer.unobserve(el);});},{threshold:.18});nodes.forEach(function(el){el.classList.add('appify-anim-ready');observer.observe(el);});
})();</script>`;
