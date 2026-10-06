import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CarouselItem } from '../types';

interface CarouselBlockProps {
  items: CarouselItem[];
  autoplay?: boolean;
  intervalMs?: number;
  showDots?: boolean;
  showArrows?: boolean;
  aspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
}

const ratioMap = { '16:9': '16 / 9', '4:3': '4 / 3', '1:1': '1 / 1', '9:16': '9 / 16' } as const;

export function CarouselBlock({ items, autoplay = false, intervalMs = 5000, showDots = true, showArrows = true, aspectRatio = '16:9' }: CarouselBlockProps) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!autoplay || items.length < 2) return;
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % items.length), Math.max(2000, intervalMs));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay, intervalMs, items.length]);

  if (!items?.length) return null;
  const current = items[Math.min(index, items.length - 1)];
  const go = (dir: number) => setIndex(i => (i + dir + items.length) % items.length);

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', background: 'rgba(127,127,127,.08)', aspectRatio: ratioMap[aspectRatio] }}>
        {current.image ? <img src={current.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : null}
        {(current.title || current.text || current.buttonText) && (
          <div style={{ position: 'absolute', inset: 'auto 0 0', padding: '40px 18px 18px', background: 'linear-gradient(transparent, rgba(0,0,0,.72))', color: 'white' }}>
            {current.title && <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>{current.title}</h3>}
            {current.text && <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, opacity: .9 }}>{current.text}</p>}
            {current.buttonText && current.buttonUrl && <a href={current.buttonUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, color: 'white', fontWeight: 700, fontSize: 12 }}>{current.buttonText}</a>}
          </div>
        )}
        {showArrows && items.length > 1 && <>
          <button type="button" aria-label="Anterior" onClick={() => go(-1)} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 999, border: 0, background: 'rgba(0,0,0,.45)', color: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><ChevronLeft size={18} /></button>
          <button type="button" aria-label="Próximo" onClick={() => go(1)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: 999, border: 0, background: 'rgba(0,0,0,.45)', color: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><ChevronRight size={18} /></button>
        </>}
      </div>
      {showDots && items.length > 1 && <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>{items.map((item, i) => <button key={item.id} aria-label={`Ir para slide ${i + 1}`} onClick={() => setIndex(i)} style={{ width: i === index ? 18 : 7, height: 7, borderRadius: 999, border: 0, padding: 0, background: 'currentColor', opacity: i === index ? .8 : .25, cursor: 'pointer' }} />)}</div>}
    </div>
  );
}
