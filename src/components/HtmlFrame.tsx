import React, { useEffect, useRef, useState } from 'react';
import { prepareResponsiveHtml } from '../utils/htmlContent';
import { prepareInteractiveHtml } from '../utils/interactiveHtml';
import { readActivityData, writeActivityData } from '../utils/activityStorage';
import { useTranslation } from 'react-i18next';
import { openExternalLink } from '../utils/externalLinks';

type Props = Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'sandbox'> & { html: string; interactive?:boolean; activityPath?:string; storageKey?:string; uiLanguage?:string; onMaterialClick?:(targetId:string)=>void };
type VideoOverlay = { id:string; title:string; rect:{ top:number; left:number; width:number; height:number } };

export function HtmlFrame({ html, interactive=false, activityPath, storageKey, uiLanguage, onMaterialClick, className, style, ...props }: Props) {
  const {i18n}=useTranslation();
  const t=i18n.getFixedT((uiLanguage || i18n.language).split('-')[0]);
  const [storageRevision,setStorageRevision]=useState(0);
  const [storageFailed,setStorageFailed]=useState(false);
  const storageError=({pt:'Não foi possível salvar o histórico neste aparelho. Verifique o espaço disponível e as permissões do navegador.',en:'Could not save history on this device. Check available space and browser permissions.',es:'No se pudo guardar el historial en este dispositivo. Revisa el espacio disponible y los permisos del navegador.',fr:"Impossible d’enregistrer l’historique sur cet appareil. Vérifiez l’espace disponible et les autorisations du navigateur."} as Record<string,string>)[(uiLanguage || i18n.language)?.split('-')[0]] || 'Could not save history on this device.';
  const storageReady=useRef(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const [activity,setActivity] = useState<{source:string;url?:string;error?:string} | null>(null);
  const [videoOverlay,setVideoOverlay] = useState<VideoOverlay | null>(null);
  const hasBuilderVideo = !interactive && html.includes('data-appify-youtube');

  useEffect(() => {
    setVideoOverlay(null);setStorageFailed(false);storageReady.current=false;
  }, [html,storageKey,storageRevision]);

  useEffect(() => {
    if (!interactive) return;
    let canceled=false;let url:string|undefined;
    const api=window.appifyDesktop?.content;
    setActivity(null);
    if(!api) {
      setActivity(/^pages\/lesson-\d+-\d+\.html$/.test(activityPath || '') ? {source:html,url:activityPath} : {source:html,error:t('app.errors.activityDesktop')});
      return;
    }
    void prepareInteractiveHtml(html).then(async prepared=>{
      if(canceled)return;
      url=await api.create(prepared);
      if(canceled) { void api.release(url);return; }
      setActivity({source:html,url});
    }).catch(()=>{if(!canceled)setActivity({source:html,error:t('app.errors.activityUnavailable')});});
    return ()=>{canceled=true;if(url){void api.release(url);}};
  }, [html,interactive,activityPath,uiLanguage]);

  useEffect(() => {
    let writes=0;let reads=0;let windowStart=Date.now();
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if(interactive) {
        const message=event.data;
        if(message?.type==='appify:storage-init') {
          try {
            if(!storageKey || ++reads>20)throw Error('Missing scope');
            const data=readActivityData(window.localStorage,storageKey);storageReady.current=true;
            frame.current?.contentWindow?.postMessage({type:'appify:storage-ready',data},'*');
          } catch {
            storageReady.current=false;setStorageFailed(true);
            frame.current?.contentWindow?.postMessage({type:'appify:storage-ready',data:{}},'*');
          }
        }
        if(message?.type==='appify:storage-write' && Number.isSafeInteger(message.id) && message.id>0) {
          let ok=false;
          try {
            if(Date.now()-windowStart>1000){writes=0;windowStart=Date.now();}
            if(!storageKey || !storageReady.current || ++writes>30)throw Error('Storage unavailable');
            writeActivityData(window.localStorage,storageKey,message.data);ok=true;
          } catch {setStorageFailed(true);}
          frame.current?.contentWindow?.postMessage({type:'appify:storage-result',id:message.id,ok},'*');
        }
        if(['appify:storage-unavailable','appify:storage-failure'].includes(message?.type))setStorageFailed(true);
        if(event.data?.type==='appify:activity-error' && typeof event.data.message==='string') setActivity({source:html,error:t('app.errors.activityError',{message:event.data.message.slice(0,160)})});
        return;
      }
      if(event.data?.type === 'appify:youtube-play') {
        const id = typeof event.data.id === 'string' ? event.data.id : '';
        const title = typeof event.data.title === 'string' ? event.data.title.slice(0,120) : t('app.media.video');
        const rect = event.data.rect;
        const validRect = rect && [rect.top,rect.left,rect.width,rect.height].every((value:unknown)=>typeof value==='number' && Number.isFinite(value));
        if(/^[A-Za-z0-9_-]{6,}$/.test(id) && validRect && rect.width > 0 && rect.height > 0) {
          setVideoOverlay({ id, title, rect });
        }
        return;
      }
      if(event.data?.type !== 'appify:external-link') return;
      const url = typeof event.data.url === 'string' ? event.data.url : '';
      const doc = new DOMParser().parseFromString(html,'text/html');
      const material = [...doc.querySelectorAll('a[data-appify-material]')].find(link => link.getAttribute('href') === url);
      const targetId = material?.getAttribute('data-appify-material') || '';
      if (/^[a-zA-Z0-9._:-]{1,80}$/.test(targetId) && /^https:\/\//.test(url)) onMaterialClick?.(targetId);
      openExternalLink(url);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [interactive,html,storageKey,storageRevision,onMaterialClick,uiLanguage]);

  if(interactive && (!activity || activity.source!==html || activity.error)) return <div role="status" style={{padding:20,background:'#fff',color:'#333'}}>{activity?.source===html && activity.error ? activity.error : t('app.errors.activityPreparing')}</div>;

  const locale=(uiLanguage || i18n.language)?.split('-')[0];
  const resetText=({pt:'Limpar histórico desta atividade',en:'Clear this activity’s history',es:'Borrar el historial de esta actividad',fr:'Effacer l’historique de cette activité'} as Record<string,string>)[locale] || 'Clear this activity’s history';
  const resetHistory=()=>{
    if(!storageKey || !window.confirm(`${resetText}?`))return;
    try {window.localStorage.removeItem(storageKey);setStorageFailed(false);setStorageRevision(value=>value+1);}catch{setStorageFailed(true);}
  };
  const innerFrame = (
    <iframe
      {...props}
      key={`${storageKey || ""}:${storageRevision}:${html}`}
      ref={frame}
      src={interactive?activity?.url:undefined}
      srcDoc={interactive?undefined:prepareResponsiveHtml(html,uiLanguage || i18n.language)}
      sandbox="allow-scripts"
      referrerPolicy="strict-origin-when-cross-origin"
      className={hasBuilderVideo || interactive ? undefined : className}
      style={hasBuilderVideo || interactive ? { width:'100%', height:'100%', border:0, display:'block', background:'#fff' } : style}
    />
  );

  if(!hasBuilderVideo) return interactive ? <div className={className} style={{flex:1,minHeight:0,width:'100%',...style,display:'flex',flexDirection:'column'}}>{storageKey && /\blocalStorage\b/.test(html) && <button type="button" onClick={resetHistory} style={{padding:6,fontSize:12,background:'#fff',color:'#555',border:0,textAlign:'right',cursor:'pointer'}}>{resetText}</button>}<div hidden={!storageFailed} role="alert" style={{padding:8,background:'#fff3cd',color:'#574200',fontSize:13}}>{storageError}</div><div style={{flex:1,minHeight:0,position:'relative'}}>{innerFrame}</div></div> : innerFrame;

  return (
    <div className={className} style={{ ...style, position: style?.position || 'relative', overflow:'hidden' }}>
      {innerFrame}
      {videoOverlay && (
        <div style={{
          position:'absolute',
          top:videoOverlay.rect.top,
          left:videoOverlay.rect.left,
          width:videoOverlay.rect.width,
          height:videoOverlay.rect.height,
          zIndex:5,
          background:'#000',
          overflow:'hidden'
        }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoOverlay.id}?autoplay=1&controls=1&playsinline=1&rel=0&fs=1`}
            title={videoOverlay.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ width:'100%', height:'100%', border:0, display:'block', background:'#000' }}
          />
        </div>
      )}
    </div>
  );
}
