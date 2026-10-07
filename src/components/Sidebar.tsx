import React from 'react';
import { X, Check, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { visibleProjectSteps } from '../utils/projectFeatures';
import { RenderDynamicIcon } from './RenderDynamicIcon';
import { AppifyLogo } from './AppLogo';

interface SidebarProps { isOpen?: boolean; onClose?: () => void; onOpenHelp?:()=>void; onCloseHelp?:()=>void; isHelpOpen?:boolean; }
export function Sidebar({ isOpen, onClose, onOpenHelp, onCloseHelp, isHelpOpen }: SidebarProps) {
  const config = useAppStore(state => state.pwaConfig);
  const steps = visibleProjectSteps(config);
  const activeStep = useAppStore(state => state.activeStep);
  const modules = useAppStore(state => state.modules);
  const selectedModuleId = useAppStore(state => state.selectedModuleId);
  const setStep = useAppStore(state => state.setStep);
  const setSelectedModule = useAppStore(state => state.setSelectedModule);
  const setView = useAppStore(state => state.setView);
  const setEditingSubmodule = useAppStore(state => state.setEditingSubmodule);

  const handleStepClick = (stepId: number) => { onCloseHelp?.(); setStep(stepId); if (onClose) onClose(); };
  const handleModuleClick = (modId: number) => { onCloseHelp?.(); setStep(3); setSelectedModule(modId); if (onClose) onClose(); };
  const handleLogoClick = () => { setView('projects'); if (onClose) onClose(); };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="px-4 pt-6">
        <AppifyLogo className="text-4xl ml-1 mb-8" />
      </div>
      <div className="sidebar-mobile-header">
        <div className="sidebar-label" style={{ margin: 0 }}>Pipeline</div>
        <button className="mobile-close-btn" onClick={onClose}><X size={16} /></button>
      </div>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div 
            className={`pipeline-step ${activeStep === step.id && !isHelpOpen ? 'active' : ''}`}
            onClick={() => handleStepClick(step.id)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleStepClick(step.id); }}
            role="button"
            tabIndex={0}
          >
            <div className={`step-indicator ${step.id < activeStep ? 'done' : step.id === activeStep ? 'active' : 'todo'}`}>
              {step.id < activeStep ? <Check size={14} /> : step.icon ? <RenderDynamicIcon name={step.icon} size={14} /> : index + 1}
            </div>
            <div className="step-info">
              <div className="step-name">{step.label}</div>
              <div className="step-meta">{step.id === 3 ? `${modules.length} módulos criados` : step.desc}</div>
            </div>
          </div>
          {index < steps.length - 1 && <div className={`step-connector ${step.id < activeStep ? 'done' : ''}`}></div>}
        </React.Fragment>
      ))}
      {onOpenHelp && <button className="btn-ghost" style={{margin:'16px',textAlign:'left'}} aria-pressed={isHelpOpen} onClick={()=>{onOpenHelp();onClose?.();}}>Ajuda e documentação</button>}
      <div className="sidebar-divider"></div>
      <div className="sidebar-label">Módulos do Projeto</div>
      <div className="module-tree">
        {modules.map(mod => (
          <React.Fragment key={mod.id}>
            <div 
              className={`module-item ${selectedModuleId === mod.id && activeStep === 3 ? 'active' : ''}`} 
              onClick={() => handleModuleClick(mod.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleModuleClick(mod.id); }}
              role="button"
              tabIndex={0}
              aria-pressed={selectedModuleId === mod.id && activeStep === 2}
            >
              <div className="module-dot"></div> <RenderDynamicIcon name={mod.iconName} size={14} /> {mod.name}
            </div>
              {selectedModuleId === mod.id && activeStep === 3 && mod.subs.map(sub => (
                <div 
                  key={sub.id} 
                  className="module-item sub"
                  onClick={() => {onCloseHelp?.();setEditingSubmodule({ modId: mod.id, subId: sub.id });}}
                  onKeyDown={(e) => { if (e.key === 'Enter') {onCloseHelp?.();setEditingSubmodule({ modId: mod.id, subId: sub.id });} }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="module-dot sub"></div> {sub.name}
                </div>
              ))}
          </React.Fragment>
        ))}
        <div 
          className="module-item btn-soon" 
          style={{ color: 'var(--accent)', fontSize: '12px', padding: '6px 10px' }} 
          title="Em breve"
          aria-disabled="true"
        >
          <Plus size={14} /> Novo módulo
        </div>
      </div>
    </aside>
  );
}
