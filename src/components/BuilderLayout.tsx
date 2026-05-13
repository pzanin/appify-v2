import React, { useState } from 'react';
import { Menu, Plus, Construction } from 'lucide-react';
import { ToastType, BuilderBlock } from '../types';
import { useAppStore } from '../store/useAppStore';
import { PIPELINE_STEPS, SUPPORTED_LOCALES } from '../constants';
import { Sidebar } from './Sidebar';
import { PhoneMockup } from './PhoneMockup';
import { ModulesAndContent } from './ModulesAndContent';
import { ModuleDetail } from './ModuleDetail';
import { IdentityConfigurator } from './IdentityConfigurator';
import { AppConfigurator } from './AppConfigurator';
import { EngagementHub } from './EngagementHub';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { PublicationHub } from './PublicationHub';
import { SupportConfig } from './SupportConfig';
import { GamificationConfig } from './GamificationConfig';
import { RenderDynamicIcon } from './RenderDynamicIcon';

interface BuilderLayoutProps { isPhoneDark: boolean; setIsPhoneDark: (val: boolean) => void; handleDeleteModule: (id: number) => void; handleDeleteSubmodule: (modId: number, subId: number) => void; handleAddSubmodule: (modId: number) => void; handleUpdateSubmoduleContent: (modId: number, subId: number, content: string, data: BuilderBlock[]) => void; showToast: (msg: string, type?: ToastType) => void; }

export function BuilderLayout({ isPhoneDark, setIsPhoneDark, handleDeleteModule, handleDeleteSubmodule, handleAddSubmodule, handleUpdateSubmoduleContent, showToast }: BuilderLayoutProps) {
  const activeStep = useAppStore(state => state.activeStep);
  const modules = useAppStore(state => state.modules);
  const selectedModuleId = useAppStore(state => state.selectedModuleId);
  const editingSubmodule = useAppStore(state => state.editingSubmodule);
  const activeLocale = useAppStore(state => state.activeLocale);
  
  const setEditingSubmodule = useAppStore(state => state.setEditingSubmodule);
  const setSelectedModule = useAppStore(state => state.setSelectedModule);
  const addModule = useAppStore(state => state.addModule);
  const setStep = useAppStore(state => state.setStep);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const progressPercent = Math.round((activeStep / PIPELINE_STEPS.length) * 100);

  let activeSubToEdit = null;
  if (editingSubmodule) {
    const mod = modules.find(m => m.id === editingSubmodule.modId);
    if (mod) activeSubToEdit = mod.subs.find(s => s.id === editingSubmodule.subId);
  }

  return (
    <div className="layout">
      {activeSubToEdit && editingSubmodule && (
        <ModulesAndContent 
          submodule={activeSubToEdit} 
          onSave={(html, data) => handleUpdateSubmoduleContent(editingSubmodule.modId, editingSubmodule.subId, html, data)} 
          onClose={() => setEditingSubmodule(null)}
        />
      )}

      <div className={`sidebar-backdrop ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="main">
        <div className="context-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="mobile-menu-btn" onClick={() => setIsSidebarOpen(true)}><Menu size={16} /></button>
            <div className="breadcrumb">
              <span>Meu Projeto</span><span className="sep">/</span><span>{PIPELINE_STEPS.find(s => s.id === activeStep)?.label}</span>
              {activeStep === 3 && selectedModuleId && <><span className="sep">/</span><span className="crumb-active">{modules.find(m => m.id === selectedModuleId)?.name}</span></>}
            </div>
            
            <div 
              style={{ 
                fontSize: '11px', 
                color: 'var(--muted)', 
                background: 'var(--surface2)', 
                padding: '3px 10px', 
                borderRadius: '99px', 
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Idioma de produção ativo"
            >
              <span>{SUPPORTED_LOCALES.find(l => l.code === activeLocale)?.flag}</span>
              <span>{SUPPORTED_LOCALES.find(l => l.code === activeLocale)?.label}</span>
            </div>
          </div>
          <div className="progress-bar-wrap"><span>{progressPercent}% completo</span><div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPercent}%` }}></div></div></div>
        </div>

        <div className="workspace">
          <div className="workspace-split">
            <div className="workspace-builder">
              
              {activeStep === 0 && <IdentityConfigurator />}

              {activeStep === 3 && (
                <>
                  <div className="section-header" style={{ marginBottom: '24px' }}><div><h2 className="section-title">Módulos & Conteúdo</h2></div></div>
                  <div>
                    <div className="card-header" style={{ marginBottom: '12px' }}>
                      <span className="card-title">Módulos criados <span style={{color:'var(--muted)', fontWeight:400}}>({modules.length})</span></span>
                    </div>
                    <div className="module-grid">
                      {modules.map(mod => (
                        <div 
                          key={mod.id} 
                          className={`module-card ${selectedModuleId === mod.id ? 'selected' : ''}`} 
                          onClick={() => setSelectedModule(mod.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setSelectedModule(mod.id); }}
                          role="button"
                          tabIndex={0}
                          aria-pressed={selectedModuleId === mod.id}
                          style={{ display: 'flex', alignItems: 'stretch', gap: 0, padding: 0, overflow: 'hidden' }}
                        >
                          {/* Left: icon + text */}
                          <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <div className="module-card-icon">
                              <RenderDynamicIcon name={mod.iconName} size={18} />
                            </div>
                            <div className="module-card-name">{mod.name}</div>
                            <div className="module-card-desc">{mod.subs.length} sub-módulos · {mod.status}</div>
                          </div>
                          {/* Right: cover thumbnail */}
                          {mod.coverImageUrl && (
                            <div style={{
                              width: '90px',
                              flexShrink: 0,
                              backgroundImage: `url(${mod.coverImageUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              borderLeft: '1px solid var(--border)',
                              borderRadius: '0 12px 12px 0'
                            }} />
                          )}
                        </div>
                      ))}
                      <button 
                        className="add-module-btn" 
                        onClick={() => {
                          const name = `Módulo ${modules.length + 1}`;
                          addModule({ 
                            name, 
                            iconName: 'BookOpen'
                          });
                          showToast(`"${name}" criado. Clique para editar.`, 'success');
                        }}
                      >
                        <Plus size={24} style={{ fontWeight: 300 }} /><span>Novo Módulo</span>
                      </button>
                    </div>
                  </div>
                  <ModuleDetail handleDeleteModule={handleDeleteModule} handleDeleteSubmodule={handleDeleteSubmodule} handleAddSubmodule={handleAddSubmodule} />
                </>
              )}

              {activeStep === 1 && <AppConfigurator />}
              {activeStep === 2 && <SupportConfig />}
              {activeStep === 4 && <EngagementHub showToast={showToast} />}
              {activeStep === 5 && <PublicationHub showToast={showToast} />}
              {activeStep === 6 && <GamificationConfig />}
              {activeStep === 7 && <AnalyticsDashboard />}

              {activeStep > 7 && (

                <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--muted)' }}>
                  <div style={{ marginBottom: '16px', opacity: 0.5, display: 'flex', justifyContent: 'center' }}><Construction size={48} /></div>
                  <h2 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>Área em Construção</h2>
                  <p>O step <strong>{PIPELINE_STEPS.find(s => s.id === activeStep)?.label}</strong> está sendo desenvolvido.</p>
                  <button onClick={() => setStep(1)} className="btn-ghost" style={{ marginTop: '20px' }}>Voltar para Módulos</button>
                </div>
              )}
            </div>
            <PhoneMockup isPhoneDark={isPhoneDark} setIsPhoneDark={setIsPhoneDark} />
          </div>
        </div>

      </main>
    </div>
  );
}
