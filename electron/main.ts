import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { developmentRendererUrl, isTrustedSender, isTrustedRendererUrl, validateWorkspace, safeOperation } from './security';
import { electronCsp } from '../src/utils/securityPolicies';
import { normalizeExternalUrl } from '../src/utils/externalLinks';
import { ProjectRepository } from './projectRepository';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
let repository: ProjectRepository;
const trustedWindows = new Map<number, { win: BrowserWindow; url: string }>();
const closingWindows = new WeakSet<BrowserWindow>();

function requireSender(event: Electron.IpcMainEvent | Electron.IpcMainInvokeEvent) {
  const entry = trustedWindows.get(event.sender.id);
  if (!entry || entry.win.isDestroyed() || !isTrustedSender(event, entry.win.webContents, entry.url)) {
    throw new Error('Operação não autorizada.');
  }
  return entry.win;
}

function handle(channel: string, listener: Parameters<typeof ipcMain.handle>[1]) {
  ipcMain.handle(channel, async (event, ...args) => {
    requireSender(event);
    try { return await safeOperation(() => listener(event, ...args)); }
    catch {
      console.warn(`[Appify] Operação ${channel} falhou.`);
      throw new Error('Não foi possível concluir a operação. Tente novamente.');
    }
  });
}

app.disableHardwareAcceleration();
app.setAppUserModelId('com.pzanin.appify');

function requireProjectId(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Identificador de projeto inválido.');
  }
  return value;
}

function requireBuildBytes(value: unknown) {
  if (!(value instanceof Uint8Array)) throw new Error('Arquivo de build inválido.');
  if (value.byteLength === 0 || value.byteLength > 500 * 1024 * 1024) {
    throw new Error('O arquivo de build deve ter entre 1 byte e 500 MB.');
  }
  return value;
}

function registerProjectHandlers() {
  handle('links:open-external', async (_event, value: unknown) => {
    const url = normalizeExternalUrl(value);
    if (!url) throw new Error('Link inválido.');
    await shell.openExternal(url);
  });
  handle('projects:list', () => repository.list());
  handle('projects:create', (_event, payload: { name?: unknown; workspace?: unknown }) => {
    const name = typeof payload?.name === 'string' ? payload.name.slice(0, 120) : 'Novo App';
    return repository.create(name, validateWorkspace(payload?.workspace));
  });
  handle('projects:open', (_event, payload: { id?: unknown }) => repository.open(requireProjectId(payload?.id)));
  handle('projects:save', (_event, payload: { id?: unknown; workspace?: unknown }) => (
    repository.save(requireProjectId(payload?.id), validateWorkspace(payload?.workspace))
  ));
  handle('projects:duplicate', (_event, payload: { id?: unknown }) => repository.duplicate(requireProjectId(payload?.id)));
  handle('projects:remove', async (_event, payload: { id?: unknown }) => {
    const directory = await repository.remove(requireProjectId(payload?.id));
    await shell.trashItem(directory);
  });
  handle('projects:export-backup', async (_event, payload: { id?: unknown }) => {
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
  handle('projects:import-backup', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Importar backup do Appify',
      properties: ['openFile'],
      filters: [{ name: 'Projeto Appify', extensions: ['json'] }],
    });
    if (result.canceled || result.filePaths.length === 0) return { canceled: true };
    const info = await fs.stat(result.filePaths[0]);
    if (info.size > 50 * 1024 * 1024) throw new Error('Backup acima do limite de tamanho.');
    const raw = await fs.readFile(result.filePaths[0], 'utf8');
    const document = JSON.parse(raw);
    validateWorkspace(document?.workspace);
    const project = await repository.importDocument(document);
    return { canceled: false, project };
  });
  handle('projects:save-build', (_event, payload: { id?: unknown; filename?: unknown; bytes?: unknown }) => {
    const filename = typeof payload?.filename === 'string' ? payload.filename.slice(0, 160) : 'appify-pwa.zip';
    return repository.writeBuildArchive(
      requireProjectId(payload?.id),
      filename,
      requireBuildBytes(payload?.bytes),
    );
  });
  ipcMain.on('app:close-ready', event => {
    try {
      const win = requireSender(event);
      if (closingWindows.has(win)) win.destroy();
    } catch { console.warn('[Appify] Pedido de fechamento bloqueado.'); }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 980,
    minHeight: 680,
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
    },
  });

  let closeRequested = false;
  win.on('close', event => {
    if (closeRequested) return;
    event.preventDefault();
    closeRequested = true;
    closingWindows.add(win);
    win.webContents.send('app:before-close');
    setTimeout(() => {
      if (!win.isDestroyed()) win.destroy();
    }, 5000);
  });

  const devUrl = developmentRendererUrl(process.env.VITE_DEV_SERVER_URL, app.isPackaged);
  const rendererFile = path.join(currentDirectory, '../dist/index.html');
  const rendererUrl = devUrl || pathToFileURL(rendererFile).href;
  trustedWindows.set(win.webContents.id, { win, url: rendererUrl });
  win.on('closed', () => trustedWindows.delete(win.webContents.id));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.on('will-attach-webview', event => event.preventDefault());
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    if (!isTrustedRendererUrl(details.url, rendererUrl)) { callback({ responseHeaders: details.responseHeaders }); return; }
    callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': [electronCsp(Boolean(devUrl))] } });
  });
  win.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  win.webContents.session.setPermissionCheckHandler(() => false);
  if (devUrl) void win.loadURL(devUrl);
  else void win.loadFile(rendererFile);
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
}).catch(() => {
  dialog.showErrorBox('Appify', 'Não foi possível iniciar o aplicativo. Verifique o acesso à pasta de projetos e tente novamente.');
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
