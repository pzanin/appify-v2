import fs from 'node:fs';

const path = 'src/components/PhoneMockup.tsx';
const raw = fs.readFileSync(path, 'utf8');
const crlf = raw.includes('\r\n');
let source = raw.replace(/\r\n/g, '\n');

function replace(before, after, label) {
  if (!source.includes(before)) throw new Error(`PhoneMockup marker not found: ${label}`);
  source = source.replace(before, after);
}

replace(
  "import { openExternalLink } from '../utils/externalLinks';",
  "import { openExternalLink, normalizeExternalUrl } from '../utils/externalLinks';\nimport { AccessDecision, evaluateAccessRule, getOrCreateAccessStartedAt } from '../utils/accessRules';",
  'access imports',
);

replace(
  "  const [lockedModuleClick, setLockedModuleClick] = useState<any>(null);",
  "  const [lockedContentClick, setLockedContentClick] = useState<{ item: any; kind: 'module' | 'lesson'; decision: AccessDecision; moduleId: number; lessonId?: number } | null>(null);",
  'locked state',
);

replace(
`  const gamification = pwaConfig?.gamification || { 
    enabled: false, 
    progressStyle: 'none', 
    enableStreaks: false, 
    streakIcon: '🔥', 
    enableCelebration: false 
  };

  const confettiColors`,
`  const gamification = pwaConfig?.gamification || { 
    enabled: false, 
    progressStyle: 'none', 
    enableStreaks: false, 
    streakIcon: '🔥', 
    enableCelebration: false 
  };
  const accessStartedAt = React.useMemo(() => getOrCreateAccessStartedAt(pwaConfig.productId, currentProjectId), [pwaConfig.productId, currentProjectId]);
  const moduleAccess = (mod: any) => evaluateAccessRule(mod, accessStartedAt);
  const lessonAccess = (lesson: any) => evaluateAccessRule(lesson, accessStartedAt);
  const openModuleWithAccess = (mod: any) => {
    if (mod.status === 'Rascunho') return;
    const decision = moduleAccess(mod);
    if (!decision.allowed) {
      setLockedContentClick({ item: mod, kind: 'module', decision, moduleId: mod.id });
      return;
    }
    setSelectedMockupModuleId(mod.id);
  };
  const openLessonWithAccess = (mod: any, lessonId: number) => {
    const lesson = mod?.subs?.find((entry: any) => entry.id === lessonId);
    if (!lesson) return;
    const decision = lessonAccess(lesson);
    if (!decision.allowed) {
      setLockedContentClick({ item: lesson, kind: 'lesson', decision, moduleId: mod.id, lessonId });
      return;
    }
    setSelectedMockupSubmoduleId(lessonId);
  };
  const openLearningLocationWithAccess = (location: { moduleId: number; lessonId: number }) => {
    const mod = modules.find(entry => entry.id === location.moduleId);
    if (!mod || mod.status === 'Rascunho') return;
    const moduleDecision = moduleAccess(mod);
    if (!moduleDecision.allowed) {
      setLockedContentClick({ item: mod, kind: 'module', decision: moduleDecision, moduleId: mod.id });
      return;
    }
    setSelectedMockupModuleId(mod.id);
    openLessonWithAccess(mod, location.lessonId);
  };

  const confettiColors`,
  'access helpers',
);

replace(
  '<CustomerLessonList module={selectedMockupModule} completed={learning.completed} onOpen={setSelectedMockupSubmoduleId} t={t} themeColor={themeColor} dark={isPhoneDark} />',
  '<CustomerLessonList module={selectedMockupModule} completed={learning.completed} isLocked={lesson => !lessonAccess(lesson).allowed} onOpen={id => openLessonWithAccess(selectedMockupModule, id)} t={t} themeColor={themeColor} dark={isPhoneDark} />',
  'lesson list access',
);

replace(
  "onContinue={location=>{setActiveTab('inicio');setSelectedMockupModuleId(location.moduleId);setSelectedMockupSubmoduleId(location.lessonId);}}",
  "onContinue={location=>{setActiveTab('inicio');openLearningLocationWithAccess(location);}}",
  'resume access',
);

