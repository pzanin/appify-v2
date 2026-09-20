import type { AppState, Project, ProjectBuildResult, ProjectFile, ProjectOperationResult } from '../types';

const BROWSER_STORAGE_KEY = 'appify-browser-projects-v1';

type BrowserProject = ProjectFile;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getBrowserProjects(): BrowserProject[] {
  try {
    const raw = localStorage.getItem(BROWSER_STORAGE_KEY);
    return raw ? JSON.parse(raw) as BrowserProject[] : [];
  } catch {
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
    workspace.pwaConfig = { ...workspace.pwaConfig, appName: name };
    return browserFallback.create(name, workspace);
  },
  async remove(id: number) {
    setBrowserProjects(getBrowserProjects().filter(item => item.project.id !== id));
  },
};

function desktopProjects() {
  return window.appifyDesktop?.projects;
}

export const projectService = {
  isDesktop: () => Boolean(desktopProjects()),

  getProjects: async (): Promise<Project[]> => {
    const desktop = desktopProjects();
    return desktop ? desktop.list() : browserFallback.list();
  },

  createProject: async (name: string, workspace: AppState): Promise<Project> => {
    const desktop = desktopProjects();
    return desktop ? desktop.create(name, workspace) : browserFallback.create(name, workspace);
  },

  openProject: async (id: number): Promise<ProjectFile> => {
    const desktop = desktopProjects();
    return desktop ? desktop.open(id) : browserFallback.open(id);
  },

  saveProject: async (id: number, workspace: AppState): Promise<Project> => {
    const desktop = desktopProjects();
    return desktop ? desktop.save(id, workspace) : browserFallback.save(id, workspace);
  },

  duplicateProject: async (id: number): Promise<Project> => {
    const desktop = desktopProjects();
    return desktop ? desktop.duplicate(id) : browserFallback.duplicate(id);
  },

  deleteProject: async (id: number): Promise<void> => {
    const desktop = desktopProjects();
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
};
