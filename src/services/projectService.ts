import type { AppState, AppifyDesktopApi, Project, ProjectBuildResult, ProjectFile, ProjectOperationResult } from '../types';

const BROWSER_STORAGE_KEY = 'appify-browser-projects-v1';
let activeProjectId: number | null = null;

type BrowserProject = ProjectFile;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isValidProject(value: unknown): value is Project {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<Project>;
  return typeof project.id === 'number'
    && typeof project.name === 'string'
    && project.name.trim().length > 0
    && (project.status === 'Publicado' || project.status === 'Rascunho');
}

function isValidBrowserProject(value: unknown): value is BrowserProject {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<BrowserProject>;
  return item.schemaVersion === 1
    && isValidProject(item.project)
    && Boolean(item.workspace)
    && typeof item.workspace === 'object';
}

function getBrowserProjects(): BrowserProject[] {
  try {
    const raw = localStorage.getItem(BROWSER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isValidBrowserProject);
    if (valid.length !== parsed.length) {
      console.warn('[Appify] Registros de projeto inválidos foram ignorados no modo navegador.');
    }
    return valid;
  } catch {
    console.warn('[Appify] Não foi possível ler os projetos salvos no navegador.');
    return [];
  }
}

function setBrowserProjects(projects: BrowserProject[]) {
  localStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(projects));
}

function browserProject(name: string, workspace: AppState): BrowserProject {
  const normalizedName = name.trim() || 'Novo App';
  return {
    schemaVersion: 1,
    project: {
      id: Date.now(),
      name: normalizedName,
      status: 'Rascunho',
      lastEdited: new Date().toISOString(),
      users: 0,
      color: workspace.pwaConfig.themeColor || '#7c6fff',
      url: `${normalizedName.toLowerCase().replace(/\s+/g, '')}.vapp.pro`,
      logoBase64: workspace.pwaConfig.logoBase64 || undefined,
    },
    workspace: clone(workspace),
  };
}

const browserFallback = {
  async list() {
    return getBrowserProjects().map(item => item.project);
  },
  async create(name: string, workspace: AppState) {
    const document = browserProject(name, workspace);
    setBrowserProjects([...getBrowserProjects(), document]);
    return document.project;
  },
  async open(id: number) {
    const document = getBrowserProjects().find(item => item.project.id === id);
    if (!document) throw new Error('Projeto local não encontrado.');
    return clone(document);
  },
  async save(id: number, workspace: AppState) {
    let saved: Project | undefined;
    const projects = getBrowserProjects().map(item => {
      if (item.project.id !== id) return item;
      saved = {
        ...item.project,
        name: workspace.appName.trim() || item.project.name,
        lastEdited: new Date().toISOString(),
        color: workspace.pwaConfig.themeColor || item.project.color,
        logoBase64: workspace.pwaConfig.logoBase64 || undefined,
      };
      return { ...item, project: saved, workspace: clone(workspace) };
    });
    if (!saved) throw new Error('Projeto local não encontrado.');
    setBrowserProjects(projects);
    return saved;
  },
  async duplicate(id: number) {
    const source = await browserFallback.open(id);
    const name = `${source.project.name} (cópia)`;
    const workspace = clone(source.workspace);
    workspace.appName = name;
    workspace.pwaConfig = { ...workspace.pwaConfig, appName: name, productId: crypto.randomUUID(), analyticsEnabled: false, analyticsProjectId: undefined };
    return browserFallback.create(name, workspace);
  },
  async remove(id: number) {
    setBrowserProjects(getBrowserProjects().filter(item => item.project.id !== id));
  },
};

type MaterialProjectsApi = AppifyDesktopApi['projects'] & {
  writeMaterial: (id:number, filename:string, bytes:Uint8Array)=>Promise<{filename:string;size:number}>;
  readMaterial: (id:number, filename:string)=>Promise<Uint8Array>;
};
function desktopProjects(): MaterialProjectsApi | undefined {
  return window.appifyDesktop?.projects as MaterialProjectsApi | undefined;
}

export const projectService = {
  isDesktop: () => Boolean(desktopProjects()),
  getCurrentProjectId: () => activeProjectId,

  getProjects: async (): Promise<Project[]> => {
    const desktop = desktopProjects();
    return desktop ? desktop.list() : browserFallback.list();
  },

  createProject: async (name: string, workspace: AppState): Promise<Project> => {
    const desktop = desktopProjects();
    const project = desktop ? await desktop.create(name, workspace) : await browserFallback.create(name, workspace);
    activeProjectId = project.id;
    return project;
  },

  openProject: async (id: number): Promise<ProjectFile> => {
    const desktop = desktopProjects();
    const document = desktop ? await desktop.open(id) : await browserFallback.open(id);
    activeProjectId = id;
    if (!document.workspace.pwaConfig?.productId) {
      document.workspace.pwaConfig = { ...document.workspace.pwaConfig, productId: crypto.randomUUID() };
      try {
        document.project = desktop
          ? await desktop.save(id, document.workspace)
          : await browserFallback.save(id, document.workspace);
      } catch {
        console.warn('[Appify] Não foi possível persistir a identidade do produto legado nesta abertura.');
      }
    }
    return document;
  },

  saveProject: async (id: number, workspace: AppState): Promise<Project> => {
    const desktop = desktopProjects();
    activeProjectId = id;
    return desktop ? desktop.save(id, workspace) : browserFallback.save(id, workspace);
  },

  duplicateProject: async (id: number): Promise<Project> => {
    const desktop = desktopProjects();
    return desktop ? desktop.duplicate(id) : browserFallback.duplicate(id);
  },

  deleteProject: async (id: number): Promise<void> => {
    const desktop = desktopProjects();
    if (activeProjectId === id) activeProjectId = null;
    return desktop ? desktop.remove(id) : browserFallback.remove(id);
  },

  exportBackup: async (id: number): Promise<ProjectOperationResult> => {
    const desktop = desktopProjects();
    if (!desktop) throw new Error('A exportação de backup está disponível no aplicativo desktop.');
    return desktop.exportBackup(id);
  },

  importBackup: async (): Promise<ProjectOperationResult> => {
    const desktop = desktopProjects();
    if (!desktop) throw new Error('A importação de backup está disponível no aplicativo desktop.');
    return desktop.importBackup();
  },

  saveBuild: async (id: number, filename: string, bytes: Uint8Array): Promise<ProjectBuildResult | null> => {
    const desktop = desktopProjects();
    return desktop ? desktop.saveBuild(id, filename, bytes) : null;
  },

  readAudio: async (id: number, filename: string): Promise<Uint8Array> => {
    const desktop = desktopProjects();
    if (!desktop) throw new Error('Áudio local disponível apenas no aplicativo desktop.');
    return desktop.readAudio(id, filename);
  },

  writeMaterial: async (id:number, filename:string, bytes:Uint8Array) => {
    const desktop=desktopProjects();
    if(!desktop) throw new Error('PDF local disponível apenas no aplicativo desktop.');
    return desktop.writeMaterial(id,filename,bytes);
  },

  readMaterial: async (id:number, filename:string):Promise<Uint8Array> => {
    const desktop=desktopProjects();
    if(!desktop) throw new Error('PDF local disponível apenas no aplicativo desktop.');
    return desktop.readMaterial(id,filename);
  },
};