import React, { useEffect, useRef } from 'react';
import { prepareResponsiveHtml } from '../utils/htmlContent';
import { openExternalLink } from '../utils/externalLinks';

export function HtmlFrame({ html, ...props }: Omit<React.IframeHTMLAttributes<HTMLIFrameElement>, 'src' | 'srcDoc' | 'sandbox'> & { html: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.type !== 'appify:external-link') return;
      openExternalLink(event.data.url);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return <iframe {...props} ref={frame} srcDoc={prepareResponsiveHtml(html)} sandbox="allow-scripts" referrerPolicy="no-referrer" />;
}
