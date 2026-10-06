import React from 'react';
import type { VideoAspectRatio, VideoProvider } from '../types';
import { aspectRatioCss, buildVideoEmbedUrl, detectVideoProvider, getYouTubeThumbnail } from '../utils/mediaEmbed';

interface VideoEmbedProps {
  url: string;
  provider?: VideoProvider;
  aspectRatio?: VideoAspectRatio;
  thumbnail?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  borderRadius?: number | string;
  width?: number | string;
}

export function VideoEmbed({
  url,
  provider,
  aspectRatio = '16:9',
  thumbnail,
  autoplay = false,
  loop = false,
  muted = false,
  controls = true,
  borderRadius = 12,
  width = '100%',
}: VideoEmbedProps) {
  const resolvedProvider = provider || detectVideoProvider(url);
  const source = buildVideoEmbedUrl(resolvedProvider, url, { autoplay, loop, muted, controls });
  const poster = thumbnail || (resolvedProvider === 'youtube' ? getYouTubeThumbnail(url) || undefined : undefined);

  if (!source) {
    return (
      <div style={{ border: '1px dashed #cbd5e1', borderRadius, padding: 24, textAlign: 'center', opacity: 0.7 }}>
        Cole uma URL de vídeo válida.
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    width,
    maxWidth: '100%',
    aspectRatio: aspectRatioCss(aspectRatio),
    borderRadius,
    overflow: 'hidden',
    position: 'relative',
    marginInline: 'auto',
    background: '#000',
  };

  if (resolvedProvider === 'direct') {
    return (
      <div style={containerStyle}>
        <video
          src={source}
          poster={poster}
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          controls={controls}
          playsInline
          preload="metadata"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <iframe
        src={source}
        title="Vídeo"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
      />
    </div>
  );
}
