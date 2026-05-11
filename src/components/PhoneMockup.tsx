import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Download, LayoutGrid, Grid, PackageOpen, ArrowLeft, Home, Rss, Users, User, Lock, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Se der erro no build, trocar para:
// import { motion, AnimatePresence } from 'motion';
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
  
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('inicio');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedMockupModuleId, setSelectedMockupModuleId] = useState<number | null>(null);
  const onboardingShown = useRef(false);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const selectedMockupModule = modules.find(m => m.id === selectedMockupModuleId) || null;
  
  const progressPercent = Math.round((activeStep / PIPELINE_STEPS.length) * 100);
  const themeColor = pwaConfig?.themeColor || '#6b8af0';
  const displayAppName = pwaConfig?.appName || appName;

  useEffect(() => {
    // Inject font if changed
    if (pwaConfig.fontFamily) {
      const linkId = `mockup-font-${pwaConfig.fontFamily.replace(/\s+/g, '-')}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${pwaConfig.fontFamily.replace(/\s+/g, '+')}:wght@400;600;800&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [pwaConfig.fontFamily]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [activeLocale]);

  useEffect(() => {
    if (currentView === 'builder' && !onboardingShown.current) {
      onboardingShown.current = true;
      const timer = setTimeout(() => setOnboardingStep(1), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

  // Carousel auto-advance
  useEffect(() => {
    const banners = pwaConfig.banners || [];
    if (banners.length <= 1) return;
    const interval = (pwaConfig.carouselInterval || 5) * 1000;
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    carouselTimerRef.current = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % banners.length);
    }, interval);
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [pwaConfig.banners, pwaConfig.carouselInterval]);

  // Reset index when banners change
  useEffect(() => {
    setCarouselIndex(0);
  }, [(pwaConfig.banners || []).length]);

  const handleNextStep = () => {
    if (onboardingStep === 1) {
      setOnboardingStep(2);
    } else {
      setOnboardingStep(0);
    }
  };

  const handleClose = () => {
    setOnboardingStep(0);
  };

  return (
    <div className="workspace-preview">
      <div 
        className={`phone-mockup ${isPhoneDark ? '' : 'light'}`} 
        style={{ 
          '--dynamic-theme': themeColor,
          fontFamily: pwaConfig.fontFamily || 'inherit',
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.3s ease'
        } as any}
      >
        
        {/* Splash Screen */}
        <AnimatePresence>
          {splashActive && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                position: 'absolute', 
                inset: 0, 
                background: themeColor, 
                zIndex: 100, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white'
              }}
            >
              <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '20px' }}>
                {pwaConfig.iconBase64 ? (
                  <img src={pwaConfig.iconBase64} alt="Icon" style={{ width: '100%', height: '100%', borderRadius: '24px' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone size={48} />
                  </div>
                )}
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, fontFamily: pwaConfig.fontFamily }}>{displayAppName}</h2>
              <div style={{ position: 'absolute', bottom: '40px', width: '120px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                 <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  style={{ width: '100%', height: '100%', background: 'white' }} 
                 />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Modals */}
        <AnimatePresence>
          {onboardingStep > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
            >
              <div 
                style={{ position: 'absolute', inset: 0 }} 
                onClick={handleClose}
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ 
                  position: 'relative',
                  background: 'white', 
                  borderRadius: '20px 20px 0 0', 
                  padding: '32px 24px', 
                  color: '#111',
                  textAlign: 'center',
                  boxShadow: '0 -10px 25px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  background: '#f3f4f6', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 20px' 
                }}>
                  {onboardingStep === 1 ? <Download size={28} color="#4b5563" /> : <Bell size={28} color="#4b5563" />}
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: pwaConfig.titleColor || '#111', fontFamily: pwaConfig.fontFamily || 'inherit' }}>
                  {onboardingStep === 1 ? t('onboarding.install.title') : t('onboarding.push.title')}
                </h3>
                
                <p style={{ fontSize: '14px', color: pwaConfig.bodyColor || '#666', lineHeight: 1.5, marginBottom: '28px' }}>
                  {onboardingStep === 1 
                    ? t('onboarding.install.subtitle')
                    : t('onboarding.push.subtitle')}
                </p>

                <button 
                  onClick={handleNextStep}
                  style={{ 
                    background: '#6994F2', 
                    color: 'white', 
                    borderRadius: '12px', 
                    width: '100%', 
                    padding: '14px', 
                    fontWeight: 700, 
                    marginBottom: '10px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {onboardingStep === 1 ? t('onboarding.install.confirm') : t('onboarding.push.confirm')}
                </button>

                <button 
                  onClick={handleClose}
                  style={{ 
                    background: 'transparent', 
                    color: '#999', 
                    width: '100%', 
                    padding: '10px', 
                    border: 'none', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {t('onboarding.install.skip')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview Modais Switcher & Icons */}
        <div className="phone-notch"></div>
        <div className="phone-header-bg">
          <div className="flex items-center gap-2 text-xl font-bold" style={{ color: pwaConfig.textColor || '#FFFFFF' }}>
            <div className="phone-logo-icon">
              {pwaConfig.logoBase64 ? (
                <img src={pwaConfig.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
              ) : (
                displayAppName.charAt(0).toUpperCase()
              )}
            </div>
            {displayAppName}
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="phone-header-icon" 
              onClick={() => setIsPhoneDark(!isPhoneDark)} 
              onKeyDown={(e) => { if (e.key === 'Enter') setIsPhoneDark(!isPhoneDark); }}
              role="button"
              tabIndex={0}
              title="Mudar Tema"
              aria-label="Alternar tema do preview"
            >
              {isPhoneDark ? <Sun size={15} /> : <Moon size={15} />}
            </div>
            <div 
              className="phone-header-icon" 
              onClick={() => setOnboardingStep(2)}
              title="Testar Modal de Notificações"
              role="button"
              tabIndex={0}
            >
              <Bell size={15} />
            </div>
            <div 
              className="phone-header-icon" 
              onClick={() => setOnboardingStep(1)}
              title="Testar Modal de Instalação (PWA)"
              role="button"
              tabIndex={0}
            >
              <Download size={15} />
            </div>
          </div>
        </div>
        <div className="phone-body" style={{ fontFamily: pwaConfig.fontFamily || 'inherit', color: pwaConfig.bodyColor || 'inherit' }}>
          {activeStep === 0 ? (
            <div className="phone-login-preview" style={{ padding: '80px 24px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              {pwaConfig.logoBase64 ? (
                <img 
                  src={pwaConfig.logoBase64} 
                  alt="Logo" 
                  className="w-24 h-24 object-contain mb-8 mx-auto rounded-2xl" 
                />
              ) : (
                <div className="w-24 h-24 flex items-center justify-center bg-[var(--surface2)] rounded-2xl mb-8 mx-auto text-sm text-[var(--muted)] font-bold border-2 border-dashed border-[var(--border)]">
                  Sua Logo
                </div>
              )}
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: pwaConfig.titleColor || (isPhoneDark ? '#fff' : '#111'), fontFamily: pwaConfig.fontFamily || 'inherit' }}>{t('app.login.title')}</h2>
              
              <div style={{ 
                background: isPhoneDark ? 'rgba(255,255,255,0.05)' : '#ffffff', 
                padding: '14px', 
                borderRadius: '12px', 
                textAlign: 'left', 
                color: pwaConfig.bodyColor || (isPhoneDark ? '#999' : '#4b5563'), 
                fontSize: '13px',
                border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e5e7eb',
                boxShadow: isPhoneDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
                marginBottom: '12px'
              }}>
                {t('app.login.emailPlaceholder')}
              </div>
              
              <button 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  marginTop: '8px', 
                  height: '48px', 
                  borderRadius: '12px',
                  background: themeColor,
                  color: pwaConfig.textColor || 'white',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '15px'
                }}
              >
                {t('app.login.button')}
              </button>
            </div>
          ) : (
            <>
              {/* Banner Carousel */}
              {(() => {
                const banners = (pwaConfig.banners || []).filter(b => b.imageUrl);
                if (banners.length === 0) {
                  return <div className="phone-hero"></div>;
                }
                const currentBanner = banners[carouselIndex % banners.length];
                return (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '3 / 1',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentBanner.id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                        onClick={() => currentBanner.link && window.open(currentBanner.link, '_blank')}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: `url(${currentBanner.imageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          cursor: currentBanner.link ? 'pointer' : 'default',
                        }}
                      />
                    </AnimatePresence>
                    {/* Dots */}
                    {banners.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '6px',
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '5px',
                      }}>
                        {banners.map((_, i) => (
                          <div
                            key={i}
                            onClick={() => setCarouselIndex(i)}
                            style={{
                              width: i === carouselIndex % banners.length ? '16px' : '6px',
                              height: '6px',
                              borderRadius: '3px',
                              background: i === carouselIndex % banners.length ? 'white' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="phone-progress-card">
                <div className="phone-progress-header"><span>Progresso</span><span>{progressPercent}%</span></div>
                <div className="phone-progress-track"><div className="phone-progress-fill" style={{ width: `${progressPercent}%` }}></div></div>
              </div>
              <div style={{ position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="wait" initial={false}>
                  {selectedMockupModule ? (
                    /* ── Sub-module detail view ── */
                    <motion.div
                      key={`mod-${selectedMockupModule.id}`}
                      initial={{ x: '100%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '100%', opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      {/* Sub-module header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 0 8px' }}>
                        <button
                          onClick={() => setSelectedMockupModuleId(null)}
                          style={{ background: 'transparent', border: 'none', color: pwaConfig.titleColor || 'var(--p-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', fontSize: '12px', fontWeight: 600 }}
                        >
                          <ArrowLeft size={14} /> Voltar
                        </button>
                      </div>
                      {/* Module cover */}
                      {selectedMockupModule.coverImageUrl ? (
                        <div style={{ width: '100%', aspectRatio: '16/6', backgroundImage: `url(${selectedMockupModule.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden' }} />
                      ) : null}
                      <div style={{ fontFamily: pwaConfig.fontFamily || 'inherit', fontWeight: 700, fontSize: '15px', color: pwaConfig.titleColor || 'var(--p-text)', marginBottom: '4px' }}>{selectedMockupModule.name}</div>
                      <div style={{ fontSize: '11px', color: pwaConfig.bodyColor || 'var(--p-muted)', marginBottom: '12px' }}>{selectedMockupModule.subs.length} aula{selectedMockupModule.subs.length !== 1 ? 's' : ''}</div>
                      {/* Sub-module list */}
                      {selectedMockupModule.subs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px 0', color: pwaConfig.bodyColor || 'var(--p-muted)', fontSize: '12px' }}>Nenhuma aula adicionada</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedMockupModule.subs.map((sub, index) => (
                            <div key={sub.id} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              background: isPhoneDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                              borderRadius: '10px', padding: '10px 12px',
                              border: isPhoneDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.07)'
                            }}>
                              {/* Thumbnail or number */}
                              {sub.coverImageUrl ? (
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0, backgroundImage: `url(${sub.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', flexShrink: 0, background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>
                                  {index + 1}
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: pwaConfig.titleColor || 'var(--p-text)', fontFamily: pwaConfig.fontFamily || 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div>
                                <div style={{ fontSize: '10px', color: pwaConfig.bodyColor || 'var(--p-muted)', marginTop: '2px' }}>{sub.type}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    /* ── Home modules grid ── */
                    <motion.div
                      key="home"
                      initial={{ x: '-30%', opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: '-30%', opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="phone-modules-header">
                        <div className="text-lg font-semibold transition-colors duration-300" style={{ color: pwaConfig.titleColor || 'var(--p-text)', fontFamily: pwaConfig.fontFamily || 'inherit' }}>Módulos</div>
                        <div className="phone-modules-actions">
                          <button className={`phone-modules-btn ${viewMode === 'list' ? 'inactive' : ''}`} title="Grid" onClick={() => setViewMode('grid')}><LayoutGrid size={14} /></button>
                          <button className={`phone-modules-btn ${viewMode === 'grid' ? 'inactive' : ''}`} title="Lista" onClick={() => setViewMode('list')}><Grid size={14} /></button>
                        </div>
                      </div>
                      {modules.length === 0 ? (
                        <div className="phone-empty-state" style={{ padding: '40px 20px', textAlign: 'center', color: pwaConfig.bodyColor || 'var(--p-muted)', fontSize: '13px', fontWeight: 500, border: 'none', background: 'transparent' }}>
                          Nenhum módulo criado
                        </div>
                      ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                          {modules.map((mod) => (
                            <div
                              key={mod.id}
                              className="phone-module-wrapper"
                              onClick={() => mod.status !== 'Rascunho' && setSelectedMockupModuleId(mod.id)}
                              style={{ cursor: mod.status !== 'Rascunho' ? 'pointer' : 'default' }}
                            >
                              <div className="phone-card">
                                <div style={{ 
                                  position: 'absolute', inset: 0, 
                                  background: mod.coverImageUrl ? `url(${mod.coverImageUrl}) center/cover no-repeat` : 'var(--p-card-empty)', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                  transition: 'background 0.3s',
                                  borderRadius: '18px'
                                }}>
                                  {!mod.coverImageUrl && (
                                    <div style={{ color: 'var(--p-card-icon)', transition: 'color 0.3s', opacity: mod.status === 'Rascunho' ? 0.4 : 1 }}>
                                      <RenderDynamicIcon name={mod.iconName} size={48} />
                                    </div>
                                  )}
                                </div>
                                {mod.status === 'Rascunho' && (<><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1, borderRadius: '18px' }}></div><div className="phone-card-lock"><Lock size={20} /></div></>)}
                                <div className="phone-card-badge">{mod.subs.length} Aulas</div>
                              </div>
                              <div className="phone-card-title-outside" style={{ opacity: mod.status === 'Rascunho' ? 0.6 : 1, color: pwaConfig.titleColor || 'var(--p-text)', fontFamily: pwaConfig.fontFamily || 'inherit' }}>{mod.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
        <div className="phone-bottom-nav">
          <div className={`phone-nav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => setActiveTab('inicio')}><Home size={20} /><span>{t('nav.home')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'conteudo' ? 'active' : ''}`} onClick={() => setActiveTab('conteudo')}><Rss size={20} /><span>{t('nav.content')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'comunidade' ? 'active' : ''}`} onClick={() => setActiveTab('comunidade')}><Users size={20} /><span>{t('nav.community')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}><User size={20} /><span>{t('nav.profile')}</span></div>
        </div>
      </div>
    </div>
  );
}
