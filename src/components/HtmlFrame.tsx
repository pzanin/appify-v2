import React, { useEffect, useRef, useState } from 'react';
import { prepareResponsiveHtml } from '../utils/htmlContent';
import { prepareInteractiveHtml } from '../utils/interactiveHtml';
import { openExternalLink } from '../utils/externalLinks';

type Props = Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'sandbox'> & { html: string; interactive?:boolean; activityPath?:string; onMaterialClick?:(targetId:string)=>void };
type VideoOverlay = { id:string; title:string; rect:{ top:number; left:number; width:number; height:number } };

export function HtmlFrame({ html, interactive=false, activityPath, onMaterialClick, className, style, ...props }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [activity,setActivity] = useState<{source:string;url?:string;error?:string} | null>(null);
  const [videoOverlay,setVideoOverlay] = useState<VideoOverlay | null>(null);
  const hasBuilderVideo = !interactive && html.includes('data-appify-youtube');

  useEffect(() => {
    setVideoOverlay(null);
  }, [html]);

  useEffect(() => {
    if (!interactive) return;
    let canceled=false;let url:string|undefined;
    const api=window.appifyDesktop?.content;
    setActivity(null);
    if(!api) {
      setActivity(/^pages\/lesson-\d+-\d+\.html$/.test(activityPath || '') ? {source:html,url:activityPath} : {source:html,error:'Abra esta prévia no Appify desktop. No PWA exportado, a atividade será carregada da pasta pages.'});
      return;
    }
    void prepareInteractiveHtml(html).then(async prepared=>{
      if(canceled)return;
      url=await api.create(prepared);
      if(canceled) { void api.release(url);return; }
      setActivity({source:html,url});
    }).catch(error=>{if(!canceled)setActivity({source:html,error:error instanceof Error?error.message:'Não foi possível preparar a atividade.'});});
    return ()=>{canceled=true;if(url){void api.release(url);}};
  }, [html,interactive,activityPath]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if(interactive) {
        if(event.data?.type==='appify:activity-error' && typeof event.data.message==='string') setActivity({source:html,error:`Erro na atividade: ${event.data.message.slice(0,160)}`});
        return;
      }
      if(event.data?.type === 'appify:youtube-play') {
        const id = typeof event.data.id === 'string' ? event.data.id : '';
        const title = typeof event.data.title === 'string' ? event.data.title.slice(0,120) : 'Vídeo';
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
  }, [interactive,html,onMaterialClick]);

  if(interactive && (!activity || activity.source!==html || activity.error)) return <div role="status" style={{padding:20,background:'#fff',color:'#333'}}>{activity?.source===html && activity.error ? activity.error : 'Preparando atividade…'}</div>;

  const innerFrame = (
    <iframe
      {...props}
      ref={frame}
      src={interactive?activity?.url:undefined}
      srcDoc={interactive?undefined:prepareResponsiveHtml(html)}
      sandbox="allow-scripts"
      referrerPolicy="strict-origin-when-cross-origin"
      className={hasBuilderVideo ? undefined : className}
      style={hasBuilderVideo ? { width:'100%', height:'100%', border:0, display:'block', background:'#fff' } : style}
    />
  );

  if(!hasBuilderVideo) return innerFrame;

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
