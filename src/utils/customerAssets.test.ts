import assert from 'node:assert/strict';
import test from 'node:test';
import { customerAssetPath, customerDesktopAssetUrl, customerWebAssetUrl } from './customerAssets';

test('customer asset resolver keeps assets scoped and rejects unsafe filenames', () => {
  assert.equal(customerAssetPath('audio','lesson-01.mp3'),'assets/audio/lesson-01.mp3');
  assert.equal(customerAssetPath('documents','guide.pdf'),'assets/documents/guide.pdf');
  assert.equal(customerAssetPath('files','worksheet.zip'),'assets/files/worksheet.zip');
  assert.equal(customerAssetPath('audio','../secret.mp3'),undefined);
  assert.equal(customerAssetPath('audio','folder/file.mp3'),undefined);
  assert.equal(customerAssetPath('audio',''),undefined);
});

test('web asset URLs stay relative to the deployed PWA base path', () => {
  assert.equal(customerWebAssetUrl('audio','lesson.mp3','https://example.com/course/index.html'),'https://example.com/course/assets/audio/lesson.mp3');
  assert.equal(customerWebAssetUrl('documents','guide.pdf','https://example.com/apps/product/'),'https://example.com/apps/product/assets/documents/guide.pdf');
});

test('desktop asset URLs use the narrow project protocol and require a project id', () => {
  assert.equal(customerDesktopAssetUrl('audio','lesson.mp3',42),'appify-asset://project/42/audio/lesson.mp3');
  assert.equal(customerDesktopAssetUrl('audio','lesson.mp3',null),undefined);
  assert.equal(customerDesktopAssetUrl('audio','../lesson.mp3',42),undefined);
});
