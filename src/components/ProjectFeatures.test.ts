import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';
import { publicFeatureConfig, visibleProjectSteps } from '../utils/projectFeatures';
const dom = new JSDOM('<div id="root"></div>', {url:'https://appify.test/'});
Object.assign(globalThis, {window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,IS_REACT_ACT_ENVIRONMENT:true});
const { createRoot } = await import('react-dom/client');
await import('../i18n');
const { useAppStore } = await import('../store/useAppStore');
const { Sidebar } = await import('./Sidebar');
const { AppConfigurator } = await import('./AppConfigurator');
const { PWARuntime } = await import('./PWARuntime');
const { PhoneMockup } = await import('./PhoneMockup');
const { DeployInstructions } = await import('./DeployInstructions');

test('project switches hide and restore tabs without losing gamification settings; other project configurations stay independent', async()=>{
  const projectA = {...INITIAL_PWA_CONFIG, engagementEnabled:true, gamification:{...INITIAL_PWA_CONFIG.gamification,enabled:true,enablePoints:true,progressStyle:'bar' as const}};
  const projectB = {...INITIAL_PWA_CONFIG,engagementEnabled:false};
  useAppStore.setState({pwaConfig:projectA,activeStep:1});
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(React.Fragment,null,React.createElement(Sidebar),React.createElement(AppConfigurator))));
  const tab=(name:string)=>[...document.querySelectorAll('.step-name')].some(el=>el.textContent===name);
  const switchFor=(name:string)=>[...document.querySelectorAll('label')].find(label=>label.textContent?.includes(name))!.querySelector('input')!;
  assert.ok(tab('Engajamento'));assert.ok(tab('Gamificação'));
  await act(async()=>switchFor('Engajamento —').click());
  await act(async()=>switchFor('Gamificação —').click());
  assert.equal(tab('Engajamento'),false);assert.equal(tab('Gamificação'),false);
  assert.equal(useAppStore.getState().pwaConfig.gamification.enablePoints,true);
  assert.equal(useAppStore.getState().pwaConfig.gamification.progressStyle,'bar');
  await act(async()=>switchFor('Gamificação —').click());assert.ok(tab('Gamificação'));
  await act(async()=>useAppStore.setState({pwaConfig:projectB}));assert.equal(tab('Gamificação'),false);
  await act(async()=>useAppStore.setState({pwaConfig:projectA}));assert.ok(tab('Gamificação'));assert.ok(tab('Engajamento'));
  await act(async()=>root.unmount());
  const legacy={...projectA};delete legacy.engagementEnabled;
  assert.ok(visibleProjectSteps(legacy).some(step=>step.id===4));
});

test('disabled engagement disappears from runtime and preview navigation; disabled gamification is sanitized on export without mutating the project',async()=>{
  const config={...INITIAL_PWA_CONFIG,engagementEnabled:false,gamification:{...INITIAL_PWA_CONFIG.gamification,enabled:false,enablePoints:true,enableCelebration:true}};
  useAppStore.setState({pwaConfig:config,activeStep:1,splashActive:false});
  for(const component of [PWARuntime,PhoneMockup]){
    const root=createRoot(document.getElementById('root')!);
    await act(async()=>root.render(React.createElement(component,{isPhoneDark:false,setIsPhoneDark:()=>{}})));
    const markup=document.getElementById('root')!.innerHTML;
    assert.doesNotMatch(markup,/Comunidade|lucide-bell|lucide-rss/);
    assert.match(markup,/Início/);
    await act(async()=>root.unmount());
  }
  const exported=publicFeatureConfig(config);
  assert.equal(exported.gamification.enablePoints,false);
  assert.equal(exported.gamification.enableCelebration,false);
  assert.deepEqual(exported.gamification.awardsConfig,[]);
  assert.equal(config.gamification.enablePoints,true);
});

test('publication defaults to Netlify, persists provider choice per project and preserves Cloudflare instructions',async()=>{
  useAppStore.setState({pwaConfig:{...INITIAL_PWA_CONFIG,deploymentProvider:undefined}});
  const root=createRoot(document.getElementById('root')!);
  await act(async()=>root.render(React.createElement(DeployInstructions)));
  assert.match(document.body.textContent || '',/Netlify Drop/);
  assert.match(document.body.textContent || '',/index.html na raiz/);
  assert.match(document.body.textContent || '',/projeto existente/);
  const select=document.querySelector('#deploy-provider') as HTMLSelectElement;
  await act(async()=>{select.value='cloudflare';select.dispatchEvent(new dom.window.Event('change',{bubbles:true}));});
  assert.equal(useAppStore.getState().pwaConfig.deploymentProvider,'cloudflare');
  assert.match(document.body.textContent || '',/No Cloudflare Pages, conecte/);
  await act(async()=>root.unmount());
});
