import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const scriptUrl = pathToFileURL(path.resolve('scripts/copy-pwa-template.mjs')).href;
const { copyPwaTemplate } = await import(scriptUrl);

test('PWA template copy creates the missing directory and updates nested assets in paths with spaces', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'Appify build '));
  try {
    mkdirSync(path.join(root, 'dist-pwa','assets'), { recursive:true });
    writeFileSync(path.join(root,'dist-pwa','index.html'), 'new index');
    writeFileSync(path.join(root,'dist-pwa','assets','pwa-engine.js'), 'new engine');
    copyPwaTemplate(root);
    assert.equal(readFileSync(path.join(root,'public','pwa-template','index.html'),'utf8'),'new index');
    const target = path.join(root,'public','pwa-template','assets','pwa-engine.js');
    assert.equal(readFileSync(target,'utf8'),'new engine');
    writeFileSync(path.join(root,'dist-pwa','assets','pwa-engine.js'), 'updated engine');
    copyPwaTemplate(root);
    assert.equal(readFileSync(target,'utf8'),'updated engine');
    assert.equal(existsSync(path.join(root,'public','pwa-template','dist-pwa')),false);
  } finally { rmSync(root,{recursive:true,force:true}); }
});
