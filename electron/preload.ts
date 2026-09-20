import { contextBridge, ipcRenderer } from 'electron';
import type { AppifyDesktopApi } from '../src/types';

const api: AppifyDesktopApi = {
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    create: (name, workspace) => ipcRenderer.invoke('projects:create', { name, workspace }),
    open: id => ipcRenderer.invoke('projects:open', { id }),
    save: (id, workspace) => ipcRenderer.invoke('projects:save', { id, workspace }),
    duplicate: id => ipcRenderer.invoke('projects:duplicate', { id }),
    remove: id => ipcRenderer.invoke('projects:remove', { id }),
    exportBackup: id => ipcRenderer.invoke('projects:export-backup', { id }),
    importBackup: () => ipcRenderer.invoke('projects:import-backup'),
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

contextBridge.exposeInMainWorld('appifyDesktop', api);
