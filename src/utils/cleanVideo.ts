export type CleanVideoAspectRatio = '16:9' | '9:16';

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,}$/;

export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return YOUTUBE_ID.test(id) ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
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

export function detectYouTubeAspectRatio(url: string): CleanVideoAspectRatio {
  try {
    const parsed = new URL(url);
    return parsed.pathname.toLowerCase().includes('/shorts/') ? '9:16' : '16:9';
  } catch {
    return '16:9';
  }
}

export function getYouTubePoster(url: string): string | null {
  const id = extractYouTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : null;
}

export function buildYouTubeEmbedUrl(url: string): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    controls: '1',
    playsinline: '1',
    rel: '0',
    fs: '1',
  });

  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
