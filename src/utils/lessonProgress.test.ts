import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_PWA_CONFIG } from '../constants';
import type { Module } from '../types';
import {emptyLessonProgress,lessonKey,moduleCompletion,progressStorageKey,readLessonProgress,resumeLesson} from './lessonProgress';
const modules:Module[]=[{id:1,name:'Módulo',iconName:'Book',status:'Ativo',subs:[{id:1,name:'Aula 1',type:'html',contentType:'html'},{id:2,name:'Aula 2',type:'html',contentType:'html'}]},{id:2,name:'Outro',iconName:'Book',status:'Ativo',subs:[{id:3,name:'Aula 3',type:'html',contentType:'html'}]}];
test('real completion ignores deleted lessons, handles empty modules and resume advances past completed lessons without bypassing locks or drafts',()=>{
  const progress={completed:[lessonKey(1,1),'1:99'],last:{moduleId:1,lessonId:1}};
  assert.deepEqual(moduleCompletion(modules[0],progress),{completed:1,total:2,percent:50});
  assert.deepEqual(moduleCompletion({...modules[0],subs:[]},progress),{completed:0,total:0,percent:0});
  assert.deepEqual(resumeLesson(modules,progress),{moduleId:1,lessonId:2});
  assert.deepEqual(resumeLesson(modules,{...progress,completed:['1:1','1:2']}),{moduleId:2,lessonId:3});
  assert.deepEqual(resumeLesson(modules,{completed:['1:1','1:2','2:3'],last:{moduleId:2,lessonId:3}}),{moduleId:2,lessonId:3});
  for(const type of ['locked','upsell','points'] as const) assert.equal(resumeLesson([{...modules[0],releaseType:type}],progress),null);
  assert.equal(resumeLesson([{...modules[0],status:'Rascunho'}],progress),null);
  assert.equal(resumeLesson(modules,{...progress,last:{moduleId:1,lessonId:99}}),null);
  assert.equal(resumeLesson(modules,emptyLessonProgress()),null);
});
test('storage identities survive product renaming and isolate products and previews; malformed data is ignored',()=>{
  const config={...INITIAL_PWA_CONFIG,productId:'product-a'};
  const key=progressStorageKey(config,false,1);
  assert.equal(key,progressStorageKey({...config,appName:'Outro nome'},false,1));
  assert.notEqual(key,progressStorageKey({...config,productId:'product-b'},false,1));
  assert.notEqual(key,progressStorageKey(config,true,1));
  Object.assign(globalThis,{localStorage:{getItem:()=>'{bad json'}});assert.deepEqual(readLessonProgress(key),emptyLessonProgress());
  Object.assign(globalThis,{localStorage:{getItem:()=>JSON.stringify({completed:['1:1','1:1',{},'bad'],last:{moduleId:1,lessonId:2}})}});
  assert.deepEqual(readLessonProgress(key),{completed:['1:1'],last:{moduleId:1,lessonId:2}});
  Object.assign(globalThis,{localStorage:{getItem:()=>{throw new Error('blocked');}}});assert.deepEqual(readLessonProgress(key),emptyLessonProgress());
});
