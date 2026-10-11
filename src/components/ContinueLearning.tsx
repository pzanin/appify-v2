import React from 'react';
import type { Module } from '../types';
import type { LessonLocation } from '../utils/lessonProgress';
import { customerButtonTextColor } from '../utils/customerTheme';
import { learningColors } from './CustomerLearning';
interface Props {location:LessonLocation|null;modules:Module[];onContinue:(location:LessonLocation)=>void;label:string;title?:string;themeColor:string;dark:boolean;}
export function ContinueLearning({location,modules,onContinue,label,title,themeColor,dark}:Props) {
  if(!location)return null;
  const module=modules.find(item=>item.id===location.moduleId);
  const lesson=module?.subs.find(item=>item.id===location.lessonId);
  if(!module || !lesson)return null;
  return <section className="cx-continue" style={{...learningColors(dark),borderLeftColor:themeColor}}>
    {title && <h2>{title}</h2>}
    <p className="cx-continue-location"><span>{module.name}</span><span aria-hidden="true"> · </span><strong>{lesson.name}</strong></p>
    <button type="button" onClick={()=>onContinue(location)} style={{background:themeColor,color:customerButtonTextColor(themeColor)}}>{label}</button>
  </section>;
}
