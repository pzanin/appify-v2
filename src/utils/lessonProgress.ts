import type { Module, PwaConfig } from '../types';
export interface LessonLocation { moduleId:number; lessonId:number; }
export interface LessonProgress { completed:string[]; last:LessonLocation|null; }
export const emptyLessonProgress = ():LessonProgress => ({completed:[],last:null});
export const lessonKey = (moduleId:number,lessonId:number) => `${moduleId}:${lessonId}`;
const validId = (value:unknown):value is number => typeof value==='number' && Number.isSafeInteger(value) && value>=0;
export function progressStorageKey(config:PwaConfig,preview:boolean,projectId:number|null) {
  const identity=config.productId || (preview ? `local-${projectId ?? config.appName}` : `legacy-${config.appName}`);
  return `appify-lesson-progress:v1:${preview ? 'preview' : 'customer'}:${encodeURIComponent(identity)}`;
}
export function readLessonProgress(key:string):LessonProgress {
  try {
    const raw=localStorage.getItem(key); if(!raw || raw.length>256000) return emptyLessonProgress();
    const value=JSON.parse(raw);
    if(!value || !Array.isArray(value.completed)) return emptyLessonProgress();
    const completed=[...new Set<string>(value.completed.filter((item:unknown)=>typeof item==='string' && /^\d{1,16}:\d{1,16}$/.test(item)))].slice(0,10000);
    const last=validId(value.last?.moduleId) && validId(value.last?.lessonId) ? {moduleId:value.last.moduleId,lessonId:value.last.lessonId} : null;
    return {completed,last};
  } catch {return emptyLessonProgress();}
}
export function moduleCompletion(module:Module,progress:LessonProgress) {
  const total=module.subs.length;
  const completed=module.subs.filter(lesson=>progress.completed.includes(lessonKey(module.id,lesson.id))).length;
  return {completed,total,percent:total ? Math.round(completed/total*100) : 0};
}
export function resumeLesson(modules:Module[],progress:LessonProgress):LessonLocation|null {
  if(!progress.last) return null;
  const accessible=modules.filter(module=>module.status==='Ativo' && !['locked','upsell','points'].includes(module.releaseType || ''))
    .flatMap(module=>module.subs.filter(lesson=>lesson.releaseType!=='locked').map(lesson=>({moduleId:module.id,lessonId:lesson.id})));
  const index=accessible.findIndex(lesson=>lessonKey(lesson.moduleId,lesson.lessonId)===lessonKey(progress.last!.moduleId,progress.last!.lessonId));
  if(index<0) return null;
  if(progress.completed.includes(lessonKey(progress.last.moduleId,progress.last.lessonId))) {
    return accessible.slice(index+1).find(lesson=>!progress.completed.includes(lessonKey(lesson.moduleId,lesson.lessonId))) || accessible[index];
  }
  return accessible[index];
}
