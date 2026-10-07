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

test('phone simulation retains the material button and routes its file through the external link handler',async(t)=>{
  const root=createRoot(document.getElementById('root')!);
  const url='https://example.com/planner.pdf';
  const html=generateBuilderHtml([{id:'file',type:'download',props:{...getDefaultProps('download'),url,buttonText:'Abrir planner'}}]);
  const opened=t.mock.method(window,'open',()=>null);
  await act(async()=>root.render(React.createElement(HtmlFrame,{html,title:'Simulação',style:{width:320,height:480}})));
  const frame=document.querySelector('iframe')!;
  const content=new JSDOM(frame.getAttribute('srcdoc')!).window.document;
  assert.equal(content.querySelector('a')!.textContent,'Abrir planner');
  assert.equal(content.querySelector('a')!.getAttribute('href'),url);
  assert.equal(content.querySelector('a')!.style.maxWidth,'100%');
  await act(async()=>window.dispatchEvent(new dom.window.MessageEvent('message',{source:frame.contentWindow,data:{type:'appify:external-link',url}})));
  assert.deepEqual(opened.mock.calls[0].arguments,[url,'_blank','noopener,noreferrer']);
  await act(async()=>root.unmount());
});

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

test('material click instrumentation accepts only the current static frame and identified download links',async t=>{
  const clicks:string[]=[];
  t.mock.method(window,'open',()=>null);
  const html=generateBuilderHtml([{id:'material-7',type:'download',props:{...getDefaultProps('download'),url:'https://example.com/guide.pdf'}}]);
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(HtmlFrame,{html,onMaterialClick:id=>clicks.push(id)})));
  const frame=document.querySelector('iframe')!;
  const send=(source:Window|null,url:string)=>window.dispatchEvent(new dom.window.MessageEvent('message',{source,data:{type:'appify:external-link',url}}));
  await act(async()=>{send(window,'https://example.com/guide.pdf');send(frame.contentWindow,'https://example.com/other.pdf');});
  assert.deepEqual(clicks,[]);
  await act(async()=>send(frame.contentWindow,'https://example.com/guide.pdf'));
  assert.deepEqual(clicks,['material-7']);
  await act(async()=>root.unmount());
});

test('scoped activity bridge persists across remount, rejects forged senders and invalid data, and warns on failed writes',async(t)=>{
 const root=createRoot(document.getElementById('root')!);const storageKey='appify-activity:test';
 const html='<script>localStorage.getItem("history")</script>';
 window.localStorage.clear();window.localStorage.setItem('private-project','secret');
 const render=()=>root.render(React.createElement(HtmlFrame,{html,interactive:true,activityPath:'pages/lesson-1-2.html',storageKey}));
 await act(async()=>render());let frame=document.querySelector('iframe')!;
 const send=async(data:any,source:Window|null=frame.contentWindow)=>act(async()=>{window.dispatchEvent(new dom.window.MessageEvent('message',{source,data}));});
 await send({type:'appify:storage-init'});
 await send({type:'appify:storage-write',id:1,data:{history:'saved'}},window);
 assert.equal(window.localStorage.getItem(storageKey),null);
 await send({type:'appify:storage-write',id:2,data:{history:'saved'}});
 assert.equal(JSON.parse(window.localStorage.getItem(storageKey)!).history,'saved');
 await act(async()=>root.render(null));await act(async()=>render());frame=document.querySelector('iframe')!;
 const replies:any[]=[];const original=frame.contentWindow!.postMessage;
 frame.contentWindow!.postMessage=(data:any)=>replies.push(data);
 await send({type:'appify:storage-init'});assert.deepEqual(replies[0].data,Object.assign(Object.create(null),{history:'saved'}));
 await send({type:'appify:storage-write',id:3,data:{history:9}});
 assert.equal(JSON.parse(window.localStorage.getItem(storageKey)!).history,'saved');assert.equal(replies.at(-1).ok,false);
 assert.equal(window.localStorage.getItem('private-project'),'secret');assert.equal(document.querySelector('[role="alert"]')?.hasAttribute('hidden'),false);
 assert.equal(document.querySelector('iframe'),frame);
 await send({type:'appify:storage-write',id:4,data:{}});assert.deepEqual(JSON.parse(window.localStorage.getItem(storageKey)!),{});
 frame.contentWindow!.postMessage=original;
 await act(async()=>root.render(React.createElement(HtmlFrame,{html,interactive:true,activityPath:'pages/lesson-1-2.html',storageKey,onMaterialClick:()=>{}})));
 await send({type:'appify:storage-write',id:5,data:{history:'after render'}});
 assert.equal(JSON.parse(window.localStorage.getItem(storageKey)!).history,'after render');
 const confirm=t.mock.method(window,'confirm',()=>false);
 await act(async()=>(document.querySelector('button') as HTMLButtonElement).click());
 assert.ok(window.localStorage.getItem(storageKey));assert.equal(document.querySelector('iframe'),frame);
 confirm.mock.mockImplementation(()=>true);
 await act(async()=>(document.querySelector('button') as HTMLButtonElement).click());
 assert.equal(window.localStorage.getItem(storageKey),null);assert.equal(window.localStorage.getItem('private-project'),'secret');
 assert.notEqual(document.querySelector('iframe'),frame);
 await act(async()=>root.unmount());
});
