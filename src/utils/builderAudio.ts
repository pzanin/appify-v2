import type { BuilderBlock } from '../types';
import { normalizeExternalUrl } from './externalLinks';

export const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const MP3_PREFIX = 'data:audio/mpeg;base64,';
const M4A_PREFIX = 'data:audio/mp4;base64,';

export function isEmbeddedAudio(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const prefix = value.startsWith(MP3_PREFIX) ? MP3_PREFIX : value.startsWith(M4A_PREFIX) ? M4A_PREFIX : '';
  if (!prefix || value.length > prefix.length + 4 * Math.ceil(MAX_AUDIO_BYTES / 3)) return false;
  const payload = value.slice(prefix.length);
  if (!payload || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return false;
  const bytes = payload.length / 4 * 3 - (payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0);
  if (bytes < 4 || bytes > MAX_AUDIO_BYTES) return false;
  try {
    const header = atob(payload.slice(0,64));
    if (prefix === M4A_PREFIX) return header.length >= 12 && header.slice(4,8) === 'ftyp' && ['M4A ', 'M4B ', 'isom', 'iso2', 'iso5', 'iso6', 'mp41', 'mp42', 'dash'].includes(header.slice(8,12));
    return header.startsWith('ID3') || (header.charCodeAt(0) === 255 && (header.charCodeAt(1) & 224) === 224 && (header.charCodeAt(1) & 6) !== 0);
  } catch { return false; }
}

export function builderAudioSource(props: BuilderBlock['props']): string {
  if (props.audioMode !== 'url') return isEmbeddedAudio(props.audioData) ? props.audioData : '';
  const url = normalizeExternalUrl(props.url?.trim());
  return url?.startsWith('https:') ? url : '';
}

export function readAudioFile(file: File): Promise<string> {
  if (!/\.(mp3|m4a)$/i.test(file.name) || file.size === 0) return Promise.reject(new Error('Selecione um arquivo MP3 ou M4A válido.'));
  if (file.size > MAX_AUDIO_BYTES) return Promise.reject(new Error('O limite é 5 MB por arquivo. Para áudios maiores, use um link HTTPS.'));
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onerror = reader.onabort = () => reject(new Error('Não foi possível ler o áudio. Tente novamente.'));
    reader.onload = () => {
      const payload = typeof reader.result === 'string' ? reader.result.split(',')[1] : '';
      const source = (/\.m4a$/i.test(file.name) ? M4A_PREFIX : MP3_PREFIX) + (payload || '');
      if (!isEmbeddedAudio(source)) { reject(new Error('O conteúdo não corresponde a um MP3 ou M4A reconhecido. Renomear a extensão não converte o áudio.')); return; }
      resolve(source);
    };
    reader.readAsDataURL(file);
  });
}
