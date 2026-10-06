import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';
import { TEST_SPLASH_MP4 } from '../utils/fixtures/splashMedia';
const dom=new JSDOM('<div id="root"></div>',{url:'https://appify.test'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import('react-dom/client');
const {AppConfigurator}=await import('./AppConfigurator');
const {useAppStore}=await import('../store/useAppStore');
function change(id:string,value:string) {
  const input=document.querySelector(id) as HTMLSelectElement;
  Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype,'value')!.set!.call(input,value);
  input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));
}

test('opening settings accept MP4, preserve the previous asset on failed replacement, switch back to brand and remove the upload',async()=>{
  useAppStore.setState({currentProjectId:null,pwaConfig:{...INITIAL_PWA_CONFIG}});
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(AppConfigurator)));
  await act(async()=>change('#splash-media-mode','file'));
  const upload=async (file:File)=>{
    const loaded=new Promise<void>(resolve=>Object.assign(globalThis,{FileReader:class extends (dom.window.FileReader as typeof FileReader) { constructor(){super();this.addEventListener('loadend',()=>resolve());} }}));
    await act(async()=>{
      const input=document.querySelector('#splash-file') as HTMLInputElement;
      Object.defineProperty(input,'files',{configurable:true,value:[file]});
      input.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await loaded;
    });
  };
  await upload(new dom.window.File([Buffer.from(TEST_SPLASH_MP4.split(',')[1],'base64')],'logo.mp4'));
  assert.equal(useAppStore.getState().pwaConfig.splashMediaData,TEST_SPLASH_MP4);
  assert.equal(useAppStore.getState().pwaConfig.splashMediaFileName,'logo.mp4');
  assert.equal(useAppStore.getState().pwaConfig.customSplash,true);
  assert.match(document.querySelector('[role="status"]')!.textContent!,/incorporada/);
  await act(async()=>change('#splash-fit','cover'));
  assert.equal(useAppStore.getState().pwaConfig.splashMediaFit,'cover');
  await upload(new dom.window.File(['<html>invalid</html>'],'broken.mp4'));
  assert.match(document.querySelector('[role="alert"]')!.textContent!,/não corresponde/);
  assert.equal(useAppStore.getState().pwaConfig.splashMediaData,TEST_SPLASH_MP4);
  await act(async()=>change('#splash-media-mode','brand'));
  assert.equal(useAppStore.getState().pwaConfig.splashMediaData,TEST_SPLASH_MP4);
  await act(async()=>change('#splash-media-mode','file'));
  await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent?.includes('Remover abertura'))!.click());
  assert.equal(useAppStore.getState().pwaConfig.splashMediaData,'');
  assert.equal(useAppStore.getState().pwaConfig.splashMediaMode,'brand');
  await act(async()=>root.unmount());
});
