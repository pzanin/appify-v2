import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { globSync } from 'node:fs';

const directory = await mkdtemp(path.join(process.cwd(), 'node_modules', '.appify-tests-'));
try {
  const tests = [...globSync('electron/**/*.test.ts'), ...globSync('src/**/*.test.ts')];
  const outputs = [];
  for (const [index, test] of tests.entries()) {
    const outfile = path.join(directory, `${index}.mjs`);
    await build({ entryPoints: [test], bundle: true, platform: 'node', format: 'esm', packages: 'external', outfile });
    outputs.push(outfile);
  }
  const result = spawnSync(process.execPath, ['--test', ...outputs], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally { await rm(directory, { recursive: true, force: true }); }
