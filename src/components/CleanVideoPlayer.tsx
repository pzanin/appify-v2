import React, { useMemo, useState } from 'react';
import { Play } from 'lucide-react';
import {
  buildYouTubeEmbedUrl,
  detectYouTubeAspectRatio,
  getYouTubePoster,
  type CleanVideoAspectRatio,
} from '../utils/cleanVideo';

interface CleanVideoPlayerProps {
  url: string;
  poster?: string;
  aspectRatio?: CleanVideoAspectRatio | 'auto';
  borderRadius?: number;
  title?: string;
}

export function CleanVideoPlayer({
  url,
  poster,
  aspectRatio = 'auto',
  borderRadius = 16,
  title = 'Vídeo',
}: CleanVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const resolvedAspectRatio = aspectRatio === 'auto' ? detectYouTubeAspectRatio(url) : aspectRatio;
  const embedUrl = useMemo(() => buildYouTubeEmbedUrl(url), [url]);
  const resolvedPoster = poster || getYouTubePoster(url) || undefined;

  const ratioCss = resolvedAspectRatio === '9:16' ? '9 / 16' : '16 / 9';

  if (!embedUrl) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: ratioCss,
        display: 'grid',
        placeItems: 'center',
        borderRadius,
        border: '1px dashed rgba(127,127,127,.35)',
        background: 'rgba(127,127,127,.08)',
        color: 'inherit',
        padding: 24,
        textAlign: 'center',
      }}>
        Cole uma URL válida do YouTube ou Shorts.
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: resolvedAspectRatio === '9:16' ? 360 : '100%',
      marginInline: 'auto',
      aspectRatio: ratioCss,
      borderRadius,
      overflow: 'hidden',
      position: 'relative',
      background: '#000',
      boxShadow: '0 10px 30px rgba(0,0,0,.18)',
    }}>
      {!isPlaying ? (
        <button
          type="button"
          aria-label={`Reproduzir ${title}`}
          onClick={() => setIsPlaying(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            background: resolvedPoster
              ? `linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.24)), url(${resolvedPoster}) center/cover no-repeat`
              : 'linear-gradient(135deg,#161b22,#0b1117)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <span style={{
            width: 68,
            height: 68,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255,255,255,.94)',
            color: '#111827',
            boxShadow: '0 10px 30px rgba(0,0,0,.28)',
            backdropFilter: 'blur(6px)',
          }}>
            <Play size={30} fill="currentColor" style={{ marginLeft: 4 }} />
          </span>
        </button>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, display: 'block' }}
        />
      )}
    </div>
  );
}
