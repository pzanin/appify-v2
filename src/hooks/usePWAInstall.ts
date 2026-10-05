import { useSyncExternalStore } from 'react';
import { initializePwaInstall } from '../utils/pwaInstallation';

export function usePWAInstall() {
  const controller = initializePwaInstall();
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  return {
    isInstallAvailable:state.available,
    isIOS:state.platform === 'ios',
    isStandalone:state.installed,
    platform:state.platform,
    isInstalling:state.busy,
    triggerInstall:controller.trigger,
  };
}
