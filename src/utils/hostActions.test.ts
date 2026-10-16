import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeHostDownloadUrl, parseHostActionRequest } from './hostActions';

test('host action protocol accepts only bounded known actions and targets',()=>{
  assert.deepEqual(parseHostActionRequest({type:'appify:host-action',action:'copy',value:'hello',targetId:'copy-1'}),{type:'appify:host-action',action:'copy',value:'hello',targetId:'copy-1'});
  assert.equal(parseHostActionRequest({type:'appify:host-action',action:'shell',value:'x',targetId:'x'}),null);
  assert.equal(parseHostActionRequest({type:'appify:host-action',action:'copy',value:'x'.repeat(20001),targetId:'x'}),null);
  assert.equal(parseHostActionRequest({type:'appify:host-action',action:'copy',value:'x',targetId:'../bad'}),null);
});

test('downloads allow packaged customer assets and credential-free HTTPS only',()=>{
  assert.deepEqual(normalizeHostDownloadUrl('./assets/documents/planner.pdf','https://app.example/course/'),{url:'https://app.example/course/assets/documents/planner.pdf',local:true});
  assert.deepEqual(normalizeHostDownloadUrl('https://cdn.example.com/guide.pdf','https://app.example/'),{url:'https://cdn.example.com/guide.pdf',local:false});
  assert.equal(normalizeHostDownloadUrl('javascript:alert(1)','https://app.example/'),null);
  assert.equal(normalizeHostDownloadUrl('https://user:pass@example.com/file.pdf','https://app.example/'),null);
  assert.equal(normalizeHostDownloadUrl('./assets/audio/private.mp3','https://app.example/'),null);
  assert.equal(normalizeHostDownloadUrl('../private.txt','https://app.example/course/'),null);
});
