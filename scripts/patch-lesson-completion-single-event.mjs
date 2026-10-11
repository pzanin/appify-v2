import fs from 'node:fs';

const path = 'src/components/PWARuntime.tsx';
let source = fs.readFileSync(path, 'utf8');

const beforeComplete = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonComplete(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonComplete(); }} onKeyDown=`;
const afterComplete = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonComplete(); }} onKeyDown=`;

const beforeIncomplete = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonIncomplete(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonIncomplete(); }} onKeyDown=`;
const afterIncomplete = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonIncomplete(); }} onKeyDown=`;

if (!source.includes(beforeComplete)) throw new Error('complete dual handler not found');
if (!source.includes(beforeIncomplete)) throw new Error('incomplete dual handler not found');

source = source.replace(beforeComplete, afterComplete);
source = source.replace(beforeIncomplete, afterIncomplete);

fs.writeFileSync(path, source);
console.log('Lesson completion now uses a single pointer event.');
