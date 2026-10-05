import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import type { SubModule } from '../types';
const dom = new JSDOM('<div id="root"></div>', { url:'https://appify.test' });
Object.assign(globalThis, { window:dom.window, document:dom.window.document, DOMParser:dom.window.DOMParser, HTMLElement:dom.window.HTMLElement, localStorage:dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT:true });
const { createRoot } = await import('react-dom/client');
const { ModulesAndContent } = await import('./ModulesAndContent');
const { useAppStore } = await import('../store/useAppStore');
const { getDefaultProps } = await import('../utils/builderHtml');
function click(element: Element) { element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})); }
function change(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = element.tagName === 'SELECT' ? dom.window.HTMLSelectElement.prototype : dom.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto,'value')!.set!.call(element,value);
  element.dispatchEvent(new dom.window.Event(element.tagName === 'SELECT' ? 'change' : 'input',{bubbles:true}));
}

test('actual editor controls edit headings, duplicate, reorder, save and reopen without losing settings', async () => {
  const sub: SubModule = {id:1,name:'Aula',type:'html',htmlMode:'visual',contentType:'html',builder_data:[{id:'hero',type:'container',subtype:'hero',props:getDefaultProps('container','hero')},{id:'cards',type:'container',subtype:'threeColumn',props:getDefaultProps('container','threeColumn')}]};
  useAppStore.setState({editingSubmodule:{modId:1,subId:1},modules:[{id:1,name:'Módulo',iconName:'Book',status:'Ativo',subs:[sub]}]});
  let saved = false;
  const root = createRoot(document.getElementById('root')!);
  await act(async()=>{root.render(React.createElement(ModulesAndContent,{submodule:sub,onSave:()=>{saved=true;},onClose:()=>{}}));});
  await act(async()=>click(document.querySelector('.vpb-block-wrapper')!));
  await act(async()=>change(document.querySelector('[aria-label="Tamanho do título em pixels"]') as HTMLInputElement,'37'));
  const select = [...document.querySelectorAll('select')].find(select=>select.previousElementSibling?.textContent === 'Fonte do Título')!;
  await act(async()=>change(select,'Roboto'));
  const heading = document.querySelector('.appify-builder-content h1') as HTMLElement;
  assert.equal(heading.style.fontSize,'37px');
  assert.match(heading.style.fontFamily,/Roboto/);
  assert.equal((document.querySelector('[aria-label="Mover bloco para cima"]') as HTMLButtonElement).disabled,true);
  await act(async()=>click(document.querySelector('[aria-label="Duplicar bloco"]')!));
  assert.equal(document.querySelectorAll('.vpb-block-wrapper').length,3);
  await act(async()=>change(document.querySelector('[aria-label="Tamanho do título em pixels"]') as HTMLInputElement,'41'));
  assert.equal((document.querySelector('.appify-builder-content h1') as HTMLElement).style.fontSize,'37px');
  await act(async()=>click(document.querySelectorAll('[aria-label="Mover bloco para baixo"]')[1]));
  const save = [...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Salvar Aula'))!;
  await act(async()=>click(save));
  assert.equal(saved,true);
  const lesson = useAppStore.getState().modules[0].subs[0];
  assert.equal(lesson.builder_data?.length,3);
  assert.equal(lesson.builder_data?.[2].props.titleFontSize,'41');
  assert.equal(lesson.builder_data?.[2].props.titleFontFamily,'Roboto');
  assert.match(lesson.contentHtml || '', /font-size:37px/);
  await act(async()=>root.unmount());
  const reopened = createRoot(document.getElementById('root')!);
  await act(async()=>reopened.render(React.createElement(ModulesAndContent,{submodule:lesson,onSave:()=>{},onClose:()=>{}})));
  assert.equal(document.querySelectorAll('.vpb-block-wrapper').length,3);
  assert.equal((document.querySelectorAll('.appify-builder-content h1')[1] as HTMLElement).style.fontSize,'41px');
  await act(async()=>reopened.unmount());
});

test('one-column controls survive saving; interactive opt-in is persisted per lesson and can be switched back to static',async()=>{
  const sub:SubModule={id:2,name:'Interação',type:'html',contentType:'html',htmlMode:'visual',builder_data:[]};
  useAppStore.setState({editingSubmodule:{modId:1,subId:2},modules:[{id:1,name:'Módulo',iconName:'Book',status:'Ativo',subs:[sub]}]});
  const root=createRoot(document.getElementById('root')!);
  const render=async(lesson:SubModule)=>act(async()=>root.render(React.createElement(ModulesAndContent,{submodule:lesson,onSave:()=>{},onClose:()=>{}})));
  await render(sub);
  const btn=(name:string)=>[...document.querySelectorAll('button')].find(node=>node.textContent?.includes(name))!;
  await act(async()=>click(btn('1 Coluna')));
  await act(async()=>change(document.querySelector('[aria-label="Largura máxima do conteúdo"]') as HTMLInputElement,'640'));
  await act(async()=>change(document.querySelector('[aria-label="Margem acima"]') as HTMLInputElement,'24'));
  await act(async()=>click(btn('Salvar Aula')));
  let saved=useAppStore.getState().modules[0].subs[0];
  assert.equal(saved.builder_data![0].subtype,'oneColumn');assert.equal(saved.builder_data![0].props.maxWidth,'640');
  assert.equal(saved.builder_data![0].props.marginTop,'24');
  await render(saved);
  await act(async()=>click(btn('Código HTML')));
  await act(async()=>change(document.querySelector('#html-execution-mode') as HTMLSelectElement,'interactive'));
  await act(async()=>click(btn('Salvar Aula')));
  saved=useAppStore.getState().modules[0].subs[0];assert.equal(saved.htmlInteractive,true);assert.equal(saved.htmlMode,'code');
  await render(saved);assert.equal((document.querySelector('#html-execution-mode') as HTMLSelectElement).value,'interactive');
  await act(async()=>change(document.querySelector('#html-execution-mode') as HTMLSelectElement,'static'));
  await act(async()=>click(btn('Salvar Aula')));assert.equal(useAppStore.getState().modules[0].subs[0].htmlInteractive,false);
  await act(async()=>root.unmount());
});
