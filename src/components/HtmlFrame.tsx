import React, { useEffect, useRef, useState } from 'react';
import { prepareResponsiveHtml } from '../utils/htmlContent';
import { prepareInteractiveHtml } from '../utils/interactiveHtml';
import { openExternalLink } from '../utils/externalLinks';

type Props = Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'sandbox'> & { html: string; interactive?:boolean; activityPath?:string };
export function HtmlFrame({ html, interactive=false, activityPath, ...props }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [activity,setActivity] = useState<{source:string;url?:string;error?:string} | null>(null);
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
      if(event.data?.type !== 'appify:external-link') return;
      openExternalLink(event.data.url);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [interactive,html]);
  if(interactive && (!activity || activity.source!==html || activity.error)) return <div role="status" style={{padding:20,background:'#fff',color:'#333'}}>{activity?.source===html && activity.error ? activity.error : 'Preparando atividade…'}</div>;
  return <iframe {...props} ref={frame} src={interactive?activity?.url:undefined} srcDoc={interactive?undefined:prepareResponsiveHtml(html)} sandbox="allow-scripts" referrerPolicy="strict-origin-when-cross-origin" />;
}
