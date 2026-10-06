import React from 'react';
import { AdvancedLayout } from '../types';

interface AdvancedLayoutBlockProps {
  layout: AdvancedLayout;
  title?: string;
  text?: string;
  image?: string;
  eyebrow?: string;
  buttonText?: string;
  buttonUrl?: string;
  gap?: number;
  reverseMobile?: boolean;
}

export function AdvancedLayoutBlock({ layout, title, text, image, eyebrow, buttonText, buttonUrl, gap = 20, reverseMobile = false }: AdvancedLayoutBlockProps) {
  if (layout === 'highlight-band') {
    return (
      <section style={{ padding: 24, borderRadius: 16, border: '1px solid rgba(127,127,127,.18)', background: 'linear-gradient(135deg, rgba(127,127,127,.08), rgba(127,127,127,.02))' }}>
        {eyebrow && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .6, marginBottom: 8 }}>{eyebrow}</div>}
        {title && <h2 style={{ margin: '0 0 8px', fontSize: 24, lineHeight: 1.15 }}>{title}</h2>}
        {text && <p style={{ margin: 0, lineHeight: 1.65, opacity: .82 }}>{text}</p>}
        {buttonText && buttonUrl && <a href={buttonUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 14, fontWeight: 700 }}>{buttonText}</a>}
      </section>
    );
  }

  if (layout === 'media-stack') {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', gap }}>
        {image && <img src={image} alt="" style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 16, display: 'block' }} />}
        <div>
          {eyebrow && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .6, marginBottom: 8 }}>{eyebrow}</div>}
          {title && <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>{title}</h2>}
          {text && <p style={{ margin: 0, lineHeight: 1.65, opacity: .82 }}>{text}</p>}
          {buttonText && buttonUrl && <a href={buttonUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 14, fontWeight: 700 }}>{buttonText}</a>}
        </div>
      </section>
    );
  }

  if (layout === 'masonry-lite') {
    return (
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap, alignItems: 'stretch' }}>
        <div style={{ padding: 22, borderRadius: 16, border: '1px solid rgba(127,127,127,.18)' }}>
          {eyebrow && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .6, marginBottom: 8 }}>{eyebrow}</div>}
          {title && <h2 style={{ margin: '0 0 8px', fontSize: 24 }}>{title}</h2>}
          {text && <p style={{ margin: 0, lineHeight: 1.65, opacity: .82 }}>{text}</p>}
        </div>
        {image ? <img src={image} alt="" style={{ width: '100%', height: '100%', minHeight: 220, objectFit: 'cover', borderRadius: 16, display: 'block' }} /> : <div style={{ borderRadius: 16, background: 'rgba(127,127,127,.08)', minHeight: 220 }} />}
      </section>
    );
  }

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap, alignItems: 'center' }} data-reverse-mobile={reverseMobile ? 'true' : 'false'}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .6, marginBottom: 8 }}>{eyebrow}</div>}
        {title && <h2 style={{ margin: '0 0 8px', fontSize: 26, lineHeight: 1.15 }}>{title}</h2>}
        {text && <p style={{ margin: 0, lineHeight: 1.65, opacity: .82 }}>{text}</p>}
        {buttonText && buttonUrl && <a href={buttonUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 14, fontWeight: 700 }}>{buttonText}</a>}
      </div>
      {image ? <img src={image} alt="" style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 16, display: 'block' }} /> : <div style={{ aspectRatio: '4 / 3', borderRadius: 16, background: 'rgba(127,127,127,.08)' }} />}
    </section>
  );
}
