import React from 'react';
import { CardItem, CardLayout } from '../types';

interface CardsBlockProps {
  items: CardItem[];
  layout?: CardLayout;
  columns?: 1 | 2 | 3;
  gap?: number;
  borderRadius?: number;
}

export function CardsBlock({ items, layout = 'grid', columns = 2, gap = 16, borderRadius = 14 }: CardsBlockProps) {
  if (!items?.length) return null;

  if (layout === 'horizontal') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap }}>
        {items.map(item => (
          <article key={item.id} style={{ display: 'grid', gridTemplateColumns: item.image ? '112px 1fr' : '1fr', gap: 14, padding: 14, border: '1px solid rgba(127,127,127,.2)', borderRadius, overflow: 'hidden' }}>
            {item.image && <img src={item.image} alt="" style={{ width: '112px', height: '88px', objectFit: 'cover', borderRadius: Math.max(8, borderRadius - 4) }} />}
            <div>
              {item.badge && <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, opacity: .7, marginBottom: 6 }}>{item.badge}</span>}
              <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, opacity: .8 }}>{item.text}</p>
              {item.buttonText && item.buttonUrl && <a href={item.buttonUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, fontWeight: 700 }}>{item.buttonText}</a>}
            </div>
          </article>
        ))}
      </div>
    );
  }

  const compact = layout === 'compact';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }}>
      {items.map(item => (
        <article key={item.id} style={{ border: '1px solid rgba(127,127,127,.2)', borderRadius, overflow: 'hidden', minWidth: 0 }}>
          {item.image && <img src={item.image} alt="" style={{ width: '100%', aspectRatio: compact ? '16 / 9' : '4 / 3', objectFit: 'cover', display: 'block' }} />}
          <div style={{ padding: compact ? 12 : 16 }}>
            {item.badge && <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, opacity: .7, marginBottom: 6 }}>{item.badge}</span>}
            <h3 style={{ margin: '0 0 6px', fontSize: compact ? 14 : 16 }}>{item.title}</h3>
            <p style={{ margin: 0, fontSize: compact ? 12 : 13, lineHeight: 1.55, opacity: .8 }}>{item.text}</p>
            {item.buttonText && item.buttonUrl && <a href={item.buttonUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 12, fontWeight: 700 }}>{item.buttonText}</a>}
          </div>
        </article>
      ))}
    </div>
  );
}
