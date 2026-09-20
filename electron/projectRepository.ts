import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { AppState, Project, ProjectFile } from '../src/types';

const PROJECT_FILE = 'project.json';
const PROJECT_BACKUP_FILE = 'project.json.bak';
const PROJECT_DIRECTORIES = ['assets', 'pages', 'build'] as const;
const DATA_IMAGE_PATTERN = /data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=]+)/gi;
const ASSET_REFERENCE_PATTERN = /assets\/(asset-[a-f0-9]{24}\.(?:png|jpg|webp|gif|svg))/gi;
const MANAGED_PAGE_PATTERN = /^lesson-\d+-\d+\.html$/;

function transformStrings(value: unknown, transform: (text: string) => string): unknown {
  if (typeof value === 'string') return transform(value);
  if (Array.isArray(value)) return value.map(item => transformStrings(item, transform));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, transformStrings(item, transform)]));
  }
  return value;
}

function collectStringMatches(value: unknown, pattern: RegExp) {
  const matches = new Set<string>();
  transformStrings(value, text => {
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags))) matches.add(match[0]);
    return text;
  });
  return matches;
}

function imageExtension(mimeSubtype: string) {
  if (/^jpe?g$/i.test(mimeSubtype)) return 'jpg';
  if (/^svg\+xml$/i.test(mimeSubtype)) return 'svg';
  return mimeSubtype.toLowerCase();
}

function imageMimeType(extension: string) {
  if (extension === 'jpg') return 'image/jpeg';
  if (extension === 'svg') return 'image/svg+xml';
  return `image/${extension}`;
}

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

