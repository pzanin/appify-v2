import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AppState, Project, ProjectFile } from '../src/types';

const PROJECT_FILE = 'project.json';
const PROJECT_DIRECTORIES = ['assets', 'pages', 'build'] as const;

function safeFolderName(name: string) {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 60);

  const windowsReserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  if (!cleaned || windowsReserved.test(cleaned)) return 'Projeto';
  return cleaned;
}

function cloneWorkspace(workspace: AppState): AppState {
  return JSON.parse(JSON.stringify(workspace)) as AppState;
}

function assertProjectFile(value: unknown): asserts value is ProjectFile {
  if (!value || typeof value !== 'object') throw new Error('Backup de projeto inválido.');
  const candidate = value as Partial<ProjectFile>;
  if (candidate.schemaVersion !== 1 || !candidate.project || !candidate.workspace) {
    throw new Error('Formato de projeto não reconhecido.');
  }
  if (typeof candidate.project.id !== 'number' || typeof candidate.project.name !== 'string') {
    throw new Error('Metadados do projeto inválidos.');
  }
}

export class ProjectRepository {
  private readonly projectsRoot: string;

  constructor(projectsRoot: string) {
    this.projectsRoot = projectsRoot;
  }

  get rootPath() {
    return this.projectsRoot;
  }

  async initialize() {
    await fs.mkdir(this.projectsRoot, { recursive: true });
  }

  async list(): Promise<Project[]> {
    await this.initialize();
    const entries = await fs.readdir(this.projectsRoot, { withFileTypes: true });
    const projects = await Promise.all(entries.filter(entry => entry.isDirectory()).map(async entry => {
      try {
        const document = await this.readFromDirectory(path.join(this.projectsRoot, entry.name));
        return document.project;
      } catch (error) {
        console.warn(`[Appify] Ignorando pasta de projeto inválida: ${entry.name}`, error);
        return null;
      }
    }));

    return projects
      .filter((project): project is Project => project !== null)
      .sort((a, b) => Date.parse(b.lastEdited) - Date.parse(a.lastEdited));
  }

  async create(name: string, workspace: AppState): Promise<Project> {
    await this.initialize();
    const normalizedName = name.trim() || 'Novo App';
    const id = await this.nextProjectId();
    const project: Project = {
      id,
      name: normalizedName,
      status: 'Rascunho',
      lastEdited: new Date().toISOString(),
      users: 0,
      color: workspace.pwaConfig.themeColor || '#7c6fff',
      url: `${safeFolderName(normalizedName).toLowerCase().replace(/\s+/g, '')}.vapp.pro`,
      logoBase64: workspace.pwaConfig.logoBase64 || undefined,
    };
    const directory = path.join(this.projectsRoot, this.directoryName(project));
    await this.createStructure(directory);
    await this.writeDocument(directory, { schemaVersion: 1, project, workspace: cloneWorkspace(workspace) });
    return project;
  }

  async open(id: number): Promise<ProjectFile> {
    const directory = await this.findDirectory(id);
    return this.readFromDirectory(directory);
  }

  async save(id: number, workspace: AppState): Promise<Project> {
    const directory = await this.findDirectory(id);
    const existing = await this.readFromDirectory(directory);
    const project: Project = {
      ...existing.project,
      name: workspace.appName.trim() || existing.project.name,
      lastEdited: new Date().toISOString(),
      color: workspace.pwaConfig.themeColor || existing.project.color,
      logoBase64: workspace.pwaConfig.logoBase64 || undefined,
    };
    await this.writeDocument(directory, { schemaVersion: 1, project, workspace: cloneWorkspace(workspace) });
    return project;
  }

  async duplicate(id: number): Promise<Project> {
    const sourceDirectory = await this.findDirectory(id);
    const source = await this.readFromDirectory(sourceDirectory);
    const copiedName = `${source.project.name} (cópia)`;
    const copiedWorkspace = cloneWorkspace(source.workspace);
    copiedWorkspace.appName = copiedName;
    copiedWorkspace.pwaConfig = { ...copiedWorkspace.pwaConfig, appName: copiedName };

    const newProject = await this.create(copiedName, copiedWorkspace);
    const targetDirectory = await this.findDirectory(newProject.id);
    for (const directoryName of PROJECT_DIRECTORIES) {
      await fs.cp(path.join(sourceDirectory, directoryName), path.join(targetDirectory, directoryName), {
        recursive: true,
        force: true,
      });
    }
    return newProject;
  }

  async remove(id: number): Promise<string> {
    return this.findDirectory(id);
  }

  async importDocument(value: unknown): Promise<Project> {
    assertProjectFile(value);
    const workspace = cloneWorkspace(value.workspace);
    const imported = await this.create(`${value.project.name} (importado)`, workspace);
    const directory = await this.findDirectory(imported.id);
    const project: Project = {
      ...value.project,
      id: imported.id,
      name: imported.name,
      lastEdited: new Date().toISOString(),
    };
    workspace.appName = project.name;
    workspace.pwaConfig = { ...workspace.pwaConfig, appName: project.name };
    await this.writeDocument(directory, { schemaVersion: 1, project, workspace });
    return project;
  }

  async readBackup(id: number): Promise<ProjectFile> {
    return this.open(id);
  }

  private async createStructure(directory: string) {
    await fs.mkdir(directory, { recursive: false });
    await Promise.all(PROJECT_DIRECTORIES.map(name => fs.mkdir(path.join(directory, name), { recursive: true })));
  }

  private directoryName(project: Project) {
    return `${safeFolderName(project.name)}-${project.id}`;
  }

  private async nextProjectId() {
    let id = Date.now();
    const existing = new Set((await this.list()).map(project => project.id));
    while (existing.has(id)) id += 1;
    return id;
  }

  private async findDirectory(id: number) {
    await this.initialize();
    const entries = await fs.readdir(this.projectsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const directory = path.join(this.projectsRoot, entry.name);
      try {
        const document = await this.readFromDirectory(directory);
        if (document.project.id === id) return directory;
      } catch {
        // Invalid directories are ignored instead of being exposed to the renderer.
      }
    }
    throw new Error('Projeto local não encontrado.');
  }

  private async readFromDirectory(directory: string): Promise<ProjectFile> {
    const raw = await fs.readFile(path.join(directory, PROJECT_FILE), 'utf8');
    const document = JSON.parse(raw) as unknown;
    assertProjectFile(document);
    return document;
  }

  private async writeDocument(directory: string, document: ProjectFile) {
    const target = path.join(directory, PROJECT_FILE);
    const temporary = `${target}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    await fs.rename(temporary, target);
  }
}
