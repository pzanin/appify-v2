export const MAX_SPLASH_BYTES = 5 * 1024 * 1024;
export const MAX_SPLASH_VIDEO_MS = 10000;
const formats: Record<string, string> = { mp4:'video/mp4', gif:'image/gif', webp:'image/webp', png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg' };

export function splashMediaSource(value: unknown): { source: string; kind: 'video' | 'image' } | null {
  if (typeof value !== 'string' || value.length > 64 + 4 * Math.ceil(MAX_SPLASH_BYTES / 3)) return null;
  const match = /^data:(video\/mp4|image\/(?:gif|webp|png|jpeg));base64,/.exec(value);
  if (!match) return null;
  const payload = value.slice(match[0].length);
  if (!payload || payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) return null;
  const bytes = payload.length / 4 * 3 - (payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0);
  if (bytes < 12 || bytes > MAX_SPLASH_BYTES) return null;
  try {
    const header = atob(payload.slice(0,64));
    const mime = match[1];
    const valid = mime === 'video/mp4' ? header.slice(4,8) === 'ftyp' && ['isom','iso2','iso5','iso6','avc1','mp41','mp42','MSNV','dash'].includes(header.slice(8,12))
      : mime === 'image/gif' ? /^GIF8[79]a/.test(header)
      : mime === 'image/webp' ? header.startsWith('RIFF') && header.slice(8,12) === 'WEBP'
      : mime === 'image/png' ? header.startsWith('\x89PNG\r\n\x1a\n')
      : header.startsWith('\xff\xd8\xff');
    return valid ? { source:value, kind:mime === 'video/mp4' ? 'video' : 'image' } : null;
  } catch { return null; }
}

export function readSplashFile(file: File): Promise<string> {
  const mime = formats[file.name.split('.').pop()?.toLowerCase() || ''];
  if (!mime || !file.size) return Promise.reject(new Error('Selecione um MP4, GIF, WebP, PNG ou JPG válido.'));
  if (file.size > MAX_SPLASH_BYTES) return Promise.reject(new Error('O limite é 5 MB por abertura. Exporte uma versão mais leve.'));
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onerror = reader.onabort = () => reject(new Error('Não foi possível ler a abertura. Tente novamente.'));
    reader.onload = () => {
      const payload = typeof reader.result === 'string' ? reader.result.split(',')[1] : '';
      const source = `data:${mime};base64,${payload || ''}`;
      if (!splashMediaSource(source)) { reject(new Error('O conteúdo não corresponde ao formato selecionado. Renomear a extensão não converte o arquivo.')); return; }
      resolve(source);
    };
    reader.readAsDataURL(file);
  });
}
