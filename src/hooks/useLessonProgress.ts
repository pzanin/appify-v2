import { useEffect, useRef, useState } from 'react';
import type { Module, PwaConfig } from '../types';
import { lessonKey, moduleCompletion, progressStorageKey, readLessonProgress, resumeLesson, type LessonProgress } from '../utils/lessonProgress';
export function useLessonProgress(config:PwaConfig,modules:Module[],projectId:number|null,preview:boolean) {
  const key=progressStorageKey(config,preview,projectId);
  const [state,setState]=useState(()=>({key,value:readLessonProgress(key)}));
  const current=state.key===key ? state : {key,value:readLessonProgress(key)};
  const latest=useRef(current);latest.current=current;
  useEffect(()=>{
    const value=readLessonProgress(key);latest.current={key,value};setState({key,value});
    const changed=(event:StorageEvent)=>{if(event.key===key || event.key===null){const value=readLessonProgress(key);latest.current={key,value};setState({key,value});}};
    window.addEventListener('storage',changed);return ()=>window.removeEventListener('storage',changed);
  },[key]);
  const save=(value:LessonProgress)=>{
    latest.current={key,value};setState({key,value});
    try {localStorage.setItem(key,JSON.stringify(value));} catch { /* Keep progress in memory when storage is unavailable. */ }
  };
  return {
    progress:current.value,
    completed:(moduleId:number,lessonId:number)=>current.value.completed.includes(lessonKey(moduleId,lessonId)),
    moduleProgress:(module:Module)=>moduleCompletion(module,current.value),
    resume:resumeLesson(modules,current.value),
    visit:(moduleId:number,lessonId:number)=>save({...latest.current.value,last:{moduleId,lessonId}}),
    complete:(moduleId:number,lessonId:number)=>{
      const id=lessonKey(moduleId,lessonId);
      if(latest.current.value.completed.includes(id))return false;
      save({...latest.current.value,completed:[...latest.current.value.completed,id]});return true;
    }
  };
}
