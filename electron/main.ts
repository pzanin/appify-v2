import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppState } from '../src/types';
import { ProjectRepository } from './projectRepository';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
let repository: ProjectRepository;

app.disableHardwareAcceleration();

function requireProjectId(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Identificador de projeto inválido.');
  }
  return value;
}

function requireWorkspace(value: unknown): AppState {
  if (!value || typeof value !== 'object') throw new Error('Dados do projeto inválidos.');
  const candidate = value as Partial<AppState>;
  if (typeof candidate.appName !== 'string' || !candidate.pwaConfig || !Array.isArray(candidate.modules)) {
    throw new Error('Dados do projeto incompletos.');
  }
  return value as AppState;
}

function registerProjectHandlers() {
  ipcMain.handle('projects:list', () => repository.list());
  ipcMain.handle('projects:create', (_event, payload: { name?: unknown; workspace?: unknown }) => {
    const name = typeof payload?.name === 'string' ? payload.name.slice(0, 120) : 'Novo App';
    return repository.create(name, requireWorkspace(payload?.workspace));
  });
  ipcMain.handle('projects:open', (_event, payload: { id?: unknown }) => repository.open(requireProjectId(payload?.id)));
  ipcMain.handle('projects:save', (_event, payload: { id?: unknown; workspace?: unknown }) => (
    repository.save(requireProjectId(payload?.id), requireWorkspace(payload?.workspace))
  ));
  ipcMain.handle('projects:duplicate', (_event, payload: { id?: unknown }) => repository.duplicate(requireProjectId(payload?.id)));
  ipcMain.handle('projects:remove', async (_event, payload: { id?: unknown }) => {
    const directory = await repository.remove(requireProjectId(payload?.id));
    await shell.trashItem(directory);
  });
  ipcMain.handle('projects:export-backup', async (_event, payload: { id?: unknown }) => {
    const document = await repository.readBackup(requireProjectId(payload?.id));
    const result = await dialog.showSaveDialog({
      title: 'Exportar backup do Appify',
      defaultPath: `${document.project.name}.appify-project.json`,
      filters: [{ name: 'Projeto Appify', extensions: ['json'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await fs.writeFile(result.filePath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    return { canceled: false, project: document.project };
  });
  ipcMain.handle('projects:import-backup', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Importar backup do Appify',
      properties: ['openFile'],
      filters: [{ name: 'Projeto Appify', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return { canceled: true };
    const raw = await fs.readFile(result.filePaths[0], 'utf8');
    const project = await repository.importDocument(JSON.parse(raw) as unknown);
    return { canceled: false, project };
  });
  ipcMain.on('app:close-ready', event => {
    BrowserWindow.fromWebContents(event.sender)?.destroy();
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 980,
    minHeight: 680,
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  let closeRequested = false;
  win.on('close', event => {
    if (closeRequested) return;
    event.preventDefault();
    closeRequested = true;
    win.webContents.send('app:before-close');
    setTimeout(() => {
      if (!win.isDestroyed()) win.destroy();
    }, 5000);
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('mailto:')) void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void win.loadFile(path.join(currentDirectory, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  const projectsRoot = process.env.APPIFY_DATA_DIR
    ? path.resolve(process.env.APPIFY_DATA_DIR)
    : path.join(app.getPath('documents'), 'Appify', 'Projects');
  repository = new ProjectRepository(projectsRoot);
  await repository.initialize();
  registerProjectHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
