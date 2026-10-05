export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable' | 'failed';
export type InstallPlatform = 'ios' | 'android' | 'desktop' | 'embedded';
export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export function installPlatform(userAgent: string, touchPoints = 0): InstallPlatform {
  if (/FBAN|FBAV|Instagram|TikTok|Line\//i.test(userAgent)) return 'embedded';
  if (/iphone|ipad|ipod/i.test(userAgent) || (/macintosh/i.test(userAgent) && touchPoints > 1)) return 'ios';
  return /android/i.test(userAgent) ? 'android' : 'desktop';
}
export function createInstallController(target: Window) {
  const media = target.matchMedia?.('(display-mode: standalone)');
  const fullscreen = target.matchMedia?.('(display-mode: fullscreen)');
  let prompt: InstallPromptEvent | null = null;
  let busy = false;
  const listeners = new Set<() => void>();
  const platform = installPlatform(target.navigator.userAgent, target.navigator.maxTouchPoints);
  let snapshot = { available:false, installed:!!(media?.matches || fullscreen?.matches || (target.navigator as Navigator & { standalone?: boolean }).standalone), platform, busy:false };
  const publish = () => { snapshot = { ...snapshot, available:!!prompt && !snapshot.installed, busy }; listeners.forEach(fn=>fn()); };
  const before = (event: Event) => { event.preventDefault(); prompt = event as InstallPromptEvent; publish(); };
  const installed = () => { prompt=null; snapshot={...snapshot,installed:true}; publish(); };
  const modeChanged = () => { snapshot={...snapshot,installed:!!(media?.matches || fullscreen?.matches || (target.navigator as Navigator & {standalone?:boolean}).standalone)}; publish(); };
  target.addEventListener('beforeinstallprompt',before);
  target.addEventListener('appinstalled',installed);
  media?.addEventListener?.('change',modeChanged);
  fullscreen?.addEventListener?.('change',modeChanged);
  return {
    getSnapshot:()=>snapshot,
    subscribe:(callback:()=>void)=>{listeners.add(callback);return ()=>{listeners.delete(callback);};},
    async trigger(): Promise<InstallOutcome> {
      if (!prompt || busy || snapshot.installed) return 'unavailable';
      const event=prompt;
      prompt=null; busy=true; publish();
      try {
        // Invoke synchronously from the tap, before awaiting anything else.
        await event.prompt();
        return (await event.userChoice).outcome;
      } catch { return 'failed'; }
      finally { busy=false; publish(); }
    },
    dispose:()=>{target.removeEventListener('beforeinstallprompt',before);target.removeEventListener('appinstalled',installed);media?.removeEventListener?.('change',modeChanged);fullscreen?.removeEventListener?.('change',modeChanged);listeners.clear();},
  };
}
let controller: ReturnType<typeof createInstallController> | undefined;
export function initializePwaInstall() { return controller ||= createInstallController(window); }
