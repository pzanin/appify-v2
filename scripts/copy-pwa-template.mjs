import { cpSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// No shell glob expansion: works on Windows even when the destination is absent.
export function copyPwaTemplate(root = fileURLToPath(new URL('../', import.meta.url))) {
  const source = path.join(root, 'dist-pwa');
  const destination = path.join(root, 'public', 'pwa-template');
  if (!statSync(path.join(source, 'index.html')).isFile()) throw new Error('Template PWA sem index.html.');
  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  copyPwaTemplate();
  console.log('Template PWA copiado para public/pwa-template.');
}
