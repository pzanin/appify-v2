import assert from 'node:assert/strict';
import test from 'node:test';
import { projectService } from './projectService';

function project(id:number) {
  return { id, name:'Legacy', status:'Rascunho' as const, lastEdited:'2026-01-01T00:00:00.000Z', users:0, color:'#000', url:'legacy.test' };
}

test('opening a legacy project creates and persists one stable product identity', async () => {
  let saves=0;
  let document:any={schemaVersion:1,project:project(7),workspace:{pwaConfig:{appName:'Legacy'},appName:'Legacy'}};
  (globalThis as any).window={appifyDesktop:{projects:{
    open:async()=>structuredClone(document),
    save:async(_id:number,workspace:any)=>{
      saves++;
      document={...document,project:{...document.project,lastEdited:'2026-01-02T00:00:00.000Z'},workspace:structuredClone(workspace)};
      return document.project;
    }
  }}};
  const first=await projectService.openProject(7);
  const identity=first.workspace.pwaConfig.productId;
  assert.equal(typeof identity,'string');
  assert.ok(identity.length>10);
  assert.equal(saves,1);
  const second=await projectService.openProject(7);
  assert.equal(second.workspace.pwaConfig.productId,identity);
  assert.equal(saves,1);
});

test('opening a project that already has productId does not rewrite it', async () => {
  let saves=0;
  const document:any={schemaVersion:1,project:project(8),workspace:{pwaConfig:{appName:'Stable',productId:'already-stable'},appName:'Stable'}};
  (globalThis as any).window={appifyDesktop:{projects:{
    open:async()=>structuredClone(document),
    save:async()=>{saves++;return document.project;}
  }}};
  const opened=await projectService.openProject(8);
  assert.equal(opened.workspace.pwaConfig.productId,'already-stable');
  assert.equal(saves,0);
});
