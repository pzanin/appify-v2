import assert from 'node:assert/strict';
import test from 'node:test';
import React,{act} from 'react';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';

const dom=new JSDOM('<div id="root"></div>',{url:'https://appify.test/'});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,navigator:dom.window.navigator,IS_REACT_ACT_ENVIRONMENT:true});
const { createRoot }=await import('react-dom/client');
await import('../i18n');
const { CustomerProfilePanel }=await import('./CustomerProfilePanel');

const config={...INITIAL_PWA_CONFIG,productId:'profile-product',language:'en-US' as const};

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
  assert.match(document.body.textContent || '',/Profile saved on this device/);
  await act(async()=>root.unmount());

  root=createRoot(host);
  await act(async()=>root.render(React.createElement(CustomerProfilePanel,{config,projectId:42,preview:true,dark:false,themeColor:'#334455'})));
  const restored=[...document.querySelectorAll('input')] as HTMLInputElement[];
  assert.equal(restored[0].value,'Jane Doe');
  assert.equal(restored[1].value,'jane@example.com');
  await act(async()=>root.unmount());
});
