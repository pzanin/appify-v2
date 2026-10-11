import fs from 'node:fs';

const path = 'src/components/PWARuntime.tsx';
let source = fs.readFileSync(path, 'utf8');

const stateAnchor = `  const [isCelebrating, setIsCelebrating] = useState(false);`;
if (!source.includes(stateAnchor)) throw new Error('debug state anchor not found');
if (!source.includes('completionDebug')) {
  source = source.replace(stateAnchor, `${stateAnchor}\n  const [completionDebug, setCompletionDebug] = useState('aguardando clique');`);
}

const oldComplete = `  const markCurrentLessonComplete = () => {\n    if (!canCompleteLesson || selectedMockupModuleId === null || selectedMockupSubmoduleId === null) return;\n    if (!learning.complete(selectedMockupModuleId, selectedMockupSubmoduleId)) return;\n    void trackAnalyticsEvent(pwaConfig, analyticsLive, {eventName:'lesson_complete',moduleId:String(selectedMockupModuleId),lessonId:String(selectedMockupSubmoduleId)});`;
const newComplete = `  const markCurrentLessonComplete = () => {\n    if (!canCompleteLesson || selectedMockupModuleId === null || selectedMockupSubmoduleId === null) { setCompletionDebug('complete bloqueado antes da ação'); return; }\n    const before = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const changed = learning.complete(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const after = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    setCompletionDebug(\`complete | changed:\${changed ? 'sim' : 'não'} | mem:\${before.memoryCompleted ? 1 : 0}→\${after.memoryCompleted ? 1 : 0} | storage:\${after.stored.includes(after.id) ? 'tem' : 'não tem'}\`);\n    if (!changed) return;\n    void trackAnalyticsEvent(pwaConfig, analyticsLive, {eventName:'lesson_complete',moduleId:String(selectedMockupModuleId),lessonId:String(selectedMockupSubmoduleId)});`;
if (!source.includes(oldComplete)) throw new Error('complete handler anchor not found');
source = source.replace(oldComplete, newComplete);

const oldIncomplete = `  const markCurrentLessonIncomplete = () => {\n    if (selectedMockupModuleId === null || selectedMockupSubmoduleId === null) return;\n    learning.uncomplete(selectedMockupModuleId, selectedMockupSubmoduleId);\n    setCanCompleteLesson(true);\n  };`;
const newIncomplete = `  const markCurrentLessonIncomplete = () => {\n    if (selectedMockupModuleId === null || selectedMockupSubmoduleId === null) { setCompletionDebug('uncomplete sem aula selecionada'); return; }\n    const before = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const changed = learning.uncomplete(selectedMockupModuleId, selectedMockupSubmoduleId);\n    const after = learning.debugSnapshot(selectedMockupModuleId, selectedMockupSubmoduleId);\n    setCompletionDebug(\`uncomplete | changed:\${changed ? 'sim' : 'não'} | mem:\${before.memoryCompleted ? 1 : 0}→\${after.memoryCompleted ? 1 : 0} | storage:\${after.stored.includes(after.id) ? 'tem' : 'não tem'}\`);\n    setCanCompleteLesson(true);\n  };`;
if (!source.includes(oldIncomplete)) throw new Error('incomplete handler anchor not found');
source = source.replace(oldIncomplete, newIncomplete);

const contentAnchor = `        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">\n          {selectedMockupSubmodule && (`;
const debugBlock = `        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">\n          {selectedMockupSubmodule && (\n            <div style={{ position:'absolute', left:10, bottom:10, zIndex:2200, maxWidth:300, padding:'7px 9px', borderRadius:8, background:'rgba(0,0,0,.86)', color:'#86efac', fontSize:9, lineHeight:1.35, fontFamily:'monospace', pointerEvents:'none' }}>\n              DIAG: {completionDebug}\n            </div>\n          )}\n          {selectedMockupSubmodule && (`;
if (!source.includes(contentAnchor)) throw new Error('content diagnostic anchor not found');
source = source.replace(contentAnchor, debugBlock);

fs.writeFileSync(path, source);
console.log('Lesson completion diagnostic applied.');