function isMissingFile(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT');
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
    // open() rehydrates local asset references, keeping the JSON backup self-contained.
    return this.open(id);
  }

  async writeBuildArchive(id: number, filename: string, bytes: Uint8Array) {
    const directory = await this.findDirectory(id);
    const buildDirectory = path.join(directory, 'build');
    await fs.mkdir(buildDirectory, { recursive: true });
    const safeFilename = `${safeFolderName(path.basename(filename, path.extname(filename)))}.zip`;
    const target = path.join(buildDirectory, safeFilename);
    const temporary = path.join(buildDirectory, `${safeFilename}.${process.pid}.${Date.now()}.tmp`);

    await fs.writeFile(temporary, bytes);
    const stats = await fs.stat(temporary);
    if (stats.size === 0) {
      await fs.rm(temporary, { force: true });
      throw new Error('O pacote PWA gerado está vazio.');
    }
    await fs.copyFile(temporary, target);
    await fs.rm(temporary, { force: true });
    await fs.writeFile(path.join(buildDirectory, 'build-info.json'), `${JSON.stringify({
      filename: safeFilename,
      generatedAt: new Date().toISOString(),
      size: stats.size,
    }, null, 2)}\n`, 'utf8');

    return { filename: safeFilename, filePath: target, size: stats.size };
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
    const target = path.join(directory, PROJECT_FILE);
    try {
      return await this.hydrateAssetReferences(directory, await this.readDocument(target));
    } catch (primaryError) {
      const candidates = [path.join(directory, PROJECT_BACKUP_FILE)];
      const entries = await fs.readdir(directory).catch(() => [] as string[]);
      candidates.push(...entries
        .filter(name => name.startsWith(`${PROJECT_FILE}.`) && name.endsWith('.tmp'))
        .sort()
        .reverse()
        .map(name => path.join(directory, name)));
      candidates.push(path.join(directory, `${PROJECT_FILE}.tmp`));

      for (const candidate of candidates) {
        try {
          const recovered = await this.readDocument(candidate);
          await fs.copyFile(candidate, target);
          console.warn(`[Appify] Projeto recuperado automaticamente a partir de ${path.basename(candidate)}.`);
          return await this.hydrateAssetReferences(directory, recovered);
        } catch {
          // Try the next recovery candidate.
        }
      }
      throw primaryError;
    }
  }

  private async writeDocument(directory: string, document: ProjectFile) {
    const target = path.join(directory, PROJECT_FILE);
    const backup = path.join(directory, PROJECT_BACKUP_FILE);
    const temporary = path.join(directory, `${PROJECT_FILE}.${process.pid}.${Date.now()}.tmp`);
    const storedDocument = await this.externalizeDataImages(directory, document);
    const serialized = `${JSON.stringify(storedDocument, null, 2)}\n`;

    await fs.writeFile(temporary, serialized, 'utf8');
    await this.readDocument(temporary);

    let hasBackup = false;
    try {
      await fs.copyFile(target, backup);
      hasBackup = true;
    } catch (error) {
      if (!isMissingFile(error)) throw error;
    }

    try {
      // copyFile is more reliable than replacing an open file with rename on Windows.
      await fs.copyFile(temporary, target);
      await this.readDocument(target);
      await fs.rm(temporary, { force: true });
      await this.writeLessonPages(directory, storedDocument.workspace).catch(error => {
        console.warn('[Appify] Não foi possível atualizar as cópias em pages/.', error);
      });
    } catch (error) {
      if (hasBackup) {
        await fs.copyFile(backup, target).catch(() => undefined);
      }
      throw error;
    }
  }

  private async readDocument(filePath: string): Promise<ProjectFile> {
    const raw = await fs.readFile(filePath, 'utf8');
    const document = JSON.parse(raw) as unknown;
    assertProjectFile(document);
    return document;
  }

  private async externalizeDataImages(directory: string, document: ProjectFile): Promise<ProjectFile> {
    const dataUrls = collectStringMatches(document, DATA_IMAGE_PATTERN);
    if (dataUrls.size === 0) return document;

    const assetsDirectory = path.join(directory, 'assets');
    await fs.mkdir(assetsDirectory, { recursive: true });
    const replacements = new Map<string, string>();

    for (const dataUrl of dataUrls) {
      const match = /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl);
      if (!match) continue;
      const bytes = Buffer.from(match[2], 'base64');
      if (bytes.length === 0) continue;
      const extension = imageExtension(match[1]);
      const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 24);
      const filename = `asset-${hash}.${extension}`;
      await fs.writeFile(path.join(assetsDirectory, filename), bytes);
      replacements.set(dataUrl, `assets/${filename}`);
    }

    return transformStrings(document, text => {
      let result = text;
      for (const [dataUrl, reference] of replacements) result = result.split(dataUrl).join(reference);
      return result;
    }) as ProjectFile;
  }

  private async hydrateAssetReferences(directory: string, document: ProjectFile): Promise<ProjectFile> {
    const references = collectStringMatches(document, ASSET_REFERENCE_PATTERN);
    if (references.size === 0) return document;
    const replacements = new Map<string, string>();

    await Promise.all([...references].map(async reference => {
      const filename = path.basename(reference);
      try {
        const bytes = await fs.readFile(path.join(directory, 'assets', filename));
        const extension = path.extname(filename).slice(1).toLowerCase();
        replacements.set(reference, `data:${imageMimeType(extension)};base64,${bytes.toString('base64')}`);
      } catch (error) {
        console.warn(`[Appify] Asset local ausente: ${filename}`, error);
      }
    }));

    return transformStrings(document, text => {
      let result = text;
      for (const [reference, dataUrl] of replacements) result = result.split(reference).join(dataUrl);
      return result;
    }) as ProjectFile;
  }

  private async writeLessonPages(directory: string, workspace: AppState) {
    const pagesDirectory = path.join(directory, 'pages');
    await fs.mkdir(pagesDirectory, { recursive: true });
    const existing = await fs.readdir(pagesDirectory).catch(() => [] as string[]);
    await Promise.all(existing
      .filter(filename => MANAGED_PAGE_PATTERN.test(filename))
      .map(filename => fs.rm(path.join(pagesDirectory, filename), { force: true })));

    const writes: Promise<void>[] = [];
    for (const module of workspace.modules) {
      for (const lesson of module.subs || []) {
        if (lesson.contentType !== 'html') continue;
        const content = lesson.contentHtml || lesson.content_html || '';
        if (!content.trim()) continue;
        const pageContent = content.replace(
          /([="'(])assets\/(asset-[a-f0-9]{24}\.(?:png|jpg|webp|gif|svg))/gi,
          '$1../assets/$2',
        );
        const html = /<html[\s>]/i.test(pageContent)
          ? pageContent
          : `<!doctype html>\n<html lang="${workspace.pwaConfig.language || 'pt-BR'}">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>\n<body>${pageContent}</body>\n</html>\n`;
        writes.push(fs.writeFile(
          path.join(pagesDirectory, `lesson-${module.id}-${lesson.id}.html`),
          html,
          'utf8',
        ));
      }
    }
    await Promise.all(writes);
  }
}
