import { prepareResponsiveHtml } from '../utils/htmlContent';
import { lessonHtml } from '../utils/lessonHtml';
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import React,{act} from 'react';
import {JSDOM} from 'jsdom';
import type {PwaConfig} from '../types';
import {INITIAL_PWA_CONFIG} from '../constants';
import {feedTimestamp} from '../utils/productCopy';
import {getDefaultProps,generateBuilderHtml} from '../utils/builderHtml';
const dom=new JSDOM('<html lang="en-US"><body><div id="root"></div></body></html>',{url:'https://product.test/',pretendToBeVisual:true});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,DOMParser:dom.window.DOMParser,MutationObserver:dom.window.MutationObserver,HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,SVGElement:dom.window.SVGElement,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window),localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const {createRoot}=await import('react-dom/client');
const {MotionGlobalConfig}=await import('motion-utils');MotionGlobalConfig.skipAnimations=true;
const {default:i18n}=await import('../i18n');
const {useAppStore}=await import('../store/useAppStore');
const {PWARuntime}=await import('./PWARuntime');
const {CustomerEntry}=await import('./CustomerEntry');
const {HtmlFrame}=await import('./HtmlFrame');
const {ScreenErrorBoundary}=await import('./ScreenErrorBoundary');
const {PWABootstrap}=await import('../App');
const settle=()=>act(async()=>{await new Promise(resolve=>setTimeout(resolve,350));});
const button=(text:string)=>[...document.querySelectorAll('button')].find(el=>el.textContent?.includes(text))!;
const english:PwaConfig={...INITIAL_PWA_CONFIG,appName:'My Course',language:'en-US',tagline:'O melhor app do mundo',customSplash:false};
function noPortuguese(){assert.doesNotMatch(document.body.textContent || '',/Concluir|Concluíd|Voltar|Conteúdo|Para acessar|é necessário|Agora mesmo|suporte@|O melhor app|Algo deu errado|Recarregar|Preparando/);}
function flatten(value:any,prefix=''):Record<string,string>{return Object.assign({},...Object.entries(value).map(([key,item])=>typeof item==='string'?{[prefix+key]:item}:flatten(item,prefix+key+'.')));}

