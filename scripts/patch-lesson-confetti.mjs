import fs from 'node:fs';

const file = 'src/components/PWARuntime.tsx';
const raw = fs.readFileSync(file, 'utf8');
const usesCrLf = raw.includes('\r\n');
let source = raw.replace(/\r\n/g, '\n');

function replaceExact(before, after, label) {
  if (!source.includes(before)) throw new Error(`Patch marker not found: ${label}`);
  source = source.replace(before, after);
}

replaceExact(
`import { engagementIsEnabled } from '../utils/projectFeatures';\nimport React, { useState, useEffect, useRef } from 'react';`,
`import { engagementIsEnabled } from '../utils/projectFeatures';\nimport { shouldCelebrateLesson } from '../utils/lessonCelebration';\nimport React, { useState, useEffect, useRef } from 'react';`,
'import celebration helper'
);

replaceExact(
`    if (gamification.enabled && gamification.enableCelebration && (selectedMockupSubmodule?.gamificationConfig?.enableCelebration ?? true)) {\n      setIsCelebrating(true);`,
`    if (shouldCelebrateLesson(gamification, selectedMockupSubmodule?.gamificationConfig)) {\n      setIsCelebrating(true);`,
'use lesson celebration override'
);

if (!source.includes('shouldCelebrateLesson(gamification, selectedMockupSubmodule?.gamificationConfig)')) {
  throw new Error('Lesson celebration override was not applied');
}

if (usesCrLf) source = source.replace(/\n/g, '\r\n');
fs.writeFileSync(file, source);
console.log('Lesson confetti patch applied.');
