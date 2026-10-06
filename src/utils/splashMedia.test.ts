import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import JSZip from 'jszip';
import { MAX_SPLASH_BYTES, readSplashFile, splashMediaSource } from './splashMedia';
import { TEST_SPLASH_MP4, TEST_SPLASH_GIF, TEST_SPLASH_WEBP, TEST_SPLASH_JPG } from './fixtures/splashMedia';
import { INITIAL_PWA_CONFIG } from '../constants';
import { publicFeatureConfig } from './projectFeatures';
import { assertSafeArchive } from './exportSecurity';
const dom = new JSDOM('');
Object.assign(globalThis,{FileReader:dom.window.FileReader});

test('opening uploads recognize actual MP4 and image bytes with missing MIME, reject renamed files and enforce the size limit',async()=>{
  for (const [extension,source] of [['mp4',TEST_SPLASH_MP4],['gif',TEST_SPLASH_GIF],['webp',TEST_SPLASH_WEBP],['JPG',TEST_SPLASH_JPG]]) {
    const bytes=Buffer.from(source.split(',')[1],'base64');
    assert.equal(await readSplashFile(new dom.window.File([bytes],`intro.${extension}`,{type:'application/octet-stream'})),source);
    assert.equal(splashMediaSource(source)?.kind,extension==='mp4'?'video':'image');
    await assert.rejects(readSplashFile(new dom.window.File(['<html>invalid</html>'],`intro.${extension}`)),/não corresponde/);
  }
  await assert.rejects(readSplashFile(new dom.window.File([Buffer.from(TEST_SPLASH_GIF.split(',')[1],'base64')],'intro.mp4')),/não corresponde/);
  await assert.rejects(readSplashFile(new dom.window.File([],'intro.mp4')),/válido/);
  await assert.rejects(readSplashFile(new dom.window.File(['<svg></svg>'],'intro.svg')),/válido/);
  await assert.rejects(readSplashFile(new dom.window.File([new Uint8Array(MAX_SPLASH_BYTES+1)],'intro.mp4')),/5 MB/);
  for (const value of ['https://example.com/intro.mp4','javascript:alert(1)','data:text/html;base64,PHNjcmlwdD4=','data:video/mp4;base64,@@@@', 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=']) assert.equal(splashMediaSource(value),null);
});

test('public export config and ZIP preserve opening media bytes and display settings without references to local files',async()=>{
  for (const source of [TEST_SPLASH_MP4,TEST_SPLASH_GIF,TEST_SPLASH_WEBP]) {
    const pwaConfig=publicFeatureConfig({...INITIAL_PWA_CONFIG,splashMediaMode:'file',splashMediaData:source,splashMediaFileName:'intro',splashMediaFit:'cover',splashMediaBackground:'#123456'});
    const zip=new JSZip();
    zip.file('app-data.json',JSON.stringify({pwaConfig}));
    await assertSafeArchive(zip);
    const reopened=await JSZip.loadAsync(await zip.generateAsync({type:'uint8array'}));
    const restored=JSON.parse(await reopened.file('app-data.json')!.async('string')).pwaConfig;
    assert.deepEqual(restored,pwaConfig);
    assert.deepEqual(Buffer.from(restored.splashMediaData.split(',')[1],'base64'),Buffer.from(source.split(',')[1],'base64'));
    assert.ok(splashMediaSource(restored.splashMediaData));
  }
});
