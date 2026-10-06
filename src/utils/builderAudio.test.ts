import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { builderAudioSource, isEmbeddedMp3, MAX_AUDIO_BYTES, readMp3File } from './builderAudio';
import { TEST_MP3 } from './fixtures/audioMp3';
const dom = new JSDOM('');
Object.assign(globalThis,{FileReader:dom.window.FileReader});

test('MP3 uploads normalize empty MIME types and reject wrong files, empty files and oversized files', async () => {
  const bytes = Buffer.from(TEST_MP3.split(',')[1],'base64');
  assert.equal(await readMp3File(new dom.window.File([bytes],'aula.MP3')),TEST_MP3);
  await assert.rejects(readMp3File(new dom.window.File([bytes],'aula.html')),/MP3 válido/);
  await assert.rejects(readMp3File(new dom.window.File([],'aula.mp3')),/MP3 válido/);
  await assert.rejects(readMp3File(new dom.window.File(['<html>test</html>'],'aula.mp3')),/cabeçalho MP3/);
  await assert.rejects(readMp3File(new dom.window.File([new Uint8Array(MAX_AUDIO_BYTES + 1)],'aula.mp3')),/5 MB/);
});

test('audio sources accept only embedded MP3 or credential-free HTTPS, and switching mode selects the correct source', () => {
  assert.equal(isEmbeddedMp3(TEST_MP3),true);
  assert.equal(builderAudioSource({audioMode:'file',audioData:TEST_MP3,url:'https://example.com/a.mp3'}),TEST_MP3);
  assert.equal(builderAudioSource({audioMode:'url',audioData:TEST_MP3,url:' https://example.com/a.mp3 '}),'https://example.com/a.mp3');
  for (const url of ['http://example.com/a.mp3','file:///a.mp3','javascript:alert(1)','mailto:x@example.com','https://user:password@example.com/a.mp3','blob:https://example.com/123']) assert.equal(builderAudioSource({audioMode:'url',url}),'');
  for (const audioData of ['data:text/html;base64,SUQz','data:audio/mpeg;base64,@@@@','data:audio/mpeg;base64,SGVsbG8=']) assert.equal(builderAudioSource({audioMode:'file',audioData}),'');
});
