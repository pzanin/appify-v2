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
import { customerEntryStorageKey } from '../utils/customerStorage';
import { checkBuyerEntitlement, createBuyerAccessClient, fetchEntitledContent, requestBuyerEmailCode, verifyBuyerEmailCode } from '../services/buyerAccess';
import { ProtectedContentAssetsProvider } from './ProtectedContentAssets';
import { useAppStore } from '../store/useAppStore';
import type { LoadedProtectedContent } from '../utils/protectedContentRuntime';

export function entryStorageKey(name:string) { return `appify-entry-v1:${window.location.pathname}:${name}`; }
export function splashDuration(config:PwaConfig) { const value=Number(config.splashDurationMs ?? 2500); return Number.isFinite(value) ? Math.max(1000,Math.min(5000,value)) : 2500; }
export function CustomerEntry({ config, children, preview = false, projectId = null, onReady }: { config:PwaConfig; children:React.ReactNode; preview?:boolean; projectId?:number|null; onReady?:()=>void }) {
  const {i18n} = useTranslation();
  const t=i18n.getFixedT((config.language || 'pt-BR').split('-')[0]);
  const accessUnavailableMessage=t('experience.accessUnavailable');
  const buyerContentUnavailableMessage=t('experience.buyerContentUnavailable');
  const buyerCodeInvalidMessage=t('experience.buyerCodeInvalid');
  const name=productName(config.appName || document.title,config.language || 'pt-BR');
  const {isStandalone} = usePWAInstall();
  const storageKey=customerEntryStorageKey(config,preview,projectId);
  const completed = () => {
    try {
      if(localStorage.getItem(storageKey) === 'done') return true;
      if(!preview && localStorage.getItem(entryStorageKey(name)) === 'done') {
        localStorage.setItem(storageKey,'done');
        localStorage.removeItem(entryStorageKey(name));
        return true;
      }
      return false;
    } catch { return false; }
  };
  const mode=preview && config.customerAccessMode === 'demo' ? 'demo' : 'open';
  const requiresBuyerAccess = !preview && config.buyerAccessEnabled === true;
  const buyerBackendConfig = useMemo(() => ({
    productId: config.productId || '',
    supabaseUrl: config.buyerAccessSupabaseUrl || config.supabaseUrl,
    supabaseAnonKey: config.buyerAccessSupabaseAnonKey || config.supabaseAnonKey,
  }), [config.productId, config.buyerAccessSupabaseUrl, config.buyerAccessSupabaseAnonKey, config.supabaseUrl, config.supabaseAnonKey]);
  const buyerClient = useMemo(() => requiresBuyerAccess ? createBuyerAccessClient(buyerBackendConfig) : null,
    [requiresBuyerAccess, buyerBackendConfig]);
  const [step,setStep] = useState<'welcome'|'access'|'install'|'ready'|'buyer-email'|'buyer-code'|'buyer-loading'|'buyer-content-error'>(()=>requiresBuyerAccess ? 'buyer-email' : completed() ? 'ready' : config.welcomeEnabled === false ? (mode === 'demo' ? 'access' : 'ready') : 'welcome');
  const [splash,setSplash] = useState(!requiresBuyerAccess && !completed() && config.customSplash !== false);
  const [email,setEmail] = useState('');
  const [emailCode,setEmailCode] = useState('');
  const [buyerError,setBuyerError] = useState('');
  const [buyerAccountId,setBuyerAccountId] = useState<string | null>(null);
  const [protectedContent,setProtectedContent] = useState<LoadedProtectedContent | null>(null);
  const [mediaFailed,setMediaFailed] = useState(false);
  const media=useMemo(()=>config.splashMediaMode === 'file' ? splashMediaSource(config.splashMediaData) : null,[config.splashMediaMode,config.splashMediaData]);
  useEffect(()=>setMediaFailed(false),[config.splashMediaMode,config.splashMediaData]);
  const color=config.themeColor || '#7c6fff';
  useEffect(()=>{ if(!splash)return; const timer=window.setTimeout(()=>setSplash(false),media?.kind === 'video' && !mediaFailed ? MAX_SPLASH_VIDEO_MS : splashDuration(config));return ()=>window.clearTimeout(timer); },[splash,config.splashDurationMs,media,mediaFailed]);
  useEffect(()=>{
    if(!requiresBuyerAccess)return;
    let canceled=false;
    if(!buyerClient){setBuyerError(accessUnavailableMessage);return;}
    void buyerClient.auth.getSession().then(async ({data,error})=>{
      if(canceled)return;
      if(error || !data.session){setBuyerAccountId(null);setStep('buyer-email');return;}
      setBuyerAccountId(data.session.user.id);
      setStep('buyer-loading');
      try {
        const content=await fetchEntitledContent(buyerClient,buyerBackendConfig);
        if(canceled)return;
        setProtectedContent(content);
        const current=useAppStore.getState().pwaConfig;
        useAppStore.setState({modules:content.modules,feedPosts:content.feedPosts,pushNotifications:content.pushNotifications,pwaConfig:{...current,banners:content.banners,gamification:{...current.gamification,awardsConfig:content.gamificationAwards}}});
        setStep('ready');
      } catch(error) {
        if(canceled)return;
        if(error instanceof Error && error.message==='access_denied') {
          // A denied entitlement is cleared. Other errors keep the session for retry.
          await buyerClient.auth.signOut();
          setBuyerAccountId(null);
          setBuyerError(accessUnavailableMessage);
          setStep('buyer-email');
        } else {
          setBuyerError(buyerContentUnavailableMessage);
          setStep('buyer-content-error');
        }
      }
    }).catch(()=>{if(!canceled){setBuyerError(accessUnavailableMessage);setStep('buyer-email');}});
    return ()=>{canceled=true;};
  },[requiresBuyerAccess,buyerClient,buyerBackendConfig,accessUnavailableMessage,buyerContentUnavailableMessage]);
  useEffect(()=>{ if(step==='ready' && !splash){try{localStorage.setItem(storageKey,'done');}catch{/* Content remains accessible without storage. */}onReady?.();} },[step,splash,storageKey,onReady]);
  const finish=()=>{ try{localStorage.setItem(storageKey,'done');}catch{/* Continue when storage is unavailable. */}setEmail('');setStep('ready'); };
  const logoutBuyer=async()=>{
    if(!buyerClient)return;
    const {error}=await buyerClient.auth.signOut();
    if(error)throw new Error('logout_unavailable');
    setProtectedContent(null);setBuyerAccountId(null);setEmail('');setEmailCode('');setBuyerError('');
    useAppStore.setState(state=>({modules:[],feedPosts:[],pushNotifications:[],pwaConfig:{...state.pwaConfig,banners:[],gamification:{...state.pwaConfig.gamification,awardsConfig:[]}}}));
    setStep('buyer-email');
  };
  useEffect(()=>{
    if(!requiresBuyerAccess || !buyerClient || !protectedContent)return;
    let canceled=false;let checking=false;
    const closeAccess=async()=>{
      if(canceled || checking)return;
      checking=true;
      try {
        const {data}=await buyerClient.auth.getSession();
        if(!data.session) {
          if(!canceled) {
            setProtectedContent(null);
            setBuyerAccountId(null);
            useAppStore.setState(state=>({modules:[],feedPosts:[],pushNotifications:[],pwaConfig:{...state.pwaConfig,banners:[],gamification:{...state.pwaConfig.gamification,awardsConfig:[]}}}));
            setBuyerError(accessUnavailableMessage);setStep('buyer-email');
          }
          return;
        }
        const hasAccess=await checkBuyerEntitlement(buyerClient,config.productId || '');
        if(!hasAccess && !canceled) {
          await buyerClient.auth.signOut();setProtectedContent(null);setBuyerAccountId(null);setEmail('');
          useAppStore.setState(state=>({modules:[],feedPosts:[],pushNotifications:[],pwaConfig:{...state.pwaConfig,banners:[],gamification:{...state.pwaConfig.gamification,awardsConfig:[]}}}));
          setBuyerError(accessUnavailableMessage);setStep('buyer-email');
        }
      } catch { /* A temporary outage does not erase content from an already open session. */ }
      finally { checking=false; }
    };
    const onVisibility=()=>{if(document.visibilityState==='visible')void closeAccess();};
    window.addEventListener('focus',onVisibility);document.addEventListener('visibilitychange',onVisibility);
    const timer=window.setInterval(()=>void closeAccess(),15*60*1000);
    return ()=>{canceled=true;window.removeEventListener('focus',onVisibility);document.removeEventListener('visibilitychange',onVisibility);window.clearInterval(timer);};
  },[requiresBuyerAccess,buyerClient,protectedContent,config.productId,accessUnavailableMessage]);
  const next=finish;
  if(step==='ready' && !splash) return protectedContent
    ? <ProtectedContentAssetsProvider assets={protectedContent.assets} buyerAccountId={buyerAccountId || ''} onLogout={logoutBuyer}>{children}</ProtectedContentAssetsProvider>
    : <>{children}</>;
  if(splash && media && !mediaFailed) return <div lang={config.language} className="customer-screen customer-media-screen" style={{background:/^#[a-f0-9]{6}$/i.test(config.splashMediaBackground || '') ? config.splashMediaBackground : '#f7f9fc'}}>
    <SplashArtwork source={media.source} kind={media.kind} name={name} fit={config.splashMediaFit === 'cover' ? 'cover' : 'contain'} onComplete={()=>setSplash(false)} onFailure={()=>setMediaFailed(true)}/>
    <div className="customer-media-actions"><button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} onClick={()=>setSplash(false)}>{t('experience.splashSkip')}</button></div>
  </div>;
  const brand=<div className="customer-brand">{config.logoBase64 || config.iconBase64 ? <img src={config.logoBase64 || config.iconBase64!} alt={name}/> : <div className="customer-monogram" style={{background:color,color:customerButtonTextColor(color)}}>{name.trim().charAt(0).toUpperCase()}</div>}</div>;
  const sendBuyerCode=async()=>{
    if(!buyerClient){setBuyerError(accessUnavailableMessage);return;}
    setBuyerError('');setStep('buyer-loading');
    try { await requestBuyerEmailCode(buyerClient,email);setStep('buyer-code'); }
    catch { setBuyerError(accessUnavailableMessage);setStep('buyer-email'); }
  };
  const confirmBuyerCode=async()=>{
    if(!buyerClient){setBuyerError(accessUnavailableMessage);return;}
    setBuyerError('');setStep('buyer-loading');
    try {
      const accountId=await verifyBuyerEmailCode(buyerClient,email,emailCode);
      setBuyerAccountId(accountId);
      const content=await fetchEntitledContent(buyerClient,buyerBackendConfig);
      setProtectedContent(content);
      const current=useAppStore.getState().pwaConfig;
      useAppStore.setState({modules:content.modules,feedPosts:content.feedPosts,pushNotifications:content.pushNotifications,pwaConfig:{...current,banners:content.banners,gamification:{...current.gamification,awardsConfig:content.gamificationAwards}}});
      setEmailCode('');setStep('install');
    } catch(error) {
      if(error instanceof Error && (error.message==='invalid_code' || error.message==='verification_unavailable')) {
        setBuyerError(buyerCodeInvalidMessage);setStep('buyer-code');return;
      }
      if(error instanceof Error && error.message==='access_denied') {
        await buyerClient.auth.signOut();setBuyerAccountId(null);
        setBuyerError(accessUnavailableMessage);setStep('buyer-email');return;
      }
      // Keep a verified session so customers can retry loading without asking for another code.
      setBuyerError(buyerContentUnavailableMessage);setStep('buyer-content-error');
    }
  };
  const retryBuyerContent=async()=>{
    if(!buyerClient){setBuyerError(buyerContentUnavailableMessage);return;}
    setBuyerError('');setStep('buyer-loading');
    try {
      const content=await fetchEntitledContent(buyerClient,buyerBackendConfig);
      setProtectedContent(content);
      const current=useAppStore.getState().pwaConfig;
      useAppStore.setState({modules:content.modules,feedPosts:content.feedPosts,pushNotifications:content.pushNotifications,pwaConfig:{...current,banners:content.banners,gamification:{...current.gamification,awardsConfig:content.gamificationAwards}}});
      setEmailCode('');setStep('install');
    } catch(error) {
      if(error instanceof Error && error.message==='access_denied') {
        await buyerClient.auth.signOut();setBuyerAccountId(null);
        setBuyerError(accessUnavailableMessage);setStep('buyer-email');return;
      }
      setBuyerError(buyerContentUnavailableMessage);setStep('buyer-content-error');
    }
  };
  return <div lang={config.language} className="customer-screen" style={{'--customer-accent':color} as React.CSSProperties}>
    <div className={`customer-card${splash ? ` customer-splash customer-splash-${config.splashAnimation === 'zoom' ? 'zoom' : config.splashAnimation === 'none' ? 'none' : 'fade'}` : ''}`}>
      {brand}
      {splash ? <><h1>{name}</h1><p>{productTagline(config) || t('experience.welcomeDescription')}</p><button className="customer-secondary" onClick={()=>setSplash(false)}>{t('experience.splashContinue')}</button></> : step==='buyer-loading' ? <>
        <h1>{t('experience.loading')}</h1><p role="status">{t('experience.accessChecking')}</p>
      </> : step==='buyer-email' ? <>
        <div className="customer-eyebrow">{t('experience.accessTitle')}</div>
        <h1>{name}</h1>
        <p>{t('experience.buyerEmailDescription')}</p>
        <form onSubmit={event=>{event.preventDefault();void sendBuyerCode();}}>
          <label htmlFor="buyer-access-email">{t('experience.buyerEmailLabel')}</label>
          <div className="customer-input-wrap"><Mail size={20}/><input id="buyer-access-email" type="email" autoComplete="email" inputMode="email" required maxLength={254} placeholder={t('experience.emailPlaceholder')} value={email} onChange={event=>setEmail(event.target.value)} /></div>
          {buyerError && <p className="customer-note" role="alert">{buyerError}</p>}
          <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} type="submit">{t('experience.buyerContinue')}<ArrowRight size={20}/></button>
        </form>
      </> : step==='buyer-code' ? <>
        <div className="customer-eyebrow">{t('experience.accessTitle')}</div>
        <h1>{t('experience.buyerCodeTitle')}</h1>
        <p>{t('experience.buyerCodeDescription')}</p>
        <p className="customer-note">{t('experience.buyerCodeHint')}</p>
        <form onSubmit={event=>{event.preventDefault();void confirmBuyerCode();}}>
          <label htmlFor="buyer-access-code">{t('experience.buyerCodeLabel')}</label>
          <div className="customer-input-wrap"><input id="buyer-access-code" type="text" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6,8}" maxLength={8} required value={emailCode} onChange={event=>setEmailCode(event.target.value.replace(/[^0-9]/g,'').slice(0,8))} /></div>
          {buyerError && <p className="customer-note" role="alert">{buyerError}</p>}
          <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} type="submit">{t('experience.buyerVerify')}<ArrowRight size={20}/></button>
        </form>
        <button className="customer-secondary" onClick={()=>{setEmailCode('');setStep('buyer-email');}}>{t('experience.back')}</button>
      </> : step==='buyer-content-error' ? <>
        <div className="customer-eyebrow">{t('experience.accessTitle')}</div>
        <h1>{t('experience.buyerContentErrorTitle')}</h1>
        <p role="alert">{buyerError || buyerContentUnavailableMessage}</p>
        <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} onClick={()=>void retryBuyerContent()}>{t('experience.buyerRetry')}<ArrowRight size={20}/></button>
        <button className="customer-secondary" onClick={()=>void logoutBuyer()}>{t('experience.buyerUseAnotherEmail')}</button>
      </> : step==='welcome' ? <>
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
