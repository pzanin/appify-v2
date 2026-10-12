import { productTagline, productName } from '../utils/productCopy';
import { customerButtonTextColor } from '../utils/customerTheme';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BookOpen, KeyRound, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PwaConfig } from '../types';
import { InstallGuide } from './InstallGuide';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { MAX_SPLASH_VIDEO_MS, splashMediaSource } from '../utils/splashMedia';
import { SplashArtwork } from './SplashArtwork';
import { customerAuthIsEnabled, readCustomerSession, requestCustomerOtp, verifyCustomerOtp } from '../services/customerAuth';

export function entryStorageKey(name:string) { return `appify-entry-v1:${window.location.pathname}:${name}`; }
export function splashDuration(config:PwaConfig) { const value=Number(config.splashDurationMs ?? 2500); return Number.isFinite(value) ? Math.max(1000,Math.min(5000,value)) : 2500; }

type EntryStep = 'checking'|'welcome'|'access'|'verify'|'install'|'ready';

export function CustomerEntry({ config, children, preview = false }: { config:PwaConfig; children:React.ReactNode; preview?:boolean }) {
  const {i18n} = useTranslation();
  const t=i18n.getFixedT((config.language || 'pt-BR').split('-')[0]);
  const name=productName(config.appName || document.title,config.language || 'pt-BR');
  const {isStandalone} = usePWAInstall();
  const authEnabled=customerAuthIsEnabled(config);
  const completed = () => { try { return !preview && !authEnabled && localStorage.getItem(entryStorageKey(name)) === 'done'; } catch { return false; } };
  const demoMode=preview && !authEnabled && config.customerAccessMode === 'demo';
  const initialStep=():EntryStep=>{
    if(authEnabled && !preview)return 'checking';
    if(completed())return 'ready';
    if(config.welcomeEnabled === false)return authEnabled || demoMode ? 'access' : 'ready';
    return 'welcome';
  };
  const [step,setStep] = useState<EntryStep>(initialStep);
  const [splash,setSplash] = useState(!completed() && config.customSplash !== false);
  const [email,setEmail] = useState('');
  const [otp,setOtp] = useState('');
  const [busy,setBusy] = useState(false);
  const [authError,setAuthError] = useState('');
  const [mediaFailed,setMediaFailed] = useState(false);
  const media=useMemo(()=>config.splashMediaMode === 'file' ? splashMediaSource(config.splashMediaData) : null,[config.splashMediaMode,config.splashMediaData]);
  useEffect(()=>setMediaFailed(false),[config.splashMediaMode,config.splashMediaData]);
  const color=config.themeColor || '#7c6fff';

  useEffect(()=>{ if(!splash)return; const timer=window.setTimeout(()=>setSplash(false),media?.kind === 'video' && !mediaFailed ? MAX_SPLASH_VIDEO_MS : splashDuration(config));return ()=>window.clearTimeout(timer); },[splash,config.splashDurationMs,media,mediaFailed]);

  useEffect(()=>{
    let active=true;
    if(!authEnabled || preview)return;
    void readCustomerSession(config).then(result=>{
      if(!active)return;
      if(result.ok && result.session){
        setSplash(false);
        setStep('ready');
      } else {
        setStep(config.welcomeEnabled === false ? 'access' : 'welcome');
      }
    });
    return()=>{active=false;};
  },[authEnabled,preview,config.backendProvider,config.supabaseUrl,config.supabasePublishableKey,config.supabaseAnonKey,config.productId,config.appName,config.welcomeEnabled]);

  useEffect(()=>{ if(step==='ready' && !splash && !preview && !authEnabled){try{localStorage.setItem(entryStorageKey(name),'done');}catch{/* Content remains accessible without storage. */}} },[step,splash,preview,name,authEnabled]);

  const finish=()=>{
    if(!preview && !authEnabled){try{localStorage.setItem(entryStorageKey(name),'done');}catch{/* Continue when storage is unavailable. */}}
    setOtp('');
    setAuthError('');
    setStep('ready');
  };

  const requestCode=async()=>{
    const normalized=email.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(normalized)){setAuthError(t('experience.authEmailError'));return;}
    setAuthError('');
    if(preview){setStep('verify');return;}
    setBusy(true);
    const result=await requestCustomerOtp(config,normalized);
    setBusy(false);
    if(!result.ok){setAuthError(t('experience.authRequestError'));return;}
    setEmail(normalized);
    setStep('verify');
  };

  const verifyCode=async()=>{
    const code=otp.replace(/\D/g,'');
    if(code.length<6){setAuthError(t('experience.authCodeError'));return;}
    setAuthError('');
    if(preview){finish();return;}
    setBusy(true);
    const result=await verifyCustomerOtp(config,email,code);
    setBusy(false);
    if(!result.ok){setAuthError(t('experience.authVerifyError'));return;}
    finish();
  };

  const afterInstall=()=>authEnabled || demoMode ? setStep('access') : finish();

  if(step==='ready' && !splash)return <>{children}</>;
  if(splash && media && !mediaFailed) return <div lang={config.language} className="customer-screen customer-media-screen" style={{background:/^#[a-f0-9]{6}$/i.test(config.splashMediaBackground || '') ? config.splashMediaBackground : '#f7f9fc'}}>
    <SplashArtwork source={media.source} kind={media.kind} name={name} fit={config.splashMediaFit === 'cover' ? 'cover' : 'contain'} onComplete={()=>setSplash(false)} onFailure={()=>setMediaFailed(true)}/>
    <div className="customer-media-actions"><button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} onClick={()=>setSplash(false)}>{t('experience.splashSkip')}</button></div>
  </div>;

  const brand=<div className="customer-brand">{config.logoBase64 || config.iconBase64 ? <img src={config.logoBase64 || config.iconBase64!} alt={name}/> : <div className="customer-monogram" style={{background:color,color:customerButtonTextColor(color)}}>{name.trim().charAt(0).toUpperCase()}</div>}</div>;

  return <div lang={config.language} className="customer-screen" style={{'--customer-accent':color} as React.CSSProperties}>
    <div className={`customer-card${splash ? ` customer-splash customer-splash-${config.splashAnimation === 'zoom' ? 'zoom' : config.splashAnimation === 'none' ? 'none' : 'fade'}` : ''}`}>
      {brand}
      {splash ? <><h1>{name}</h1><p>{productTagline(config) || t('experience.welcomeDescription')}</p><button className="customer-secondary" onClick={()=>setSplash(false)}>{t('experience.splashContinue')}</button></>
      : step==='checking' ? <><h1>{name}</h1><p role="status">{t('experience.authChecking')}</p></>
      : step==='welcome' ? <>
        <div className="customer-eyebrow">{t('experience.welcome')}</div>
        <h1>{name}</h1>
        <p>{productTagline(config) || t('experience.welcomeDescription')}</p>
        <div className="customer-note customer-benefit"><BookOpen size={24}/><span>{t('experience.benefit')}</span></div>
        <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} onClick={()=> authEnabled || demoMode ? setStep('access') : finish()}>{t('experience.start')}<ArrowRight size={20}/></button>
        {(!isStandalone || preview) && <button className="customer-secondary" onClick={()=>setStep('install')}>{t('experience.installInvite')}</button>}
      </>
      : step==='access' ? <>
        <div className="customer-eyebrow">{authEnabled ? t('experience.authLabel') : t('experience.demoLabel')}</div>
        <h1>{authEnabled ? t('experience.authTitle') : t('experience.accessTitle')}</h1>
        <p>{authEnabled ? t('experience.authDescription') : t('experience.accessDescription')}</p>
        <form onSubmit={event=>{event.preventDefault();if(authEnabled)void requestCode();else finish();}}>
          <label htmlFor="customer-access-email">{authEnabled ? t('experience.authEmail') : t('experience.email')}</label>
          <div className="customer-input-wrap"><Mail size={20}/><input id="customer-access-email" type="email" autoComplete="email" inputMode="email" required={authEnabled} placeholder={t('experience.emailPlaceholder')} value={email} onChange={event=>{setEmail(event.target.value);setAuthError('');}} /></div>
          <p className="customer-note">{authEnabled ? (preview ? t('experience.authPreviewNote') : t('experience.authNote')) : t('experience.demoNote')}</p>
          {authError && <p role="alert" className="customer-note">{authError}</p>}
          <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} type="submit" disabled={busy}>{busy ? t('experience.authSending') : authEnabled ? t('experience.authSendCode') : t('experience.demoContinue')}<ArrowRight size={20}/></button>
        </form>
        {config.welcomeEnabled !== false && <button className="customer-secondary" onClick={()=>{setAuthError('');setStep('welcome');}}>{t('experience.back')}</button>}
      </>
      : step==='verify' ? <>
        <div className="customer-eyebrow">{t('experience.authLabel')}</div>
        <h1>{t('experience.authCodeTitle')}</h1>
        <p>{t('experience.authCodeDescription',{email})}</p>
        <form onSubmit={event=>{event.preventDefault();void verifyCode();}}>
          <label htmlFor="customer-access-code">{t('experience.authCodeLabel')}</label>
          <div className="customer-input-wrap"><KeyRound size={20}/><input id="customer-access-code" type="text" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*" maxLength={8} required placeholder={t('experience.authCodePlaceholder')} value={otp} onChange={event=>{setOtp(event.target.value.replace(/\D/g,'').slice(0,8));setAuthError('');}} /></div>
          {preview && <p className="customer-note">{t('experience.authPreviewCodeNote')}</p>}
          {authError && <p role="alert" className="customer-note">{authError}</p>}
          <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} type="submit" disabled={busy}>{busy ? t('experience.authVerifying') : t('experience.authVerify')}<ArrowRight size={20}/></button>
        </form>
        <button className="customer-secondary" disabled={busy} onClick={()=>{setOtp('');setAuthError('');void requestCode();}}>{t('experience.authResend')}</button>
        <button className="customer-secondary" onClick={()=>{setOtp('');setAuthError('');setStep('access');}}>{t('experience.authChangeEmail')}</button>
      </>
      : <InstallGuide t={t} name={name} color={color} onContinue={afterInstall} preview={preview}/>} 
    </div>
  </div>;
}
