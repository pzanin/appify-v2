import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('');
Object.assign(globalThis,{window:dom.window,document:dom.window.document,DOMParser:dom.window.DOMParser});
const { prepareInteractiveHtml,normalizeHtmlPaste,INTERACTIVE_CSP }=await import('./interactiveHtml');
const { prepareResponsiveHtml }=await import('./htmlContent');
const { LINK_BRIDGE, VIDEO_BRIDGE }=await import('./htmlSecurity');
const fixture=readFileSync('docs/examples/interactive-breathing.html','utf8');

test('interactive activity compiles Tailwind locally and keeps buttons, SVG dimensions and event handlers; static mode remains restricted',async()=>{
  const result=await prepareInteractiveHtml(fixture);
  const parsed=new JSDOM(result).window.document;
  assert.equal(parsed.querySelector('script[src]'),null);
  assert.equal(parsed.querySelector('link'),null);
  assert.equal(parsed.querySelector('#btn-play')?.getAttribute('onclick'),'toggleBreathing()');
  const css=parsed.querySelector('#appify-compiled-tailwind')!.textContent!;
  assert.match(css,/--color-zen-teal: #1c424b/);
  assert.match(css,/\.w-24/);assert.match(css,/\.w-56/);
  assert.match(css,/\.text-white/);assert.match(css,/border-style/);
  assert.match(css,/\.w-5/);
  assert.equal(result.includes('appify-responsive-html'),false);
  assert.equal(parsed.querySelector('[http-equiv]')?.getAttribute('content'),INTERACTIVE_CSP);
  const staticDoc=new JSDOM(prepareResponsiveHtml(fixture)).window.document;
  assert.equal(staticDoc.querySelector('button'),null);
  assert.deepEqual([...staticDoc.querySelectorAll('script')].map(script=>script.textContent),[LINK_BRIDGE,VIDEO_BRIDGE]);
});

test('activity can start, tick, change modes, pause and reset without contacting a server',async()=>{
  const result=await prepareInteractiveHtml(fixture);
  const activity=new JSDOM(result,{runScripts:'dangerously'});
  const doc=activity.window.document;
  doc.getElementById('btn-play')!.click();
  assert.equal(doc.getElementById('instruction-text')!.textContent,'Inhala');
  assert.equal(doc.getElementById('timer-number')!.textContent,'4');
  activity.window.eval('tick()');assert.equal(doc.getElementById('timer-number')!.textContent,'3');
  doc.getElementById('tab-caja')!.click();assert.equal(doc.getElementById('mode-title')!.textContent,'Respiración de Caja');
  doc.getElementById('btn-play')!.click();activity.window.eval('for(let i=0;i<16;i++) tick()');
  assert.equal(doc.getElementById('cycle-count')!.textContent,'1');
  doc.getElementById('btn-play')!.click();assert.equal(doc.getElementById('instruction-text')!.textContent,'Pausado');
  doc.getElementById('btn-reset')!.click();assert.equal(doc.getElementById('cycle-count')!.textContent,'0');
  doc.getElementById('tab-coherente')!.click();doc.getElementById('btn-play')!.click();
  assert.equal(doc.getElementById('timer-number')!.textContent,'5');
  activity.window.close();
});

test('only inline activity code is kept; dangerous metadata, nested frames, remote resources and configurations with executable expressions are rejected or removed',async()=>{
  const html=await prepareInteractiveHtml('<base href="file:///private"><meta http-equiv="refresh" content="0;url=https://evil.test"><script src="https://evil.test/library.js"></script><iframe src="https://evil.test"></iframe><form action="https://evil.test"><button onclick="run()">Go</button></form><img src="https://evil.test/image"><script>function run(){document.body.dataset.clicked="yes"}</script>');
  const doc=new JSDOM(html).window.document;
  assert.equal(doc.querySelector('base,iframe,script[src],[action],meta[http-equiv="refresh"]'),null);
  assert.equal(doc.querySelector('img')?.getAttribute('src'),null);
  assert.match(INTERACTIVE_CSP,/connect-src 'none'/);
  assert.match(INTERACTIVE_CSP,/frame-src 'none'/);
  assert.equal(INTERACTIVE_CSP.includes('unsafe-eval'),false);
  await assert.rejects(prepareInteractiveHtml('<script>tailwind.config={theme:{extend:{colors: (()=>{parent.attack=true})()}}}</script>'),/apenas valores/);
  await assert.rejects(prepareInteractiveHtml('<script>tailwind.config={plugins:["external"]}</script>'),/suporta Tailwind padrão/);
});

test('common Markdown artifacts are repaired without changing ordinary JavaScript operators',()=>{
  const html=normalizeHtmlPaste('```html\n\\<html><script src="[https://cdn.tailwindcss.com](https://cdn.tailwindcss.com)"></script><script>if(a<b){ambientGlow\\.style.opacity=1;}</script>\\</html>\n```');
  assert.match(html,/<html>/);assert.doesNotMatch(html,/\\[<>]|\[https:/);
  assert.match(html,/src="https:\/\/cdn.tailwindcss.com"/);
  assert.match(html,/if\(a<b\)/);assert.match(html,/ambientGlow\.style/);
});
