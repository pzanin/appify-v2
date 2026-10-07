import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_PWA_CONFIG } from '../constants';
import { analyticsBaseUrl, summarizeAnalytics, trackAnalyticsEvent } from './analytics';
import { createIngestHandler, validEvent } from '../../supabase/functions/analytics-ingest/handler';
const projectId='11111111-1111-4111-8111-111111111111';
const installationId='22222222-2222-4222-8222-222222222222';
const eventId='33333333-3333-4333-8333-333333333333';
const event={eventId,projectId,installationId,eventName:'lesson_open',moduleId:'1',lessonId:'2',targetKind:'',targetId:''};
const config={...INITIAL_PWA_CONFIG,analyticsEnabled:true,analyticsProjectId:projectId,supabaseUrl:'https://test.supabase.co'};

test('analytics sends only anonymous content identifiers, excludes preview/disabled projects, isolates installations and ignores network/storage failure',async t=>{
  const memory=new Map<string,string>();
  Object.assign(globalThis,{localStorage:{getItem:(key:string)=>memory.get(key)||null,setItem:(key:string,value:string)=>memory.set(key,value)}});
  const requests: Array<{url:string;event:Record<string,string>}> = [];
  t.mock.method(globalThis,'fetch',async (url:string,options:RequestInit)=>{requests.push({url,event:JSON.parse(options.body as string)});return new Response(null,{status:204});});
  const details={eventName:'lesson_open' as const,moduleId:'1',lessonId:'2'};
  await trackAnalyticsEvent(config,false,details);
  await trackAnalyticsEvent({...config,analyticsEnabled:false},true,details);
  assert.equal(requests.length,0);
  await trackAnalyticsEvent(config,true,details);await trackAnalyticsEvent(config,true,details);
  assert.equal(requests[0].url,'https://test.supabase.co/functions/v1/analytics-ingest');
  assert.ok(validEvent(requests[0].event));
  assert.equal(requests[0].event.installationId,requests[1].event.installationId);
  assert.notEqual(requests[0].event.eventId,requests[1].event.eventId);
  assert.equal(Object.keys(requests[0].event).length,8);
  await trackAnalyticsEvent({...config,analyticsProjectId:installationId},true,details);
  assert.notEqual(requests[2].event.installationId,requests[0].event.installationId);
  t.mock.method(globalThis,'fetch',async()=>{throw new Error('offline');});
  await assert.doesNotReject(trackAnalyticsEvent(config,true,details));
  Object.assign(globalThis,{localStorage:{getItem:()=>{throw new Error('storage unavailable');}}});
  await assert.doesNotReject(trackAnalyticsEvent(config,true,details));
  for(const url of ['http://test.supabase.co','https://test.supabase.co.evil.com','https://test.supabase.co/path','https://test.supabase.co?x=1']) assert.equal(analyticsBaseUrl(url),null);
});

test('collector enforces origin, project allowlist, strict schema, size limit and methods before ingestion; hides backend errors',async()=>{
  let inserted=0;let limited=false;
  const handler=createIngestHandler({projectOrigin:async id=>id===projectId ? 'https://product.test' : null,ingest:async()=>{inserted++;return !limited;}});
  const request=(body:unknown=event,origin='https://product.test')=>new Request('https://test.supabase.co/functions/v1/analytics-ingest',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)});
  assert.equal((await handler(request())).status,204);assert.equal(inserted,1);
  for(const body of [{...event,email:'private@example.com'},{...event,eventName:'purchase'},{...event,moduleId:'https://private'},{...event,targetId:'x'},{...event,projectId:'invalid'},{...event,projectId:installationId}]) assert.ok((await handler(request(body))).status>=400);
  assert.equal((await handler(request(event,'https://wrong.test'))).status,403);
  assert.equal((await handler(request(event,''))).status,403);
  assert.equal((await handler(request({...event,targetId:'x'.repeat(3000)}))).status,400);
  assert.equal(inserted,1);
  limited=true;assert.equal((await handler(request())).status,429);
  assert.equal((await handler(new Request('https://test.supabase.co',{method:'GET',headers:{origin:'https://product.test'}}))).status,405);
  const failed=createIngestHandler({projectOrigin:async()=>{throw new Error('private backend details');},ingest:async()=>true});
  const result=await failed(request());assert.equal(result.status,503);assert.equal(await result.text(),'');
  assert.ok(validEvent({...event,eventName:'lesson_complete'}));
  assert.ok(validEvent({...event,eventName:'link_click',targetKind:'material',targetId:'block-7'}));
  assert.ok(validEvent({...event,eventName:'link_click',lessonId:'',targetKind:'offer',targetId:'1'}));
  assert.equal(validEvent({...event,eventName:'link_click',lessonId:'',targetKind:'material',targetId:'7'}),false);
});

test('report totals include only the three event types and reject invalid counters',()=>{
  assert.deepEqual(summarizeAnalytics([{event_name:'lesson_open',module_id:'1',lesson_id:'2',target_kind:'',target_id:'',total:3},{event_name:'link_click',module_id:'1',lesson_id:'2',target_kind:'material',target_id:'7',total:4}]),{lesson_open:3,lesson_complete:0,link_click:4});
});
