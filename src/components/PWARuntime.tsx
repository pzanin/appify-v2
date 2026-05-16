import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Download, LayoutGrid, Grid, PackageOpen, ArrowLeft, Home, Rss, Users, User, Lock, Smartphone, Share, Plus, Headset, MessageCircle, Mail, Copy, Check, Trophy, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { RenderDynamicIcon } from './RenderDynamicIcon';
import { useTranslation } from 'react-i18next';

interface PWARuntimeProps { 
  isPhoneDark: boolean; 
  setIsPhoneDark: (val: boolean) => void; 
}

export function PWARuntime({ isPhoneDark, setIsPhoneDark }: PWARuntimeProps) {
  const { t } = useTranslation();
  const appName = useAppStore(state => state.appName);
  const modules = useAppStore(state => state.modules);
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const splashActive = useAppStore(state => state.splashActive);
  const activeLocale = useAppStore(state => state.activeLocale);
  const mockupOnboardingCompleted = useAppStore(state => state.mockupOnboardingCompleted);
  const setMockupOnboardingCompleted = useAppStore(state => state.setMockupOnboardingCompleted);

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(0);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('inicio');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedMockupModuleId, setSelectedMockupModuleId] = useState<number | null>(null);
  const [selectedMockupSubmoduleId, setSelectedMockupSubmoduleId] = useState<number | null>(null);
  const [mockProfileImg, setMockProfileImg] = useState<string | null>(null);
  
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

  // Bootstrap do PWA (Fetch dos dados estáticos compilados)
  useEffect(() => {
    fetch('/app-data.json')
      .then(res => res.json())
      .then(data => {
        useAppStore.setState(data);
        setIsHydrated(true); // Libera a tela
      })
      .catch(err => {
        console.error("Erro ao ler app-data:", err);
        setIsHydrated(true); // Libera a tela mesmo com erro para não travar em dev
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

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
    if (selectedMockupSubmoduleId) {
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
  }, [activeLocale]);

  const getResponsiveHtml = (html: string) => {
    if (!html) return '';
    const hideScrollbarStyle = `<style>::-webkit-scrollbar { display: none !important; width: 0px !important; } html, body { -ms-overflow-style: none !important; scrollbar-width: none !important; margin: 0; padding: 0; overflow-x: hidden; max-width: 100vw; font-family: sans-serif; } img, video, iframe { max-width: 100% !important; height: auto; } * { box-sizing: border-box; }</style>`;
    if (html.includes('<html') || html.includes('<meta name="viewport"')) {
      return html.includes('</head>') ? html.replace('</head>', `${hideScrollbarStyle}</head>`) : `${hideScrollbarStyle}${html}`;
    }
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">${hideScrollbarStyle}</head><body>${html}</body></html>`;
  };

  if (isBootstrapping) {
    return (
      <div className={`w-screen h-screen flex items-center justify-center ${isPhoneDark ? 'bg-[#0d1117] text-white' : 'bg-[#f6f8fa] text-[#1f2328]'}`}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!isHydrated) {
    return <div style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff', fontFamily: 'sans-serif'}}>Carregando App...</div>;
  }

  return (
    <div 
      className={`w-screen h-screen flex flex-col overflow-hidden relative ${isPhoneDark ? 'bg-[#0d1117] text-white' : 'bg-[#f6f8fa] text-[#1f2328]'}`}
      style={{ 
        fontFamily: pwaConfig?.fontFamily || 'inherit',
        '--dynamic-theme': themeColor
      } as any}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pwa-bottom-nav { 
          background: ${isPhoneDark ? 'rgba(22, 27, 34, 0.8)' : 'rgba(255, 255, 255, 0.8)'}; 
          backdrop-filter: blur(12px);
          border-top: 1px solid ${isPhoneDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
        }
      `}</style>

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
          <div onClick={() => setIsPhoneDark(!isPhoneDark)} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            {isPhoneDark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
          </div>
          <div onClick={() => setOnboardingStep(2)} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
            <Bell size={18} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-height-0 relative overflow-hidden flex flex-col">
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
                {pwaConfig?.iconBase64 ? <img src={pwaConfig.iconBase64} alt="Icon" className="w-full h-full rounded-[28px] shadow-2xl" /> : <div className="w-full h-full bg-white/10 backdrop-blur-lg rounded-[28px] border border-white/20 flex items-center justify-center"><Smartphone size={48} /></div>}
              </motion.div>
              <h2 className="text-3xl font-black tracking-tighter">{displayAppName}</h2>
              <div className="absolute bottom-16 w-36 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-3/5 h-full bg-gradient-to-r from-transparent via-white to-transparent" />
              </div>
            </motion.div>
          )}

          {/* NAVIGATION VIEWS */}
          {activeTab === 'perfil' ? (
            <motion.div key="perfil" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col items-center overflow-y-auto no-scrollbar px-6 pt-8 pb-32">
               <div className={`text-2xl font-black mb-8 self-start ${isPhoneDark ? 'text-white' : 'text-gray-900'}`}>{t('app.profile.title', 'Meu Perfil')}</div>
               <div className="relative mb-8">
                  <label className="cursor-pointer block">
                    <input type="file" hidden accept="image/*" onChange={(e) => { if (e.target.files?.[0]) setMockProfileImg(URL.createObjectURL(e.target.files[0])); }} />
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-4 ${isPhoneDark ? 'bg-gray-800 border-white/5' : 'bg-white border-black/5 shadow-sm'}`} style={{ color: themeColor }}>
                      {mockProfileImg ? <img src={mockProfileImg} alt="Perfil" className="w-full h-full object-cover" /> : <User size={40} />}
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-theme flex items-center justify-center text-white rounded-full border-4 shadow-lg" style={{ background: themeColor, borderColor: isPhoneDark ? '#0d1117' : '#f6f8fa' }}>
                      <Plus size={14} strokeWidth={3} />
                    </div>
                  </label>
               </div>
               <div className="w-full space-y-4 mb-8">
                  <div className={`p-4 rounded-2xl text-sm font-bold ${isPhoneDark ? 'bg-white/5' : 'bg-white shadow-sm border border-black/5'}`} style={{ color: isPhoneDark ? '#9ca3af' : '#4b5563' }}>Nome do Aluno</div>
                  <div className={`p-4 rounded-2xl text-sm font-bold border border-dashed ${isPhoneDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`} style={{ color: isPhoneDark ? '#6b7280' : '#9ca3af' }}>email@exemplo.com</div>
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
          ) : activeTab === 'comunidade' ? (
            <motion.div key="comunidade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col px-6 pt-8 pb-32 overflow-y-auto no-scrollbar">
               <div className={`text-2xl font-black mb-6 ${isPhoneDark ? 'text-white' : 'text-gray-900'}`}>{t('app.community.title', 'Comunidade')}</div>
               <div className={`p-5 rounded-3xl border ${isPhoneDark ? 'bg-white/5 border-white/5' : 'bg-white shadow-sm border-black/5'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black" style={{ background: themeColor }}>A</div>
                    <div>
                      <div className="text-sm font-black">Admin</div>
                      <div className="text-[10px] uppercase font-bold opacity-50">Agora mesmo</div>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed opacity-80">{t('app.community.welcomeMessage', 'Bem-vindo à nossa comunidade! Este é o seu espaço premium para interagir e tirar dúvidas.')}</p>
               </div>
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-y-auto no-scrollbar pb-32">
              {/* HOME CONTENT */}
              <div className="px-6 pt-8">
                 {/* CAROUSEL */}
                 {(() => {
                    const banners = (pwaConfig?.banners || []).filter(b => b.imageUrl);
                    if (banners.length === 0) return null;
                    const safeIndex = carouselIndex % banners.length;
                    const banner = banners[safeIndex];
                    return (
                      <div className="relative w-full aspect-[2.5/1] rounded-3xl overflow-hidden shadow-2xl mb-8 group cursor-pointer" onClick={() => banner.link && window.open(banner.link, '_blank')}>
                        <AnimatePresence mode="wait">
                          <motion.div key={banner.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${banner.imageUrl})` }} />
                        </AnimatePresence>
                        {banners.length > 1 && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                            {banners.map((_, i) => (
                              <div key={i} className={`h-1.5 rounded-full transition-all ${i === safeIndex ? 'w-6' : 'w-1.5'}`} style={{ background: i === safeIndex ? themeColor : 'rgba(255,255,255,0.4)' }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                 })()}

                 <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <RenderDynamicIcon name="LayoutGrid" size={20} color={themeColor} />
                    {t('app.modules.title', 'Módulos')}
                 </h3>

                 {/* MODULES GRID */}
                 <div className="grid grid-cols-2 gap-4">
                    {modules.map((mod, idx) => {
                      const isLocked = mod.releaseType === 'locked' || mod.releaseType === 'upsell';
                      return (
                        <motion.div 
                          key={mod.id} 
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (isLocked) setLockedModuleClick(mod);
                            else setSelectedMockupModuleId(mod.id);
                          }}
                          className={`flex flex-col group cursor-pointer`}
                        >
                          <div className={`aspect-square rounded-3xl overflow-hidden relative mb-3 border-2 transition-all ${isPhoneDark ? 'bg-gray-800 border-white/5 group-hover:border-white/20' : 'bg-white border-black/5 group-hover:border-black/10 shadow-sm'}`}>
                             {mod.coverImageUrl ? (
                               <img src={mod.coverImageUrl} alt={mod.name} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full flex items-center justify-center opacity-40">
                                  <RenderDynamicIcon name={mod.iconName} size={40} />
                               </div>
                             )}
                             {isLocked && (
                               <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                                    <Lock size={18} color="#000" />
                                  </div>
                               </div>
                             )}
                          </div>
                          <span className="text-xs font-black px-1 truncate leading-tight uppercase opacity-90">{mod.name}</span>
                        </motion.div>
                      );
                    })}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="pwa-bottom-nav fixed bottom-0 left-0 right-0 px-6 pt-4 pb-8 flex justify-between items-center z-[100]">
        {[
          { id: 'inicio', icon: Home, label: t('nav.home', 'Início') },
          { id: 'conteudo', icon: Rss, label: t('nav.content', 'Conteúdo') },
          { id: 'comunidade', icon: Users, label: t('nav.community', 'Comunidade') },
          { id: 'perfil', icon: User, label: t('nav.profile', 'Perfil') }
        ].map(item => (
          <button 
            key={item.id} 
            onClick={() => { setActiveTab(item.id); setSelectedMockupModuleId(null); setSelectedMockupSubmoduleId(null); }}
            className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === item.id ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
            style={{ color: activeTab === item.id ? themeColor : 'inherit' }}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} />
            <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* MODALS (Locked, Onboarding, etc) - Ported as overlays */}
      <AnimatePresence>
        {lockedModuleClick && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setLockedModuleClick(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className={`relative p-8 rounded-t-[40px] text-center ${isPhoneDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-50">
                <Lock size={28} color="#f59e0b" />
              </div>
              <h3 className="text-xl font-black mb-2">{t('app.upsell.lockedTitle', 'Conteúdo Bloqueado')}</h3>
              <p className="text-sm opacity-60 mb-8 leading-relaxed">Para acessar o módulo <strong>{lockedModuleClick.name}</strong>, é necessário adquirir este upgrade.</p>
              <button className="w-full py-5 rounded-2xl font-black bg-gray-900 text-white shadow-xl mb-3">{t('app.upsell.checkoutButton', 'Ir para o Checkout')}</button>
              <button onClick={() => setLockedModuleClick(null)} className="w-full py-3 font-bold opacity-40">{t('app.upsell.cancelButton', 'Cancelar')}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
