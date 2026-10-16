import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';

const dom=new JSDOM('<div></div>',{url:'https://appify.test/'});
Object.assign(globalThis,{
  window:dom.window,
  document:dom.window.document,
  DOMParser:dom.window.DOMParser,
  Image:dom.window.Image,
  localStorage:dom.window.localStorage,
  FileReader: class {
    onload?: (event:{target:{result:ArrayBuffer}})=>void;
    readAsArrayBuffer(blob:Blob){ void blob.arrayBuffer().then(result=>this.onload?.({target:{result}})); }
  },
});
const {useAppStore}=await import('../store/useAppStore');
const {handleExportZIP}=await import('./exportPWA');

test('packaged PDF is copied into the PWA ZIP and listed for offline caching',async t=>{
  const {default:FileSaver}=await import('file-saver');
  const {default:JSZip}=await import('jszip');
  const pdf=new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x34,0x0a,0x25,0x45,0x4f,0x46]);
  const downloads:Blob[]=[];
  t.mock.method(FileSaver,'saveAs',(blob:Blob)=>downloads.push(blob));
  t.mock.method(dom.window.HTMLCanvasElement.prototype,'getContext',()=>({fillRect(){},fillText(){}}) as any);
  t.mock.method(dom.window.HTMLCanvasElement.prototype,'toBlob',function(callback:BlobCallback){callback(new Blob(['icon'],{type:'image/png'}));});
  t.mock.method(globalThis,'fetch',async()=>new Response('<html><head></head><body><script src="assets/pwa-engine-chunk.js"></script></body></html>'));
  const reads:string[]=[];
  (window as any).appifyDesktop={projects:{
    readMaterial:async(_id:number,filename:string)=>{reads.push(filename);return pdf;},
    saveBuild:async()=>({filename:'test-pwa.zip',size:1}),
  }};
  useAppStore.setState({
    currentProjectId:41,
    appName:'Material Test',
    pwaConfig:{...INITIAL_PWA_CONFIG,appName:'Material Test',productId:'material-export-test',offlineMode:true},
    modules:[{id:1,name:'Module',iconName:'Book',status:'Ativo',subs:[{id:1,name:'Lesson',type:'html',contentType:'html',contentHtml:'<a data-appify-action="download" data-appify-value="assets/documents/material-123-planner.pdf" data-appify-material="file-1" href="assets/documents/material-123-planner.pdf">Planner</a>'}]}],
  });
  assert.equal(await handleExportZIP(),true);
  assert.deepEqual(reads,['material-123-planner.pdf']);
  assert.equal(downloads.length,1);
  const zip=await JSZip.loadAsync(await downloads[0].arrayBuffer());
  const stored=await zip.file('assets/documents/material-123-planner.pdf')!.async('uint8array');
  assert.deepEqual([...stored],[...pdf]);
  const sw=await zip.file('sw.js')!.async('string');
  assert.match(sw,/\.\/assets\/documents\/material-123-planner\.pdf/);
  delete (window as any).appifyDesktop;
});
