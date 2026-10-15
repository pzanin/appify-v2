import { app, BrowserWindow, dialog, ipcMain, shell, protocol } from 'electron';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { developmentRendererUrl, isTrustedSender, isTrustedRendererUrl, validateWorkspace, safeOperation } from './security';
import { InteractiveContentStore } from './interactiveContent';
import { electronCsp, INTERACTIVE_CSP } from '../src/utils/securityPolicies';
import { normalizeExternalUrl } from '../src/utils/externalLinks';
import { ProjectRepository } from './projectRepository';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const interactiveContent = new InteractiveContentStore();
protocol.registerSchemesAsPrivileged([
  {scheme:'appify-content',privileges:{standard:true,secure:true}},
  {scheme:'appify-asset',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true,corsEnabled:true}},
]);
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

function requireAudioFilename(value: unknown) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,158}\.mp3$/i.test(value) || path.basename(value) !== value) {
    throw new Error('Arquivo de áudio inválido.');
  }
  return value;
}

async function serveProjectAudio(request:Request) {
  if(request.method!=='GET' && request.method!=='HEAD') return new Response('Método não permitido.',{status:405});
  try {
    const url=new URL(request.url);
    const parts=url.pathname.split('/').filter(Boolean).map(part=>decodeURIComponent(part));
    const projectId=Number(parts[0]);
    const filename=parts[2] || '';
    console.log(`[Appify Audio] pedido recebido: projeto=${projectId || 'inválido'} arquivo=${filename || 'ausente'} range=${request.headers.get('range') || 'nenhum'}`);
    if(url.hostname!=='project' || parts.length!==3 || parts[1]!=='audio' || !Number.isSafeInteger(projectId) || projectId<=0) {
      console.warn('[Appify Audio] URL interna inválida.');
      return new Response('Asset inválido.',{status:400});
    }
    if(filename.includes('..') || path.basename(filename)!==filename || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,158}\.mp3$/i.test(filename)) {
      console.warn('[Appify Audio] Nome de arquivo inválido.');
      return new Response('Asset inválido.',{status:400});
    }
    const projectDirectory=await repository.remove(projectId);
    const target=path.join(projectDirectory,'assets','audio',filename);
    const stats=await fs.stat(target);
    if(!stats.isFile() || stats.size<=0 || stats.size>100*1024*1024) {
      console.warn(`[Appify Audio] arquivo recusado: ${filename}`);
      return new Response('Asset inválido.',{status:400});
    }
    console.log(`[Appify Audio] arquivo encontrado: ${filename} (${stats.size} bytes)`);

    const baseHeaders:Record<string,string>={
      'Content-Type':'audio/mpeg',
      'Accept-Ranges':'bytes',
      'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff',
      'Access-Control-Allow-Origin':'*',
    };
    const range=request.headers.get('range');
    if(range) {
      const match=/^bytes=(\d*)-(\d*)$/i.exec(range.trim());
      if(!match) return new Response(null,{status:416,headers:{...baseHeaders,'Content-Range':`bytes */${stats.size}`}});
      let start=match[1] ? Number(match[1]) : 0;
      let end=match[2] ? Number(match[2]) : stats.size-1;
      if(!match[1] && match[2]) {
        const suffix=Number(match[2]);
        start=Math.max(0,stats.size-suffix);
        end=stats.size-1;
      }
      if(!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start<0 || end<start || start>=stats.size) return new Response(null,{status:416,headers:{...baseHeaders,'Content-Range':`bytes */${stats.size}`}});
      end=Math.min(end,stats.size-1);
      const length=end-start+1;
      const handle=await fs.open(target,'r');
      try {
        const bytes=Buffer.alloc(length);
        await handle.read(bytes,0,length,start);
        console.log(`[Appify Audio] resposta parcial 206: ${start}-${end}/${stats.size}`);
        return new Response(request.method==='HEAD'?null:bytes,{status:206,headers:{...baseHeaders,'Content-Length':String(length),'Content-Range':`bytes ${start}-${end}/${stats.size}`}});
      } finally {
        await handle.close();
      }
    }

    const bytes=request.method==='HEAD' ? null : await fs.readFile(target);
    console.log(`[Appify Audio] resposta completa 200: ${stats.size} bytes`);
    return new Response(bytes,{status:200,headers:{...baseHeaders,'Content-Length':String(stats.size)}});
  } catch (error) {
    const code=error && typeof error==='object' && 'code' in error ? String((error as {code?:unknown}).code || '') : '';
    console.warn(`[Appify Audio] arquivo não encontrado ou leitura falhou${code ? ` (${code})` : ''}.`);
    return new Response('Asset não encontrado.',{status:404});
  }
}

function registerProjectHandlers() {
  handle('content:create', (event, html:unknown)=>interactiveContent.create(event.sender.id,html));
  handle('content:release', (event, url:unknown)=>interactiveContent.release(event.sender.id,url));
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
  handle('projects:read-audio', async (_event, payload: { id?: unknown; filename?: unknown }) => {
    const projectId = requireProjectId(payload?.id);
    const filename = requireAudioFilename(payload?.filename);
    const directory = await repository.remove(projectId);
    const target = path.join(directory, 'assets', 'audio', filename);
    const stats = await fs.stat(target);
    if (!stats.isFile() || stats.size <= 0 || stats.size > 100 * 1024 * 1024) throw new Error('Arquivo de áudio inválido.');
    return new Uint8Array(await fs.readFile(target));
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
  const ownerId=win.webContents.id;
  win.on('closed', () => { trustedWindows.delete(ownerId); interactiveContent.clear(ownerId); });
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
  protocol.handle('appify-content', request => {
    const html=request.method==='GET' ? interactiveContent.get(request.url) : undefined;
    return new Response(html || 'Prévia indisponível.', {status:html?200:404,headers:{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':`sandbox allow-scripts; ${INTERACTIVE_CSP}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  });
  protocol.handle('appify-asset', serveProjectAudio);
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
