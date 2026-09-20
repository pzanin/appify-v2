import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Download, LayoutGrid, Grid, PackageOpen, ArrowLeft, Home, Rss, Users, User, Lock, Smartphone, Share, Plus, Headset, MessageCircle, Mail, Copy, Check, Trophy, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { RenderDynamicIcon } from './RenderDynamicIcon';
import { useTranslation } from 'react-i18next';
import { prepareResponsiveHtml } from '../utils/htmlContent';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWARuntimeProps { 
  isPhoneDark: boolean; 
  setIsPhoneDark: (val: boolean) => void; 
}

interface EmptyStateProps {
  icon: any;
  text: string;
}

function EmptyState({ icon: Icon, text }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', height: '100%', flex: 1 }}>
      <div style={{ opacity: 0.15, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={48} />
      </div>
      <p style={{ fontSize: '13px', fontWeight: 600, opacity: 0.4, lineHeight: 1.5, margin: 0, maxWidth: '240px' }}>
        {text}
      </p>
    </div>
  );
}

export function PWARuntime({ isPhoneDark, setIsPhoneDark }: PWARuntimeProps) {
  const { i18n } = useTranslation();
  const appName = useAppStore(state => state.appName);
  const modules = useAppStore(state => state.modules);
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const splashActive = useAppStore(state => state.splashActive);
  const pwaLanguage = pwaConfig.language || 'pt-BR';
  const t = i18n.getFixedT(pwaLanguage.split('-')[0]);
  const mockupOnboardingCompleted = useAppStore(state => state.mockupOnboardingCompleted);
  const setMockupOnboardingCompleted = useAppStore(state => state.setMockupOnboardingCompleted);
  const feedPosts = useAppStore(state => state.feedPosts) || [];
  const pushNotifications = useAppStore(state => state.pushNotifications) || [];
  const currentProjectId = useAppStore(state => state.currentProjectId);
  const { isInstallAvailable, isIOS, isStandalone, triggerInstall } = usePWAInstall();

  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [installAttempted, setInstallAttempted] = useState(false);
  const [hasNewAnnouncement, setHasNewAnnouncement] = useState<boolean>(false);
  const [hasNewPush, setHasNewPush] = useState<boolean>(false);
  const [activePushBanner, setActivePushBanner] = useState<any | null>(null);

  useEffect(() => {
    if (isStandalone) {
      setOnboardingStep(current => current === 1 ? 0 : current);
      return;
    }
    const storageKey = `appify-install-dismissed-${pwaConfig?.appName || appName}`;
    if (localStorage.getItem(storageKey)) return;
    const timer = window.setTimeout(() => setOnboardingStep(current => current === 0 ? 1 : current), 1400);
    return () => window.clearTimeout(timer);
  }, [appName, isStandalone, pwaConfig?.appName]);

  const dismissInstall = () => {
    localStorage.setItem(`appify-install-dismissed-${pwaConfig?.appName || appName}`, '1');
    setOnboardingStep(0);
    setInstallAttempted(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      dismissInstall();
      return;
    }
    if (!isInstallAvailable) {
      setInstallAttempted(true);
      return;
    }
    const outcome = await triggerInstall();
    setInstallAttempted(true);
    if (outcome === 'accepted') dismissInstall();
  };

  useEffect(() => {
    if (feedPosts && feedPosts.length > 0) {
      const latestPost = feedPosts[0];
      const latestTime = latestPost.createdAt || latestPost.id;
      const lastViewed = Number(localStorage.getItem('last_viewed_announcement') || '0');
      if (latestTime > lastViewed) {
        setHasNewAnnouncement(true);
      } else {
        setHasNewAnnouncement(false);
      }
    } else {
      setHasNewAnnouncement(false);
    }
  }, [feedPosts]);

  useEffect(() => {
    if (pushNotifications && pushNotifications.length > 0) {
      const latestPush = pushNotifications[0];
      const latestTime = latestPush.createdAt || latestPush.id;
      const lastViewed = Number(localStorage.getItem('last_viewed_push') || '0');
      if (latestTime > lastViewed) {
        setHasNewPush(true);
        if (Date.now() - latestTime < 10000) {
          setActivePushBanner(latestPush);
          const timer = setTimeout(() => {
            setActivePushBanner(null);
          }, 5000);
          return () => clearTimeout(timer);
        }
      } else {
        setHasNewPush(false);
      }
    } else {
      setHasNewPush(false);
    }
  }, [pushNotifications]);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('inicio');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedMockupModuleId, setSelectedMockupModuleId] = useState<number | null>(null);
  const [selectedMockupSubmoduleId, setSelectedMockupSubmoduleId] = useState<number | null>(null);
  const [mockProfileImg, setMockProfileImg] = useState<string | null>(null);

  // Reset states when project changes
  useEffect(() => {
    setSelectedMockupModuleId(null);
    setSelectedMockupSubmoduleId(null);
    setActiveTab('inicio');
  }, [currentProjectId]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  const awards = pwaConfig?.gamification?.awardsConfig || [];
  const mockEarnedBadges = awards.length > 0 ? [awards[0].id] : [];
  const mockTotalPoints = awards.length > 0 ? awards[0].points : 0;

  const [lockedModuleClick, setLockedModuleClick] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Anti-Cheat states
  const [canCompleteLesson, setCanCompleteLesson] = useState(false);
  const [lessonCompletionTimer, setLessonCompletionTimer] = useState(5);
  const [mockProgressPercentage, setMockProgressPercentage] = useState(0);
  const [isCurrentLessonCompleted, setIsCurrentLessonCompleted] = useState(false);

  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedMockupModule = modules.find(m => m.id === selectedMockupModuleId) || null;
  const selectedMockupSubmodule = selectedMockupModule?.subs?.find(s => s.id === selectedMockupSubmoduleId) || null;

  const themeColor = pwaConfig?.themeColor || '#7c6fff';
  const displayAppName = pwaConfig?.appName || appName;
  const gamification = pwaConfig?.gamification || { enabled: false, progressStyle: 'none', enableStreaks: false, streakIcon: '🔥', enableCelebration: false };

  const navItems = [
    { id: 'inicio', icon: Home, label: t('nav.home', 'Início') },
    { id: 'conteudo', icon: Rss, label: t('nav.content', 'Conteúdo') },
    { id: 'comunidade', icon: Users, label: t('nav.community', 'Comunidade') },
    { id: 'perfil', icon: User, label: t('nav.profile', 'Perfil') }
  ];

  if (pwaConfig?.supportConfig?.type && pwaConfig.supportConfig.type !== 'none') {
    navItems.push({ id: 'suporte', icon: Headset, label: t('nav.support', 'Suporte') });
  }
  const confettiColors = ['#FFC700', '#FF0055', '#00FF88', '#00B8FF'];

  const getModuleProgress = (index: number) => {
    if (index === 0) return 100;
    if (index === 1) return 60;
    return 0;
  };

  const handleSimulateCompletion = () => {
    if (canCompleteLesson && !isCurrentLessonCompleted) {
      setIsCurrentLessonCompleted(true);
      setMockProgressPercentage(100);
      if (selectedMockupSubmodule?.gamificationConfig?.enableCelebration ?? true) {
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 3500);
      }
    }
  };


  useEffect(() => {
    if (selectedMockupModuleId !== null) {
      const modIndex = modules.findIndex(m => m.id === selectedMockupModuleId);
      setMockProgressPercentage(getModuleProgress(modIndex));
    }
  }, [selectedMockupModuleId, modules]);

  useEffect(() => {
    const banners = (pwaConfig?.banners || []).filter(b => b.imageUrl);
    const interval = (pwaConfig?.carouselInterval || 5) * 1000;
    if (banners.length > 1 && activeTab === 'inicio') {
      carouselTimerRef.current = setInterval(() => setCarouselIndex(prev => prev + 1), interval);
    }
    return () => { if (carouselTimerRef.current) clearInterval(carouselTimerRef.current); };
  }, [pwaConfig?.banners, pwaConfig?.carouselInterval, activeTab]);

  useEffect(() => {
    if (pwaConfig?.fontFamily) {
      const fontName = pwaConfig.fontFamily;
      const linkId = `pwa-font-${fontName.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;600;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [pwaConfig?.fontFamily]);

  useEffect(() => {
    if (pwaConfig?.defaultTheme) setIsPhoneDark(pwaConfig.defaultTheme === 'dark');
  }, [pwaConfig?.defaultTheme, setIsPhoneDark]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (selectedMockupSubmodule) {
      const timeGate = selectedMockupSubmodule?.gamificationConfig?.timeGateSeconds || 0;
      setCanCompleteLesson(timeGate === 0);
      setLessonCompletionTimer(timeGate);
      setIsCurrentLessonCompleted(false);
      if (timeGate > 0) {
        interval = setInterval(() => {
          setLessonCompletionTimer((prev) => {
            if (prev <= 1) {
              if (interval) clearInterval(interval);
              setCanCompleteLesson(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      setCanCompleteLesson(false);
      setLessonCompletionTimer(5);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [selectedMockupSubmoduleId]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [pwaLanguage]);


  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div 
        className={`w-full h-full flex flex-col overflow-hidden relative ${isPhoneDark ? 'bg-[#091218] text-white' : 'bg-[#f6f8fa] text-[#1f2328]'}`}
        style={{ 
          fontFamily: pwaConfig?.fontFamily || 'inherit',
          '--dynamic-theme': themeColor,
          width: '100%',
          maxWidth: '430px',
          margin: '0 auto',
          position: 'relative',
          height: '100%'
        } as any}
      >
        <style>{`
          .custom-scrollbar { overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; }
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.3); border-radius: 4px; }
          .pwa-bottom-nav { 
            background: ${isPhoneDark ? 'rgba(22, 27, 34, 0.8)' : 'rgba(255, 255, 255, 0.8)'}; 
            backdrop-filter: blur(12px);
            border-top: 1px solid ${isPhoneDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
          }
        `}</style>

        <AnimatePresence>
          {activePushBanner && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 12, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              onClick={() => {
                setActiveTab('inicio');
                setActivePushBanner(null);
                localStorage.setItem('last_viewed_push', String(Date.now()));
                setHasNewPush(false);
              }}
              style={{
                position: 'absolute',
                top: '40px',
                left: '12px',
                right: '12px',
                background: isPhoneDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: '18px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: isPhoneDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
                zIndex: 999,
                cursor: 'pointer',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <div style={{ width: '36px', height: '36px', background: themeColor, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <Bell size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: isPhoneDark ? '#fff' : '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activePushBanner.title}
                </div>
                <div style={{ fontSize: '12px', color: isPhoneDark ? '#9ca3af' : '#4b5563', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activePushBanner.body}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 pt-12 pb-4 relative z-10" style={{ background: themeColor, color: pwaConfig?.textColor || '#FFFFFF' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)', pointerEvents: 'none' }} />
          <div className="flex items-center gap-3 text-lg font-bold relative z-10">
            <div className="w-8 h-8 bg-[#1a1a24] flex items-center justify-center rounded-lg shadow-lg">
              {pwaConfig?.logoBase64 ? <img src={pwaConfig.logoBase64} alt="Logo" className="w-full h-full rounded-md object-contain" /> : displayAppName.charAt(0).toUpperCase()}
            </div>
            <span className="tracking-tight">{displayAppName}</span>
          </div>
          <div className="flex items-center gap-4 relative z-10">
            {gamification.enabled && gamification.enableStreaks && (
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                <span className="text-sm">{gamification.streakIcon}</span>
                <span className="text-xs font-black">3</span>
              </div>
            )}
            {!isStandalone && (
              <button
                type="button"
                onClick={() => { setInstallAttempted(false); setOnboardingStep(1); }}
                aria-label={t('app.header.install', 'Instalar')}
                title={t('app.header.install', 'Instalar')}
                className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                style={{ display: 'inline-flex', color: 'inherit', background: 'transparent', border: 'none', padding: 0 }}
              >
                <Download size={18} strokeWidth={2.5} />
              </button>
            )}
            <div onClick={() => setIsPhoneDark(!isPhoneDark)} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
              {isPhoneDark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
            </div>
            <div 
              onClick={() => {
                localStorage.setItem('last_viewed_push', String(Date.now()));
                setHasNewPush(false);
                setOnboardingStep(2);
              }} 
              className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity relative"
            >
              <Bell size={18} strokeWidth={2.5} />
              {hasNewPush && (
                <span 
                  style={{ 
                    position: 'absolute', 
                    top: '-2px', 
                    right: '-2px', 
                    width: '6px', 
                    height: '6px', 
                    backgroundColor: '#ef4444', 
                    borderRadius: '50%', 
                    border: isPhoneDark ? '1px solid #1f2937' : '1px solid #ffffff' 
                  }} 
                />
              )}
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {/* CELEBRATION OVERLAY */}
            {isCelebrating && (
              <motion.div key="celeb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 500, rotate: 0, opacity: 1 }}
                    animate={{ y: 1200, x: (Math.random() * 500) + (Math.random() - 0.5) * 200, rotate: Math.random() * 720, opacity: 0 }}
                    transition={{ duration: 2 + Math.random(), ease: "easeOut", delay: Math.random() * 0.5 }}
                    style={{
                      position: 'absolute', width: '10px', height: '10px',
                      background: confettiColors[i % confettiColors.length],
                      borderRadius: i % 2 === 0 ? '50%' : '2px',
                    }}
                  />
                ))}
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <motion.div initial={{ scale: 0.8, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0, y: -20 }} className={`p-8 rounded-[32px] text-center shadow-2xl border ${isPhoneDark ? 'bg-gray-800 border-white/10' : 'bg-white border-black/5'} max-w-[280px] w-full`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`} style={{ background: `${themeColor}15`, color: themeColor }}>
                      <Trophy size={32} />
                    </div>
                    <h3 className={`text-2xl font-black mb-2 ${isPhoneDark ? 'text-white' : 'text-gray-900'}`}>{t('app.gamification.completed', 'Concluído!')}</h3>
                    <p className={`text-sm font-bold ${isPhoneDark ? 'text-gray-400' : 'text-gray-500'}`}>{t('app.gamification.keepGoing', 'Continue assim!')}</p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* SPLASH SCREEN */}
            {splashActive && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }} transition={{ duration: 0.6 }} className="absolute inset-0 z-[1000] flex flex-col items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd, #1a1a24)` }}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 15 }} className="w-24 h-24 mb-6 relative">
                  {pwaConfig?.iconBase64 ? <img src={pwaConfig.iconBase64} alt="Icon" className="w-full h-full rounded-[28px] shadow-2xl" /> : <div className="w-full h-full rounded-[28px] flex items-center justify-center" style={{ background: '#1F2937', border: '1px solid rgba(255,255,255,0.1)' }}><Smartphone size={48} /></div>}
                </motion.div>
                <h2 className="text-3xl font-black tracking-tighter">{displayAppName}</h2>
                <div className="absolute bottom-16 w-36 h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-3/5 h-full bg-gradient-to-r from-transparent via-white to-transparent" />
                </div>
              </motion.div>
            )}

            {/* NAVIGATION VIEWS */}
            {activeTab === 'perfil' ? (
              <motion.div key="perfil" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center custom-scrollbar px-6 pt-8 pb-32">
                 <div className={`text-2xl font-black mb-8 self-start ${isPhoneDark ? 'text-white' : 'text-gray-900'}`}>{t('app.profile.title', 'Meu Perfil')}</div>
                 <div className="relative mb-8">
                    <label className="cursor-pointer block">
                      <input type="file" hidden accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setMockProfileImg(URL.createObjectURL(e.target.files[0])); }} />
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 ${isPhoneDark ? 'bg-gray-800 border-white/5' : 'bg-white border-black/5 shadow-sm'}`} style={{ color: themeColor }}>
                        {mockProfileImg ? <img src={mockProfileImg} alt="Perfil" className="w-full h-full object-cover" /> : <User size={40} />}
                      </div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-theme flex items-center justify-center text-white rounded-full border-4 shadow-lg" style={{ background: themeColor, borderColor: isPhoneDark ? '#091218' : '#f6f8fa' }}>
                        <Plus size={14} strokeWidth={3} />
                      </div>
                    </label>
                 </div>
                 <div className="w-full space-y-4 mb-8">
                    <input type="text" className={`w-full p-4 rounded-2xl text-sm font-bold outline-none transition-all focus:ring-2 focus:ring-[var(--dynamic-theme)] ${isPhoneDark ? 'bg-white/5 text-gray-300' : 'bg-white text-gray-700 shadow-sm border border-black/5'}`} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t('app.profile.namePlaceholder', 'Nome Completo')} />
                    <input type="email" className={`w-full p-4 rounded-2xl text-sm font-bold border border-dashed outline-none transition-all focus:ring-2 focus:ring-[var(--dynamic-theme)] ${isPhoneDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`} value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder={t('app.profile.emailPlaceholder', 'E-mail (Chave de Acesso)')} />
                 </div>

                 {pwaConfig?.gamification?.enablePoints && (
                   <div className="w-full space-y-6 mb-12">
                      <div className={`flex items-center justify-between p-5 rounded-3xl border ${isPhoneDark ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-black/5'}`}>
                          <div className="flex items-center gap-3 font-black text-sm">
                            <Trophy size={20} color={themeColor} /> {t('app.gamification.points', 'Meus Pontos')}
                          </div>
                          <div className="text-2xl font-black" style={{ color: themeColor }}>{mockTotalPoints}</div>
                      </div>
                      {awards.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                          {awards.map(award => (
                            <div key={award.id} className={`aspect-square flex flex-col items-center justify-center p-3 rounded-2xl text-center border transition-all ${mockEarnedBadges.includes(award.id) ? 'opacity-100' : 'opacity-40 grayscale'}`} style={{ background: mockEarnedBadges.includes(award.id) ? `${themeColor}15` : 'transparent', borderColor: mockEarnedBadges.includes(award.id) ? `${themeColor}30` : (isPhoneDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)') }}>
                              <span className="text-2xl mb-1">{award.icon}</span>
                              <span className="text-[9px] font-black leading-tight uppercase">{award.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                 )}
                 <button className="w-full py-5 rounded-2xl font-black text-white shadow-2xl transition-transform active:scale-95" style={{ background: themeColor, boxShadow: `0 12px 24px ${themeColor}44` }}>{t('app.profile.saveButton', 'Salvar Alterações')}</button>
              </motion.div>
            ) : activeTab === 'suporte' ? (
              <motion.div key="suporte" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center custom-scrollbar px-6 pt-8 pb-32">
                <div style={{ width: '80px', height: '80px', background: `${themeColor}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: themeColor, flexShrink: 0 }}>
                  <Headset size={40} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: isPhoneDark ? 'white' : '#111', textAlign: 'center' }}>{t('app.support.title')}</h2>
                <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', lineHeight: 1.6, marginBottom: '32px', textAlign: 'center' }}>{t('app.support.description')}</p>

                {pwaConfig?.supportConfig?.type === 'whatsapp' ? (
                  <button 
                    onClick={() => window.open(`https://wa.me/${pwaConfig.supportConfig.contact}`, '_blank')}
                    style={{ width: '100%', padding: '18px', background: '#25D366', color: 'white', borderRadius: '18px', border: 'none', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)', flexShrink: 0 }}
                  >
                    <MessageCircle size={20} /> {t('app.support.openWa')}
                  </button>
                ) : (
                  <div style={{ width: '100%', background: isPhoneDark ? '#1F2937' : '#F9FAFB', padding: '20px', borderRadius: '24px', border: `1px solid ${isPhoneDark ? '#374151' : '#E5E7EB'}`, flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '8px', letterSpacing: '0.5px' }}>{t('app.support.emailLabel')}</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: isPhoneDark ? 'white' : '#111', marginBottom: '16px', wordBreak: 'break-all', lineHeight: '1.4' }}>{pwaConfig?.supportConfig?.contact || 'suporte@sua-plataforma.com'}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pwaConfig?.supportConfig?.contact || '');
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      style={{ width: '100%', padding: '12px', background: isPhoneDark ? '#374151' : 'white', color: isPhoneDark ? 'white' : '#111', borderRadius: '14px', border: `1px solid ${isPhoneDark ? '#4B5563' : '#E5E7EB'}`, fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {copied ? <Check size={18} color="#22c55e" /> : <Copy size={18} />}
                      {copied ? t('app.support.copied') : t('app.support.copyEmail')}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'comunidade' ? (
              <motion.div key="comunidade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col px-6 pt-8 pb-32 custom-scrollbar">
                 <div className={`text-2xl font-black mb-6 ${isPhoneDark ? 'text-white' : 'text-gray-900'}`}>{t('app.community.title', 'Comunidade')}</div>
                 {feedPosts && feedPosts.length > 0 ? (
                   <div className="flex flex-col gap-4">
                     {feedPosts.map(post => (
                       <div key={post.id} className={`p-5 rounded-3xl border ${isPhoneDark ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-black/5'}`}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black" style={{ background: themeColor }}>{post.author?.[0] || '?'}</div>
                            <div>
                              <div className="text-sm font-black">{post.author}</div>
                              <div className="text-[10px] uppercase font-bold opacity-50">{post.timestamp}</div>
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">{post.content}</p>
                          {post.imageUrl && (
                            <div className="mt-4 rounded-xl overflow-hidden border border-black/5">
                              <img src={post.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                            </div>
                          )}
                       </div>
                     ))}
                   </div>
                 ) : (
                   <EmptyState icon={Users} text={t('app.community.emptyState', 'Nenhum conteúdo disponível no momento')} />
                 )}
              </motion.div>
            ) : activeTab === 'conteudo' ? (
              <motion.div key="conteudo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col px-6 pt-8 pb-32 custom-scrollbar">
                <div className={`text-2xl font-black mb-6 ${isPhoneDark ? 'text-white' : 'text-gray-900'}`}>{t('app.content.title', 'Conteúdo')}</div>
                {pushNotifications && pushNotifications.length > 0 ? (
                  <div className="w-full space-y-4">
                    {pushNotifications.map(push => (
                      <div key={push.id} className={`rounded-3xl overflow-hidden border ${isPhoneDark ? 'bg-gray-800 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                        {push.imageUrl ? (
                          <div className="w-full h-36 overflow-hidden">
                            <img src={push.imageUrl} alt={push.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-36 flex items-center justify-center text-white" style={{ background: themeColor, opacity: 0.9 }}>
                            <Rss size={48} className="opacity-30" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: themeColor }}>{t('app.content.badge', 'NOVIDADE')}</div>
                          <div className={`text-base font-black mb-2 ${isPhoneDark ? 'text-white' : 'text-gray-900'}`}>{push.title}</div>
                          <p className={`text-xs leading-relaxed ${isPhoneDark ? 'text-gray-400' : 'text-gray-500'}`}>{push.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={Rss} text={t('app.content.emptyState', 'Nenhum conteúdo disponível no momento')} />
                )}
              </motion.div>
            ) : (
              <motion.div key="inicio" initial={{ x: '-30%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-30%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="absolute inset-0 flex flex-col">
                <AnimatePresence mode="wait" initial={false}>
                  {selectedMockupModule ? (
                    <motion.div key={`mod-${selectedMockupModule.id}`} initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className={`absolute inset-0 flex flex-col ${selectedMockupSubmodule ? 'overflow-hidden' : 'custom-scrollbar'}`} style={{ padding: selectedMockupSubmodule ? '0' : '20px 20px 80px 20px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: selectedMockupSubmodule ? '12px 16px 8px' : '10px 0 8px', 
                        flexShrink: 0 
                      }}>
                        <button onClick={() => { if (selectedMockupSubmodule) setSelectedMockupSubmoduleId(null); else setSelectedMockupModuleId(null); }} style={{ background: 'transparent', border: 'none', color: isPhoneDark ? '#ffffff' : '#111111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', fontSize: '13px', fontWeight: 700 }}>
                          <ArrowLeft size={16} /> {t('app.modules.back', 'Voltar')}
                        </button>
                        {selectedMockupSubmodule && (
                          <div className="flex items-center">
                            {!isCurrentLessonCompleted ? (
                              !canCompleteLesson ? (
                                <div className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full animate-pulse" style={{ background: isPhoneDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: isPhoneDark ? '#ffffff' : '#111111' }}>
                                  <Clock size={14} />
                                  <span>{lessonCompletionTimer}s</span>
                                </div>
                              ) : (
                                <button 
                                  onClick={handleSimulateCompletion}
                                  className="flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full transition-all"
                                  style={{ color: themeColor, backgroundColor: `${themeColor}20`, border: 'none', cursor: 'pointer' }}
                                >
                                  <CheckCircle size={18} />
                                  <span>{t('app.modules.complete', 'Concluir')}</span>
                                </button>
                              )
                            ) : (
                              <div className="flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full transition-all text-green-500 bg-green-500/10">
                                <div style={{ background: '#22c55e', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                  <Check size={12} strokeWidth={4} />
                                </div>
                                <span>{t('app.modules.completed_status', 'Concluída')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedMockupSubmodule ? (
                        <motion.div key={`sub-${selectedMockupSubmodule.id}`} initial={{ x: '20%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col flex-1 w-full h-full min-h-0 relative">
                          <div className="flex-1 w-full min-h-0 relative bg-white">
                            {(() => {
                              const type = selectedMockupSubmodule.contentType || 'html';
                              const url = selectedMockupSubmodule.contentUrl || '';
                              
                              if (type === 'html') {
                                return (
                                  <iframe 
                                    srcDoc={prepareResponsiveHtml(selectedMockupSubmodule.contentHtml || selectedMockupSubmodule.content_html || '')}
                                    title="Conteúdo da Aula" 
                                    className="absolute inset-0 w-full h-full border-none block" 
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                                    style={{ background: '#ffffff' }} 
                                  />
                                );
                              }

                              let embedUrl = url;
                              if (type === 'youtube') {
                                const id = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
                                embedUrl = `https://www.youtube.com/embed/${id}`;
                              } else if (type === 'vimeo') {
                                const id = url.split('/').pop();
                                embedUrl = `https://player.vimeo.com/video/${id}`;
                              }

                              return (
                                <iframe 
                                  src={embedUrl} 
                                  title="Conteúdo da Aula" 
                                  className="absolute inset-0 w-full h-full border-none block" 
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  style={{ background: '#000' }} 
                                />
                              );
                            })()}
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '18px', color: isPhoneDark ? '#ffffff' : '#111111', marginBottom: '4px', flexShrink: 0 }}>{selectedMockupModule.name}</div>
                          <div style={{ fontSize: '12px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '16px', flexShrink: 0 }}>{selectedMockupModule.subs?.length || 0} {selectedMockupModule.subs?.length === 1 ? t('app.modules.lessonSingle', 'aula') : t('app.modules.lessonPlural', 'aulas')}</div>

                          {/* Progress Bar */}
                          {(() => {
                            return (
                              <div style={{ marginBottom: '16px', flexShrink: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: themeColor }}>
                                    {mockProgressPercentage}% {t('app.modules.completed', 'concluído')}
                                  </span>
                                </div>
                                <div style={{ 
                                  width: '100%', 
                                  height: '6px', 
                                  background: isPhoneDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                                  borderRadius: '99px',
                                  overflow: 'hidden'
                                }}>
                                  <motion.div 
                                    initial={false}
                                    animate={{ width: `${mockProgressPercentage}%` }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    style={{ 
                                      height: '100%', 
                                      background: themeColor,
                                      borderRadius: '99px'
                                    }} 
                                  />
                                </div>
                              </div>
                            );
                          })()}

                          {(selectedMockupModule.subs?.length || 0) === 0 ? (
                            <EmptyState icon={PackageOpen} text={t('app.modules.noLessons', 'Nenhuma aula adicionada')} />
                          ) : (
                            <div className={selectedMockupModule.subs.length === 1 ? 'grid grid-cols-1 w-[66%] mx-auto gap-4' : selectedMockupModule.subs.length === 2 ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-3'}>
                              {selectedMockupModule.subs.map((sub, index) => (
                                <div key={sub.id} onClick={() => setSelectedMockupSubmoduleId(sub.id)} style={{ display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}>
                                  {sub.coverImageUrl ? <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', backgroundImage: `url(${sub.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', boxShadow: isPhoneDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }} /> : <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: 700, border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', boxShadow: isPhoneDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }}>{index + 1}</div>}
                                  <div style={{ width: '100%', paddingLeft: '4px' }}><div style={{ fontSize: '12px', fontWeight: 600, color: isPhoneDark ? '#ffffff' : '#111111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="home" initial={{ x: '-30%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-30%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="absolute inset-0 flex flex-col custom-scrollbar" style={{ padding: '20px 20px 80px 20px' }}>

                      {activeTab === 'inicio' && (() => {
                        const banners = (pwaConfig?.banners || []).filter(b => b.imageUrl);
                        if (banners.length === 0) return <div className="phone-hero" style={{ minHeight: '80px', flexShrink: 0, marginBottom: '16px' }}></div>;

                        const safeIndex = carouselIndex % banners.length;
                        const currentBanner = banners[safeIndex];

                        return (
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 1', overflow: 'hidden', flexShrink: 0, borderRadius: '12px', marginBottom: '16px', boxShadow: isPhoneDark ? 'none' : '0 4px 12px rgba(0,0,0,0.06)' }}>
                            <AnimatePresence mode="wait">
                              <motion.div
                                key={`${currentBanner.id}-${safeIndex}`}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                transition={{ duration: 0.35 }}
                                onClick={() => currentBanner.link && window.open(currentBanner.link, '_blank')}
                                style={{ position: 'absolute', inset: 0, backgroundImage: `url(${currentBanner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', cursor: currentBanner.link ? 'pointer' : 'default' }}
                              />
                            </AnimatePresence>

                            {banners.length > 1 && (
                              <div style={{ position: 'absolute', bottom: '8px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 10 }}>
                                {banners.map((_, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      width: idx === safeIndex ? '16px' : '6px',
                                      height: '6px',
                                      borderRadius: '3px',
                                      background: idx === safeIndex ? themeColor : 'rgba(255, 255, 255, 0.5)',
                                      transition: 'all 0.3s ease',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      <div className="phone-modules-header" style={{ flexShrink: 0 }}>
                        <div className="text-lg font-semibold" style={{ color: isPhoneDark ? '#FFFFFF' : '#111111' }}>{t('app.modules.title', 'Módulos')}</div>
                      </div>

                      {modules.length === 0 ? (
                        <EmptyState icon={LayoutGrid} text={t('app.modules.emptyState', 'Nenhum módulo criado')} />
                      ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                          {modules.map((mod, idx) => {
                            const isLocked = mod.releaseType === 'locked' || mod.releaseType === 'upsell';
                            const isByPoints = mod.releaseType === 'points';
                            const progress = getModuleProgress(idx);
                            
                            return (
                              <div
                                key={mod.id}
                                className="phone-module-wrapper"
                                onClick={() => {
                                  if (mod.status === 'Rascunho') return;
                                  if (isLocked || isByPoints) {
                                    setLockedModuleClick(mod);
                                  } else {
                                    setSelectedMockupModuleId(mod.id);
                                  }
                                }}
                                style={{ cursor: mod.status !== 'Rascunho' ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', height: 'auto' }}
                              >
                                <div style={{
                                  position: 'relative', width: '100%', aspectRatio: '1/1',
                                  borderRadius: '16px', backgroundColor: isPhoneDark ? '#1f2937' : '#ffffff',
                                  boxShadow: isPhoneDark ? '0 4px 0 rgba(255,255,255,0.06)' : '0 4px 12px rgba(0,0,0,0.06)',
                                  border: isPhoneDark ? 'none' : '1px solid #f3f4f6',
                                  marginBottom: '6px', flexShrink: 0,
                                  overflow: 'hidden'
                                }}>
                                  <div style={{ position: 'absolute', inset: 0, background: mod.coverImageUrl ? `url(${mod.coverImageUrl}) center/cover no-repeat` : 'rgba(107,138,240,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                                    {!mod.coverImageUrl && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: themeColor, opacity: mod.status === 'Rascunho' ? 0.4 : 1 }}><RenderDynamicIcon name={mod.iconName} size={48} /></div>}
                                    {(isLocked || isByPoints) && (
                                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                          <Lock size={20} color="#111111" />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Progress Badge */}
                                  {gamification.enabled && gamification.progressStyle === 'ring' && (
                                    <div style={{ 
                                      position: 'absolute', top: '8px', left: '8px', 
                                      background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', 
                                      color: 'white', padding: '4px 8px', borderRadius: '8px', 
                                      fontSize: '10px', fontWeight: 800, zIndex: 2 
                                    }}>
                                      {progress}%
                                    </div>
                                  )}

                                  {/* Progress Bar */}
                                  {gamification.enabled && gamification.progressStyle === 'bar' && (
                                    <div style={{ 
                                      position: 'absolute', bottom: 0, left: 0, right: 0, 
                                      height: '4px', background: isPhoneDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                                      zIndex: 3 
                                    }}>
                                      <div style={{ 
                                        height: '100%', width: `${progress}%`, 
                                        background: themeColor, transition: 'width 0.6s ease' 
                                      }} />
                                    </div>
                                  )}

                                  {mod.status === 'Rascunho' && (<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1, borderRadius: '16px' }} />)}
                                  {isByPoints && (
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 800, zIndex: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                                      <Lock size={12} /> {mod.requiredPoints || 0} pts
                                    </div>
                                  )}
                                  {!isLocked && !isByPoints && (
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, zIndex: 2 }}>
                                      {mod.subs?.length || 0} {t('app.modules.lessonPlural', 'Aulas')}
                                    </div>
                                  )}
                                </div>
                                <div style={{ opacity: mod.status === 'Rascunho' ? 0.6 : 1, color: isPhoneDark ? '#ffffff' : '#111111', fontSize: '13px', fontWeight: 600, paddingLeft: '2px', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {mod.name}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM NAVIGATION */}
        <nav className="pwa-bottom-nav absolute bottom-0 left-0 right-0 px-6 pt-4 pb-8 flex justify-between items-center z-[100]">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => { 
                setActiveTab(item.id); 
                setSelectedMockupModuleId(null); 
                setSelectedMockupSubmoduleId(null); 
                if (item.id === 'comunidade') {
                  localStorage.setItem('last_viewed_announcement', String(Date.now()));
                  setHasNewAnnouncement(false);
                }
              }}
              className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
              style={{ color: activeTab === item.id ? themeColor : 'inherit', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
                {item.id === 'comunidade' && hasNewAnnouncement && (
                  <span 
                    style={{ 
                      position: 'absolute', 
                      top: '-2px', 
                      right: '-2px', 
                      width: '8px', 
                      height: '8px', 
                      backgroundColor: '#ef4444', 
                      borderRadius: '50%', 
                      border: isPhoneDark ? '1px solid #1f2937' : '1px solid #ffffff' 
                    }} 
                  />
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* ONBOARDING MODAL */}
        <AnimatePresence>
          {onboardingStep > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] flex flex-col justify-end" style={{ background: 'rgba(9, 18, 24, 0.92)' }}>
              <div className="absolute inset-0" onClick={() => { setOnboardingStep(0); setMockupOnboardingCompleted(true); }} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className={`relative rounded-t-[40px] p-8 text-center ${isPhoneDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border-t border-[var(--border)]`}>
                <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '120px', background: themeColor, filter: 'blur(60px)', opacity: 0.1, pointerEvents: 'none' }} />

                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: `${themeColor}15`, color: themeColor }}>
                  {onboardingStep === 1 ? <Download size={32} /> : <Bell size={32} />}
                </div>

                <h3 className="text-xl font-black mb-3">
                  {onboardingStep === 1 ? t('onboarding.install.title', 'Instalar App') : t('onboarding.push.title', 'Notificações')}
                </h3>
                <p className="text-sm opacity-60 mb-8 leading-relaxed">
                  {onboardingStep === 1 ? t('onboarding.install.subtitle', 'Adicione nosso app à sua tela inicial para acesso instantâneo.') : t('onboarding.push.subtitle', 'Ative as notificações para receber lembretes e novidades em tempo real.')}
                </p>

                {onboardingStep === 1 && isIOS && (
                  <div className="text-left rounded-2xl p-4 mb-5 space-y-3" style={{ background: isPhoneDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)' }}>
                    <div className="flex items-center gap-3"><Share size={18} /><span className="text-sm font-semibold">{t('onboarding.install.iosStep1', '1. Toque no ícone de Compartilhar')}</span></div>
                    <div className="flex items-center gap-3"><Plus size={18} /><span className="text-sm font-semibold">{t('onboarding.install.iosStep2', '2. Selecione “Adicionar à Tela de Início”')}</span></div>
                    <div className="flex items-center gap-3"><Check size={18} /><span className="text-sm font-semibold">{t('onboarding.install.iosStep3', '3. Ative “Abrir como Aplicativo Web” e toque em Adicionar')}</span></div>
                  </div>
                )}

                {onboardingStep === 1 && !isIOS && !isInstallAvailable && installAttempted && (
                  <div className="rounded-2xl p-4 mb-5 text-sm leading-relaxed" style={{ background: isPhoneDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)' }}>
                    {t('onboarding.install.androidHelp', 'Abra o menu do navegador e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.')}
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (onboardingStep === 1) void handleInstall();
                    else { setOnboardingStep(0); setMockupOnboardingCompleted(true); }
                  }}
                  className="w-full py-5 rounded-2xl font-black text-white shadow-xl mb-3"
                  style={{ background: themeColor, border: 'none', cursor: 'pointer' }}
                >
                  {onboardingStep === 1
                    ? (isIOS ? t('onboarding.install.understood', 'Entendi') : t('onboarding.install.confirm', 'Instalar Agora'))
                    : t('onboarding.push.confirm', 'Ativar')}
                </button>
                <button 
                  onClick={() => {
                    if (onboardingStep === 1) dismissInstall();
                    else { setOnboardingStep(0); setMockupOnboardingCompleted(true); }
                  }} 
                  className="w-full py-3 font-bold opacity-40"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  {t('onboarding.install.skip', 'Agora Não')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODALS */}
        <AnimatePresence>
          {lockedModuleClick && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLockedModuleClick(null)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`relative p-8 rounded-t-[40px] text-center ${isPhoneDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-50">
                  <Lock size={28} color="#f59e0b" />
                </div>
                <h3 className="text-xl font-black mb-2">{t('app.upsell.lockedTitle', 'Conteúdo Bloqueado')}</h3>
                <p className="text-sm opacity-60 mb-8 leading-relaxed">Para acessar o módulo <strong>{lockedModuleClick.name}</strong>, é necessário adquirir este upgrade.</p>
                <button className="w-full py-5 rounded-2xl font-black bg-gray-900 text-white shadow-xl mb-3" style={{ border: 'none', cursor: 'pointer' }}>{t('app.upsell.checkoutButton', 'Ir para o Checkout')}</button>
                <button onClick={() => setLockedModuleClick(null)} className="w-full py-3 font-bold opacity-40" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>{t('app.upsell.cancelButton', 'Cancelar')}</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
