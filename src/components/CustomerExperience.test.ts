import assert from 'node:assert/strict';
import test from 'node:test';
import React, {act} from 'react';
import {JSDOM} from 'jsdom';
import {INITIAL_PWA_CONFIG} from '../constants';
import {progressStorageKey} from '../utils/lessonProgress';
import {customerEntryStorageKey} from '../utils/customerStorage';
import type {Module, PwaConfig} from '../types';

const dom = new JSDOM('<div id="root"></div>', {url:'https://product.test/', pretendToBeVisual:true});
Object.assign(globalThis, {window:dom.window, document:dom.window.document, DOMParser:dom.window.DOMParser, MutationObserver:dom.window.MutationObserver, HTMLElement:dom.window.HTMLElement, Element:dom.window.Element, SVGElement:dom.window.SVGElement, getComputedStyle:dom.window.getComputedStyle, requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window), cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window), localStorage:dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot} = await import('react-dom/client');
const {MotionGlobalConfig} = await import('motion-utils');
MotionGlobalConfig.skipAnimations = true;
const {default:i18n} = await import('../i18n');
const {useAppStore} = await import('../store/useAppStore');
const {PWARuntime} = await import('./PWARuntime');
const {PhoneMockup} = await import('./PhoneMockup');
const settle = () => act(async()=>{await new Promise(resolve=>setTimeout(resolve,350));});
const modules:Module[] = [
  {id:1,name:'Module with a long descriptive title',iconName:'BookOpen',status:'Ativo',subs:[1,2,3,4].map(id=>({id,name:`Lesson ${id}: a complete title that must remain readable`,type:'html',contentType:'html',contentHtml:'<p>Lesson content</p>'}))},
  {id:2,name:'Upgrade',iconName:'BookOpen',status:'Ativo',releaseType:'upsell',checkoutUrl:'https://example.com/checkout',subs:[]},
  {id:3,name:'Draft',iconName:'BookOpen',status:'Rascunho',subs:[]},
];

