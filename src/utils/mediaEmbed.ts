import type { VideoAspectRatio, VideoProvider } from '../types';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,}$/;

export function detectVideoProvider(url: string): VideoProvider {
  const value = (url || '').toLowerCase();
  if (value.includes('youtube.com') || value.includes('youtu.be')) return 'youtube';
  if (value.includes('vimeo.com')) return 'vimeo';
  return 'direct';
}

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return YOUTUBE_ID.test(id) ? id : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const watchId = parsed.searchParams.get('v');
      if (watchId && YOUTUBE_ID.test(watchId)) return watchId;
      const parts = parsed.pathname.split('/').filter(Boolean);
      const markerIndex = parts.findIndex(part => ['embed', 'shorts', 'live'].includes(part));
      const candidate = markerIndex >= 0 ? parts[markerIndex + 1] : null;
      return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function extractVimeoId(url: string): string | null {
  const match = (url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  return match?.[1] || null;
}

export function getYouTubeThumbnail(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

export function aspectRatioCss(aspect: VideoAspectRatio = '16:9'): string {
  if (aspect === '9:16') return '9 / 16';
  if (aspect === '1:1') return '1 / 1';
  return '16 / 9';
}

export function buildVideoEmbedUrl(
  provider: VideoProvider,
  url: string,
  options: { autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean } = {}
): string | null {
  const { autoplay = false, loop = false, muted = false, controls = true } = options;

  if (provider === 'youtube') {
    const id = extractYouTubeId(url);
    if (!id) return null;
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      controls: controls ? '1' : '0',
      autoplay: autoplay ? '1' : '0',
      mute: muted ? '1' : '0',
    });
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', id);
    }
    return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
  }

  if (provider === 'vimeo') {
    const id = extractVimeoId(url);
    if (!id) return null;
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      loop: loop ? '1' : '0',
      muted: muted ? '1' : '0',
      controls: controls ? '1' : '0',
      dnt: '1',
    });
    return `https://player.vimeo.com/video/${id}?${params.toString()}`;
  }

  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
