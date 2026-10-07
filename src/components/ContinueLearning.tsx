import React from 'react';
import type { Module } from '../types';
import type { LessonLocation } from '../utils/lessonProgress';
interface Props {location:LessonLocation|null;modules:Module[];onContinue:(location:LessonLocation)=>void;label:string;themeColor:string;dark:boolean;}
export function ContinueLearning({location,modules,onContinue,label,themeColor,dark}:Props) {
  if(!location)return null;
  const module=modules.find(item=>item.id===location.moduleId);
  const lesson=module?.subs.find(item=>item.id===location.lessonId);
  if(!module || !lesson)return null;
  return <section style={{padding:16,borderRadius:16,background:dark?'#1f2937':'#f3f4f6',marginBottom:20,flexShrink:0}}>
    <p style={{fontSize:13,lineHeight:1.5,color:dark?'#e5e7eb':'#374151',margin:'0 0 12px',overflowWrap:'anywhere'}}>{module.name} · {lesson.name}</p>
    <button onClick={()=>onContinue(location)} style={{display:'block',width:'100%',padding:'14px 16px',border:0,borderRadius:12,background:themeColor,color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer',lineHeight:1.4}}>{label}</button>
  </section>;
}