test('runtime and phone preview preserve resume, access rules and progress across all product languages', async()=>{
  await i18n.changeLanguage('pt');
  for (const Component of [PWARuntime,PhoneMockup]) {
    for (const language of ['pt-BR','en-US','es','fr'] as const) {
      localStorage.clear();
      const config={...INITIAL_PWA_CONFIG,customerLayout:'comfortable' as const,productId:'cx-test',appName:'Course',language,customSplash:false,welcomeEnabled:false,banners:[],engagementEnabled:true,supportConfig:{type:'email' as const,contact:'help@example.com'},gamification:{...INITIAL_PWA_CONFIG.gamification,enabled:true,progressStyle:'bar' as const}};
      const storage=progressStorageKey(config,true,1);
      const saved=JSON.stringify({completed:['1:1'],last:{moduleId:1,lessonId:2}});
      localStorage.setItem(storage,saved);
      if (Component === PhoneMockup) localStorage.setItem(customerEntryStorageKey(config,true,1),'done');
      useAppStore.setState({currentProjectId:1,activeStep:1,splashActive:false,pwaConfig:config,modules});
      const root=createRoot(document.getElementById('root')!);
      await act(async()=>root.render(React.createElement(Component,{isPhoneDark:false,setIsPhoneDark:()=>{}})));
      await settle();
      const t=i18n.getFixedT(language.split('-')[0]);
      assert.equal(document.querySelector('.phone-hero'),null);
      assert.equal(document.querySelector('.cx-continue h2')?.textContent,t('app.learning.resumeTitle'));
      assert.match(document.querySelector('.cx-continue')!.textContent!,/Lesson 2/);
      assert.equal(document.querySelector('.cx-continue')!.compareDocumentPosition(document.querySelector('.cx-module-library')!),dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      assert.equal(document.querySelector('.cx-module-card:disabled')?.textContent?.trim(),'Draft0 '+t('app.modules.lessonPlural'));
      assert.equal(document.querySelectorAll('.cx-bottom-nav button').length,5);
      assert.equal(document.querySelectorAll('.cx-bottom-nav [aria-current="page"]').length,1);
      assert.equal(localStorage.getItem(storage),saved);
      if (language === 'en-US') {
        for (const count of [1,5]) {
          await act(async()=>useAppStore.setState({pwaConfig:{...config,banners:Array.from({length:count},(_,id)=>({id,imageUrl:'https://example.com/banner.png',link:''}))}}));
          assert.equal(document.querySelector('.cx-home-banner')!.nextElementSibling,document.querySelector('.cx-continue'));
          assert.equal(localStorage.getItem(storage),saved);
        }
        await act(async()=>useAppStore.setState({pwaConfig:config}));
        assert.equal(document.querySelector('.cx-home-banner'),null);
      }
      await act(async()=>document.querySelector<HTMLButtonElement>('.cx-continue button')!.click());
      await settle();
      assert.equal(document.querySelector('iframe')?.title,t('app.modules.contentTitle'));
      await act(async()=>[...document.querySelectorAll('button')].find(button=>button.textContent?.includes(t('app.modules.back')))!.click());
      await settle();
      assert.equal(document.querySelectorAll('.cx-lesson-card').length,4);
      const progressBeforeSwitch=localStorage.getItem(storage);
      await act(async()=>useAppStore.setState({pwaConfig:{...config,customerLayout:'standard'}}));
      assert.ok(document.querySelector('[data-customer-layout="standard"] .cx-lesson-list'));
      assert.equal(document.querySelectorAll('.cx-lesson-card').length,4);
      assert.equal(localStorage.getItem(storage),progressBeforeSwitch);
      await act(async()=>useAppStore.setState({pwaConfig:config}));
      assert.ok(document.querySelector('[data-customer-layout="comfortable"] .cx-lesson-list'));
      assert.equal(document.querySelectorAll('.cx-lesson-completed').length,1);
      assert.equal(document.querySelectorAll('[role="progressbar"]').length,1);
      assert.equal(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),'1');
      assert.doesNotMatch(document.querySelector('.cx-module-heading')!.textContent!,/%/);
      await act(async()=>document.querySelector<HTMLButtonElement>('.cx-bottom-nav button')!.click());
      await settle();
      await act(async()=>document.querySelectorAll<HTMLButtonElement>('.cx-module-card')[1].click());
      assert.match(document.body.textContent!,new RegExp(t('app.upsell.lockedTitle')));
      assert.equal(JSON.parse(localStorage.getItem(storage)!).completed.length,1);
      await act(async()=>root.unmount());
    }
  }
});

test('new projects have no resume placeholder and disabled engagement leaves only configured navigation',async()=>{
  localStorage.clear();
  const config:PwaConfig={...INITIAL_PWA_CONFIG,productId:'fresh',customSplash:false,language:'en-US',engagementEnabled:false,supportConfig:{type:'none' as const,contact:''},gamification:{...INITIAL_PWA_CONFIG.gamification,enabled:false}};
  useAppStore.setState({currentProjectId:2,splashActive:false,pwaConfig:config,modules});
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(PWARuntime,{isPhoneDark:true,setIsPhoneDark:()=>{}})));
  await settle();
  assert.equal(document.querySelector('.cx-continue'),null);
  assert.ok(document.querySelector('[data-customer-layout="standard"]'));
  assert.deepEqual([...document.querySelectorAll('.cx-bottom-nav button')].map(button=>button.textContent),['Home','Profile']);
  await act(async()=>document.querySelector<HTMLButtonElement>('.cx-module-card')!.click());
  await settle();
  assert.equal(document.querySelector('[role="progressbar"]'),null);
  assert.match(document.querySelector('.cx-module-heading')!.textContent!,/0 of 4 lessons completed/);
  await act(async()=>root.unmount());
});
