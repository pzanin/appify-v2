import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Download, LayoutGrid, Grid, PackageOpen, ArrowLeft, Home, Rss, Users, User, Lock, Smartphone, Share, Plus, Headset, MessageCircle, Mail, Copy, Check, Trophy, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { PIPELINE_STEPS } from '../constants';
import { RenderDynamicIcon } from './RenderDynamicIcon';
import { useTranslation } from 'react-i18next';

interface PhoneMockupProps { isPhoneDark: boolean; setIsPhoneDark: (val: boolean) => void; }

export function PhoneMockup({ isPhoneDark, setIsPhoneDark }: PhoneMockupProps) {
  const { t } = useTranslation();
  const appName = useAppStore(state => state.appName);
  const modules = useAppStore(state => state.modules);
  const activeStep = useAppStore(state => state.activeStep);
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const currentView = useAppStore(state => state.currentView);
  const splashActive = useAppStore(state => state.splashActive);
  const activeLocale = useAppStore(state => state.activeLocale);
  const mockupOnboardingCompleted = useAppStore(state => state.mockupOnboardingCompleted);
  const setMockupOnboardingCompleted = useAppStore(state => state.setMockupOnboardingCompleted);

  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('inicio');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedMockupModuleId, setSelectedMockupModuleId] = useState<number | null>(null);
  const [selectedMockupSubmoduleId, setSelectedMockupSubmoduleId] = useState<number | null>(null);
  const [mockProfileImg, setMockProfileImg] = useState<string | null>(null);

  const [lockedModuleClick, setLockedModuleClick] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);

  // Anti-Cheat states
  const [canCompleteLesson, setCanCompleteLesson] = useState(false);
  const [lessonCompletionTimer, setLessonCompletionTimer] = useState(5);
  const [mockProgressPercentage, setMockProgressPercentage] = useState(0);
  const [isCurrentLessonCompleted, setIsCurrentLessonCompleted] = useState(false);

  const onboardingShown = useRef(false);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedMockupModule = modules.find(m => m.id === selectedMockupModuleId) || null;
  const selectedMockupSubmodule = selectedMockupModule?.subs?.find(s => s.id === selectedMockupSubmoduleId) || null;

  const themeColor = pwaConfig?.themeColor || '#6b8af0';
  const displayAppName = pwaConfig?.appName || appName;

  // Gamification state with safe fallbacks
  const gamification = pwaConfig?.gamification || { 
    enabled: false, 
    progressStyle: 'none', 
    enableStreaks: false, 
    streakIcon: '🔥', 
    enableCelebration: false 
  };

  const confettiColors = ['#FFC700', '#FF0055', '#00FF88', '#00B8FF'];

  // Mock Progress for modules
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

  // Sync mock progress when module is selected
  useEffect(() => {
    if (selectedMockupModuleId !== null) {
      const modIndex = modules.findIndex(m => m.id === selectedMockupModuleId);
      setMockProgressPercentage(getModuleProgress(modIndex));
    }
  }, [selectedMockupModuleId, modules]);

  useEffect(() => {
    const banners = (pwaConfig.banners || []).filter(b => b.imageUrl);
    const interval = (pwaConfig.carouselInterval || 5) * 1000;
    
    if (banners.length > 1 && activeTab === 'inicio' && activeStep !== 0) {
      carouselTimerRef.current = setInterval(() => {
        setCarouselIndex(prev => prev + 1);
      }, interval);
    }
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [pwaConfig.banners, pwaConfig.carouselInterval, activeTab, activeStep]);

  useEffect(() => {
    if (pwaConfig.fontFamily) {
      const fontName = pwaConfig.fontFamily;
      const linkId = `mockup-font-${fontName.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@400;600;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [pwaConfig.fontFamily]);

  // Sync isPhoneDark with defaultTheme from pwaConfig
  useEffect(() => {
    if (pwaConfig.defaultTheme) {
      setIsPhoneDark(pwaConfig.defaultTheme === 'dark');
    }
  }, [pwaConfig.defaultTheme, setIsPhoneDark]);

  // Anti-Cheat Timer Logic
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

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedMockupSubmoduleId]);

  // Simulated Onboarding Trigger
  useEffect(() => {
    if (activeStep !== 0 && !mockupOnboardingCompleted && onboardingStep === 0) {
      const timer = setTimeout(() => setOnboardingStep(1), 1000);
      return () => clearTimeout(timer);
    }
  }, [activeStep, mockupOnboardingCompleted]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [activeLocale]);

  const getResponsiveHtml = (html: string) => {
    if (!html) return '';
    const hideScrollbarStyle = `
      <style>
        ::-webkit-scrollbar { display: none !important; width: 0px !important; background: transparent !important; }
        html, body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      </style>
    `;
    if (html.includes('<html') || html.includes('<meta name="viewport"')) {
      return html.includes('</head>') ? html.replace('</head>', `${hideScrollbarStyle}</head>`) : `${hideScrollbarStyle}${html}`;
    }
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">${hideScrollbarStyle}<style>html, body { margin: 0; padding: 0; overflow-x: hidden; max-width: 100vw; font-family: sans-serif; } img, video, iframe { max-width: 100% !important; height: auto; } * { box-sizing: border-box; }</style></head><body>${html}</body></html>`;
  };

  return (
    <div className="workspace-preview">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      <div className={`phone-mockup ${isPhoneDark ? '' : 'light'}`} style={{ '--dynamic-theme': themeColor, fontFamily: pwaConfig.fontFamily || 'inherit', opacity: isTransitioning ? 0 : 1, transition: 'opacity 0.3s ease' } as any}>

        <AnimatePresence>
          {isCelebrating && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none', overflow: 'hidden' }}
            >
              {/* Confetti Particles */}
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: -20, 
                    x: Math.random() * 300, 
                    rotate: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    y: 800, 
                    x: (Math.random() * 300) + (Math.random() - 0.5) * 100,
                    rotate: Math.random() * 360 * 2,
                    opacity: 0
                  }}
                  transition={{ 
                    duration: 2 + Math.random(), 
                    ease: "easeOut",
                    delay: Math.random() * 0.5
                  }}
                  style={{
                    position: 'absolute',
                    width: i % 2 === 0 ? '8px' : '10px',
                    height: i % 2 === 0 ? '8px' : '5px',
                    background: confettiColors[i % confettiColors.length],
                    borderRadius: i % 3 === 0 ? '50%' : '2px',
                  }}
                />
              ))}

              {/* Dopamine Toast */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: -20 }}
                  style={{
                    background: isPhoneDark ? '#1f2937' : '#ffffff',
                    padding: '32px',
                    borderRadius: '32px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                    textAlign: 'center',
                    border: `1px solid ${isPhoneDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                    width: '100%',
                    maxWidth: '240px'
                  }}
                >
                  <div style={{ width: '60px', height: '60px', background: `${themeColor}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: themeColor }}>
                    <Trophy size={32} />
                  </div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#fff' : '#111' }}>
                    {t('app.gamification.completed', 'Concluído!')}
                  </h3>
                  <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', fontWeight: 600 }}>
                    {t('app.gamification.keepGoing', 'Continue assim!')}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {splashActive && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: themeColor, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '20px' }}>
                {pwaConfig.iconBase64 ? <img src={pwaConfig.iconBase64} alt="Icon" style={{ width: '100%', height: '100%', borderRadius: '24px' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Smartphone size={48} /></div>}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{displayAppName}</h2>
              <div style={{ position: 'absolute', bottom: '40px', width: '120px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.5, ease: "easeInOut" }} style={{ width: '100%', height: '100%', background: 'white' }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {lockedModuleClick && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 60, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ position: 'absolute', inset: 0 }} onClick={() => setLockedModuleClick(null)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'relative', background: isPhoneDark ? '#1f2937' : 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px 40px', color: isPhoneDark ? '#fff' : '#111', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '6px solid #FFE0B2' }}>
                  <Lock size={32} color="#F57C00" />
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#fff' : '#111' }}>{t('app.upsell.lockedTitle', 'Conteúdo Bloqueado')}</h3>
                <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '28px', lineHeight: 1.5 }}>
                  {t('app.upsell.lockedMessagePart1', 'Para acessar o módulo')} <strong>{lockedModuleClick.name}</strong>, {t('app.upsell.lockedMessagePart2', 'é necessário adquirir este upgrade.')}
                </p>
                <button onClick={() => { if (lockedModuleClick.checkoutUrl) window.open(lockedModuleClick.checkoutUrl, '_blank'); setLockedModuleClick(null); }} style={{ width: '100%', padding: '16px', background: '#0F172A', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}>
                  <PackageOpen size={18} /> {t('app.upsell.checkoutButton', 'Ir para o Checkout')}
                </button>
                <button onClick={() => setLockedModuleClick(null)} style={{ background: 'transparent', color: isPhoneDark ? '#9CA3AF' : '#6B7280', width: '100%', padding: '12px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>{t('app.upsell.cancelButton', 'Cancelar')}</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {onboardingStep > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 150, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0 }} onClick={() => { setOnboardingStep(0); setMockupOnboardingCompleted(true); }} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'relative', background: isPhoneDark ? '#1F2937' : 'white', borderRadius: '32px 32px 0 0', padding: '40px 24px 32px', color: isPhoneDark ? 'white' : '#111', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                {/* Background Glow */}
                <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '120px', height: '120px', background: themeColor, filter: 'blur(60px)', opacity: 0.1, pointerEvents: 'none' }} />

                <div style={{ width: '72px', height: '72px', background: `${themeColor}15`, borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: themeColor }}>
                  {onboardingStep === 1 ? <Download size={32} /> : <Bell size={32} />}
                </div>

                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>
                  {onboardingStep === 1 ? t('onboarding.install.title', 'Instalar App') : t('onboarding.push.title', 'Notificações')}
                </h3>
                <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', lineHeight: 1.6, marginBottom: '32px', padding: '0 10px' }}>
                  {onboardingStep === 1 ? t('onboarding.install.subtitle', 'Adicione nosso app à sua tela inicial para acesso instantâneo.') : t('onboarding.push.subtitle', 'Ative as notificações para receber lembretes e novidades em tempo real.')}
                </p>


                <button 
                  onClick={() => {
                    if (onboardingStep === 1) setOnboardingStep(2);
                    else { setOnboardingStep(0); setMockupOnboardingCompleted(true); }
                  }} 
                  style={{ background: themeColor, color: 'white', borderRadius: '16px', width: '100%', padding: '16px', fontWeight: 700, fontSize: '16px', marginBottom: '12px', border: 'none', cursor: 'pointer', boxShadow: `0 4px 12px ${themeColor}33` }}
                >
                  {onboardingStep === 1 ? t('onboarding.install.confirm', 'Instalar Agora') : t('onboarding.push.confirm', 'Ativar')}
                </button>
                <button 
                  onClick={() => {
                    if (onboardingStep === 1) setOnboardingStep(2);
                    else { setOnboardingStep(0); setMockupOnboardingCompleted(true); }
                  }} 
                  style={{ background: 'transparent', color: isPhoneDark ? '#9CA3AF' : '#6B7280', width: '100%', padding: '10px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('onboarding.install.skip', 'Agora Não')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="phone-notch"></div>
        <div className="phone-header-bg">
          <div className="flex items-center gap-2 text-xl font-bold" style={{ color: pwaConfig.textColor || '#FFFFFF' }}>
            <div className="phone-logo-icon">
              {pwaConfig.logoBase64 ? <img src={pwaConfig.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} /> : displayAppName.charAt(0).toUpperCase()}
            </div>
            {displayAppName}
          </div>
          <div className="flex items-center gap-2">
            {/* Streak Pill */}
            {gamification.enabled && gamification.enableStreaks && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '4px', 
                background: isPhoneDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', 
                padding: '4px 10px', borderRadius: '99px', marginRight: '4px' 
              }}>
                <span style={{ fontSize: '14px' }}>{gamification.streakIcon}</span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: pwaConfig.textColor || '#FFFFFF' }}>3</span>
              </div>
            )}
            
            <div className="phone-header-icon" onClick={() => setIsPhoneDark(!isPhoneDark)} role="button" title={t('app.header.theme', 'Mudar Tema')}>
              {isPhoneDark ? <Sun size={15} /> : <Moon size={15} />}
            </div>
            <div className="phone-header-icon" onClick={() => setOnboardingStep(2)} title={t('app.header.notifications', 'Notificações')}><Bell size={15} /></div>
            <div className="phone-header-icon" onClick={() => setOnboardingStep(1)} title={t('app.header.install', 'Instalar')}><Download size={15} /></div>
          </div>
        </div>

        <div className="phone-body" style={{
          fontFamily: pwaConfig.fontFamily || 'inherit',
          display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative'
        }}>
          <AnimatePresence mode="wait">
            {activeStep === 0 ? (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col justify-center text-center overflow-y-auto no-scrollbar" style={{ padding: '40px 24px' }}>
                {pwaConfig.logoBase64 ? <img src={pwaConfig.logoBase64} alt="Logo" className="w-24 h-24 object-contain mb-8 mx-auto rounded-2xl flex-shrink-0" /> : <div className="w-24 h-24 flex items-center justify-center bg-[var(--surface2)] rounded-2xl mb-8 mx-auto text-sm text-[var(--muted)] font-bold border-2 border-dashed border-[var(--border)] flex-shrink-0">Logo</div>}

                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#ffffff' : '#111111' }}>{t('app.login.title', 'Acesse sua conta')}</h2>

                <div style={{ width: '100%', background: isPhoneDark ? 'rgba(255,255,255,0.05)' : '#ffffff', padding: '14px', borderRadius: '12px', textAlign: 'left', color: isPhoneDark ? '#9CA3AF' : '#6B7280', fontSize: '13px', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e5e7eb', boxShadow: isPhoneDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px', flexShrink: 0 }}>{t('app.login.emailPlaceholder', 'Digite seu e-mail')}</div>
                <button className="btn-primary" style={{ width: '100%', marginTop: '8px', height: '48px', borderRadius: '12px', background: themeColor, color: '#ffffff', border: 'none', fontWeight: 700, flexShrink: 0 }}>{t('app.login.button', 'ENTRAR')}</button>
              </motion.div>
            ) : activeTab === 'perfil' ? (
              <motion.div key="perfil" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col items-center overflow-y-auto no-scrollbar" style={{ padding: '32px 24px 80px 24px' }}>
                <div style={{ fontWeight: 800, fontSize: '20px', color: isPhoneDark ? '#ffffff' : '#111111', marginBottom: '28px', alignSelf: 'flex-start', flexShrink: 0 }}>{t('app.profile.title', 'Meu Perfil')}</div>
                <div style={{ position: 'relative', marginBottom: '12px', flexShrink: 0 }}>
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input type="file" hidden accept="image/jpeg, image/jpg" onChange={(e) => { if (e.target.files && e.target.files[0]) setMockProfileImg(URL.createObjectURL(e.target.files[0])); }} />
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: isPhoneDark ? 'rgba(255,255,255,0.08)' : '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColor, overflow: 'hidden', border: `2px solid ${themeColor}33`, boxShadow: isPhoneDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)' }}>
                      {mockProfileImg ? <img src={mockProfileImg} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} />}
                    </div>
                    <div style={{ position: 'absolute', bottom: '0', right: '0', background: themeColor, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: isPhoneDark ? '2px solid #111' : '2px solid #fff' }}>
                      <User size={12} />
                    </div>
                  </label>
                </div>
                <span style={{ fontSize: '10px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '32px', fontWeight: 600, flexShrink: 0 }}>{t('app.profile.fileFormat', 'Apenas arquivos .JPG ou .JPEG')}</span>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flexShrink: 0 }}>
                  <input type="text" placeholder={t('app.profile.namePlaceholder', 'Nome Completo') as string} value={t('app.profile.nameDefault', 'Nome do Aluno') as string} readOnly style={{ width: '100%', padding: '16px', background: isPhoneDark ? 'rgba(255,255,255,0.05)' : '#ffffff', borderRadius: '14px', border: isPhoneDark ? 'none' : '1px solid #e5e7eb', boxShadow: isPhoneDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)', color: isPhoneDark ? '#9CA3AF' : '#6B7280', fontSize: '14px', outline: 'none', cursor: 'default' }} />
                  <input
                    type="email"
                    placeholder={t('app.profile.emailPlaceholder', 'E-mail (Chave de Acesso)') as string}
                    value="email.com"
                    readOnly
                    style={{
                      width: '100%', padding: '16px', background: isPhoneDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
                      borderRadius: '14px', border: isPhoneDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #d1d5db',
                      color: isPhoneDark ? '#9CA3AF' : '#6B7280',
                      fontSize: '14px', outline: 'none', cursor: 'not-allowed'
                    }}
                  />
                </div>
                <button onClick={() => setActiveTab('inicio')} style={{ width: '100%', padding: '16px', background: themeColor, color: '#ffffff', borderRadius: '14px', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: `0 8px 20px ${themeColor}33`, flexShrink: 0 }}>{t('app.profile.saveButton', 'Salvar Alterações')}</button>
              </motion.div>
            ) : activeTab === 'suporte' ? (
              <motion.div key="suporte" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col items-center overflow-y-auto no-scrollbar" style={{ padding: '32px 24px 80px 24px' }}>
                <div style={{ width: '80px', height: '80px', background: `${themeColor}15`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: themeColor, flexShrink: 0 }}>
                  <Headset size={40} />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px', color: isPhoneDark ? 'white' : '#111', textAlign: 'center' }}>{t('app.support.title')}</h2>
                <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', lineHeight: 1.6, marginBottom: '32px', textAlign: 'center' }}>{t('app.support.description')}</p>

                {pwaConfig.supportConfig?.type === 'whatsapp' ? (
                  <button 
                    onClick={() => window.open(`https://wa.me/${pwaConfig.supportConfig.contact}`, '_blank')}
                    style={{ width: '100%', padding: '18px', background: '#25D366', color: 'white', borderRadius: '18px', border: 'none', fontWeight: 700, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.2)', flexShrink: 0 }}
                  >
                    <MessageCircle size={20} /> {t('app.support.openWa')}
                  </button>
                ) : (
                  <div style={{ width: '100%', background: isPhoneDark ? '#1F2937' : '#F9FAFB', padding: '20px', borderRadius: '24px', border: `1px solid ${isPhoneDark ? '#374151' : '#E5E7EB'}`, flexShrink: 0 }}>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '8px', letterSpacing: '0.5px' }}>{t('app.support.emailLabel')}</p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: isPhoneDark ? 'white' : '#111', marginBottom: '16px', wordBreak: 'break-all', lineHeight: '1.4' }}>{pwaConfig.supportConfig?.contact || 'suporte@appify.com'}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(pwaConfig.supportConfig?.contact || '');
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
              <motion.div key="comunidade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar" style={{ padding: '24px 20px 80px 20px' }}>
                <div style={{ fontWeight: 800, fontSize: '20px', color: isPhoneDark ? '#ffffff' : '#111111', marginBottom: '20px', flexShrink: 0 }}>{t('app.community.title', 'Comunidade')}</div>
                <div style={{ background: isPhoneDark ? 'rgba(255,255,255,0.05)' : '#ffffff', padding: '16px', borderRadius: '16px', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e5e7eb', boxShadow: isPhoneDark ? 'none' : '0 4px 12px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '16px' }}>A</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: isPhoneDark ? '#ffffff' : '#111111' }}>{t('app.community.admin', 'Admin')}</div>
                      <div style={{ fontSize: '11px', color: isPhoneDark ? '#9CA3AF' : '#6B7280' }}>{t('app.community.justNow', 'Agora mesmo')}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: isPhoneDark ? '#D1D5DB' : '#4B5563', lineHeight: '1.5' }}>
                    {t('app.community.welcomeMessage', 'Bem-vindo à nossa comunidade! Este é o seu espaço premium para interagir, tirar dúvidas e compartilhar seus resultados. 🎉')}
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'conteudo' ? (
              <motion.div key="conteudo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar" style={{ padding: '24px 20px 80px 20px' }}>
                <div style={{ fontWeight: 800, fontSize: '20px', color: isPhoneDark ? '#ffffff' : '#111111', marginBottom: '20px', flexShrink: 0 }}>{t('app.content.title', 'Conteúdo')}</div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
                  <div style={{ background: isPhoneDark ? '#1f2937' : '#ffffff', borderRadius: '16px', overflow: 'hidden', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e5e7eb', boxShadow: isPhoneDark ? 'none' : '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <div style={{ width: '100%', height: '140px', background: themeColor, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Rss size={48} opacity={0.3} />
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: themeColor, fontWeight: 800, marginBottom: '6px', letterSpacing: '0.5px' }}>{t('app.content.badge', 'NOVIDADE')}</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: isPhoneDark ? '#ffffff' : '#111111', marginBottom: '8px' }}>{t('app.content.newLesson', 'Nova aula liberada!')}</div>
                      <div style={{ fontSize: '13px', color: isPhoneDark ? '#9CA3AF' : '#4B5563', lineHeight: '1.5' }}>{t('app.content.newLessonDesc', 'Acabamos de liberar um conteúdo exclusivo sobre estratégias avançadas. Acesse a aba início e confira o novo módulo!')}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="inicio" initial={{ x: '-30%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-30%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="absolute inset-0 flex flex-col">
                <AnimatePresence mode="wait" initial={false}>
                  {selectedMockupModule ? (
                    <motion.div key={`mod-${selectedMockupModule.id}`} initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className={`absolute inset-0 flex flex-col ${selectedMockupSubmoduleId ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar'}`} style={{ padding: selectedMockupSubmoduleId ? '0' : '20px 20px 80px 20px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: selectedMockupSubmoduleId ? '12px 16px 8px' : '10px 0 8px', 
                        flexShrink: 0 
                      }}>
                        <button onClick={() => { if (selectedMockupSubmoduleId) setSelectedMockupSubmoduleId(null); else setSelectedMockupModuleId(null); }} style={{ background: 'transparent', border: 'none', color: isPhoneDark ? '#ffffff' : '#111111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', fontSize: '13px', fontWeight: 700 }}>
                          <ArrowLeft size={16} /> {t('app.modules.back', 'Voltar')}
                        </button>

                        {selectedMockupSubmoduleId && (
                          <div className="flex items-center">
                            {!isCurrentLessonCompleted ? (
                              !canCompleteLesson ? (
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--surface)] px-2 py-1 rounded-full" style={{ background: isPhoneDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
                                  <Clock size={14} />
                                  <span>{lessonCompletionTimer}s</span>
                                </div>
                              ) : (
                                <button 
                                  onClick={handleSimulateCompletion}
                                  className="flex items-center gap-1 text-[12px] font-bold px-2 py-1 rounded-full transition-all"
                                  style={{ color: themeColor, backgroundColor: `${themeColor}20` }}
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
                                    srcDoc={getResponsiveHtml(selectedMockupSubmodule.contentHtml || selectedMockupSubmodule.content_html || '<p style="text-align:center; font-family:sans-serif; opacity:0.5; padding:20px;">Nenhum conteúdo definido.</p>')} 
                                    title="Conteúdo da Aula" 
                                    className="absolute inset-0 w-full h-full border-none block" 
                                    sandbox="allow-scripts allow-same-origin" 
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

                          {/* Progress Bar Refinement */}
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
                            <div style={{ textAlign: 'center', padding: '24px 0', color: isPhoneDark ? '#9CA3AF' : '#6B7280', fontSize: '12px' }}>{t('app.modules.noLessons', 'Nenhuma aula adicionada')}</div>
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
                    <motion.div key="home" initial={{ x: '-30%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-30%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar" style={{ padding: '20px 20px 80px 20px' }}>

                      {activeTab === 'inicio' && (() => {
                        const banners = (pwaConfig.banners || []).filter(b => b.imageUrl);
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
                        <div className="phone-empty-state" style={{ padding: '40px 20px', textAlign: 'center', color: isPhoneDark ? '#9CA3AF' : '#6B7280', fontSize: '13px', fontWeight: 500, border: 'none', background: 'transparent' }}>{t('app.modules.emptyState', 'Nenhum módulo criado')}</div>
                      ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                          {modules.map((mod, idx) => {
                            const isLocked = mod.releaseType === 'locked';
                            const progress = getModuleProgress(idx);
                            
                            return (
                              <div
                                key={mod.id}
                                className="phone-module-wrapper"
                                onClick={() => {
                                  if (mod.status === 'Rascunho') return;
                                  if (isLocked) {
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
                                  <div style={{ position: 'absolute', inset: 0, background: mod.coverImageUrl ? `url(${mod.coverImageUrl}) center/cover no-repeat` : 'var(--p-card-empty)', borderRadius: '16px', overflow: 'hidden' }}>
                                    {!mod.coverImageUrl && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--p-card-icon)', opacity: mod.status === 'Rascunho' ? 0.4 : 1 }}><RenderDynamicIcon name={mod.iconName} size={48} /></div>}
                                    {isLocked && (
                                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                          <Lock size={20} color="#111111" />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Ring Progress Badge */}
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
                                  {!isLocked && (
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

        <div className="phone-bottom-nav">
          <div className={`phone-nav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => { setActiveTab('inicio'); setSelectedMockupModuleId(null); setSelectedMockupSubmoduleId(null); }}><Home size={20} /><span>{t('nav.home', 'Início')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'conteudo' ? 'active' : ''}`} onClick={() => { setActiveTab('conteudo'); setSelectedMockupModuleId(null); setSelectedMockupSubmoduleId(null); }}><Rss size={20} /><span>{t('nav.content', 'Conteúdo')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'comunidade' ? 'active' : ''}`} onClick={() => setActiveTab('comunidade')}><Users size={20} /><span>{t('nav.community', 'Comunidade')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}><User size={20} /><span>{t('nav.profile', 'Perfil')}</span></div>
          {pwaConfig.supportConfig?.type !== 'none' && (
            <div className={`phone-nav-item ${activeTab === 'suporte' ? 'active' : ''}`} onClick={() => setActiveTab('suporte')}><Headset size={20} /><span>{t('nav.support')}</span></div>
          )}
        </div>
      </div>
    </div>
  );
}