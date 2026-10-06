import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { electronCsp } from './securityPolicies';

const dom = new JSDOM('');
Object.assign(globalThis, { window: dom.window, document: dom.window.document, DOMParser: dom.window.DOMParser });
const { prepareResponsiveHtml } = await import('./htmlContent');
const { sanitizeImportedHtml, LINK_BRIDGE, LINK_BRIDGE_HASH, VIDEO_BRIDGE, VIDEO_BRIDGE_HASH, safeEmbedUrl } = await import('./htmlSecurity');

test('imported HTML cannot execute its scripts, access the editor or inject navigation metadata', () => {
  const html = prepareResponsiveHtml(`<html><head><base href="file:///etc/"><meta http-equiv="refresh" content="0;url=https://evil.test"></head><body>
    <script>parent.appifyDesktop.projects.remove(1)</script><img src="x" onerror="alert(1)">
    <iframe srcdoc="<script>alert(1)</script>" src="file:///etc/passwd"></iframe>
    <a href="javascript:alert(1)">bad</a><a href="https://pay.hotmart.com/ABC">buy</a>
    <iframe src="https://www.youtube.com/embed/test"></iframe><h1 style="color:red">Lesson</h1></body></html>`);
  const doc = new JSDOM(html).window.document;
  assert.deepEqual([...doc.querySelectorAll('script')].map(script => script.textContent), [LINK_BRIDGE, VIDEO_BRIDGE]);
  assert.equal(doc.querySelector('script[src]'), null);
  assert.equal(doc.querySelector('base'), null);
  assert.equal(doc.querySelector('[onerror]'), null);
  assert.equal(doc.querySelector('[srcdoc]'), null);
  assert.equal(doc.querySelector('[href^="javascript:"]'), null);
  assert.equal(doc.querySelectorAll('iframe').length, 1);
  assert.equal(doc.querySelector('iframe')?.getAttribute('sandbox'), 'allow-scripts allow-same-origin allow-presentation');
  assert.equal(doc.querySelector('iframe')?.getAttribute('referrerpolicy'), 'strict-origin-when-cross-origin');
  assert.equal(doc.querySelector('h1')?.textContent, 'Lesson');
  assert.match(doc.querySelector('meta[http-equiv]')?.getAttribute('content') || '', /connect-src 'none'/);
  assert.equal(LINK_BRIDGE_HASH, `sha256-${createHash('sha256').update(LINK_BRIDGE).digest('base64')}`);
  assert.equal(VIDEO_BRIDGE_HASH, `sha256-${createHash('sha256').update(VIDEO_BRIDGE).digest('base64')}`);
  const csp = doc.querySelector('meta[http-equiv]')!.getAttribute('content')!;
  assert.ok(csp.includes(`'${LINK_BRIDGE_HASH}'`) && csp.includes(`'${VIDEO_BRIDGE_HASH}'`));
  assert.equal(csp.split('script-src')[1].split(';')[0].includes('unsafe-inline'), false);
  const untrusted = new JSDOM(sanitizeImportedHtml('<iframe src="https://example.com/page"></iframe>')).window.document.querySelector('iframe')!;
  assert.equal(untrusted.getAttribute('sandbox'), 'allow-scripts');
});

test('visual blocks are sanitized and production Electron CSP does not allow arbitrary scripts', () => {
  assert.equal(sanitizeImportedHtml('<svg><a xlink:href="javascript:alert(1)">x</a></svg>').includes('javascript:'), false);
  assert.equal(safeEmbedUrl('file:///secret'), undefined);
  assert.equal(safeEmbedUrl('https://user:pass@example.com'), undefined);
  const csp = electronCsp();
  assert.equal(csp.split('script-src')[1].split(';')[0].includes('unsafe-inline'), false);
  assert.equal(csp.includes('unsafe-eval'), false);
  assert.match(csp, /object-src 'none'/);
});
