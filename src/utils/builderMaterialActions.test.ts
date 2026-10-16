import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('');
Object.assign(globalThis,{window:dom.window,document:dom.window.document,DOMParser:dom.window.DOMParser});
const { builderDownloadUrl, generateBuilderHtml, getDefaultProps } = await import('./builderHtml');
const { isPdfBytes, packagedMaterialFilename } = await import('./builderMaterial');

test('packaged PDF references and bytes are strictly validated',()=>{
  assert.equal(packagedMaterialFilename('assets/documents/material-123-planner.pdf'),'material-123-planner.pdf');
  assert.equal(packagedMaterialFilename('../documents/planner.pdf'),null);
  assert.equal(packagedMaterialFilename('assets/documents/../secret.pdf'),null);
  assert.equal(packagedMaterialFilename('assets/documents/planner.exe'),null);
  assert.equal(isPdfBytes(new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31])),true);
  assert.equal(isPdfBytes(new TextEncoder().encode('<html>fake pdf</html>')),false);
  assert.equal(builderDownloadUrl('assets/documents/material-123-planner.pdf'),'assets/documents/material-123-planner.pdf');
  assert.equal(builderDownloadUrl('assets/documents/../secret.pdf'),'');
});

test('visual builder emits declared host actions for download, copy and print',()=>{
  const download=generateBuilderHtml([{id:'file-1',type:'download',props:{...getDefaultProps('download'),url:'assets/documents/material-123-planner.pdf',buttonText:'Get planner'}}]);
  const downloadDoc=new JSDOM(download).window.document;
  const link=downloadDoc.querySelector('[data-appify-action="download"]')!;
  assert.equal(link.getAttribute('data-appify-value'),'assets/documents/material-123-planner.pdf');
  assert.equal(link.getAttribute('data-appify-material'),'file-1');
  assert.equal(link.textContent,'Get planner');

  const copy=generateBuilderHtml([{id:'copy-1',type:'copyAction',props:{...getDefaultProps('copyAction','', 'en-US'),content:'My answer <safe>',buttonText:'Copy answer'}}]);
  const copyDoc=new JSDOM(copy).window.document;
  const copyVisible=copyDoc.querySelector('[data-appify-copy-content="copy-1"]')!;
  const copyLink=copyDoc.querySelector('[data-appify-action="copy"]')!;
  assert.equal(copyVisible.textContent,'My answer <safe>');
  assert.ok(copy.includes('My answer &lt;safe&gt;'));
  assert.equal(copyLink.getAttribute('data-appify-target'),'copy-1');
  assert.equal(copyLink.getAttribute('data-appify-value'),'My answer <safe>');
  assert.equal(copyLink.textContent,'Copy answer');

  const print=generateBuilderHtml([{id:'print-1',type:'printAction',props:{...getDefaultProps('printAction','', 'en-US'),buttonText:'Print / Save PDF'}}]);
  const printLink=new JSDOM(print).window.document.querySelector('[data-appify-action="print"]')!;
  assert.equal(printLink.getAttribute('data-appify-target'),'print-1');
  assert.equal(printLink.textContent,'Print / Save PDF');
});

test('new action defaults follow the product language',()=>{
  const en=getDefaultProps('copyAction','', 'en-US') as Record<string,unknown>;
  const es=getDefaultProps('printAction','', 'es') as Record<string,unknown>;
  const fr=getDefaultProps('copyAction','', 'fr') as Record<string,unknown>;
  assert.equal(en.buttonText,'Copy content');
  assert.equal(es.buttonText,'Imprimir / Guardar PDF');
  assert.equal(fr.buttonText,'Copier le contenu');
});
