import React, { useEffect, useRef, useState } from 'react';
import { buildSandboxDocument, iframeSandboxPermissions } from '../utils/interactiveHtml';

interface InteractiveHtmlFrameProps {
  html: string;
  minHeight?: number;
  className?: string;
  title?: string;
}

export function InteractiveHtmlFrame({
  html,
  minHeight = 320,
  className,
  title = 'Conteúdo interativo',
}: InteractiveHtmlFrameProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [height, setHeight] = useState(minHeight);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!event.data || event.data.type !== 'appify:sandbox-height') return;

      const nextHeight = Number(event.data.height);
      if (!Number.isFinite(nextHeight)) return;
      setHeight(Math.max(minHeight, Math.min(nextHeight, 5000)));
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [minHeight]);

  return (
    <iframe
      ref={frameRef}
      className={className}
      title={title}
      srcDoc={buildSandboxDocument(html)}
      sandbox={iframeSandboxPermissions('sandbox')}
      referrerPolicy="no-referrer"
      style={{
        width: '100%',
        height: `${height}px`,
        border: 0,
        display: 'block',
        background: '#fff',
      }}
    />
  );
}