replace(
`<CustomerModuleCards modules={modules} moduleProgress={learning.moduleProgress} list={viewMode === 'list'} t={t} themeColor={themeColor} dark={isPhoneDark} onOpen={mod => {
                          if (mod.status === 'Rascunho') return;
                          if (mod.releaseType === 'locked' || mod.releaseType === 'upsell' || mod.releaseType === 'points') setLockedModuleClick(mod);
                          else setSelectedMockupModuleId(mod.id);
                        }} />`,
`<CustomerModuleCards modules={modules} moduleProgress={learning.moduleProgress} list={viewMode === 'list'} isLocked={mod => mod.status !== 'Rascunho' && !moduleAccess(mod).allowed} t={t} themeColor={themeColor} dark={isPhoneDark} onOpen={openModuleWithAccess} />`,
  'module cards access',
);

replace('          {lockedModuleClick && (', '          {lockedContentClick && (', 'modal condition');
replace('onClick={() => setLockedModuleClick(null)}', 'onClick={() => setLockedContentClick(null)}', 'modal backdrop');
replace(
`                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#fff' : '#111' }}>{t('app.upsell.lockedTitle')}</h3>
                <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '28px', lineHeight: 1.5 }}>
                  {t('app.upsell.lockedMessagePart1')} <strong>{lockedModuleClick.name}</strong>, {t('app.upsell.lockedMessagePart2')}
                </p>
                <button onClick={() => { if (lockedModuleClick.checkoutUrl) openExternalLink(lockedModuleClick.checkoutUrl); setLockedModuleClick(null); }} style={{ width: '100%', padding: '16px', background: '#0F172A', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}>
                  <PackageOpen size={18} /> {t('app.upsell.checkoutButton')}
                </button>
                <button onClick={() => setLockedModuleClick(null)} style={{ background: 'transparent', color: isPhoneDark ? '#9CA3AF' : '#6B7280', width: '100%', padding: '12px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{t('app.upsell.cancelButton')}</button>`,
`                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#fff' : '#111' }}>{lockedContentClick.decision.reason === 'drip' ? t('app.upsell.dripTitle') : lockedContentClick.decision.reason === 'points' ? t('app.upsell.pointsTitle') : t('app.upsell.lockedTitle')}</h3>
                <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '28px', lineHeight: 1.5 }}>
                  {lockedContentClick.decision.reason === 'drip'
                    ? t('app.upsell.dripMessage', { days: lockedContentClick.decision.remainingDays || 1, date: lockedContentClick.decision.unlockAt ? new Intl.DateTimeFormat(pwaLanguage).format(new Date(lockedContentClick.decision.unlockAt)) : '' })
                    : lockedContentClick.decision.reason === 'points'
                      ? t('app.upsell.pointsMessage', { points: lockedContentClick.decision.requiredPoints || 0 })
                      : <>{lockedContentClick.kind === 'lesson' ? t('app.upsell.lockedLessonPart1') : t('app.upsell.lockedMessagePart1')} <strong>{lockedContentClick.item.name}</strong>, {t('app.upsell.lockedMessagePart2')}</>}
                </p>
                {lockedContentClick.decision.reason === 'upsell' && (() => {
                  const url = normalizeExternalUrl(lockedContentClick.item.checkoutUrl);
                  if (!url || !url.startsWith('https://')) return null;
                  return <button onClick={() => { openExternalLink(url); setLockedContentClick(null); }} style={{ width: '100%', padding: '16px', background: '#0F172A', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}>
                    <PackageOpen size={18} /> {t('app.upsell.checkoutButton')}
                  </button>;
                })()}
                <button onClick={() => setLockedContentClick(null)} style={{ background: 'transparent', color: isPhoneDark ? '#9CA3AF' : '#6B7280', width: '100%', padding: '12px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{t('app.upsell.cancelButton')}</button>`,
  'access modal',
);

fs.writeFileSync(path, crlf ? source.replace(/\n/g, '\r\n') : source);
console.log('Phone preview access rules patch applied.');
