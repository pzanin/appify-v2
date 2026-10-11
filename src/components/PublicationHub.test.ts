import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';
import { normalizePublishedUrl } from '../utils/publication';
import {EXPORT_SECURITY_MESSAGE} from '../utils/exportSecurity';
const dom = new JSDOM('<div id="root"></div>', { url: 'https://appify.test/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import('react-dom/client');
const { useAppStore } = await import('../store/useAppStore');
const { PublicationHub } = await import('./PublicationHub');

test('published URLs normalize hostnames and preserve paths and query parameters; unsafe URLs are rejected', () => {
  assert.equal(normalizePublishedUrl(' meuapp.netlify.app '), 'https://meuapp.netlify.app/');
  assert.equal(normalizePublishedUrl('https://example.com/app/?a=1&b=2'), 'https://example.com/app/?a=1&b=2');
  for (const url of ['', 'http://example.com', 'javascript:alert(1)', 'https://user:password@example.com', 'https://bad host.com', 'https://']) assert.equal(normalizePublishedUrl(url), null);
});

test('publication accepts default branding without Supabase or custom domain, encodes QR URL and isolates project history', async () => {
  useAppStore.setState({ currentProjectId: 1, pwaConfig: { ...INITIAL_PWA_CONFIG, appName: 'Piloto', publishedUrl: 'https://example.com/app/?a=1&b=2', exportHistory: [{version:'1.2',date:'2026-10-07T12:00:00Z',notes:'Materiais novos'}] }, modules: [{id:1,name:'Introdução',iconName:'Book',status:'Ativo',subs:[{id:1,name:'Aula',type:'html',contentType:'html'}]}] });
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(React.createElement(PublicationHub, {showToast:()=>{}})));
  const exportButton = () => [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Gerar e baixar ZIP'))!;
  assert.equal(exportButton().disabled, false);
  assert.ok(!document.body.textContent?.includes('Service Role'));
  assert.equal(document.querySelector('#published-url'),null);
  assert.equal(document.querySelector('img'),null);
  const mobileTools = [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Testar no celular — opcional'))!;
  assert.equal(mobileTools.getAttribute('aria-expanded'),'false');
  await act(async () => mobileTools.click());
  assert.equal(mobileTools.getAttribute('aria-expanded'),'true');
  const qr = document.querySelector('img')!;
  assert.equal(new URL(qr.src).searchParams.get('data'), 'https://example.com/app/?a=1&b=2');
  assert.ok(document.body.textContent?.includes('Materiais novos'));
  await act(async () => mobileTools.click());
  assert.equal(document.querySelector('img'),null);
  assert.equal(useAppStore.getState().pwaConfig.publishedUrl,'https://example.com/app/?a=1&b=2');
  await act(async () => useAppStore.setState({ currentProjectId: 2, pwaConfig: {...INITIAL_PWA_CONFIG, appName:'Segundo'} }));
  assert.ok(!document.body.textContent?.includes('Materiais novos'));
  assert.ok(document.body.textContent?.includes('Nenhuma exportação registrada'));
  await act(async () => useAppStore.setState({modules:[]}));
  assert.equal(exportButton().disabled, true);
  await act(async () => root.unmount());
});

test('failed archive generation does not create an export record and restores the button', async t => {
  useAppStore.setState({currentProjectId:1,pwaConfig:{...INITIAL_PWA_CONFIG,appName:'Piloto'},modules:[{id:1,name:'Módulo',iconName:'Book',status:'Ativo',subs:[{id:1,name:'Aula',type:'html',contentType:'html'}]}]});
  t.mock.method(dom.window.HTMLCanvasElement.prototype, 'getContext', () => null);
  const messages: string[] = [];
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(React.createElement(PublicationHub,{showToast:(message:string)=>messages.push(message)})));
  await act(async () => [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Gerar e baixar ZIP'))!.click());
  assert.equal(useAppStore.getState().pwaConfig.exportHistory, undefined);
  assert.ok(messages.some(message=>message.includes('Erro ao exportar')));
  assert.equal([...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Gerar e baixar ZIP'))!.disabled,false);
  await act(async () => root.unmount());
});

test('private credentials in engagement content block export before icon generation or download',async t=>{
  const {default:FileSaver}=await import('file-saver');
  const {handleExportZIP}=await import('../utils/exportPWA');
  const download=t.mock.method(FileSaver,'saveAs',()=>{});
  const canvas=t.mock.method(dom.window.HTMLCanvasElement.prototype,'getContext',()=>null);
  useAppStore.setState({currentProjectId:1,pwaConfig:{...INITIAL_PWA_CONFIG,productId:'export-security',engagementEnabled:true},modules:[],feedPosts:[{id:1,author:'Team',content:'sb_'+'secret_test-private-credential',timestamp:''}],pushNotifications:[]});
  const messages:string[]=[];
  assert.equal(await handleExportZIP(message=>messages.push(message)),false);
  assert.ok(messages.includes(EXPORT_SECURITY_MESSAGE));
  assert.equal(canvas.mock.calls.length,0);
  assert.equal(download.mock.calls.length,0);
});

test('successful ZIP exports record the version, preserve history after remount and omit editor history from public data', async t => {
  const { default: FileSaver } = await import('file-saver');
  const { default: JSZip } = await import('jszip');
  Object.assign(globalThis, { FileReader: class {
    onload?: (event: {target: {result: ArrayBuffer}}) => void;
    readAsArrayBuffer(blob: Blob) { void blob.arrayBuffer().then(result => this.onload?.({target:{result}})); }
  } });
  const downloads: Blob[] = [];
  t.mock.method(FileSaver, 'saveAs', (blob: Blob) => { downloads.push(blob); });
  t.mock.method(dom.window.HTMLCanvasElement.prototype, 'getContext', () => ({fillRect(){},fillText(){}}));
  t.mock.method(dom.window.HTMLCanvasElement.prototype, 'toBlob', function(callback: BlobCallback) { callback(new Blob(['icon'],{type:'image/png'})); });
  t.mock.method(globalThis, 'fetch', async () => new Response('<html><head></head><body></body></html>'));
  useAppStore.setState({currentProjectId:1,pwaConfig:{...INITIAL_PWA_CONFIG,appName:'Piloto',version:'1.2.3',customerLayout:'comfortable',publishedUrl:'https://example.com',changelogNotes:'Aulas novas'},modules:[{id:1,name:'Módulo',iconName:'Book',status:'Ativo',subs:[{id:1,name:'Aula',type:'html',contentType:'html'}]}],feedPosts:[{id:5,author:'Equipe',content:'Aviso do produto',timestamp:'Agora mesmo'}],pushNotifications:[{id:6,title:'Atualização',body:'Nova aula',createdAt:123}]});
  let root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(React.createElement(PublicationHub,{showToast:()=>{}})));
  await act(async () => [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Gerar e baixar ZIP'))!.click());
  await act(async () => {
    for (let attempt = 0; attempt < 100 && !downloads.length; attempt++) await new Promise(resolve => setTimeout(resolve, 10));
  });
  assert.equal(downloads.length,1);
  assert.equal(useAppStore.getState().pwaConfig.exportHistory?.[0].version,'1.2.3');
  const zip = await JSZip.loadAsync(await downloads[0].arrayBuffer());
  const data = JSON.parse(await zip.file('app-data.json')!.async('string'));
  assert.equal(data.pwaConfig.exportHistory,undefined);
  assert.equal(data.pwaConfig.publishedUrl,undefined);
  assert.equal(data.pwaConfig.customerLayout,'comfortable');
  assert.deepEqual(data.feedPosts,useAppStore.getState().feedPosts);
  assert.deepEqual(data.pushNotifications,useAppStore.getState().pushNotifications);
  await act(async()=>useAppStore.setState({pwaConfig:{...useAppStore.getState().pwaConfig,engagementEnabled:false}}));
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Gerar e baixar ZIP'))!.click());
  await act(async()=>{
    for(let attempt=0;attempt<100 && downloads.length<2;attempt++)await new Promise(resolve=>setTimeout(resolve,10));
  });
  assert.equal(downloads.length,2);
  const disabledZip=await JSZip.loadAsync(await downloads[1].arrayBuffer());
  const disabledData=JSON.parse(await disabledZip.file('app-data.json')!.async('string'));
  assert.deepEqual(disabledData.feedPosts,[]);
  assert.deepEqual(disabledData.pushNotifications,[]);
  assert.equal(useAppStore.getState().feedPosts.length,1);
  assert.equal(useAppStore.getState().pushNotifications.length,1);
  await act(async () => root.unmount());
  root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(React.createElement(PublicationHub,{showToast:()=>{}})));
  assert.ok(document.body.textContent?.includes('v1.2.3'));
  await act(async () => root.unmount());
});
