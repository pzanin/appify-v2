import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Bell, Download, LayoutGrid, Grid, PackageOpen, ArrowLeft, Home, Rss, Users, User, Lock, Smartphone } from 'lucide-react';
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

  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('inicio');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selectedMockupModuleId, setSelectedMockupModuleId] = useState<number | null>(null);
  const [selectedMockupSubmoduleId, setSelectedMockupSubmoduleId] = useState<number | null>(null);
  const [mockProfileImg, setMockProfileImg] = useState<string | null>(null);

  const [lockedModuleClick, setLockedModuleClick] = useState<any>(null);

  const onboardingShown = useRef(false);
  const carouselTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedMockupModule = modules.find(m => m.id === selectedMockupModuleId) || null;
  const selectedMockupSubmodule = selectedMockupModule?.subs?.find(s => s.id === selectedMockupSubmoduleId) || null;

  const themeColor = pwaConfig?.themeColor || '#6b8af0';
  const displayAppName = pwaConfig?.appName || appName;

  useEffect(() => {
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
      {/* Feitiço de invisibilidade de rolagem */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      <div className={`phone-mockup ${isPhoneDark ? '' : 'light'}`} style={{ '--dynamic-theme': themeColor, fontFamily: pwaConfig.fontFamily || 'inherit', opacity: isTransitioning ? 0 : 1, transition: 'opacity 0.3s ease' } as any}>

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
                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: pwaConfig.titleColor || (isPhoneDark ? '#fff' : '#111') }}>Conteúdo Bloqueado</h3>
                <p style={{ fontSize: '14px', color: isPhoneDark ? '#9CA3AF' : '#6B7280', marginBottom: '28px', lineHeight: 1.5 }}>
                  Para acessar o módulo <strong>{lockedModuleClick.name}</strong>, é necessário adquirir este upgrade.
                </p>
                <button onClick={() => { if (lockedModuleClick.checkoutUrl) window.open(lockedModuleClick.checkoutUrl, '_blank'); setLockedModuleClick(null); }} style={{ width: '100%', padding: '16px', background: '#0F172A', color: 'white', borderRadius: '16px', border: 'none', fontWeight: 700, fontSize: '16px', cursor: 'pointer', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.2)' }}>
                  <PackageOpen size={18} /> Ir para o Checkout
                </button>
                <button onClick={() => setLockedModuleClick(null)} style={{ background: 'transparent', color: isPhoneDark ? '#9CA3AF' : '#6B7280', width: '100%', padding: '12px', border: 'none', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {onboardingStep > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <div style={{ position: 'absolute', inset: 0 }} onClick={() => setOnboardingStep(0)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'relative', background: 'white', borderRadius: '20px 20px 0 0', padding: '32px 24px', color: '#111', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  {onboardingStep === 1 ? <Download size={28} color="#4b5563" /> : <Bell size={28} color="#4b5563" />}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '12px' }}>{onboardingStep === 1 ? t('onboarding.install.title') : t('onboarding.push.title')}</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.5, marginBottom: '28px' }}>{onboardingStep === 1 ? t('onboarding.install.subtitle') : t('onboarding.push.subtitle')}</p>
                <button onClick={() => setOnboardingStep(onboardingStep === 1 ? 2 : 0)} style={{ background: '#6994F2', color: 'white', borderRadius: '12px', width: '100%', padding: '14px', fontWeight: 700, marginBottom: '10px', border: 'none' }}>{onboardingStep === 1 ? t('onboarding.install.confirm') : t('onboarding.push.confirm')}</button>
                <button onClick={() => setOnboardingStep(0)} style={{ background: 'transparent', color: '#999', width: '100%', padding: '10px', border: 'none', fontSize: '14px', fontWeight: 500 }}>{t('onboarding.install.skip')}</button>
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
            <div className="phone-header-icon" onClick={() => setIsPhoneDark(!isPhoneDark)} role="button" title="Mudar Tema">
              {isPhoneDark ? <Sun size={15} /> : <Moon size={15} />}
            </div>
            <div className="phone-header-icon" onClick={() => setOnboardingStep(2)} title="Notificações"><Bell size={15} /></div>
            <div className="phone-header-icon" onClick={() => setOnboardingStep(1)} title="Instalar"><Download size={15} /></div>
          </div>
        </div>

        <div className="phone-body" style={{
          fontFamily: pwaConfig.fontFamily || 'inherit', color: pwaConfig.bodyColor || 'inherit',
          display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative'
        }}>
          <AnimatePresence mode="wait">
            {activeStep === 0 ? (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col justify-center text-center overflow-y-auto no-scrollbar" style={{ padding: '40px 24px' }}>
                {pwaConfig.logoBase64 ? <img src={pwaConfig.logoBase64} alt="Logo" className="w-24 h-24 object-contain mb-8 mx-auto rounded-2xl flex-shrink-0" /> : <div className="w-24 h-24 flex items-center justify-center bg-[var(--surface2)] rounded-2xl mb-8 mx-auto text-sm text-[var(--muted)] font-bold border-2 border-dashed border-[var(--border)] flex-shrink-0">Sua Logo</div>}

                {/* TÍTULO CORRIGIDO: Forçado a ser #ffffff no escuro e #111111 no claro */}
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '8px', color: isPhoneDark ? '#ffffff' : '#111111' }}>{t('app.login.title', 'Acesse sua conta')}</h2>

                <div style={{ width: '100%', background: isPhoneDark ? 'rgba(255,255,255,0.05)' : '#ffffff', padding: '14px', borderRadius: '12px', textAlign: 'left', color: isPhoneDark ? '#999' : '#4b5563', fontSize: '13px', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e5e7eb', boxShadow: isPhoneDark ? 'none' : '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '12px', flexShrink: 0 }}>{t('app.login.emailPlaceholder', 'Digite seu e-mail')}</div>
                <button className="btn-primary" style={{ width: '100%', marginTop: '8px', height: '48px', borderRadius: '12px', background: themeColor, color: '#ffffff', border: 'none', fontWeight: 700, flexShrink: 0 }}>{t('app.login.button', 'ENTRAR')}</button>
              </motion.div>
            ) : activeTab === 'perfil' ? (
              <motion.div key="perfil" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col items-center overflow-y-auto no-scrollbar" style={{ padding: '32px 24px 80px 24px' }}>
                <div style={{ fontWeight: 800, fontSize: '20px', color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111'), marginBottom: '28px', alignSelf: 'flex-start', flexShrink: 0 }}>Meu Perfil</div>
                <div style={{ position: 'relative', marginBottom: '12px', flexShrink: 0 }}>
                  <label style={{ cursor: 'pointer', display: 'block' }}>
                    <input type="file" hidden accept="image/jpeg, image/jpg" onChange={(e) => { if (e.target.files && e.target.files[0]) setMockProfileImg(URL.createObjectURL(e.target.files[0])); }} />
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: isPhoneDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColor, overflow: 'hidden', border: `2px solid ${themeColor}33` }}>
                      {mockProfileImg ? <img src={mockProfileImg} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} />}
                    </div>
                    <div style={{ position: 'absolute', bottom: '0', right: '0', background: themeColor, width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: isPhoneDark ? '2px solid #111' : '2px solid #fff' }}>
                      <User size={12} />
                    </div>
                  </label>
                </div>
                <span style={{ fontSize: '10px', color: pwaConfig.bodyColor || 'var(--p-muted)', marginBottom: '32px', fontWeight: 600, flexShrink: 0 }}>Apenas arquivos .JPG ou .JPEG</span>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flexShrink: 0 }}>
                  <input type="text" placeholder="Nome Completo" defaultValue="Nome do Aluno" style={{ width: '100%', padding: '16px', background: isPhoneDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6', borderRadius: '14px', border: 'none', color: isPhoneDark ? '#ffffff' : '#111111', fontSize: '14px', outline: 'none' }} />
                  <input type="email" placeholder="E-mail (Chave de Acesso)" value="aluno@email.com" readOnly style={{ width: '100%', padding: '16px', background: isPhoneDark ? 'rgba(255,255,255,0.02)' : '#f9fafb', borderRadius: '14px', border: isPhoneDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(0,0,0,0.1)', color: pwaConfig.bodyColor || 'var(--p-muted)', fontSize: '14px', outline: 'none', cursor: 'not-allowed' }} />
                </div>
                <button onClick={() => setActiveTab('inicio')} style={{ width: '100%', padding: '16px', background: themeColor, color: '#ffffff', borderRadius: '14px', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer', boxShadow: `0 8px 20px ${themeColor}33`, flexShrink: 0 }}>Salvar Alterações</button>
              </motion.div>
            ) : activeTab === 'comunidade' ? (
              <motion.div key="comunidade" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar" style={{ padding: '24px 20px 80px 20px' }}>
                <div style={{ fontWeight: 800, fontSize: '20px', color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111'), marginBottom: '20px', flexShrink: 0 }}>Comunidade</div>
                <div style={{ background: isPhoneDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', padding: '16px', borderRadius: '16px', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '16px' }}>A</div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111') }}>Admin</div>
                      <div style={{ fontSize: '11px', color: pwaConfig.bodyColor || 'var(--p-muted)' }}>Agora mesmo</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: pwaConfig.bodyColor || 'var(--p-text)', lineHeight: '1.5' }}>
                    Bem-vindo à nossa comunidade! Este é o seu espaço premium para interagir, tirar dúvidas e compartilhar seus resultados. 🎉
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'conteudo' ? (
              <motion.div key="conteudo" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col overflow-y-auto no-scrollbar" style={{ padding: '24px 20px 80px 20px' }}>
                <div style={{ fontWeight: 800, fontSize: '20px', color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111'), marginBottom: '20px', flexShrink: 0 }}>Conteúdo</div>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
                  <div style={{ background: isPhoneDark ? '#1f2937' : '#ffffff', borderRadius: '16px', overflow: 'hidden', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)', boxShadow: isPhoneDark ? 'none' : '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ width: '100%', height: '140px', background: themeColor, opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <Rss size={48} opacity={0.3} />
                    </div>
                    <div style={{ padding: '16px' }}>
                      <div style={{ fontSize: '11px', color: themeColor, fontWeight: 800, marginBottom: '6px', letterSpacing: '0.5px' }}>NOVIDADE</div>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111'), marginBottom: '8px' }}>Nova aula liberada!</div>
                      <div style={{ fontSize: '13px', color: pwaConfig.bodyColor || 'var(--p-muted)', lineHeight: '1.5' }}>Acabamos de liberar um conteúdo exclusivo sobre estratégias avançadas. Acesse a aba início e confira o novo módulo!</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="inicio" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col">
                <AnimatePresence mode="wait" initial={false}>
                  {selectedMockupModule ? (
                    <motion.div key={`mod-${selectedMockupModule.id}`} initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className={`absolute inset-0 flex flex-col ${selectedMockupSubmoduleId ? 'overflow-hidden' : 'overflow-y-auto no-scrollbar'}`} style={{ padding: selectedMockupSubmoduleId ? '0' : '20px 20px 80px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: selectedMockupSubmoduleId ? '12px 16px 8px' : '10px 0 8px', flexShrink: 0 }}>
                        <button onClick={() => { if (selectedMockupSubmoduleId) setSelectedMockupSubmoduleId(null); else setSelectedMockupModuleId(null); }} style={{ background: 'transparent', border: 'none', color: isPhoneDark ? '#ffffff' : '#111111', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', fontSize: '13px', fontWeight: 700 }}>
                          <ArrowLeft size={16} /> Voltar
                        </button>
                      </div>
                      {selectedMockupSubmodule ? (
                        <motion.div key={`sub-${selectedMockupSubmodule.id}`} initial={{ x: '20%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="flex flex-col flex-1 w-full h-full min-h-0 relative">
                          <div className="flex-1 w-full min-h-0 relative bg-white">
                            <iframe srcDoc={getResponsiveHtml(selectedMockupSubmodule.content_html || '<p style="text-align:center; font-family:sans-serif; opacity:0.5; padding:20px;">Nenhum conteúdo definido.</p>')} title="Conteúdo da Aula" className="absolute inset-0 w-full h-full border-none block" sandbox="allow-scripts allow-same-origin" style={{ background: selectedMockupSubmodule.content_html ? '#ffffff' : 'transparent' }} />
                          </div>
                        </motion.div>
                      ) : (
                        <>
                          <div style={{ fontWeight: 700, fontSize: '18px', color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111'), marginBottom: '4px', flexShrink: 0 }}>{selectedMockupModule.name}</div>
                          <div style={{ fontSize: '12px', color: pwaConfig.bodyColor || 'var(--p-muted)', marginBottom: '16px', flexShrink: 0 }}>{selectedMockupModule.subs?.length || 0} aula{(selectedMockupModule.subs?.length || 0) !== 1 ? 's' : ''}</div>
                          {(selectedMockupModule.subs?.length || 0) === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: pwaConfig.bodyColor || 'var(--p-muted)', fontSize: '12px' }}>Nenhuma aula adicionada</div>
                          ) : (
                            <div className={selectedMockupModule.subs.length === 1 ? 'grid grid-cols-1 w-[66%] mx-auto gap-4' : selectedMockupModule.subs.length === 2 ? 'grid grid-cols-2 gap-4' : 'grid grid-cols-3 gap-3'}>
                              {selectedMockupModule.subs.map((sub, index) => (
                                <div key={sub.id} onClick={() => setSelectedMockupSubmoduleId(sub.id)} style={{ display: 'flex', flexDirection: 'column', gap: '6px', cursor: 'pointer' }}>
                                  {sub.coverImageUrl ? <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', backgroundImage: `url(${sub.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }} /> : <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '16px', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '22px', fontWeight: 700, border: isPhoneDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>{index + 1}</div>}
                                  <div style={{ width: '100%', paddingLeft: '4px' }}><div style={{ fontSize: '12px', fontWeight: 600, color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub.name}</div></div>
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
                        const currentBanner = banners[carouselIndex % banners.length];
                        return (
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 1', overflow: 'hidden', flexShrink: 0, borderRadius: '12px', marginBottom: '16px' }}>
                            <AnimatePresence mode="wait">
                              <motion.div key={currentBanner.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.35 }} onClick={() => currentBanner.link && window.open(currentBanner.link, '_blank')} style={{ position: 'absolute', inset: 0, backgroundImage: `url(${currentBanner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            </AnimatePresence>
                          </div>
                        );
                      })()}

                      <div className="phone-modules-header" style={{ flexShrink: 0 }}>
                        <div className="text-lg font-semibold" style={{ color: pwaConfig.titleColor || (isPhoneDark ? '#FFFFFF' : '#111111') }}>Módulos</div>
                      </div>

                      {modules.length === 0 ? (
                        <div className="phone-empty-state" style={{ padding: '40px 20px', textAlign: 'center', color: pwaConfig.bodyColor || 'var(--p-muted)', fontSize: '13px', fontWeight: 500, border: 'none', background: 'transparent' }}>Nenhum módulo criado</div>
                      ) : (
                        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'flex flex-col gap-3'}>
                          {modules.map((mod) => {
                            const isLocked = mod.releaseType === 'locked';
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
                                  borderRadius: '16px', backgroundColor: isPhoneDark ? '#1f2937' : '#f3f4f6',
                                  boxShadow: isPhoneDark ? '0 4px 0 rgba(255,255,255,0.06)' : '0 4px 0 rgba(0,0,0,0.08)',
                                  marginBottom: '6px', flexShrink: 0
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
                                  {mod.status === 'Rascunho' && (<div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1, borderRadius: '16px' }} />)}
                                  {!isLocked && (
                                    <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, zIndex: 2 }}>
                                      {mod.subs?.length || 0} Aulas
                                    </div>
                                  )}
                                </div>
                                <div style={{ opacity: mod.status === 'Rascunho' ? 0.6 : 1, color: pwaConfig.titleColor || (isPhoneDark ? '#ffffff' : '#111111'), fontSize: '13px', fontWeight: 600, paddingLeft: '2px', lineHeight: '1.2', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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
          <div className={`phone-nav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => { setActiveTab('inicio'); setSelectedMockupModuleId(null); setSelectedMockupSubmoduleId(null); }}><Home size={20} /><span>{t('nav.home')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'conteudo' ? 'active' : ''}`} onClick={() => { setActiveTab('conteudo'); setSelectedMockupModuleId(null); setSelectedMockupSubmoduleId(null); }}><Rss size={20} /><span>{t('nav.content')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'comunidade' ? 'active' : ''}`} onClick={() => setActiveTab('comunidade')}><Users size={20} /><span>{t('nav.community')}</span></div>
          <div className={`phone-nav-item ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}><User size={20} /><span>{t('nav.profile')}</span></div>
        </div>
      </div>
    </div>
  );
}