import assert from 'node:assert/strict';
import test from 'node:test';
import { InteractiveContentStore } from './interactiveContent';
import { electronCsp } from '../src/utils/securityPolicies';
test('preview URLs serve only registered memory content; cleanup is owner scoped and size/count limits apply',()=>{
  const store=new InteractiveContentStore();const url=store.create(1,'<h1>Activity</h1>');
  assert.match(url,/^appify-content:\/\/activity\/[a-f0-9-]{36}$/);
  assert.equal(store.get(url),'<h1>Activity</h1>');
  assert.equal(store.get('appify-content://activity/../../private'),undefined);
  store.release(2,url);assert.ok(store.get(url));store.release(1,url);assert.equal(store.get(url),undefined);
  const other=store.create(2,'Other');
  for(let i=0;i<12;i++)store.create(1,'Test');assert.throws(()=>store.create(1,'Extra'));
  store.clear(1);assert.equal(store.get(other),'Other');
  assert.throws(()=>store.create(1,'x'.repeat(8*1024*1024+1)));
  const csp=electronCsp();assert.match(csp,/frame-src[^;]+appify-content:/);
  assert.doesNotMatch(csp.split('script-src')[1].split(';')[0],/unsafe-inline|unsafe-eval/);
});
