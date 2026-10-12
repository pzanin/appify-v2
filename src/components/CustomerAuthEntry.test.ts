import assert from 'node:assert/strict';
import test from 'node:test';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { INITIAL_PWA_CONFIG } from '../constants';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://appify.test/' });
Object.assign(globalThis, { window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import('react-dom/client');
await import('../i18n');
const { CustomerEntry } = await import('./CustomerEntry');

const setInput = (input: HTMLInputElement, value: string) => {
  Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
};
const button = (text: string) => [...document.querySelectorAll('button')].find(item => item.textContent?.includes(text))!;

test('auth preview shows email and code screens without contacting Supabase or persisting entry state', async () => {
  localStorage.clear();
  const config = {
    ...INITIAL_PWA_CONFIG,
    appName: 'Produto Seguro',
    customSplash: false,
    backendProvider: 'supabase' as const,
    customerAuthEnabled: true,
    supabaseUrl: 'https://demo.supabase.co',
    supabasePublishableKey: 'sb_publishable_abcdefghijklmnopqrstuvwxyz123456',
  };
  const root = createRoot(document.getElementById('root')!);
  await act(async () => root.render(React.createElement(CustomerEntry, { config, preview: true }, React.createElement('div', { 'data-testid': 'content' }, 'Conteúdo'))));
  await act(async () => button('Acessar conteúdo').click());
  assert.match(document.body.textContent || '', /Acesso seguro/);
  assert.match(document.body.textContent || '', /nenhum e-mail será enviado/i);
  const email = document.querySelector<HTMLInputElement>('#customer-access-email')!;
  await act(async () => setInput(email, 'buyer@example.com'));
  await act(async () => button('Enviar código').click());
  assert.ok(document.querySelector('#customer-access-code'));
  const code = document.querySelector<HTMLInputElement>('#customer-access-code')!;
  await act(async () => setInput(code, '123456'));
  await act(async () => button('Confirmar e entrar').click());
  assert.ok(document.querySelector('[data-testid="content"]'));
  assert.equal(localStorage.length, 0);
  await act(async () => root.unmount());
});
