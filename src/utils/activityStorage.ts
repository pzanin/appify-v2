import type { PwaConfig } from '../types';
import { progressStorageKey } from './lessonProgress';
export const ACTIVITY_STORAGE_LIMIT = 256000;
export type ActivityData = Record<string,string>;
export function activityStorageKey(config:PwaConfig,preview:boolean,projectId:number|null,moduleId:number,lessonId:number) {
  return `${progressStorageKey(config,preview,projectId).replace('appify-lesson-progress','appify-activity')}:${moduleId}:${lessonId}`;
}
export function validActivityData(value:unknown):value is ActivityData {
  return !!value && typeof value==='object' && !Array.isArray(value)
    && Object.keys(value).length<=100
    && Object.entries(value).every(([key,item])=>key.length>0 && key.length<=128 && typeof item==='string' && item.length<=64000)
    && JSON.stringify(value).length<=ACTIVITY_STORAGE_LIMIT;
}
export function readActivityData(storage:Storage,key:string):ActivityData {
  const raw=storage.getItem(key);
  if(!raw)return Object.create(null);
  if(raw.length>ACTIVITY_STORAGE_LIMIT)throw Error('Invalid activity data');
  const data:unknown=JSON.parse(raw);
  if(!validActivityData(data))throw Error('Invalid activity data');
  return Object.assign(Object.create(null),data);
}
// The activity never chooses its host key or reads other host storage.
export function writeActivityData(storage:Storage,key:string,value:unknown) {
  if(!validActivityData(value))throw Error('Invalid activity data');
  storage.setItem(key,JSON.stringify(value));
}

// A synchronous, activity-only localStorage facade is hydrated before user scripts run.
// No eval, same-origin permissions or native storage access are granted to the frame.
export const ACTIVITY_STORAGE_BRIDGE = `(()=>{
let data=Object.create(null),ready=false,loaded=false,started=false,sequence=0;
const pending=new Set();
const signal=(message)=>parent.postMessage(message,'*');
const notify=(message)=>window.dispatchEvent(new CustomEvent('appify:storage-status',{detail:message}));
const persist=(next)=>{
 if(Object.keys(next).length>100||JSON.stringify(next).length>256000){signal({type:'appify:storage-failure'});throw new DOMException('Activity storage limit','QuotaExceededError');}
 const id=++sequence;pending.add(id);data=next;
 signal({type:'appify:storage-write',id,data});
};
const store={getItem(key){return data[String(key)]??null},setItem(key,value){
 key=String(key);value=String(value);if(!key.length||key.length>128||value.length>64000){signal({type:'appify:storage-failure'});throw new DOMException('Activity storage limit','QuotaExceededError');}
 persist(Object.assign(Object.create(null),data,{[key]:value}));
},removeItem(key){const next=Object.assign(Object.create(null),data);delete next[String(key)];persist(next)},clear(){persist(Object.create(null))},key(index){return Object.keys(data)[index]??null},get length(){return Object.keys(data).length}};
Object.defineProperty(window,'localStorage',{value:store,configurable:false});
const start=()=>{
 if(!ready||!loaded||started)return;started=true;clearInterval(retry);
 const scripts=[...document.querySelectorAll('script[type="application/appify-pending"]')];
 for(const old of scripts){const script=document.createElement('script');script.textContent=old.textContent;old.replaceWith(script)}
 document.dispatchEvent(new Event('DOMContentLoaded',{bubbles:true}));
 window.dispatchEvent(new Event('load'));
};
window.addEventListener('message',(event)=>{
 if(event.source!==parent||!event.data)return;
 const message=event.data;
 if(message.type==='appify:storage-ready'&&!ready){data=Object.assign(Object.create(null),message.data);ready=true;start()}
 if(message.type==='appify:storage-result'&&pending.delete(message.id))notify({saved:message.ok});
});
window.addEventListener('load',()=>{loaded=true;start()},{once:true});
const request=()=>signal({type:'appify:storage-init'});
const retry=setInterval(request,500);request();
setTimeout(()=>{if(!ready){clearInterval(retry);signal({type:'appify:storage-unavailable'})}},10000);
})();`;
