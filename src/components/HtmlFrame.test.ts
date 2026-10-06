import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act} from 'react';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<div id="root"></div>',{url:'https://appify.test/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,DOMParser:dom.window.DOMParser,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import('react-dom/client');
const {HtmlFrame}=await import('./HtmlFrame');
const {generateBuilderHtml,getDefaultProps}=await import('../utils/builderHtml');
const {TEST_MP3,TEST_M4A}=await import('../utils/fixtures/audioMp3');

test('phone iframe preserves uploaded and linked audio controls with a minimum height despite responsive media height auto',async()=>{
  const root=createRoot(document.getElementById('root')!);
  for (const source of [TEST_MP3,TEST_M4A,'https://example.com/audio.mp3','https://example.com/audio.m4a']) {
    const html=generateBuilderHtml([{id:'audio',type:'audio',props:{...getDefaultProps('audio'),...(source.startsWith('data:')?{audioData:source}:{audioMode:'url',url:source})}}]);
    await act(async()=>root.render(React.createElement(HtmlFrame,{html,title:'Simulação',style:{width:320,height:480}})));
    const frame=document.querySelector('iframe')!;
    assert.equal(frame.getAttribute('sandbox'),'allow-scripts');
    const content=new JSDOM(frame.getAttribute('srcdoc')!).window.document;
    const player=content.querySelector('audio')!;
    assert.equal(player.getAttribute('src'),source);
    assert.ok(player.hasAttribute('controls'));
    assert.equal(player.hasAttribute('autoplay'),false);
    assert.equal(player.style.minHeight,'54px');
    assert.equal(player.style.display,'block');
    assert.match(content.querySelector('#appify-responsive-html')!.textContent!,/height: auto !important/);
  }
  await act(async()=>root.unmount());
});

test('exported activities load the compiled lesson file with an opaque sandbox; invalid paths are not rendered',async()=>{
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(HtmlFrame,{html:'<button>Activity</button>',interactive:true,activityPath:'pages/lesson-1-2.html'})));
  const frame=document.querySelector('iframe')!;assert.equal(frame.getAttribute('src'),'pages/lesson-1-2.html');
  assert.equal(frame.getAttribute('srcdoc'),null);assert.equal(frame.getAttribute('sandbox'),'allow-scripts');
  await act(async()=>root.render(React.createElement(HtmlFrame,{html:'<button>Activity</button>',interactive:true,activityPath:'../../private.html'})));
  assert.equal(document.querySelector('iframe'),null);assert.match(document.body.textContent || '',/Appify desktop/);
  await act(async()=>root.unmount());
});

test('desktop preview uses native memory content, rejects activity requests to open external links, reports bounded errors and releases its document',async()=>{
  let created='';let released='';let opened=0;
  window.appifyDesktop={content:{create:async html=>{created=html;return 'appify-content://activity/test';},release:async url=>{released=url;}},links:{openExternal:async()=>{opened++;}}} as any;
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(HtmlFrame,{html:'<button onclick="run()">Go</button><script>function run(){}</script>',interactive:true})));
  const frame=document.querySelector('iframe')!;assert.ok(frame);assert.equal(frame.getAttribute('src'),'appify-content://activity/test');
  assert.match(created,/onclick="run\(\)"/);
  await act(async()=>window.dispatchEvent(new dom.window.MessageEvent('message',{source:frame.contentWindow,data:{type:'appify:external-link',url:'https://example.com'}})));
  assert.equal(opened,0);
  await act(async()=>window.dispatchEvent(new dom.window.MessageEvent('message',{source:dom.window as any,data:{type:'appify:activity-error',message:'Wrong sender'}})));
  assert.ok(document.querySelector('iframe'));
  await act(async()=>window.dispatchEvent(new dom.window.MessageEvent('message',{source:frame.contentWindow,data:{type:'appify:activity-error',message:'Invalid JavaScript'}})));
  assert.match(document.body.textContent || '',/Erro na atividade: Invalid JavaScript/);
  await act(async()=>root.unmount());assert.equal(released,'appify-content://activity/test');
  delete window.appifyDesktop;
});
