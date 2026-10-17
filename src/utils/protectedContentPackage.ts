import JSZip from 'jszip';
import type { FeedPost, Module, PushNotification, PwaConfig } from '../types';
import { prepareInteractiveHtml } from './interactiveHtml';
import { prepareResponsiveHtml } from './htmlContent';
import { lessonHtml } from './lessonHtml';
import { assertPublicExport, assertSafeArchive, isAllowedExportPath } from './exportSecurity';
import { isPdfBytes } from './builderMaterial';

export const MAX_PROTECTED_CONTENT_BYTES = 50 * 1024 * 1024;

export interface ProtectedContentPackageInput {
  productId: string;
  version: string;
  language: string;
  modules: Module[];
  banners?: PwaConfig['banners'];
  gamificationAwards?: PwaConfig['gamification']['awardsConfig'];
  feedPosts: FeedPost[];
  pushNotifications: PushNotification[];
  readAudio: (filename: string) => Promise<Uint8Array>;
  readMaterial: (filename: string) => Promise<Uint8Array>;
}

function audioFilenames(html: string) {
  return [...html.matchAll(/(?:\.\.\/|\.\/)?assets\/audio\/([A-Za-z0-9][A-Za-z0-9._-]{0,158}\.mp3)/gi)].map(match => match[1]);
}

function materialFilenames(html: string) {
  return [...html.matchAll(/(?:\.\.\/|\.\/)?assets\/documents\/([A-Za-z0-9][A-Za-z0-9._-]{0,158}\.pdf)/gi)].map(match => match[1]);
}

function assertProductId(value: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('Identidade do produto inválida.');
  }
}

export async function createProtectedContentPackage(input: ProtectedContentPackageInput): Promise<Blob> {
  assertProductId(input.productId);
  const audio = new Set<string>();
  const materials = new Set<string>();
  const content = {
    schemaVersion: 1,
    productId: input.productId,
    version: input.version,
    language: input.language,
    createdAt: new Date().toISOString(),
    modules: input.modules,
    banners: input.banners || [],
    gamificationAwards: input.gamificationAwards || [],
    feedPosts: input.feedPosts,
    pushNotifications: input.pushNotifications,
  };
  assertPublicExport(content);

  const zip = new JSZip();
  zip.file('content.json', JSON.stringify(content));
  for (const module of input.modules) {
    for (const lesson of module.subs || []) {
      if (lesson.contentType !== 'html') continue;
      const html = lessonHtml(lesson, input.language);
      if (!html.trim()) continue;
      audioFilenames(html).forEach(filename => audio.add(filename));
      materialFilenames(html).forEach(filename => materials.add(filename));
      const pagePath = `pages/lesson-${module.id}-${lesson.id}.html`;
      if (!isAllowedExportPath(pagePath)) throw new Error('Identificador de aula inválido.');
      zip.file(pagePath, lesson.htmlInteractive ? await prepareInteractiveHtml(html) : prepareResponsiveHtml(html, input.language));
    }
  }

  for (const filename of audio) {
    const path = `assets/audio/${filename}`;
    if (!isAllowedExportPath(path)) throw new Error('Arquivo de áudio inválido.');
    const bytes = await input.readAudio(filename);
    if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) throw new Error('Áudio local ausente no projeto.');
    zip.file(path, bytes);
  }
  for (const filename of materials) {
    const path = `assets/documents/${filename}`;
    if (!isAllowedExportPath(path)) throw new Error('PDF local inválido.');
    const bytes = await input.readMaterial(filename);
    if (!(bytes instanceof Uint8Array) || !isPdfBytes(bytes)) throw new Error('PDF local inválido ou ausente no projeto.');
    zip.file(path, bytes);
  }

  await assertSafeArchive(zip);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
  if (blob.size > MAX_PROTECTED_CONTENT_BYTES) {
    throw new Error('O pacote ultrapassa o limite de 50 MB do armazenamento privado atual.');
  }
  return blob;
}
