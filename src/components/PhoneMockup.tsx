import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Download, LayoutGrid, Grid, PackageOpen, ArrowLeft, Home, Rss, Users, User, Lock, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
// Se der erro no build, trocar para:
// import { motion, AnimatePresence } from 'motion';
import { useAppStore } from '../store/useAppStore';
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
  const activeLocale = useAppStore(state => state.activeLocale);
  
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('inicio');
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
  }, [activeLocale]);

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
                  {onboardingStep === 1 ? 'Instalar na tela inicial?' : 'Ativar notificações?'}
                </h3>
                
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5, marginBottom: '28px' }}>
                  {onboardingStep === 1 
                    ? 'Acesse o app com um toque, sem precisar do navegador.'
                    : 'Fique por dentro de novidades, lembretes e conteúdo exclusivo.'}
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
                  {onboardingStep === 1 ? 'Sim, instalar' : 'Sim, quero!'}
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
                  Agora não
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
              <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#fff' : '#111' }}>Acesse sua conta</h2>
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
                Digite seu e-mail
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
                ENTRAR
              </button>
            </div>
          ) : (
            <>
              <div className="phone-hero"></div>
              <div className="phone-progress-card">
                <div className="phone-progress-header"><span>Progresso</span><span>{progressPercent}%</span></div>
                <div className="phone-progress-track"><div className="phone-progress-fill" style={{ width: `${progressPercent}%` }}></div></div>
              </div>
              <div>
                <div className="phone-modules-header">
                  <div className="text-lg font-semibold text-[var(--p-text)] transition-colors duration-300">Módulos</div>
                  <div className="phone-modules-actions">
                    <button className={`phone-modules-btn ${viewMode === 'list' ? 'inactive' : ''}`} title="Grid" onClick={() => setViewMode('grid')}><LayoutGrid size={14} /></button>
                    <button className={`phone-modules-btn ${viewMode === 'grid' ? 'inactive' : ''}`} title="Lista" onClick={() => setViewMode('list')}><Grid size={14} /></button>
                  </div>
                </div>
                {modules.length === 0 ? (
                  <div className="phone-empty-state" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--p-muted)', fontSize: '13px', fontWeight: 500, border: 'none', background: 'transparent' }}>
                    Nenhum módulo criado
                  </div>
                ) : (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                    {modules.map((mod) => (
                      <div key={mod.id} className="phone-module-wrapper">
                        <div className="phone-card">
                          <div style={{ position: 'absolute', inset: 0, background: 'var(--p-card-empty)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                            <div style={{ color: 'var(--p-card-icon)', transition: 'color 0.3s', opacity: mod.status === 'Rascunho' ? 0.4 : 1 }}>
                              <RenderDynamicIcon name={mod.iconName} size={48} />
                            </div>
                          </div>
                          {mod.status === 'Rascunho' && (<><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1, borderRadius: '18px' }}></div><div className="phone-card-lock"><Lock size={20} /></div></>)}
                          <div className="phone-card-badge">{mod.subs.length} Aulas</div>
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
          <div className={`phone-nav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => setActiveTab('inicio')}><Home size={20} /><span>Início</span></div>
          <div className={`phone-nav-item ${activeTab === 'conteudo' ? 'active' : ''}`} onClick={() => setActiveTab('conteudo')}><Rss size={20} /><span>Conteúdo</span></div>
          <div className={`phone-nav-item ${activeTab === 'comunidade' ? 'active' : ''}`} onClick={() => setActiveTab('comunidade')}><Users size={20} /><span>Comunidade</span></div>
          <div className={`phone-nav-item ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}><User size={20} /><span>Perfil</span></div>
        </div>
      </div>
    </div>
  );
}
