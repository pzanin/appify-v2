export function isTrustedRendererUrl(candidate: string, expected: string): boolean {
  try {
    const actual = new URL(candidate);
    const allowed = new URL(expected);
    return actual.protocol === allowed.protocol && actual.host === allowed.host
      && actual.pathname === allowed.pathname && actual.search === allowed.search
      && !actual.username && !actual.password;
  } catch { return false; }
}

export function developmentRendererUrl(value: string | undefined, packaged: boolean): string | null {
  if (packaged || !value) return null;
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.username || url.password) throw new Error('Servidor de desenvolvimento inválido.');
  return url.href;
}

// Bound to the actual window and its main frame; file:// origins alone are not sufficient.
export function isTrustedSender(event: { sender: unknown; senderFrame: unknown },
  contents: { mainFrame: unknown; isDestroyed: () => boolean }, expectedUrl: string): boolean {
  if (!contents || contents.isDestroyed() || event.sender !== contents || !event.senderFrame
    || event.senderFrame !== contents.mainFrame) return false;
  return isTrustedRendererUrl((event.senderFrame as { url: string }).url, expectedUrl);
}
import type { AppState } from '../src/types';

export function validateWorkspace(value: unknown): AppState {
  if (!value || typeof value !== 'object') throw new Error('Dados do projeto inválidos.');
  const candidate = value as Partial<AppState>;
  if (typeof candidate.appName !== 'string' || !candidate.pwaConfig || typeof candidate.pwaConfig !== 'object'
    || !Array.isArray(candidate.modules) || candidate.modules.length > 10000) throw new Error('Dados do projeto inválidos.');
  for (const module of candidate.modules) {
    if (!module || !Number.isSafeInteger(module.id) || module.id <= 0 || !Array.isArray(module.subs)) throw new Error('Módulo inválido.');
    for (const lesson of module.subs) {
      if (!lesson || !Number.isSafeInteger(lesson.id) || lesson.id <= 0) throw new Error('Aula inválida.');
    }
  }
  if (JSON.stringify(value).length > 50 * 1024 * 1024) throw new Error('Projeto acima do limite de tamanho.');
  return value as AppState;
}

export async function safeOperation<T>(operation: () => T | Promise<T>): Promise<T> {
  try { return await operation(); }
  catch { throw new Error('Não foi possível concluir a operação. Tente novamente.'); }
}
