import React, { useEffect, useRef } from 'react';

export function SplashArtwork({ source, kind, name, fit, onComplete, onFailure }: {
  source:string; kind:'video'|'image'; name:string; fit:'contain'|'cover'; onComplete:()=>void; onFailure:()=>void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const failure = useRef(onFailure);
  failure.current = onFailure;
  useEffect(() => {
    const player = video.current;
    if (!player) return;
    let active = true;
    player.muted = true;
    try { player.play()?.catch(() => { if (active) failure.current(); }); }
    catch { failure.current(); }
    return () => { active = false; player.pause(); };
  }, [source,kind]);
  const style: React.CSSProperties = { width:'100%', height:'100%', objectFit:fit };
  return kind === 'video'
    ? <video ref={video} src={source} style={style} aria-label={name} autoPlay muted playsInline preload="auto" disablePictureInPicture onEnded={onComplete} onError={onFailure} />
    : <img src={source} style={style} alt={name} onError={onFailure} />;
}
