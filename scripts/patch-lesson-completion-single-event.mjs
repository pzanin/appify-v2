import fs from 'node:fs';

const path = 'src/components/PWARuntime.tsx';
let source = fs.readFileSync(path, 'utf8');

const refAnchor = `  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);`;
const refReplacement = `${refAnchor}\n  const lastLessonPointerActionAtRef = useRef(0);`;
if (!source.includes(refAnchor)) throw new Error('pointer guard anchor not found');
if (!source.includes('lastLessonPointerActionAtRef')) source = source.replace(refAnchor, refReplacement);

const completeBefore = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonComplete(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonComplete(); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); markCurrentLessonComplete(); } }}`;
const completeAfter = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); lastLessonPointerActionAtRef.current = Date.now(); markCurrentLessonComplete(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (Date.now() - lastLessonPointerActionAtRef.current < 500) return; markCurrentLessonComplete(); }}`;

const incompleteBefore = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonIncomplete(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); markCurrentLessonIncomplete(); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); markCurrentLessonIncomplete(); } }}`;
const incompleteAfter = `onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); lastLessonPointerActionAtRef.current = Date.now(); markCurrentLessonIncomplete(); }} onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (Date.now() - lastLessonPointerActionAtRef.current < 500) return; markCurrentLessonIncomplete(); }}`;

if (!source.includes(completeBefore)) throw new Error('complete dual handler not found');
if (!source.includes(incompleteBefore)) throw new Error('incomplete dual handler not found');

source = source.replace(completeBefore, completeAfter);
source = source.replace(incompleteBefore, incompleteAfter);

fs.writeFileSync(path, source);
console.log('Lesson completion duplicate pointer/click execution guard applied.');
