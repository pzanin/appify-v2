import { productTagline, productName } from '../utils/productCopy';
import { customerButtonTextColor } from '../utils/customerTheme';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PwaConfig } from '../types';
import { InstallGuide } from './InstallGuide';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { MAX_SPLASH_VIDEO_MS, splashMediaSource } from '../utils/splashMedia';
import { SplashArtwork } from './SplashArtwork';

export function entryStorageKey(name:string) { return `appify-entry-v1:${window.location.pathname}:${name}`; }
export function splashDuration(config:PwaConfig) { const value=Number(config.splashDurationMs ?? 2500); return Number.isFinite(value) ? Math.max(1000,Math.min(5000,value)) : 2500; }
export function CustomerEntry({ config, children, preview = false }: { config:PwaConfig; children:React.ReactNode; preview?:boolean }) {
  const {i18n} = useTranslation();
  const t=i18n.getFixedT((config.language || 'pt-BR').split('-')[0]);
  const name=productName(config.appName || document.title,config.language || 'pt-BR');
  const {isStandalone} = usePWAInstall();
  const completed = () => { try { return !preview && localStorage.getItem(entryStorageKey(name)) === 'done'; } catch { return false; } };
  const mode=preview && config.customerAccessMode === 'demo' ? 'demo' : 'open';
  const [step,setStep] = useState<'welcome'|'access'|'install'|'ready'>(()=>completed() ? 'ready' : config.welcomeEnabled === false ? (mode === 'demo' ? 'access' : 'ready') : 'welcome');
  const [splash,setSplash] = useState(!completed() && config.customSplash !== false);
  const [email,setEmail] = useState('');
  const [mediaFailed,setMediaFailed] = useState(false);
  const media=useMemo(()=>config.splashMediaMode === 'file' ? splashMediaSource(config.splashMediaData) : null,[config.splashMediaMode,config.splashMediaData]);
  useEffect(()=>setMediaFailed(false),[config.splashMediaMode,config.splashMediaData]);
  const color=config.themeColor || '#7c6fff';
  useEffect(()=>{ if(!splash)return; const timer=window.setTimeout(()=>setSplash(false),media?.kind === 'video' && !mediaFailed ? MAX_SPLASH_VIDEO_MS : splashDuration(config));return ()=>window.clearTimeout(timer); },[splash,config.splashDurationMs,media,mediaFailed]);
  useEffect(()=>{ if(step==='ready' && !splash && !preview){try{localStorage.setItem(entryStorageKey(name),'done');}catch{/* Content remains accessible without storage. */}} },[step,splash,preview,name]);
  const finish=()=>{ if(!preview){try{localStorage.setItem(entryStorageKey(name),'done');}catch{/* Continue when storage is unavailable. */}}setEmail('');setStep('ready'); };
  const next=finish;
  if(step==='ready' && !splash)return <>{children}</>;
  if(splash && media && !mediaFailed) return <div lang={config.language} className="customer-screen customer-media-screen" style={{background:/^#[a-f0-9]{6}$/i.test(config.splashMediaBackground || '') ? config.splashMediaBackground : '#f7f9fc'}}>
    <SplashArtwork source={media.source} kind={media.kind} name={name} fit={config.splashMediaFit === 'cover' ? 'cover' : 'contain'} onComplete={()=>setSplash(false)} onFailure={()=>setMediaFailed(true)}/>
    <div className="customer-media-actions"><button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} onClick={()=>setSplash(false)}>{t('experience.splashSkip')}</button></div>
  </div>;
  const brand=<div className="customer-brand">{config.logoBase64 || config.iconBase64 ? <img src={config.logoBase64 || config.iconBase64!} alt={name}/> : <div className="customer-monogram" style={{background:color,color:customerButtonTextColor(color)}}>{name.trim().charAt(0).toUpperCase()}</div>}</div>;
  return <div lang={config.language} className="customer-screen" style={{'--customer-accent':color} as React.CSSProperties}>
    <div className={`customer-card${splash ? ` customer-splash customer-splash-${config.splashAnimation === 'zoom' ? 'zoom' : config.splashAnimation === 'none' ? 'none' : 'fade'}` : ''}`}>
      {brand}
      {splash ? <><h1>{name}</h1><p>{productTagline(config) || t('experience.welcomeDescription')}</p><button className="customer-secondary" onClick={()=>setSplash(false)}>{t('experience.splashContinue')}</button></> : step==='welcome' ? <>
        <div className="customer-eyebrow">{t('experience.welcome')}</div>
        <h1>{name}</h1>
        <p>{productTagline(config) || t('experience.welcomeDescription')}</p>
        <div className="customer-note customer-benefit"><BookOpen size={24}/><span>{t('experience.benefit')}</span></div>
        <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} onClick={()=> mode==='demo' ? setStep('access') : next()}>{t('experience.start')}<ArrowRight size={20}/></button>
        {(!isStandalone || preview) && <button className="customer-secondary" onClick={()=>setStep('install')}>{t('experience.installInvite')}</button>}
      </> : step==='access' ? <>
        <div className="customer-eyebrow">{t('experience.demoLabel')}</div>
        <h1>{t('experience.accessTitle')}</h1>
        <p>{t('experience.accessDescription')}</p>
        <form onSubmit={event=>{event.preventDefault();next();}}>
          <label htmlFor="customer-demo-email">{t('experience.email')}</label>
          <div className="customer-input-wrap"><Mail size={20}/><input id="customer-demo-email" type="email" autoComplete="email" inputMode="email" placeholder={t('experience.emailPlaceholder')} value={email} onChange={event=>setEmail(event.target.value)} /></div>
          <p className="customer-note">{t('experience.demoNote')}</p>
          <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} type="submit">{t('experience.demoContinue')}<ArrowRight size={20}/></button>
        </form>
        <button className="customer-secondary" onClick={()=>setStep('welcome')}>{t('experience.back')}</button>
      </> : <InstallGuide t={t} name={name} color={color} onContinue={finish} preview={preview}/>}
    </div>
  </div>;
}
