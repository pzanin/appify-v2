import JSZip from 'jszip';
import type { FeedPost, Module, PushNotification, PwaConfig } from '../types';
import { assertSafeArchive, isAllowedExportPath } from './exportSecurity';

export const MAX_DOWNLOADED_PROTECTED_CONTENT_BYTES = 60 * 1024 * 1024;

export interface ProtectedContentRuntimeData {
  schemaVersion: 1;
  productId: string;
  version: string;
  language: string;
  modules: Module[];
  banners: PwaConfig['banners'];
  gamificationAwards: PwaConfig['gamification']['awardsConfig'];
  feedPosts: FeedPost[];
  pushNotifications: PushNotification[];
}

export interface LoadedProtectedContent extends ProtectedContentRuntimeData {
  assets: Map<string, Blob>;
}

const PRODUCT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AUDIO_PATH = /^assets\/audio\/[A-Za-z0-9][A-Za-z0-9._-]{0,158}\.mp3$/i;
const PDF_PATH = /^assets\/documents\/[A-Za-z0-9][A-Za-z0-9._-]{0,158}\.pdf$/i;
const LESSON_PAGE_PATH = /^pages\/lesson-\d+-\d+\.html$/;

export async function parseProtectedContentPackage(blob: Blob, expectedProductId: string): Promise<LoadedProtectedContent> {
  if (!PRODUCT_ID.test(expectedProductId) || blob.size <= 0 || blob.size > MAX_DOWNLOADED_PROTECTED_CONTENT_BYTES) {
    throw new Error('Protected content package is invalid.');
  }
  const zip = await JSZip.loadAsync(await blob.arrayBuffer(), { checkCRC32: true, createFolders: false });
  await assertSafeArchive(zip);
  const contentFile = zip.file('content.json');
  if (!contentFile) throw new Error('Protected content package is incomplete.');
  const raw: unknown = JSON.parse(await contentFile.async('string'));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Protected content package is invalid.');
  const content = raw as Record<string, unknown>;
  if (content.schemaVersion !== 1 || content.productId !== expectedProductId
    || typeof content.version !== 'string' || typeof content.language !== 'string'
    || !Array.isArray(content.modules) || !Array.isArray(content.banners) || !Array.isArray(content.gamificationAwards)
    || !Array.isArray(content.feedPosts) || !Array.isArray(content.pushNotifications)) {
    throw new Error('Protected content package does not match this product.');
  }

  let uncompressedBytes = 0;
  const assets = new Map<string, Blob>();
  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir || path === 'content.json') continue;
    const isLessonPage = LESSON_PAGE_PATH.test(path);
    if (!isAllowedExportPath(path) || (!isLessonPage && !AUDIO_PATH.test(path) && !PDF_PATH.test(path))) {
      throw new Error('Protected content package contains an unsupported file.');
    }
    const bytes = await entry.async('uint8array');
    uncompressedBytes += bytes.byteLength;
    if (uncompressedBytes > MAX_DOWNLOADED_PROTECTED_CONTENT_BYTES) {
      throw new Error('Protected content package is too large.');
    }
    const type = isLessonPage ? 'text/html' : PDF_PATH.test(path) ? 'application/pdf' : 'audio/mpeg';
    assets.set(path, new Blob([bytes], { type }));
  }

  return {
    schemaVersion: 1,
    productId: expectedProductId,
    version: content.version,
    language: content.language,
    modules: content.modules as Module[],
    banners: content.banners as PwaConfig['banners'],
    gamificationAwards: content.gamificationAwards as PwaConfig['gamification']['awardsConfig'],
    feedPosts: content.feedPosts as FeedPost[],
    pushNotifications: content.pushNotifications as PushNotification[],
    assets,
  };
}
