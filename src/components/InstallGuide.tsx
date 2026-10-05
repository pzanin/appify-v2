import { customerButtonTextColor } from '../utils/customerTheme';
import React, { useState } from 'react';
import { Smartphone, Share, MoreVertical, CheckCircle, Download } from 'lucide-react';
import type { TFunction } from 'i18next';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function InstallGuide({ t, name, color, onContinue, preview = false }: { t:TFunction; name:string; color:string; onContinue:()=>void; preview?:boolean }) {
  const { isInstallAvailable, isStandalone, platform, triggerInstall, isInstalling } = usePWAInstall();
  const [result,setResult] = useState('');
  const [showHelp,setShowHelp] = useState(false);
  const native = !preview && isInstallAvailable && !showHelp;
  const steps = platform === 'ios'
    ? [t('experience.install.ios1'),t('experience.install.ios2'),t('experience.install.ios3')]
    : platform === 'embedded'
    ? [t('experience.install.embedded1'),t('experience.install.embedded2')]
    : platform === 'desktop'
    ? [t('experience.install.desktop1'),t('experience.install.desktop2')]
    : [t('experience.install.android1'),t('experience.install.android2'),t('experience.install.android3')];
  const install = async () => {
    const outcome = await triggerInstall();
    setResult(outcome);
    if (outcome === 'failed' || outcome === 'unavailable') setShowHelp(true);
  };
  return <section className="customer-install" aria-labelledby="install-guide-title">
    <div className="customer-symbol">{isStandalone ? <CheckCircle size={36}/> : <Smartphone size={36}/>}</div>
    <h2 id="install-guide-title">{isStandalone ? t('experience.install.done') : t('experience.install.title')}</h2>
    <p>{isStandalone ? t('experience.install.doneDescription',{name}) : t('experience.install.description',{name})}</p>
    {preview && <p className="customer-note">{t('experience.install.preview')}</p>}
    {!isStandalone && <>
      {native ? <div className="customer-note">{t('experience.install.nativeHelp')}</div> : result !== 'accepted' && <ol className="customer-steps">{steps.map((step,index)=><li key={index}><span>{index+1}</span><div>{step}</div>{index===0 && (platform==='ios' ? <Share size={20}/> : <MoreVertical size={20}/>)}</li>)}</ol>}
      {result === 'accepted' && <p role="status" className="customer-note">{t('experience.install.accepted')}</p>}
      {result === 'dismissed' && <p role="status" className="customer-note">{t('experience.install.dismissed')}</p>}
      {result === 'failed' && <p role="status" className="customer-note">{t('experience.install.failed')}</p>}
      {native && <button className="customer-primary" style={{background:color,color:customerButtonTextColor(color)}} disabled={isInstalling} onClick={()=>void install()}><Download size={20}/>{t(isInstalling?'experience.install.wait':'experience.install.button')}</button>}
      {native && <button className="customer-secondary" onClick={()=>setShowHelp(true)}>{t('experience.install.manual')}</button>}
    </>}
    <button className={isStandalone ? 'customer-primary' : 'customer-secondary'} style={isStandalone ? {background:color,color:customerButtonTextColor(color)} : undefined} onClick={onContinue}>{t(isStandalone?'experience.continue':'experience.install.skip')}</button>
    {!isStandalone && <p className="customer-footnote">{t('experience.install.optional')}</p>}
  </section>;
}
