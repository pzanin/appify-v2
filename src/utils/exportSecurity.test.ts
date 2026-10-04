import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { assertPublicExport, assertSafeArchive, containsPrivateCredential, isAllowedExportPath } from './exportSecurity';

function jwt(role: string) {
  return `${btoa('{"alg":"HS256"}')}.${btoa(JSON.stringify({ role, iss: 'supabase' })).replace(/=+$/, '')}.signature`;
}

test('export blocks nested secret fields and credentials hidden in HTML, assets or public key slots', () => {
  for (const value of [{ modules: [{ builder_data: [{ props: { ['client_' + 'secret']: 'private-value' } }] }] },
    { supabaseAnonKey: jwt('service_role') }, { html: `<script>const key='${'sb_' + 'secret_abcdefgh'}';</script>` },
    { content: '-----BEGIN RSA ' + 'PRIVATE KEY-----' }, { token: jwt('authenticated') },
    { html: 'SERVICE_ROLE_KEY=' + 'private-value-123' }]) assert.throws(() => assertPublicExport(value));
  assert.doesNotThrow(() => assertPublicExport({ supabaseAnonKey: jwt('anon'), serviceKey: '', font: 'Syne' }));
  assert.equal(containsPrivateCredential('const key="sk-' + 'proj-abcdefghijklmnopqrstuvwxyz"'), true);
});

test('ZIP paths cannot carry env, Git files, private keys or traversal', () => {
  for (const name of ['.env', '.env.local', '.git/config', '../secrets.json', 'assets/../../.env',
    'assets/private.pem', 'pages/lesson-../secret.html']) assert.equal(isAllowedExportPath(name), false);
  for (const name of ['app-data.json', 'assets/pwa-engine-chunk.js', 'pages/lesson-1-2.html', 'pages/']) assert.equal(isAllowedExportPath(name), true);
});

test('archive is checked after template inclusion and before download/disk writes', async () => {
  const zip = new JSZip();
  zip.file('app-data.json', JSON.stringify({ appName: 'Meu App' }));
  zip.file('assets/pwa-engine.js', 'const events={access_token:"access_token"};');
  await assertSafeArchive(zip);
  zip.file('assets/pwa-engine.js', 'const key="sb_' + 'secret_test-credential";');
  await assert.rejects(() => assertSafeArchive(zip));
  zip.remove('assets/pwa-engine.js');
  zip.file('.env.local', 'anything');
  await assert.rejects(() => assertSafeArchive(zip));
});
