import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import type { AppState } from '../src/types';
import { ProjectRepository } from './projectRepository';
import { TEST_SPLASH_MP4, TEST_SPLASH_GIF, TEST_SPLASH_WEBP } from '../src/utils/fixtures/splashMedia';

const ONE_PIXEL_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

function workspace(): AppState {
  return {
    currentView: 'builder',
    activeStep: 1,
    appName: 'Teste Assets',
    selectedModuleId: 1,
    editingSubmodule: null,
    activeLocale: 'pt-BR',
    splashActive: false,
    mockupOnboardingCompleted: true,
    analytics: {
      upsellClicks: { total: 0, clicks: 0 },
      dropOffByModule: [],
      gamificationStats: { activeStreaks: 0, celebrationTriggers: 0 },
      pwaAdoption: { web: 0, installed: 0 },
      activeUsers: 0,
      sessionsToday: 0,
      avgConsumptionMinutes: 0,
      retentionRate: 0,
      retentionFunnel: [],
    },
    feedPosts: [],
    pushNotifications: [],
    pwaConfig: {
      appName: 'Teste Assets', tagline: '', themeColor: '#123456', textColor: '#fff', bgColor: '#000',
      fontFamily: 'DM Sans', fontWeight: '400', fontSize: 16, titleColor: '#fff', bodyColor: '#fff',
      orientation: 'portrait', display: 'standalone', icon: null, logo: null, logoBase64: ONE_PIXEL_PNG,
      iconBase64: ONE_PIXEL_PNG, domain: '', language: 'pt-BR', description: '', noIndex: true,
      offlineMode: true, customSplash: false, startUrl: '.', version: '1.0.0', changelogNotes: '',
      supabaseUrl: '', supabaseAnonKey: '', defaultTheme: 'light', banners: [],
      supportConfig: { type: 'none', contact: '' },
      gamification: {
        enabled: false, progressStyle: 'none', enableStreaks: false, streakIcon: '',
        enableCelebration: false, enablePoints: false, enableBadges: false, awardsConfig: [],
      },
    },
    modules: [{
      id: 1, name: 'Módulo', iconName: 'BookOpen', status: 'Ativo',
      subs: [{
        id: 2, name: 'Aula', type: 'lesson', contentType: 'html',
        contentHtml: `<div><img src="${ONE_PIXEL_PNG}"></div>`,
        builder_data: [{ id: 'image-1', type: 'image', props: { src: ONE_PIXEL_PNG } }],
      }],
    }],
  };
}

test('opening animations survive local saving, reopening and importing self-contained backups', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'appify-opening-'));
  try {
    const repository = new ProjectRepository(root);
    for (const source of [TEST_SPLASH_MP4,TEST_SPLASH_GIF,TEST_SPLASH_WEBP]) {
      const state = workspace();
      Object.assign(state.pwaConfig,{customSplash:true,splashMediaMode:'file',splashMediaData:source,splashMediaFit:'cover',splashMediaBackground:'#123456'});
      const project = await repository.create('Abertura',state);
      const opened = await repository.open(project.id);
      assert.equal(opened.workspace.pwaConfig.splashMediaData,source);
      assert.equal(opened.workspace.pwaConfig.splashMediaFit,'cover');
      const backup = await repository.readBackup(project.id);
      const imported = await repository.importDocument(backup);
      assert.equal((await repository.open(imported.id)).workspace.pwaConfig.splashMediaData,source);
    }
  } finally { await fs.rm(root,{recursive:true,force:true}); }
});

test('externalizes images, writes pages and rehydrates projects and backups', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'appify-projects-'));
  try {
    const repository = new ProjectRepository(root);
    const project = await repository.create('Teste Assets', workspace());
    const projectDirectory = path.join(root, (await fs.readdir(root))[0]);
    const projectJson = await fs.readFile(path.join(projectDirectory, 'project.json'), 'utf8');
    const assets = await fs.readdir(path.join(projectDirectory, 'assets'));
    const page = await fs.readFile(path.join(projectDirectory, 'pages', 'lesson-1-2.html'), 'utf8');

    assert.equal(projectJson.includes('data:image'), false);
    assert.match(projectJson, /assets\/asset-[a-f0-9]{24}\.png/);
    assert.equal(assets.length, 1, 'identical images should share one asset file');
    assert.match(page, /\.\.\/assets\/asset-[a-f0-9]{24}\.png/);

    const opened = await repository.open(project.id);
    assert.equal(opened.workspace.pwaConfig.logoBase64, ONE_PIXEL_PNG);
    assert.equal(opened.workspace.modules[0].subs[0].builder_data?.[0].props.src, ONE_PIXEL_PNG);
    assert.match(opened.workspace.modules[0].subs[0].contentHtml || '', /^<div><img src="data:image\/png;base64,/);

    const backup = await repository.readBackup(project.id);
    assert.equal(JSON.stringify(backup).includes('data:image/png;base64,'), true);

    const imported = await repository.importDocument(backup);
    const importedDocument = await repository.open(imported.id);
    assert.equal(importedDocument.workspace.pwaConfig.iconBase64, ONE_PIXEL_PNG);

    const build = await repository.writeBuildArchive(project.id, 'Teste Assets-pwa.zip', new Uint8Array([80, 75, 3, 4]));
    assert.match(build.filename, /^Teste Assets-pwa-\d{8}-\d{6}\.zip$/);
    assert.deepEqual(
      [...await fs.readFile(path.join(projectDirectory, 'build', build.filename))],
      [80, 75, 3, 4],
    );
    const buildInfo = JSON.parse(await fs.readFile(path.join(projectDirectory, 'build', 'build-info.json'), 'utf8')) as { filename: string; size: number };
    assert.deepEqual({ filename: buildInfo.filename, size: buildInfo.size }, { filename: build.filename, size: 4 });
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('analytics settings survive local save and backups while duplicated projects start with collection disabled',async()=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'appify-analytics-'));
  try {
    const repository=new ProjectRepository(directory);
    const data=workspace();
    const projectId='11111111-1111-4111-8111-111111111111';
    data.pwaConfig={...data.pwaConfig,analyticsEnabled:true,analyticsProjectId:projectId,supabaseUrl:'https://test.supabase.co'};
    const created=await repository.create('Analytics',data);
    const reopened=await repository.open(created.id);
    assert.equal(reopened.workspace.pwaConfig.analyticsProjectId,projectId);
    assert.equal(reopened.workspace.pwaConfig.analyticsEnabled,true);
    const backup=await repository.readBackup(created.id);
    const imported=await repository.importDocument(backup);
    assert.equal((await repository.open(imported.id)).workspace.pwaConfig.analyticsProjectId,projectId);
    const duplicate=await repository.duplicate(created.id);
    const copy=await repository.open(duplicate.id);
    assert.equal(copy.workspace.pwaConfig.analyticsEnabled,false);
    assert.equal(copy.workspace.pwaConfig.analyticsProjectId,undefined);
    assert.equal((await repository.open(created.id)).workspace.pwaConfig.analyticsEnabled,true);
  } finally {await fs.rm(directory,{recursive:true,force:true});}
});
