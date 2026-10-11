import fs from 'node:fs';

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) throw new Error(`Missing ${label}`);
  return source.replace(before, after);
};

const hookPath = 'src/hooks/useLessonProgress.ts';
let hook = fs.readFileSync(hookPath, 'utf8');
hook = replaceOnce(
  hook,
  `    uncomplete:(moduleId:number,lessonId:number)=>{\n      const id=lessonKey(moduleId,lessonId);\n      if(!latest.current.value.completed.includes(id))return false;\n      save({...latest.current.value,completed:latest.current.value.completed.filter(item=>item!==id)});return true;\n    }`,
  `    uncomplete:(moduleId:number,lessonId:number)=>{\n      const id=lessonKey(moduleId,lessonId);\n      if(!latest.current.value.completed.includes(id))return false;\n      save({...latest.current.value,completed:latest.current.value.completed.filter(item=>item!==id)});return true;\n    },\n    toggle:(moduleId:number,lessonId:number,allowComplete=true):'completed'|'uncompleted'|'blocked'=>{\n      const id=lessonKey(moduleId,lessonId);\n      const value=latest.current.value;\n      if(value.completed.includes(id)) {\n        save({...value,completed:value.completed.filter(item=>item!==id)});\n        return 'uncompleted';\n      }\n      if(!allowComplete) return 'blocked';\n      save({...value,completed:[...value.completed,id]});\n      return 'completed';\n    }`
  ,
  'lesson toggle hook'
);
fs.writeFileSync(hookPath, hook);

const runtimePath = 'src/components/PWARuntime.tsx';
let runtime = fs.readFileSync(runtimePath, 'utf8');
runtime = replaceOnce(
  runtime,
  `  const handleSimulateCompletion = () => {\n    if (isCurrentLessonCompleted && selectedMockupModuleId !== null && selectedMockupSubmoduleId !== null) {\n      learning.uncomplete(selectedMockupModuleId,selectedMockupSubmoduleId);\n      setCanCompleteLesson(true);\n      return;\n    }\n    if (canCompleteLesson && selectedMockupModuleId !== null && selectedMockupSubmoduleId !== null && learning.complete(selectedMockupModuleId,selectedMockupSubmoduleId)) {\n      void trackAnalyticsEvent(pwaConfig, analyticsLive, {eventName:'lesson_complete',moduleId:String(selectedMockupModuleId),lessonId:String(selectedMockupSubmoduleId)});\n      if (gamification.enabled && gamification.enableCelebration && (selectedMockupSubmodule?.gamificationConfig?.enableCelebration ?? true)) {\n        setIsCelebrating(true);\n        setTimeout(() => setIsCelebrating(false), 3500);\n      }\n    }\n  };`,
  `  const handleSimulateCompletion = () => {\n    if (selectedMockupModuleId === null || selectedMockupSubmoduleId === null) return;\n    const result = learning.toggle(selectedMockupModuleId, selectedMockupSubmoduleId, canCompleteLesson);\n    if (result === 'uncompleted') {\n      setCanCompleteLesson(true);\n      return;\n    }\n    if (result !== 'completed') return;\n    void trackAnalyticsEvent(pwaConfig, analyticsLive, {eventName:'lesson_complete',moduleId:String(selectedMockupModuleId),lessonId:String(selectedMockupSubmoduleId)});\n    if (gamification.enabled && gamification.enableCelebration && (selectedMockupSubmodule?.gamificationConfig?.enableCelebration ?? true)) {\n      setIsCelebrating(true);\n      setTimeout(() => setIsCelebrating(false), 3500);\n    }\n  };`,
  'runtime lesson completion handler'
);
fs.writeFileSync(runtimePath, runtime);

console.log('Lesson completion toggle regression fix applied.');