test('all product translation keys and interpolation variables exist in all four languages',()=>{
 const files=['PWARuntime','PhoneMockup','CustomerEntry','InstallGuide','ScreenErrorBoundary','HtmlFrame'];
 const keys=new Set<string>();for(const file of files){for(const match of readFileSync(`src/components/${file}.tsx`,'utf8').matchAll(/\bt\(['"]([^'"]+)/g))keys.add(match[1]);}
 const pt=flatten(JSON.parse(readFileSync('src/locales/pt.json','utf8')));
 for(const locale of ['pt','en','es','fr']){
  const copy=flatten(JSON.parse(readFileSync(`src/locales/${locale}.json`,'utf8')));
  assert.deepEqual(Object.keys(copy).sort(),Object.keys(pt).sort(),locale);
  for(const key of keys)assert.ok(copy[key],`${locale}: ${key}`);
  for(const [key,text] of Object.entries(pt))assert.deepEqual([...text.matchAll(/{{(.*?)}}/g)].map(m=>m[1]).sort(),[...copy[key].matchAll(/{{(.*?)}}/g)].map(m=>m[1]).sort(),`${locale}: ${key}`);
 }
});

test('English runtime stays in English while the Builder is Portuguese, including upsell, support, feed and lesson completion',async()=>{
 await i18n.changeLanguage('pt');localStorage.clear();
 useAppStore.setState({currentProjectId:1,splashActive:false,pwaConfig:{...english,supportConfig:{type:'email',contact:''}},modules:[{id:1,name:'Lessons',iconName:'BookOpen',status:'Ativo',subs:[{id:2,name:'First lesson',type:'html',contentType:'html',contentHtml:'<p>Welcome</p>'}]},{id:3,name:'Advanced course',iconName:'BookOpen',status:'Ativo',releaseType:'upsell',checkoutUrl:'https://example.com',subs:[]}],feedPosts:[{id:5,author:'Team',content:'Welcome to the course',timestamp:'Agora mesmo'}]});
 const root=createRoot(document.getElementById('root')!);
 await act(async()=>root.render(React.createElement(PWARuntime,{isPhoneDark:false,setIsPhoneDark:()=>{}})));noPortuguese();
 await act(async()=>document.querySelectorAll<HTMLElement>('.phone-module-wrapper')[1].click());
 assert.match(document.body.textContent || '',/To access the module Advanced course, you need to purchase this upgrade/);noPortuguese();
 await act(async()=>button('Cancel').click());await settle();
 await act(async()=>button('Support').click());await settle();assert.match(document.body.textContent || '',/Support contact has not been configured/);noPortuguese();
 await act(async()=>button('Community').click());await settle();assert.match(document.body.textContent || '',/Just now/);noPortuguese();
 await act(async()=>button('Profile').click());await settle();assert.equal(document.querySelector('input[type="text"]')?.getAttribute('placeholder'),'Full Name');noPortuguese();
 await act(async()=>button('Home').click());await settle();await act(async()=>document.querySelector<HTMLElement>('.phone-module-wrapper')!.click());await settle();
 await act(async()=>[...document.querySelectorAll<HTMLElement>('div')].find(el=>el.textContent==='First lesson' && el.style.fontSize==='12px')!.parentElement!.parentElement!.click());
 await settle();assert.ok(button('Mark as complete'));assert.equal(document.querySelector('iframe')?.title,'Lesson content');noPortuguese();
 await act(async()=>button('Mark as complete').click());assert.match(document.body.textContent || '',/Completed/);noPortuguese();
 await act(async()=>root.unmount());
});

test('English welcome and install guide ignore the old Portuguese placeholder tagline',async()=>{
 await i18n.changeLanguage('pt');const root=createRoot(document.getElementById('root')!);
 await act(async()=>root.render(React.createElement(CustomerEntry,{config:english,preview:true,children:React.createElement('p',null,'Library')})));
 assert.match(document.body.textContent || '',/Your content, organized and easy to access/);noPortuguese();
 await act(async()=>button('Add to home screen').click());assert.match(document.body.textContent || '',/Installation is optional/);noPortuguese();
 await act(async()=>root.unmount());
});

test('English activity errors use the product language, without falling back to the Portuguese Builder',async()=>{
 const root=createRoot(document.getElementById('root')!);
 await act(async()=>root.render(React.createElement(HtmlFrame,{html:'<button>Activity</button>',interactive:true,activityPath:'pages/lesson-1-2.html',uiLanguage:'en-US'})));
 const frame=document.querySelector('iframe')!;
 await act(async()=>window.dispatchEvent(new dom.window.MessageEvent('message',{source:frame.contentWindow,data:{type:'appify:activity-error',message:'Invalid JavaScript'}})));
 assert.match(document.body.textContent || '',/Activity error: Invalid JavaScript/);noPortuguese();
 await act(async()=>root.unmount());
});

test('English loading and data failure appear before app-data can be read; crash screen follows document language',async t=>{
 let reject:(e:Error)=>void=()=>{};t.mock.method(globalThis,'fetch',()=>new Promise((_,fail)=>{reject=fail;}));
 const root=createRoot(document.getElementById('root')!);
 await act(async()=>root.render(React.createElement(PWABootstrap,{isPhoneDark:false,setIsPhoneDark:()=>{}})));
 assert.match(document.body.textContent || '',/Opening your content/);noPortuguese();
 await act(async()=>reject(Error('offline')));assert.ok(button('Try again'));noPortuguese();
 await act(async()=>root.render(null));t.mock.method(console,'error',()=>{});
 const Broken=()=>{throw Error('private detail');};
 await act(async()=>root.render(React.createElement(ScreenErrorBoundary,{product:true,children:React.createElement(Broken)})));
 assert.ok(button('Reload app'));assert.match(document.body.textContent || '',/Something went wrong/);assert.doesNotMatch(document.body.textContent || '',/private detail/);noPortuguese();
 await act(async()=>root.unmount());
});

test('generated block defaults, prompts and video labels follow product language; saved author content is preserved',()=>{
 const specs=[['header'],['text'],['list'],['card'],['accordion'],['audio'],['download'],['image'],['video'],['link'],...['hero','oneColumn','twoColumn','threeColumn','imageText','testimonial','cta'].map(type=>['container',type])];
 const blocks=specs.map(([type,subtype],index)=>({id:String(index),type,subtype,props:getDefaultProps(type,subtype,'en-US')}));
 const doc=new JSDOM(generateBuilderHtml(blocks,'en-US')).window.document;
 assert.doesNotMatch(doc.body.textContent || '',/Título|Subtítulo|Digite|benefício|Dica|Clique|Envie|Informe|Baixar|Descrição|depoimento|Coluna|Pronto para|Faça uma/);
 const video={id:'video',type:'video',props:{...getDefaultProps('video',undefined,'en-US'),url:'https://youtu.be/abcdefghijk'}};
 const videoDoc=new JSDOM(generateBuilderHtml([video],'en-US')).window.document;assert.equal(videoDoc.querySelector('a')?.getAttribute('aria-label'),'Play Video');
 const authored={id:'custom',type:'text',props:{content:'Texto do autor que deve ser preservado'}};
 assert.match(generateBuilderHtml([authored],'en-US'),/Texto do autor que deve ser preservado/);
 const visual:any={id:2,name:'Lesson',type:'html',htmlMode:'visual',contentHtml:'Informe um link HTTPS para o arquivo.',builder_data:[{id:'file',type:'download',props:{title:'Worksheet',buttonText:'Download'}}]};
 assert.match(lessonHtml(visual,'en-US'),/Add an HTTPS link to the file/);
 assert.doesNotMatch(lessonHtml(visual,'en-US'),/Informe/);
 const empty=new JSDOM(prepareResponsiveHtml('','en-US')).window.document;assert.equal(empty.documentElement.lang,'en-US');assert.match(empty.body.textContent || '',/No content has been added/);
 assert.equal(lessonHtml({...visual,htmlMode:'code'},'en-US'),visual.contentHtml);
 assert.equal(lessonHtml({...visual,customHtml:'<p>Texto importado</p>'},'en-US'),'<p>Texto importado</p>');
});

test('legacy feed dates and new numeric dates are formatted in the product locale',()=>{
 assert.equal(feedTimestamp({id:1,author:'A',content:'A',timestamp:'Agora mesmo'},'en-US'),'Just now');
 const date=new Date(2026,9,7,10,30).getTime();
 const expected=new Intl.DateTimeFormat('en-US',{dateStyle:'short',timeStyle:'short'}).format(date);
 assert.equal(feedTimestamp({id:1,author:'A',content:'A',timestamp:'07/10/2026, 10:30:00'},'en-US'),expected);
 assert.equal(feedTimestamp({id:1,author:'A',content:'A',timestamp:'',displayDate:date},'en-US'),expected);
});
