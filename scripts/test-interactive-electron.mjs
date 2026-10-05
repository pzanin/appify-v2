import { build } from 'esbuild';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const directory=await mkdtemp(path.resolve('node_modules/.appify-electron-test-'));
try {
  const dom=new JSDOM('');Object.assign(globalThis,{window:dom.window,document:dom.window.document,DOMParser:dom.window.DOMParser});
  const modulePath=path.join(directory,'prepare.mjs');
  await build({entryPoints:['src/utils/interactiveHtml.ts'],outfile:modulePath,bundle:true,platform:'node',format:'esm',packages:'external'});
  const {prepareInteractiveHtml,INTERACTIVE_CSP}=await import(pathToFileURL(modulePath).href);
  const html=await prepareInteractiveHtml(await readFile('docs/examples/interactive-breathing.html','utf8'));
  await writeFile(path.join(directory,'activity.html'),html.replace('</body>',`<script>
    window.boundary={};
    try{parent.document.body.dataset.attacked='yes';boundary.parent='allowed'}catch{boundary.parent='blocked'}
    try{localStorage.setItem('private','x');boundary.storage='allowed'}catch{boundary.storage='blocked'}
    boundary.api=typeof window.appifyDesktop;boundary.node=typeof require;
    fetch('https://example.com/private').then(()=>boundary.network='allowed').catch(()=>boundary.network='blocked');
  </script></body>`));
  await build({entryPoints:['src/utils/securityPolicies.ts'],outfile:path.join(directory,'policies.cjs'),bundle:true,platform:'node',format:'cjs'});
  const script=String.raw`
const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {app,BrowserWindow,protocol}=require('electron');const {electronCsp}=require('./policies.cjs');
protocol.registerSchemesAsPrivileged([{scheme:'appify-content',privileges:{standard:true,secure:true}},{scheme:'appify-test',privileges:{standard:true,secure:true}}]);
app.commandLine.appendSwitch('headless');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
  let win;
  try {
    protocol.handle('appify-content',()=>new Response(fs.readFileSync(path.join(__dirname,'activity.html')),{headers:{'Content-Type':'text/html','Content-Security-Policy':${JSON.stringify('sandbox allow-scripts; '+INTERACTIVE_CSP)}}}));
    protocol.handle('appify-test',()=>new Response('<html><body><h1>Editor</h1></body></html>',{headers:{'Content-Type':'text/html','Content-Security-Policy':electronCsp()}}));
    win=new BrowserWindow({show:false,width:480,height:950,webPreferences:{preload:path.resolve('dist-electron/preload.cjs'),sandbox:true,nodeIntegration:false,contextIsolation:true,offscreen:true}});
    await win.loadURL('appify-test://editor/');
    await win.webContents.executeJavaScript("const frame=document.createElement('iframe');frame.sandbox='allow-scripts';frame.style='width:390px;height:820px;border:0';frame.src='appify-content://activity/example';document.body.append(frame)");
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Activity load timed out')),5000);const poll=setInterval(()=>{const frame=win.webContents.mainFrame.frames.find(f=>f.url.startsWith('appify-content:'));if(frame){clearTimeout(timer);clearInterval(poll);resolve()}},20)});
    const frame=win.webContents.mainFrame.frames.find(f=>f.url.startsWith('appify-content:'));
    const initial=await frame.executeJavaScript("({text:document.getElementById('btn-play').textContent,color:getComputedStyle(document.getElementById('breathing-circle')).backgroundColor,width:document.getElementById('breathing-circle').getBoundingClientRect().width,svg:document.querySelector('svg').getBoundingClientRect().width,boundary})");
    assert.equal(initial.text,'Iniciar');assert.equal(initial.color,'rgb(28, 66, 75)');assert.equal(initial.width,96);assert.equal(initial.svg,20);
    assert.deepEqual(initial.boundary,{parent:'blocked',storage:'blocked',api:'undefined',node:'undefined',network:'blocked'});
    await frame.executeJavaScript("document.getElementById('btn-play').click()");
    assert.equal(await frame.executeJavaScript("document.getElementById('timer-number').textContent"),'4');
    await frame.executeJavaScript("document.getElementById('tab-coherente').click();document.getElementById('btn-play').click()");
    assert.equal(await frame.executeJavaScript("document.getElementById('timer-number').textContent"),'5');
    await frame.executeJavaScript("document.getElementById('btn-reset').click()");
    assert.equal(await frame.executeJavaScript("document.getElementById('instruction-text').textContent"),'Preparado');
    assert.equal(await win.webContents.executeJavaScript("document.body.dataset.attacked || ''"),'');
    assert.equal(await win.webContents.executeJavaScript("typeof window.appifyDesktop.content.create"),'function');
    console.log('PASS: Chromium activity controls, local CSS, SVG sizing and opaque sandbox boundaries.');
  } catch(error){console.error(error);process.exitCode=1;} finally{win?.destroy();app.quit();}
});`;
  await writeFile(path.join(directory,'smoke.cjs'),script);
  // Electron 42 resolves/downloads its binary lazily after a clean npm ci.
  const executable=createRequire(import.meta.url)('electron');
  const args=[...(process.platform==='linux' && process.getuid?.()===0?['--no-sandbox']:[]),'--headless',path.join(directory,'smoke.cjs')];
  const child=spawn(executable,args,{stdio:['ignore','pipe','pipe'],env:{...process.env,ELECTRON_RUN_AS_NODE:''}});
  let output='';child.stdout.on('data',chunk=>output+=chunk);child.stderr.on('data',chunk=>output+=chunk);
  const status=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',resolve)});
  if(status!==0 || !output.includes('PASS:')){console.error(output);process.exitCode=1;}else console.log(output.split('\n').filter(line=>line.startsWith('PASS:')).join('\n'));
} finally {await rm(directory,{recursive:true,force:true});}
