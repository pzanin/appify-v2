import i18n from '../i18n';
import { useAppStore } from '../store/useAppStore';
import React from 'react';
import { extractYouTubeId, getYouTubePoster } from '../utils/cleanVideo';

let globalObserver: MutationObserver | null = null;
let globalEnhancerStarted = false;

function enhanceIframe(frame: HTMLIFrameElement) {
  if (frame.dataset.appifyCleanVideo === '1') return;

  const src = frame.getAttribute('src') || '';
  const id = extractYouTubeId(src);
  if (!id) return;

  const parent = frame.parentElement;
  if (!parent) return;

  const inPhonePreview = Boolean(parent.closest('.phone-mockup'));
  const inExportedPwa = Boolean(parent.closest('.standalone-app-wrapper'));
  if (!inPhonePreview && !inExportedPwa) return;

  frame.dataset.appifyCleanVideo = '1';
  frame.dataset.appifyOriginalSrc = src;
  frame.src = 'about:blank';

  const overlay = document.createElement('button');
  overlay.type = 'button';
  const t=i18n.getFixedT((useAppStore.getState().pwaConfig.language || document.documentElement.lang || 'pt-BR').split('-')[0]);
  overlay.setAttribute('aria-label',t('app.media.play',{title:t('app.media.video')}));
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

    // YouTube requires same-origin/presentation capabilities inside a sandboxed iframe.
    // This relaxation is applied only to validated YouTube embeds handled by this enhancer.
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    overlay.remove();
  }, { once: true });
}

function scanEligibleIframes() {
  document
    .querySelectorAll<HTMLIFrameElement>('.phone-mockup iframe, .standalone-app-wrapper iframe')
    .forEach(enhanceIframe);
}

function ensureGlobalEnhancer() {
  if (globalEnhancerStarted || typeof document === 'undefined') return;

  const start = () => {
    if (globalEnhancerStarted || !document.body) return;
    globalEnhancerStarted = true;
    scanEligibleIframes();
    globalObserver = new MutationObserver(scanEligibleIframes);
    globalObserver.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}

ensureGlobalEnhancer();

export function CleanYouTubePreviewEnhancer() {
  React.useEffect(() => {
    ensureGlobalEnhancer();
    scanEligibleIframes();
  }, []);

  return null;
}
