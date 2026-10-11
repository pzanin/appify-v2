import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtemp, mkdir, writeFile, symlink, rm} from 'node:fs/promises';
import path from 'node:path';
import {loadConfigFromFile, resolveConfig, optimizeDeps} from 'vite';

test('dev dependency scan ignores exported PWAs and backup bundles', async()=>{
  const root=await mkdtemp(path.join(process.cwd(),'node_modules','.appify-vite-scan-'));
  try {
    await symlink(path.join(process.cwd(),'node_modules'),path.join(root,'node_modules'),process.platform==='win32'?'junction':'dir');
    await writeFile(path.join(root,'index.html'),'<script type="module" src="/main.js"></script>');
    await writeFile(path.join(root,'main.js'),"import React from 'react'; import {createRoot} from 'react-dom/client'; import {motion} from 'motion/react'; console.log(React,createRoot,motion);");
    for(const directory of ['dist-pwa','release-backup','dist-electron-backup','public/pwa-template']) {
      const target=path.join(root,directory);await mkdir(target,{recursive:true});
      await writeFile(path.join(target,'index.html'),'<script type="module" src="./bundle.js"></script>');
      await writeFile(path.join(target,'bundle.js'),"import 'appify-test-dependency-that-does-not-exist';");
    }
    const loaded=await loadConfigFromFile({command:'serve',mode:'development'});
    assert.ok(loaded);
    const config=await resolveConfig({...loaded.config,configFile:false,root,cacheDir:path.join(root,'.vite'),plugins:[]},'serve');
    const metadata=await optimizeDeps(config,true);
    assert.ok(metadata.optimized.react);
    assert.ok(metadata.optimized['react-dom/client']);
    assert.ok(metadata.optimized['motion/react']);
    assert.equal(metadata.optimized['appify-test-dependency-that-does-not-exist'],undefined);
  } finally {await rm(root,{recursive:true,force:true});}
});
