import { execFileSync } from 'node:child_process';
import { readFileSync, globSync } from 'node:fs';
import { build } from 'esbuild';

const compiled = await build({ entryPoints: ['src/utils/exportSecurity.ts'], bundle: true, format: 'esm', write: false });
const { containsPrivateCredential } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const staged = process.argv.includes('--staged');
const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'];
const files = process.argv.includes('--build')
  ? [...globSync('dist/**/*.{js,css,html,json}'), ...globSync('dist-electron/*.{js,cjs,mjs}'), ...globSync('public/pwa-template/**/*.{js,css,html,json}') ]
  : execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean);
const blocked = [];
for (const file of files) {
  if (/(?:^|\/)\.env(?:\..*)?$/.test(file) && !file.endsWith('.env.example')) { blocked.push(file); continue; }
  if (!/\.(?:[cm]?[jt]sx?|json|html|css|md|ya?ml|toml|env|example|pem|key)$/.test(file)) continue;
  const content = staged ? execFileSync('git', ['show', `:${file}`], { encoding: 'utf8' }) : readFileSync(file, 'utf8');
  if (containsPrivateCredential(content)) blocked.push(file);
}
if (blocked.length) {
  console.error('Credenciais privadas ou arquivos de ambiente detectados (valores ocultos):');
  for (const file of blocked) console.error(`- ${file}`);
  process.exitCode = 1;
} else console.log(`Verificação de secrets aprovada: ${files.length} arquivos ${staged ? 'no index' : 'rastreados'}.`);
