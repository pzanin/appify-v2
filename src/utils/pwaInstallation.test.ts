import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createInstallController, installPlatform } from './pwaInstallation';
function setup() { const dom = new JSDOM('',{url:'https://appify.test'});return {dom,controller:createInstallController(dom.window as unknown as Window)}; }
function promptEvent(dom:JSDOM,outcome:'accepted'|'dismissed',failure=false) {
  let calls=0;
  const event=new dom.window.Event('beforeinstallprompt',{cancelable:true});
  Object.assign(event,{prompt:()=>{calls++;return failure?Promise.reject(new Error('failure')):Promise.resolve();},userChoice:Promise.resolve({outcome})});
  return {event,calls:()=>calls};
}
test('install event is captured before UI subscription; consumed once; acceptance is not proof of installation',async()=>{
  const {dom,controller}=setup();const prompt=promptEvent(dom,'accepted');
  dom.window.dispatchEvent(prompt.event);
  assert.equal(prompt.event.defaultPrevented,true);
  assert.equal(controller.getSnapshot().available,true);
  assert.equal(await controller.trigger(),'accepted');
  assert.equal(controller.getSnapshot().installed,false);
  assert.equal(await controller.trigger(),'unavailable');
  assert.equal(prompt.calls(),1);
  dom.window.dispatchEvent(new dom.window.Event('appinstalled'));
  assert.equal(controller.getSnapshot().installed,true);
  controller.dispose();
});
test('unavailable, dismissed and failed installation keep content reachable and allow a fresh browser event',async()=>{
  const {dom,controller}=setup();
  assert.equal(await controller.trigger(),'unavailable');
  const dismissed=promptEvent(dom,'dismissed');dom.window.dispatchEvent(dismissed.event);
  assert.equal(await controller.trigger(),'dismissed');
  assert.equal(controller.getSnapshot().available,false);
  const failed=promptEvent(dom,'accepted',true);dom.window.dispatchEvent(failed.event);
  assert.equal(await controller.trigger(),'failed');
  assert.equal(controller.getSnapshot().busy,false);
  controller.dispose();
});
test('platform guidance distinguishes Android, iPhone/iPad, embedded browser and desktop',()=>{
  assert.equal(installPlatform('Mozilla Android Chrome'),'android');
  assert.equal(installPlatform('iPhone Safari'),'ios');
  assert.equal(installPlatform('Macintosh',5),'ios');
  assert.equal(installPlatform('Android Instagram'),'embedded');
  assert.equal(installPlatform('Windows Chrome'),'desktop');
});
