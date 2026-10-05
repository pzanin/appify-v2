import { customerButtonTextColor } from '../utils/customerTheme';
import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PwaConfig } from '../types';
import { InstallGuide } from './InstallGuide';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function entryStorageKey(name:string) { return `appify-entry-v1:${window.location.pathname}:${name}`; }
export function CustomerEntry({ config, children, preview = false }: { config:PwaConfig; children:React.ReactNode; preview?:boolean }) {
  const {i18n} = useTranslation();
  const t=i18n.getFixedT((config.language || 'pt-BR').split('-')[0]);
  const name=config.appName || document.title;
  const {isStandalone} = usePWAInstall();
  const completed = () => { try { return !preview && localStorage.getItem(entryStorageKey(name)) === 'done'; } catch { return false; } };
  const [step,setStep] = useState<'welcome'|'access'|'install'|'ready'>(()=>completed() ? 'ready' : config.welcomeEnabled === false ? ((config.customerAccessMode || 'demo') === 'demo' ? 'access' : isStandalone ? 'ready' : 'install') : 'welcome');
  const [splash,setSplash] = useState(!preview && config.customSplash !== false);
  const [email,setEmail] = useState('');
  const color=config.themeColor || '#7c6fff';
  const mode=config.customerAccessMode || 'demo';
  useEffect(()=>{ if(!splash)return; const timer=window.setTimeout(()=>setSplash(false),650);return ()=>window.clearTimeout(timer); },[splash]);
  const finish=()=>{ if(!preview){try{localStorage.setItem(entryStorageKey(name),'done');}catch{/* Continue when storage is unavailable. */}}setEmail('');setStep('ready'); };
  const next=()=>{ if(isStandalone && !preview)finish(); else setStep('install'); };
  if(step==='ready' && !splash)return <>{children}</>;
  const brand=<div className="customer-brand">{config.logoBase64 || config.iconBase64 ? <img src={config.logoBase64 || config.iconBase64!} alt={name}/> : <div className="customer-monogram" style={{background:color,color:customerButtonTextColor(color)}}>{name.trim().charAt(0).toUpperCase()}</div>}</div>;
  return <div className="customer-screen" style={{'--customer-accent':color} as React.CSSProperties}>
    <div className="customer-card">
      {brand}
      {splash ? <><h1>{name}</h1><p role="status">{t('experience.loading')}</p></> : step==='welcome' ? <>
        <div className="customer-eyebrow">{t('experience.welcome')}</div>
        <h1>{name}</h1>
        <p>{config.tagline || t('experience.welcomeDescription')}</p>
        <div className="customer-note customer-benefit"><BookOpen size={24}/><span>{t('experience.benefit')}</span></div>
        <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} onClick={()=> mode==='demo' ? setStep('access') : next()}>{t('experience.start')}<ArrowRight size={20}/></button>
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
