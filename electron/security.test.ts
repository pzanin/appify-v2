import assert from 'node:assert/strict';
import test from 'node:test';
import { developmentRendererUrl, isTrustedRendererUrl, isTrustedSender, safeOperation, validateWorkspace } from './security';
import { normalizeExternalUrl } from '../src/utils/externalLinks';

test('IPC requires the registered window, main frame and exact renderer document', () => {
  const url = 'file:///app/dist/index.html';
  const frame = { url };
  const contents = { mainFrame: frame, isDestroyed: () => false };
  assert.equal(isTrustedSender({ sender: contents, senderFrame: frame }, contents, url), true);
  for (const event of [{ sender: {}, senderFrame: frame }, { sender: contents, senderFrame: { url } },
    { sender: contents, senderFrame: null }]) assert.equal(isTrustedSender(event, contents, url), false);
  for (const value of ['file:///app/dist/evil.html', 'about:blank', 'https://evil.test',
    'file:///app/dist/index.html?evil=1', 'file:///app/dist/index.html/evil']) {
    frame.url = value;
    assert.equal(isTrustedSender({ sender: contents, senderFrame: frame }, contents, url), false);
  }
  assert.equal(isTrustedRendererUrl(`${url}#builder`, url), true);
  assert.equal(developmentRendererUrl('http://localhost:3000', true), null);
  assert.throws(() => developmentRendererUrl('https://evil.test', false));
});

test('external links reject dangerous protocols, credentials, control characters and malformed URLs', () => {
  for (const value of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,x', 'http://example.com',
    'https://user:secret@example.com', ' https://example.com', 'mailto:a@b.test%0d%0aX:x', null, 'invalid']) {
    assert.equal(normalizeExternalUrl(value), null);
  }
  assert.equal(normalizeExternalUrl('https://pay.hotmart.com/ABC'), 'https://pay.hotmart.com/ABC');
  assert.equal(normalizeExternalUrl('mailto:help@example.com'), 'mailto:help@example.com');
});

test('safe IPC failures hide exception messages, paths, stacks and credential values', async () => {
  await assert.rejects(() => safeOperation(() => { throw new Error('C:\\Users\\Paulo\\private.env sb_' + 'secret_test-token'); }),
    { message: 'Não foi possível concluir a operação. Tente novamente.' });
  assert.equal(await safeOperation(() => 42), 42);
});

test('workspace validation blocks lesson IDs used for filesystem traversal', () => {
  const workspace = { appName: 'Teste', pwaConfig: {}, modules: [{ id: 1, subs: [{ id: 2 }] }] };
  assert.doesNotThrow(() => validateWorkspace(workspace));
  assert.throws(() => validateWorkspace({ ...workspace, modules: [{ id: '../x', subs: [] }] }));
  assert.throws(() => validateWorkspace({ ...workspace, modules: [{ id: 1, subs: [{ id: '../../x' }] }] }));
});
