import type { AppifyDesktopApi } from './types';

declare global {
  interface Window {
    appifyDesktop?: AppifyDesktopApi;
  }
}

export {};
