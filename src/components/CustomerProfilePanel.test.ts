import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act} from 'react';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';

const dom=new JSDOM('<div id="root"></div>',{url:'https://appify.test/'});
Object.defineProperty(globalThis,'window',{value:dom.window,configurable:true,writable:true});
Object.defineProperty(globalThis,'document',{value:dom.window.document,configurable:true,writable:true});
Object.defineProperty(globalThis,'localStorage',{value:dom.window.localStorage,configurable:true,writable:true});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
Object.defineProperty(globalThis,'IS_REACT_ACT_ENVIRONMENT',{value:true,configurable:true,writable:true});
const { createRoot }=await import('react-dom/client');
await import('../i18n');
const { CustomerProfilePanel }=await import('./CustomerProfilePanel');
const { ProtectedContentAssetsProvider }=await import('./ProtectedContentAssets');

const config={...INITIAL_PWA_CONFIG,productId:'profile-product',language:'en-US' as const};

test('buyer logout is shown only in authenticated product context and invokes session cleanup',async()=>{
  let loggedOut=0;
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(ProtectedContentAssetsProvider,{assets:new Map(),onLogout:async()=>{loggedOut++;}},React.createElement(CustomerProfilePanel,{config:{...config,buyerAccessEnabled:true},projectId:null,preview:false,dark:false,themeColor:'#334455'}))));
  const button=[...document.querySelectorAll('button')].find(item=>item.textContent?.includes('Sign out of this product'))!;
  assert.ok(button);
  await act(async()=>button.click());
  assert.equal(loggedOut,1);
  await act(async()=>root.unmount());
});

async function setInput(input:HTMLInputElement,value:string) {
  await act(async()=>{
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype,'value')!.set!.call(input,value);
    input.dispatchEvent(new dom.window.Event('input',{bubbles:true}));
  });
}

test('profile save shows localized success and survives remount',async()=>{
  localStorage.clear();
  const host=document.getElementById('root')!;
  let root=createRoot(host);
  await act(async()=>root.render(React.createElement(CustomerProfilePanel,{config,projectId:42,preview:true,dark:false,themeColor:'#334455'})));
  const inputs=[...document.querySelectorAll('input')] as HTMLInputElement[];
  assert.equal(inputs.length,2);
  await setInput(inputs[0],'Jane Doe');
  await setInput(inputs[1],'jane@example.com');
  const save=[...document.querySelectorAll('button')].find(node=>node.textContent?.includes('Save Changes'))!;
  assert.ok(save);
  await act(async()=>save.click());
  assert.match(document.body.textContent || '',/Your details were saved on this device\./);
  await act(async()=>root.unmount());

  root=createRoot(host);
  await act(async()=>root.render(React.createElement(CustomerProfilePanel,{config,projectId:42,preview:true,dark:false,themeColor:'#334455'})));
  const restored=[...document.querySelectorAll('input')] as HTMLInputElement[];
  assert.equal(restored[0].value,'Jane Doe');
  assert.equal(restored[1].value,'jane@example.com');
  await act(async()=>root.unmount());
});

test('preview reset clears local customer state and returns to first visit',async()=>{
  localStorage.clear();
  const { customerEntryStorageKey, customerProfileStorageKey }=await import('../utils/customerStorage');
  const { progressStorageKey }=await import('../utils/lessonProgress');
  const { activityStorageKey }=await import('../utils/activityStorage');
  const projectId=42;
  localStorage.setItem(customerProfileStorageKey(config,true,projectId),'{}');
  localStorage.setItem(customerEntryStorageKey(config,true,projectId),'done');
  localStorage.setItem(progressStorageKey(config,true,projectId),JSON.stringify({completed:['1:1'],last:{moduleId:1,lessonId:1}}));
  localStorage.setItem(activityStorageKey(config,true,projectId,1,1),JSON.stringify({note:'saved'}));
  let resets=0;
  const host=document.getElementById('root')!;
  const root=createRoot(host);
  await act(async()=>root.render(React.createElement(CustomerProfilePanel,{config,projectId,preview:true,dark:false,themeColor:'#334455',onResetPreview:()=>{resets++;}})));
  const reset=[...document.querySelectorAll('button')].find(node=>node.textContent?.includes('Reset test data'))!;
  assert.ok(reset);
  await act(async()=>reset.click());
  assert.equal(resets,1);
  assert.equal(localStorage.getItem(customerProfileStorageKey(config,true,projectId)),null);
  assert.equal(localStorage.getItem(customerEntryStorageKey(config,true,projectId)),null);
  assert.equal(localStorage.getItem(progressStorageKey(config,true,projectId)),null);
  assert.equal(localStorage.getItem(activityStorageKey(config,true,projectId,1,1)),null);
  await act(async()=>root.unmount());
});
