import { contextBridge, ipcRenderer } from 'electron';
import type { AppifyDesktopApi } from '../src/types';

type PreviewProfile = { name: string; email: string; updatedAt: number };
type ExtendedProjectsApi = AppifyDesktopApi['projects'] & {
  readPreviewProfile: (id: number) => Promise<PreviewProfile>;
  writePreviewProfile: (id: number, profile: { name: string; email: string }) => Promise<PreviewProfile>;
  writeMaterial: (id:number, filename:string, bytes:Uint8Array) => Promise<{filename:string;size:number}>;
  readMaterial: (id:number, filename:string) => Promise<Uint8Array>;
};

const api: AppifyDesktopApi & { projects: ExtendedProjectsApi } = {
  content: { create: html=>ipcRenderer.invoke('content:create',html), release: url=>ipcRenderer.invoke('content:release',url) },
  links: { openExternal: url => ipcRenderer.invoke('links:open-external', url) },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    create: (name, workspace) => ipcRenderer.invoke('projects:create', { name, workspace }),
    open: id => ipcRenderer.invoke('projects:open', { id }),
    save: (id, workspace) => ipcRenderer.invoke('projects:save', { id, workspace }),
    duplicate: id => ipcRenderer.invoke('projects:duplicate', { id }),
    remove: id => ipcRenderer.invoke('projects:remove', { id }),
    exportBackup: id => ipcRenderer.invoke('projects:export-backup', { id }),
    importBackup: () => ipcRenderer.invoke('projects:import-backup'),
    saveBuild: (id, filename, bytes) => ipcRenderer.invoke('projects:save-build', { id, filename, bytes }),
    readAudio: (id, filename) => ipcRenderer.invoke('projects:read-audio', { id, filename }),
    writeMaterial: (id, filename, bytes) => ipcRenderer.invoke('projects:write-material', { id, filename, bytes }),
    readMaterial: (id, filename) => ipcRenderer.invoke('projects:read-material', { id, filename }),
    readPreviewProfile: id => ipcRenderer.invoke('projects:read-preview-profile', { id }),
    writePreviewProfile: (id, profile) => ipcRenderer.invoke('projects:write-preview-profile', { id, profile }),
  },
  lifecycle: {
    onBeforeClose: listener => {
      const handler = () => { void listener(); };
      ipcRenderer.on('app:before-close', handler);
      return () => ipcRenderer.removeListener('app:before-close', handler);
    },
    readyToClose: () => ipcRenderer.send('app:close-ready'),
  },
};

if (process.isMainFrame) contextBridge.exposeInMainWorld('appifyDesktop', api);
