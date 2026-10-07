import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act} from 'react';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';
import type { Module, PwaConfig } from '../types';
import { useLessonProgress } from '../hooks/useLessonProgress';
import { ContinueLearning } from './ContinueLearning';
import { progressStorageKey } from '../utils/lessonProgress';
const dom=new JSDOM('<div id="root"></div>',{url:'https://product.test/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import('react-dom/client');
const modules:Module[]=[{id:1,name:'Curso',iconName:'Book',status:'Ativo',subs:[{id:1,name:'Primeira',type:'html',contentType:'html'},{id:2,name:'Segunda',type:'html',contentType:'html'}]}];
const config={...INITIAL_PWA_CONFIG,productId:'product-a',gamification:{...INITIAL_PWA_CONFIG.gamification,enabled:false}};
function Harness({config,preview=false}:{config:PwaConfig;preview?:boolean}) {
  const learning=useLessonProgress(config,modules,1,preview);
  return React.createElement(React.Fragment,null,
    React.createElement('button',{onClick:()=>learning.visit(1,1)},'Abrir aula'),
    React.createElement('button',{onClick:()=>learning.complete(1,1)},'Concluir aula'),
    React.createElement('span',{'data-testid':'percent'},String(learning.moduleProgress(modules[0]).percent)),
    React.createElement(ContinueLearning,{location:learning.resume,modules,label:'Continuar de onde parei',themeColor:'#123456',dark:false,onContinue:location=>learning.visit(location.moduleId,location.lessonId)}));
}
const button=(text:string)=>[...document.querySelectorAll('button')].find(item=>item.textContent===text)!;
test('progress and next-lesson resume survive remount without gamification and never leak into another product or preview',async()=>{
  localStorage.clear();let root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(Harness,{config})));
  assert.equal(document.querySelector('section'),null);
  await act(async()=>button('Abrir aula').click());
  assert.match(document.querySelector('section')!.textContent || '',/Primeira/);
  await act(async()=>{button('Concluir aula').click();button('Concluir aula').click();});
  assert.equal(document.querySelector('[data-testid="percent"]')!.textContent,'50');
  assert.match(document.querySelector('section')!.textContent || '',/Segunda/);
  assert.equal(JSON.parse(localStorage.getItem(progressStorageKey(config,false,1))!).completed.length,1);
  await act(async()=>root.unmount());root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(Harness,{config:{...config,appName:'Novo nome',gamification:{...config.gamification,enabled:true}}})));
  assert.equal(document.querySelector('[data-testid="percent"]')!.textContent,'50');
  await act(async()=>button('Continuar de onde parei').click());
  assert.deepEqual(JSON.parse(localStorage.getItem(progressStorageKey(config,false,1))!).last,{moduleId:1,lessonId:2});
  await act(async()=>root.render(React.createElement(Harness,{config:{...config,productId:'product-b'}})));
  assert.equal(document.querySelector('[data-testid="percent"]')!.textContent,'0');assert.equal(document.querySelector('section'),null);
  await act(async()=>root.render(React.createElement(Harness,{config,preview:true})));
  assert.equal(document.querySelector('[data-testid="percent"]')!.textContent,'0');assert.equal(document.querySelector('section'),null);
  await act(async()=>root.unmount());
});
