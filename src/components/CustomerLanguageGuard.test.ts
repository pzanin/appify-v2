import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const customerFiles = [
  'src/components/PWARuntime.tsx',
  'src/components/PhoneMockup.tsx',
  'src/components/HtmlFrame.tsx',
  'src/components/CustomerEntry.tsx',
  'src/components/InstallGuide.tsx',
  'src/components/CustomerProfilePanel.tsx',
  'src/components/CustomerLearning.tsx',
  'src/components/ContinueLearning.tsx',
  'src/components/ScreenErrorBoundary.tsx',
];

test('customer runtime does not expose known Appify implementation copy or manual locale maps', () => {
  const combined = customerFiles.map(file => readFileSync(file, 'utf8')).join('\n');
  for (const forbidden of [
    'Abra esta prévia no Appify desktop',
    'Open this preview in the Appify desktop app',
    'PWA exportado',
    'exported PWA',
    'Erro na atividade: {{message}}',
    'Activity error: {{message}}',
    "pt:'Limpar histórico desta atividade'",
    "en:'Clear this activity’s history'",
    "t('app.errors.activityClearHistory')",
    'title="Marcar como não concluída"',
    'alt="Logo"',
    'mockEarnedBadges',
    'mockTotalPoints',
    'mockProfileImg',
  ]) assert.equal(combined.includes(forbidden), false, `customer-visible implementation copy found: ${forbidden}`);
});