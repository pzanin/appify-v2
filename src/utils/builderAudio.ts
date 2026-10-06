import type { BuilderBlock } from '../types';
import { normalizeExternalUrl } from './externalLinks';

export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const MP3_PREFIX = 'data:audio/mpeg;base64,';

export function isEmbeddedMp3(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith(MP3_PREFIX) || value.length > MP3_PREFIX.length + 4 * Math.ceil(MAX_AUDIO_BYTES / 3)) return false;
  const payload = value.slice(MP3_PREFIX.length);
  if (!payload || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return false;
  const bytes = payload.length / 4 * 3 - (payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0);
  if (bytes < 4 || bytes > MAX_AUDIO_BYTES) return false;
  try {
    const header = atob(payload.slice(0,12));
    return header.startsWith('ID3') || (header.charCodeAt(0) === 255 && (header.charCodeAt(1) & 224) === 224 && (header.charCodeAt(1) & 6) !== 0);
  } catch { return false; }
}

export function builderAudioSource(props: BuilderBlock['props']): string {
  if (props.audioMode !== 'url') return isEmbeddedMp3(props.audioData) ? props.audioData : '';
  const url = normalizeExternalUrl(props.url?.trim());
  return url?.startsWith('https:') ? url : '';
}

export function readMp3File(file: File): Promise<string> {
  if (!/\.mp3$/i.test(file.name) || file.size === 0) return Promise.reject(new Error('Selecione um arquivo MP3 válido.'));
  if (file.size > MAX_AUDIO_BYTES) return Promise.reject(new Error('O limite é 5 MB por arquivo. Para áudios maiores, use um link HTTPS.'));
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onerror = reader.onabort = () => reject(new Error('Não foi possível ler o MP3. Tente novamente.'));
    reader.onload = () => {
      const payload = typeof reader.result === 'string' ? reader.result.split(',')[1] : '';
      const source = MP3_PREFIX + (payload || '');
      if (!isEmbeddedMp3(source)) { reject(new Error('O arquivo não possui um cabeçalho MP3 reconhecido.')); return; }
      resolve(source);
    };
    reader.readAsDataURL(file);
  });
}
