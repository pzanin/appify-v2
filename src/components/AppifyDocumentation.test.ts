import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act} from 'react';
import { JSDOM } from 'jsdom';
const dom=new JSDOM('<div id="root"></div>',{url:'https://appify.test/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import('react-dom/client');
const {AppifyDocumentation}=await import('./AppifyDocumentation');
const {Sidebar}=await import('./Sidebar');
const {useAppStore}=await import('../store/useAppStore');
test('help is accessible separately from pipeline and searches accented feature names without changing the project',async()=>{
  const step=useAppStore.getState().activeStep;let opened=false;let closed=false;
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(Sidebar,{onOpenHelp:()=>{opened=true;}})));
  await act(async()=>[...document.querySelectorAll('button')].find(item=>item.textContent==='Ajuda e documentação')!.click());assert.equal(opened,true);assert.equal(useAppStore.getState().activeStep,step);
  await act(async()=>root.render(React.createElement(AppifyDocumentation,{onClose:()=>{closed=true;}})));
  const input=document.querySelector<HTMLInputElement>('#documentation-search')!;
  await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,'audio');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  assert.ok(document.querySelector('section'));assert.match(document.querySelector('section')!.textContent||'',/áudio/i);
  await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,'qwertyasdf');input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  assert.match(document.body.textContent||'',/Nenhum tópico encontrado/);
  await act(async()=>[...document.querySelectorAll('button')].find(item=>item.textContent==='Voltar ao projeto')!.click());assert.equal(closed,true);
  await act(async()=>root.unmount());
});

test('documentation opens as an internal page, hides the phone preview and returns to the same editor step',async()=>{
  const {default:BuilderLayout}=await import('./BuilderLayout');
  useAppStore.setState({activeStep:3,modules:[],editingSubmodule:null});
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(BuilderLayout,{isPhoneDark:false,setIsPhoneDark:()=>{},handleDeleteModule:()=>{},handleDeleteSubmodule:()=>{},handleAddSubmodule:()=>{},handleUpdateSubmoduleContent:()=>{},showToast:()=>{}})));
  await act(async()=>[...document.querySelectorAll('button')].find(item=>item.textContent==='Ajuda e documentação')!.click());
  assert.ok(document.querySelector('#documentation-search'));
  assert.equal(useAppStore.getState().activeStep,3);
  assert.equal(document.querySelector('.progress-bar-wrap'),null);
  await act(async()=>[...document.querySelectorAll('button')].find(item=>item.textContent==='Voltar ao projeto')!.click());
  assert.equal(document.querySelector('#documentation-search'),null);
  assert.match(document.querySelector('.workspace-builder')!.textContent||'',/Módulos criados/);
  await act(async()=>root.unmount());
});
