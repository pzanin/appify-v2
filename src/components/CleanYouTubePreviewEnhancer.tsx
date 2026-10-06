import React from 'react';
import { extractYouTubeId, getYouTubePoster } from '../utils/cleanVideo';

function enhanceIframe(frame: HTMLIFrameElement) {
  if (frame.dataset.appifyCleanVideo === '1') return;

  const src = frame.getAttribute('src') || '';
  const id = extractYouTubeId(src);
  if (!id) return;

  const parent = frame.parentElement;
  if (!parent || !parent.closest('.phone-mockup')) return;

  frame.dataset.appifyCleanVideo = '1';
  frame.dataset.appifyOriginalSrc = src;
  frame.src = 'about:blank';

  const overlay = document.createElement('button');
  overlay.type = 'button';
  overlay.setAttribute('aria-label', 'Reproduzir vídeo');
  overlay.dataset.appifyCleanOverlay = '1';

  const poster = getYouTubePoster(src);
  Object.assign(overlay.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    border: '0',
    padding: '0',
    cursor: 'pointer',
    zIndex: '2',
    background: poster
      ? `linear-gradient(rgba(0,0,0,.12),rgba(0,0,0,.24)), url(${poster}) center/cover no-repeat`
      : 'linear-gradient(135deg,#161b22,#0b1117)',
  });

  const play = document.createElement('span');
  play.textContent = '▶';
  Object.assign(play.style, {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    margin: 'auto',
    background: 'rgba(255,255,255,.94)',
    color: '#111827',
    fontSize: '28px',
    lineHeight: '1',
    boxShadow: '0 10px 30px rgba(0,0,0,.28)',
  });
  overlay.appendChild(play);

  if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative';
  parent.appendChild(overlay);

  overlay.addEventListener('click', () => {
    const original = frame.dataset.appifyOriginalSrc || src;
    const videoId = extractYouTubeId(original);
    if (!videoId) return;

    const params = new URLSearchParams({
      autoplay: '1',
      controls: '1',
      playsinline: '1',
      rel: '0',
      fs: '1',
    });

    frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    overlay.remove();
  }, { once: true });
}

export function CleanYouTubePreviewEnhancer() {
  React.useEffect(() => {
    const scan = () => {
      document.querySelectorAll<HTMLIFrameElement>('.phone-mockup iframe').forEach(enhanceIframe);
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
