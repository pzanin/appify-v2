import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Download, LayoutGrid, Grid, PackageOpen, ArrowLeft, Home, Rss, Users, User, Lock, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Se der erro no build, trocar para:
// import { motion, AnimatePresence } from 'motion';
import { useAppStore, useTranslation } from '../store/useAppStore';
import { PIPELINE_STEPS } from '../constants';
import { RenderDynamicIcon } from './RenderDynamicIcon';

interface PhoneMockupProps { isPhoneDark: boolean; setIsPhoneDark: (val: boolean) => void; }
export function PhoneMockup({ isPhoneDark, setIsPhoneDark }: PhoneMockupProps) {
  const appName = useAppStore(state => state.appName);
  const modules = useAppStore(state => state.modules);
  const activeStep = useAppStore(state => state.activeStep);
  const pwaConfig = useAppStore(state => state.pwaConfig);
  const currentView = useAppStore(state => state.currentView);
  const splashActive = useAppStore(state => state.splashActive);
  
  const { t, locale } = useTranslation();
  const [onboardingStep, setOnboardingStep] = useState<number>(0); // 0: none, 1: Install, 2: Notifications
  const [isTransitioning, setIsTransitioning] = useState(false);
  const onboardingShown = useRef(false);
  
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
  }, [locale]);

  useEffect(() => {
    if (currentView === 'builder' && !onboardingShown.current) {
      onboardingShown.current = true;
      const timer = setTimeout(() => setOnboardingStep(1), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentView]);

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

                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px', color: '#111' }}>
                  {onboardingStep === 1 ? t('onboarding.install.title') : t('onboarding.push.title')}
                </h3>
                
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5, marginBottom: '28px' }}>
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

        {/* Preview Modais Switcher */}
        <button 
          onClick={() => setOnboardingStep(1)}
          style={{ 
            position: 'absolute', 
            top: '50px', 
            right: '15px', 
            zIndex: 30, 
            background: 'rgba(255,255,255,0.15)', 
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '20px',
            padding: '4px 10px',
            fontSize: '9px',
            color: isPhoneDark ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {t('preview.modals') || 'Preview modais'}
        </button>

        <div className="phone-notch"></div>
        <div className="phone-header-bg">
          <div className="phone-logo" style={{ color: pwaConfig.textColor || '#FFFFFF' }}>
            <div className="phone-logo-icon">
              {pwaConfig.logoBase64 ? (
                <img src={pwaConfig.logoBase64} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'contain' }} />
              ) : (
                displayAppName.charAt(0).toUpperCase()
              )}
            </div>
            {displayAppName}
          </div>
          <div className="phone-header-icons">
            <div 
              className="phone-header-icon" 
              onClick={() => setIsPhoneDark(!isPhoneDark)} 
              onKeyDown={(e) => { if (e.key === 'Enter') setIsPhoneDark(!isPhoneDark); }}
              role="button"
              tabIndex={0}
              title={t('preview.theme.toggle') || "Mudar Tema"}
              aria-label="Alternar tema do preview"
            >
              {isPhoneDark ? <Sun size={15} /> : <Moon size={15} />}
            </div>
            <div className="phone-header-icon"><Bell size={15} /></div>
            <div className="phone-header-icon"><Download size={15} /></div>
          </div>
        </div>
        <div className="phone-body">
          {activeStep === 0 ? (
            <div className="phone-login-preview" style={{ padding: '80px 24px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ 
                width: '80px', 
                height: '80px', 
                background: themeColor, 
                borderRadius: '22px', 
                margin: '0 auto 24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: pwaConfig.textColor || 'white',
                boxShadow: '0 10px 20px -5px rgba(0,0,0,0.2)'
              }}>
                <Smartphone size={40} />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#fff' : '#111' }}>{t('app.login.title')}</h2>
              <p style={{ fontSize: '13px', color: isPhoneDark ? '#999' : '#666', marginBottom: '32px' }}>{pwaConfig.tagline}</p>
              
              <div style={{ 
                background: isPhoneDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', 
                padding: '14px', 
                borderRadius: '12px', 
                textAlign: 'left', 
                color: isPhoneDark ? '#666' : '#999', 
                fontSize: '13px',
                border: '1px solid var(--border)',
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
              <div className="phone-hero"></div>
              <div className="phone-progress-card">
                <div className="phone-progress-header"><span>{t('preview.progress')}</span><span>{progressPercent}%</span></div>
                <div className="phone-progress-track"><div className="phone-progress-fill" style={{ width: `${progressPercent}%` }}></div></div>
              </div>
              <div>
                <div className="phone-modules-header">
                  <div className="phone-modules-title">{t('preview.modules')}</div>
                  <div className="phone-modules-actions">
                    <button className="phone-modules-btn inactive" title="Grid de 2"><LayoutGrid size={14} /></button>
                    <button className="phone-modules-btn" title="Grid de 3"><Grid size={14} /></button>
                  </div>
                </div>
                {modules.length === 0 ? (
                  <div className="phone-empty-state">
                    <div className="phone-empty-icon"><PackageOpen size={24} /></div>
                    <h4 className="phone-empty-title">{t('preview.empty.title') || 'Nenhum Módulo'}</h4>
                    <p className="phone-empty-desc">{t('preview.empty.desc') || 'Seu catálogo está vazio. Adicione módulos no construtor à esquerda para ver a mágica acontecer aqui.'}</p>
                    <div style={{ marginTop: '16px', fontSize: '10px', color: 'var(--dynamic-theme)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowLeft size={12} /> {t('preview.empty.cta') || 'COMEÇAR A CRIAR'}</div>
                  </div>
                ) : (
                  <div className="phone-grid">
                    {modules.map((mod) => (
                      <div key={mod.id} className="phone-module-wrapper">
                        <div className="phone-card">
                          <div style={{ position: 'absolute', inset: 0, background: 'var(--p-card-empty)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                            <div style={{ color: 'var(--p-card-icon)', transition: 'color 0.3s', opacity: mod.status === 'Rascunho' ? 0.4 : 1 }}>
                              <RenderDynamicIcon name={mod.iconName} size={48} />
                            </div>
                          </div>
                          {mod.status === 'Rascunho' && (<><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1, borderRadius: '18px' }}></div><div className="phone-card-lock"><Lock size={20} /></div></>)}
                          <div className="phone-card-badge">{mod.subs.length} {t('preview.lessons')}</div>
                        </div>
                        <div className="phone-card-title-outside" style={{ opacity: mod.status === 'Rascunho' ? 0.6 : 1 }}>{mod.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="phone-bottom-nav">
          <div className="phone-nav-item active"><Home size={20} /><span>{t('nav.home')}</span></div>
          <div className="phone-nav-item"><Rss size={20} /><span>{t('nav.content')}</span></div>
          <div className="phone-nav-item"><Users size={20} /><span>{t('nav.community')}</span></div>
          <div className="phone-nav-item"><User size={20} /><span>{t('nav.profile')}</span></div>
        </div>
      </div>
    </div>
  );
}
