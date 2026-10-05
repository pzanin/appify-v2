import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act} from 'react';
import { JSDOM } from 'jsdom';
import type { PwaConfig } from '../types';
import { INITIAL_PWA_CONFIG } from '../constants';
const dom=new JSDOM('<div id="root"></div>',{url:'https://appify.test/'});
Object.defineProperty(dom.window.navigator,'userAgent',{value:'Mozilla Android Chrome'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const { createRoot }=await import('react-dom/client');
await import('../i18n');
const { initializePwaInstall }=await import('../utils/pwaInstallation');
const { CustomerEntry,entryStorageKey }=await import('./CustomerEntry');
const controller=initializePwaInstall();
const config:PwaConfig={...INITIAL_PWA_CONFIG,appName:'Guia de Viagem',customSplash:false,language:'pt-BR' as const};
const button=(text:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!;
const click=(node:HTMLElement)=>node.click();
async function render(settings=config) {
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(CustomerEntry,{config:settings},React.createElement('div',{'data-testid':'library'},'Aulas'))));
  return root;
}
test('customer sees branding, explicit demo access, Android manual help and can reach content without installation; email is never persisted',async()=>{
  localStorage.clear();const root=await render();
  assert.match(document.body.textContent || '',/Guia de Viagem/);
  assert.equal(document.querySelector('[data-testid="library"]'),null);
  await act(async()=>click(button('Começar')));
  assert.match(document.body.textContent || '',/Não verifica compras/);
  const email=document.querySelector('input[type="email"]') as HTMLInputElement;
  await act(async()=>{Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(email,'test@example.com');email.dispatchEvent(new dom.window.Event('input',{bubbles:true}));});
  await act(async()=>click(button('Entrar na demonstração')));
  assert.match(document.body.textContent || '',/três pontos/);
  assert.equal(button('Instalar aplicativo'),undefined);
  await act(async()=>click(button('Continuar no navegador')));
  assert.ok(document.querySelector('[data-testid="library"]'));
  assert.equal(localStorage.getItem(entryStorageKey(config.appName)),'done');
  assert.equal(JSON.stringify({...localStorage}).includes('test@example.com'),false);
  await act(async()=>root.unmount());
  const reopened=await render();assert.ok(document.querySelector('[data-testid="library"]'));await act(async()=>reopened.unmount());
});
test('early captured prompt produces a real install button; browser acceptance is not reported as installed',async()=>{
  localStorage.clear();let prompts=0;
  const event=new dom.window.Event('beforeinstallprompt',{cancelable:true});
  Object.assign(event,{prompt:async()=>{prompts++;},userChoice:Promise.resolve({outcome:'accepted'})});dom.window.dispatchEvent(event);
  const root=await render({...config,customerAccessMode:'open'});
  await act(async()=>click(button('Começar')));
  assert.ok(button('Instalar aplicativo'));
  await act(async()=>click(button('Instalar aplicativo')));
  assert.equal(prompts,1);
  assert.match(document.body.textContent || '',/aceitou a instalação/);
  assert.equal(document.body.textContent?.includes('O aplicativo está instalado'),false);
  await act(async()=>dom.window.dispatchEvent(new dom.window.Event('appinstalled')));
  assert.match(document.body.textContent || '',/O aplicativo está instalado/);
  await act(async()=>click(button('Abrir meu conteúdo')));
  assert.ok(document.querySelector('[data-testid="library"]'));
  await act(async()=>root.unmount());
});
test('entry and installation copy exists in every supported language and never references button color',async()=>{
  const { readFileSync }=await import('node:fs');
  const locales=['pt','en','es','fr'].map(lang=>JSON.parse(readFileSync(`src/locales/${lang}.json`,'utf8')));
  for(const locale of locales){
    assert.deepEqual(Object.keys(locale.experience).sort(),Object.keys(locales[0].experience).sort());
    assert.deepEqual(Object.keys(locale.experience.install).sort(),Object.keys(locales[0].experience.install).sort());
    assert.doesNotMatch(locale.onboarding.install.androidStep1,/azul|blue|bleu/i);
  }
  controller.dispose();
});
