import React from 'react';
import { ChevronRight, Lock, CheckCircle } from 'lucide-react';
import type { TFunction } from 'i18next';
import type { Module } from '../types';
import { RenderDynamicIcon } from './RenderDynamicIcon';

export function learningColors(dark: boolean): React.CSSProperties {
  return {
    '--cx-surface': dark ? '#161f2b' : '#ffffff',
    '--cx-text': dark ? '#f3f4f6' : '#1f2937',
    '--cx-muted': dark ? '#cbd5e1' : '#4b5563',
    '--cx-border': dark ? '#364152' : '#dce1e7',
    '--cx-track': dark ? '#364152' : '#e5e7eb',
  } as React.CSSProperties;
}

interface Progress { completed: number; total: number; percent: number }
export function LearningProgress({ progress, t, themeColor, showBar = false }: {
  progress: Progress; t: TFunction; themeColor: string; showBar?: boolean;
}) {
  const label = t('app.learning.progress', {completed: progress.completed, total: progress.total});
  return <div className="cx-progress">
    <p>{label}</p>
    {showBar && progress.total > 0 && <div className="cx-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.completed}>
      <div style={{ width: `${progress.percent}%`, background: themeColor }} />
    </div>}
  </div>;
}

export function CustomerModuleCards({ modules, moduleProgress, onOpen, t, themeColor, dark, list = false }: {
  modules: Module[]; moduleProgress: (module: Module) => Progress; onOpen: (module: Module) => void;
  t: TFunction; themeColor: string; dark: boolean; list?: boolean;
}) {
  return <div className="cx-module-library" style={learningColors(dark)}>
    <div className={`cx-module-grid${list ? ' cx-module-list' : ''}`}>
      {modules.map(module => {
        const locked = ['locked', 'upsell', 'points'].includes(module.releaseType || '');
        const draft = module.status === 'Rascunho';
        const count = module.subs?.length || 0;
        return <button type="button" key={module.id} className="phone-module-wrapper cx-module-card" disabled={draft} onClick={() => onOpen(module)}>
          <div className="cx-module-cover">
            {module.coverImageUrl ? <img src={module.coverImageUrl} alt="" decoding="async" /> : <RenderDynamicIcon name={module.iconName} size={40} />}
            {locked && <span className="cx-module-lock"><Lock size={20} aria-hidden="true" /><span className="sr-only">{t('app.upsell.lockedTitle')}</span></span>}
            {module.releaseType === 'points' && <span className="cx-points">{module.requiredPoints || 0} {t('app.gamification.points')}</span>}
          </div>
          <div className="cx-module-copy">
            <span className="cx-module-title">{module.name}</span>
            {locked || draft || !count ? <p className="cx-module-count">{count} {t(count === 1 ? 'app.modules.lessonSingle' : 'app.modules.lessonPlural')}</p> : <LearningProgress progress={moduleProgress(module)} t={t} themeColor={themeColor} />}
          </div>
        </button>;
      })}
    </div>
  </div>;
}

export function CustomerLessonList({ module, completed, onOpen, t, themeColor, dark }: {
  module: Module; completed: (moduleId: number, lessonId: number) => boolean; onOpen: (id: number) => void;
  t: TFunction; themeColor: string; dark: boolean;
}) {
  return <div className="cx-lesson-list" data-lesson-count={module.subs.length} style={learningColors(dark)}>
    {module.subs.map((lesson, index) => <button type="button" key={lesson.id} className="cx-lesson-card" onClick={() => onOpen(lesson.id)}>
      <span className="cx-lesson-cover">
        {lesson.coverImageUrl ? <img src={lesson.coverImageUrl} alt="" decoding="async" /> : <span>{index + 1}</span>}
      </span>
      <span className="cx-lesson-copy">
        <span className="cx-lesson-title">{lesson.name}</span>
        {completed(module.id, lesson.id) && <span className="cx-lesson-completed"><CheckCircle size={15} aria-hidden="true" />{t('app.modules.completed_status')}</span>}
      </span>
      <ChevronRight size={18} aria-hidden="true" className="cx-lesson-arrow" />
    </button>)}
  </div>;
}

interface NavigationItem { id: string; label: string; icon: React.ElementType }
export function CustomerBottomNavigation({ items, activeTab, onSelect, dark, hasAnnouncement, label }: {
  items: NavigationItem[]; activeTab: string; onSelect: (id: string) => void; dark: boolean; hasAnnouncement: boolean; label: string;
}) {
  return <nav className="cx-bottom-nav" aria-label={label} style={learningColors(dark)}>
    {items.map(item => <button type="button" key={item.id} aria-current={activeTab === item.id ? 'page' : undefined} onClick={() => onSelect(item.id)}>
      <span className="cx-nav-icon"><item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} aria-hidden="true" />
        {item.id === 'comunidade' && hasAnnouncement && <span className="cx-nav-dot" />}
      </span>
      <span>{item.label}</span>
    </button>)}
  </nav>;
}
