import { app as d, BrowserWindow as f, ipcMain as p, shell as E, dialog as h } from "electron";
import { promises as c } from "node:fs";
import s from "node:path";
import { fileURLToPath as I } from "node:url";
const j = "project.json", g = ["assets", "pages", "build"];
function D(r) {
  const e = r.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").replace(/[. ]+$/g, "").trim().slice(0, 60);
  return !e || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(e) ? "Projeto" : e;
}
function u(r) {
  return JSON.parse(JSON.stringify(r));
}
function y(r) {
  if (!r || typeof r != "object") throw new Error("Backup de projeto inválido.");
  const e = r;
  if (e.schemaVersion !== 1 || !e.project || !e.workspace)
    throw new Error("Formato de projeto não reconhecido.");
  if (typeof e.project.id != "number" || typeof e.project.name != "string")
    throw new Error("Metadados do projeto inválidos.");
}
class N {
  constructor(e) {
    this.projectsRoot = e;
  }
  get rootPath() {
    return this.projectsRoot;
  }
  async initialize() {
    await c.mkdir(this.projectsRoot, { recursive: !0 });
  }
  async list() {
    await this.initialize();
    const e = await c.readdir(this.projectsRoot, { withFileTypes: !0 });
    return (await Promise.all(e.filter((o) => o.isDirectory()).map(async (o) => {
      try {
        return (await this.readFromDirectory(s.join(this.projectsRoot, o.name))).project;
      } catch (i) {
        return console.warn(`[Appify] Ignorando pasta de projeto inválida: ${o.name}`, i), null;
      }
    }))).filter((o) => o !== null).sort((o, i) => Date.parse(i.lastEdited) - Date.parse(o.lastEdited));
  }
  async create(e, t) {
    await this.initialize();
    const o = e.trim() || "Novo App", n = {
      id: await this.nextProjectId(),
      name: o,
      status: "Rascunho",
      lastEdited: (/* @__PURE__ */ new Date()).toISOString(),
      users: 0,
      color: t.pwaConfig.themeColor || "#7c6fff",
      url: `${D(o).toLowerCase().replace(/\s+/g, "")}.vapp.pro`,
      logoBase64: t.pwaConfig.logoBase64 || void 0
    }, m = s.join(this.projectsRoot, this.directoryName(n));
    return await this.createStructure(m), await this.writeDocument(m, { schemaVersion: 1, project: n, workspace: u(t) }), n;
  }
  async open(e) {
    const t = await this.findDirectory(e);
    return this.readFromDirectory(t);
  }
  async save(e, t) {
    const o = await this.findDirectory(e), i = await this.readFromDirectory(o), n = {
      ...i.project,
      name: t.appName.trim() || i.project.name,
      lastEdited: (/* @__PURE__ */ new Date()).toISOString(),
      color: t.pwaConfig.themeColor || i.project.color,
      logoBase64: t.pwaConfig.logoBase64 || void 0
    };
    return await this.writeDocument(o, { schemaVersion: 1, project: n, workspace: u(t) }), n;
  }
  async duplicate(e) {
    const t = await this.findDirectory(e), o = await this.readFromDirectory(t), i = `${o.project.name} (cópia)`, n = u(o.workspace);
    n.appName = i, n.pwaConfig = { ...n.pwaConfig, appName: i };
    const m = await this.create(i, n), F = await this.findDirectory(m.id);
    for (const l of g)
      await c.cp(s.join(t, l), s.join(F, l), {
        recursive: !0,
        force: !0
      });
    return m;
  }
  async remove(e) {
    return this.findDirectory(e);
  }
  async importDocument(e) {
    y(e);
    const t = u(e.workspace), o = await this.create(`${e.project.name} (importado)`, t), i = await this.findDirectory(o.id), n = {
      ...e.project,
      id: o.id,
      name: o.name,
      lastEdited: (/* @__PURE__ */ new Date()).toISOString()
    };
    return t.appName = n.name, t.pwaConfig = { ...t.pwaConfig, appName: n.name }, await this.writeDocument(i, { schemaVersion: 1, project: n, workspace: t }), n;
  }
  async readBackup(e) {
    return this.open(e);
  }
  async createStructure(e) {
    await c.mkdir(e, { recursive: !1 }), await Promise.all(g.map((t) => c.mkdir(s.join(e, t), { recursive: !0 })));
  }
  directoryName(e) {
    return `${D(e.name)}-${e.id}`;
  }
  async nextProjectId() {
    let e = Date.now();
    const t = new Set((await this.list()).map((o) => o.id));
    for (; t.has(e); ) e += 1;
    return e;
  }
  async findDirectory(e) {
    await this.initialize();
    const t = await c.readdir(this.projectsRoot, { withFileTypes: !0 });
    for (const o of t) {
      if (!o.isDirectory()) continue;
      const i = s.join(this.projectsRoot, o.name);
      try {
        if ((await this.readFromDirectory(i)).project.id === e) return i;
      } catch {
      }
    }
    throw new Error("Projeto local não encontrado.");
  }
  async readFromDirectory(e) {
    const t = await c.readFile(s.join(e, j), "utf8"), o = JSON.parse(t);
    return y(o), o;
  }
  async writeDocument(e, t) {
    const o = s.join(e, j), i = `${o}.tmp`;
    await c.writeFile(i, `${JSON.stringify(t, null, 2)}
`, "utf8"), await c.rename(i, o);
  }
}
const P = s.dirname(I(import.meta.url));
let a;
d.disableHardwareAcceleration();
function w(r) {
  if (typeof r != "number" || !Number.isSafeInteger(r) || r <= 0)
    throw new Error("Identificador de projeto inválido.");
  return r;
}
function R(r) {
  if (!r || typeof r != "object") throw new Error("Dados do projeto inválidos.");
  const e = r;
  if (typeof e.appName != "string" || !e.pwaConfig || !Array.isArray(e.modules))
    throw new Error("Dados do projeto incompletos.");
  return r;
}
function S() {
  p.handle("projects:list", () => a.list()), p.handle("projects:create", (r, e) => {
    const t = typeof (e == null ? void 0 : e.name) == "string" ? e.name.slice(0, 120) : "Novo App";
    return a.create(t, R(e == null ? void 0 : e.workspace));
  }), p.handle("projects:open", (r, e) => a.open(w(e == null ? void 0 : e.id))), p.handle("projects:save", (r, e) => a.save(w(e == null ? void 0 : e.id), R(e == null ? void 0 : e.workspace))), p.handle("projects:duplicate", (r, e) => a.duplicate(w(e == null ? void 0 : e.id))), p.handle("projects:remove", async (r, e) => {
    const t = await a.remove(w(e == null ? void 0 : e.id));
    await E.trashItem(t);
  }), p.handle("projects:export-backup", async (r, e) => {
    const t = await a.readBackup(w(e == null ? void 0 : e.id)), o = await h.showSaveDialog({
      title: "Exportar backup do Appify",
      defaultPath: `${t.project.name}.appify-project.json`,
      filters: [{ name: "Projeto Appify", extensions: ["json"] }]
    });
    return o.canceled || !o.filePath ? { canceled: !0 } : (await c.writeFile(o.filePath, `${JSON.stringify(t, null, 2)}
`, "utf8"), { canceled: !1, project: t.project });
  }), p.handle("projects:import-backup", async () => {
    const r = await h.showOpenDialog({
      title: "Importar backup do Appify",
      properties: ["openFile"],
      filters: [{ name: "Projeto Appify", extensions: ["json"] }]
    });
    if (r.canceled || r.filePaths.length === 0) return { canceled: !0 };
    const e = await c.readFile(r.filePaths[0], "utf8");
    return { canceled: !1, project: await a.importDocument(JSON.parse(e)) };
  }), p.on("app:close-ready", (r) => {
    var e;
    (e = f.fromWebContents(r.sender)) == null || e.destroy();
  });
}
function v() {
  const r = new f({
    width: 1200,
    height: 800,
    minWidth: 980,
    minHeight: 680,
    webPreferences: {
      preload: s.join(P, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0
    }
  });
  let e = !1;
  r.on("close", (t) => {
    e || (t.preventDefault(), e = !0, r.webContents.send("app:before-close"), setTimeout(() => {
      r.isDestroyed() || r.destroy();
    }, 5e3));
  }), r.webContents.setWindowOpenHandler(({ url: t }) => ((t.startsWith("https://") || t.startsWith("mailto:")) && E.openExternal(t), { action: "deny" })), process.env.VITE_DEV_SERVER_URL ? r.loadURL(process.env.VITE_DEV_SERVER_URL) : r.loadFile(s.join(P, "../dist/index.html"));
}
d.whenReady().then(async () => {
  const r = process.env.APPIFY_DATA_DIR ? s.resolve(process.env.APPIFY_DATA_DIR) : s.join(d.getPath("documents"), "Appify", "Projects");
  a = new N(r), await a.initialize(), S(), v(), d.on("activate", () => {
    f.getAllWindows().length === 0 && v();
  });
});
d.on("window-all-closed", () => {
  process.platform !== "darwin" && d.quit();
});
