import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { JSDOM } from 'jsdom';
import { createProtectedContentPackage } from './protectedContentPackage';
import { parseProtectedContentPackage } from './protectedContentRuntime';

const dom = new JSDOM('');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, DOMParser: dom.window.DOMParser });

const productId = '2ae26932-ade3-4a2d-9f36-f55d00c057fc';

test('protected package separates product lessons and local assets from the public PWA archive', async () => {
  const result = await createProtectedContentPackage({
    productId,
    version: '1.2.3',
    language: 'en-US',
    modules: [{ id: 4, name: 'Module', iconName: 'Book', status: 'Ativo', subs: [{
      id: 9, name: 'Lesson', type: 'html', contentType: 'html',
      contentHtml: '<h1>Protected lesson</h1><audio controls src="assets/audio/lesson.mp3"></audio><a data-appify-action="download" data-appify-value="assets/documents/guide.pdf">Guide</a>',
    }] }],
    feedPosts: [],
    pushNotifications: [],
    async readAudio(filename) { assert.equal(filename, 'lesson.mp3'); return new Uint8Array([1, 2, 3]); },
    async readMaterial(filename) { assert.equal(filename, 'guide.pdf'); return new Uint8Array([37, 80, 68, 70, 45, 49]); },
  });
  const zip = await JSZip.loadAsync(await result.arrayBuffer());
  const content = JSON.parse(await zip.file('content.json')!.async('string'));
  assert.equal(content.productId, productId);
  assert.equal(content.modules[0].subs[0].contentHtml.includes('Protected lesson'), true);
  assert.ok(zip.file('pages/lesson-4-9.html'));
  assert.deepEqual([...await zip.file('assets/audio/lesson.mp3')!.async('uint8array')], [1, 2, 3]);
  assert.deepEqual([...await zip.file('assets/documents/guide.pdf')!.async('uint8array')], [37, 80, 68, 70, 45, 49]);
});

test('protected packages reject missing assets, invalid product identity and private credentials', async () => {
  const base = {
    productId,
    version: '1.0.0',
    language: 'en-US',
    modules: [],
    feedPosts: [],
    pushNotifications: [],
    async readAudio() { return new Uint8Array(); },
    async readMaterial() { return new Uint8Array(); },
  };
  await assert.rejects(createProtectedContentPackage({ ...base, productId: 'invalid' }), /Identidade do produto inválida/);
  await assert.rejects(createProtectedContentPackage({ ...base, feedPosts: [{ id: 1, author: 'x', content: 'SERVICE_ROLE_KEY=really-private-credential', timestamp: '' }] }), /Exportação bloqueada/);
  await assert.rejects(createProtectedContentPackage({
    ...base,
    modules: [{ id: 1, name: 'Audio', iconName: 'Book', status: 'Ativo', subs: [{ id: 2, name: 'Lesson', type: 'html', contentType: 'html', contentHtml: '<audio src="assets/audio/missing.mp3"></audio>' }] }],
  }), /Áudio local ausente/);
});

test('protected runtime parses a package only for its matching product and validates assets', async () => {
  const result = await createProtectedContentPackage({
    productId, version: '1.0.0', language: 'en-US',
    modules: [{ id: 4, name: 'Module', iconName: 'Book', status: 'Ativo', subs: [{
      id: 9, name: 'Lesson', type: 'html', contentType: 'html', contentHtml: '<p>Protected lesson</p><audio src="assets/audio/lesson.mp3"></audio><a data-appify-action="download" data-appify-value="assets/documents/guide.pdf">Guide</a>',
    }] }], feedPosts: [], pushNotifications: [],
    async readAudio() { return new Uint8Array([1, 2, 3]); },
    async readMaterial() { return new Uint8Array([37, 80, 68, 70, 45, 49]); },
  });
  const loaded = await parseProtectedContentPackage(result, productId);
  assert.equal(loaded.modules[0].subs[0].name, 'Lesson');
  assert.ok(loaded.assets.get('pages/lesson-4-9.html'));
  assert.deepEqual([...new Uint8Array(await loaded.assets.get('assets/audio/lesson.mp3')!.arrayBuffer())], [1, 2, 3]);
  assert.equal(loaded.assets.get('assets/documents/guide.pdf')?.type, 'application/pdf');
  await assert.rejects(parseProtectedContentPackage(result, '11111111-1111-4111-8111-111111111111'), /does not match this product/);
});
