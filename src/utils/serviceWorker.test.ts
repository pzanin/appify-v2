import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { generateServiceWorker } from './serviceWorker';

test('updates prefer fresh network content, offline falls back, and private/API routes are never cached',async()=>{
  const handlers:Record<string,(event:any)=>void>={};let online=true;let fetched=0;let put=0;
  const context={URL,Set,Promise, self:{registration:{scope:'https://appify.test/'},location:{origin:'https://appify.test'},addEventListener:(name:string,fn:any)=>{handlers[name]=fn;}},
    fetch:async()=>{fetched++;if(!online)throw new Error('offline');return {ok:true,clone:()=>({kind:'new copy'}),kind:'new'};},
    caches:{match:async()=>({kind:'old'}),open:async()=>({put:async()=>{put++;}})}};
  vm.runInNewContext(generateServiceWorker('appify-pwa-new',['./index.html','./app-data.json'],true),context);
  let result:Promise<any>|undefined;const waits:Promise<any>[]=[];
  const event={request:{url:'https://appify.test/app-data.json?nocache=1',method:'GET'},respondWith:(value:Promise<any>)=>{result=value;},waitUntil:(value:Promise<any>)=>waits.push(value)};
  handlers.fetch(event);assert.equal((await result!).kind,'new');await Promise.all(waits);assert.equal(put,1);
  online=false;handlers.fetch(event);assert.equal((await result!).kind,'old');assert.equal(fetched,2);
  result=undefined;handlers.fetch({...event,request:{url:'https://appify.test/api/verify-buyer',method:'GET'}});assert.equal(result,undefined);
});
