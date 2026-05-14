import React from 'react';
import { Smartphone, Calendar, Users, Plus, Check, ArrowLeft, Eye, Download, Sparkles, Sun, Moon, Bell, Home, Rss, User, Trash2 } from 'lucide-react';
import { Project, ToastType } from '../types';
import { useAppStore } from '../store/useAppStore';
import { PIPELINE_STEPS } from '../constants';
import { LocaleSwitcher } from './LocaleSwitcher';
import { AppifyLogo } from './AppLogo';

// --- Header ---
interface HeaderProps {
  handleOpenProject: (id: number, name: string) => void;
  handleExportZip: () => void;
  handlePublish: () => void;
  showToast: (msg: string, type?: ToastType) => void;
}

export function Header({ handleOpenProject, handleExportZip, handlePublish, showToast }: HeaderProps) {
  const currentView = useAppStore(state => state.currentView);
  const setView = useAppStore(state => state.setView);
  const setSplash = useAppStore(state => state.setSplash);
  const setIsNewProjectModalOpen = useAppStore(state => state.setIsNewProjectModalOpen);

  return (
    <header className="header">
      <AppifyLogo className="h-7 w-auto text-[var(--text-primary)]" />

      <div className="header-actions">
        {currentView === 'builder' ? (
          <>
            <button className="btn-ghost" onClick={() => setView('projects')}><ArrowLeft size={16} /> Meus Projetos</button>
            <LocaleSwitcher showToast={showToast} />
            <button 
              className="btn-ghost" 
              onClick={() => {
                setSplash(true);
                setTimeout(() => setSplash(false), 1500);
              }}
            >
              <Eye size={16} /> Preview PWA
            </button>
            <button className="btn-ghost" onClick={handleExportZip}><Download size={16} /> Exportar ZIP</button>
            <button className="btn-primary" onClick={handlePublish}><Sparkles size={16} /> Publicar</button>
          </>
        ) : (
          <button 
            className="btn-primary" 
            onClick={() => {
              console.log("Botão do Header clicado!");
              setIsNewProjectModalOpen(true);
            }}
          >
            <Plus size={16} /> Novo Projeto
          </button>
        )}
      </div>
    </header>
  );
}

// --- ProjectCard ---
export interface ProjectCardProps {
  proj: Project;
  handleOpenProject: (id: number, name: string) => void;
  handleToggleProjectStatus: (id: number) => void;
  handleDeleteProject: (id: number) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ proj, handleOpenProject, handleToggleProjectStatus, handleDeleteProject }) => {
  return (
    <div 
      className="project-card" 
      onClick={() => handleOpenProject(proj.id, proj.name)}
      onKeyDown={(e) => { if (e.key === 'Enter') handleOpenProject(proj.id, proj.name); }}
      role="button"
      tabIndex={0}
    >
      <div className="project-card-header">
        <div className="project-icon" style={{ background: proj.logoBase64 ? 'var(--surface2)' : proj.color, overflow: 'hidden', padding: 0 }}>
          {proj.logoBase64 ? (
            <img 
              src={proj.logoBase64} 
              alt={proj.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
            />
          ) : (
            proj.name.charAt(0).toUpperCase()
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="icon-btn delete-project-btn" 
            title="Excluir Projeto"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProject(proj.id);
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleDeleteProject(proj.id); } }}
          >
            <Trash2 size={16} />
          </button>
          <span className={`project-status ${proj.status === 'Publicado' ? 'status-pub' : 'status-draft'}`}>
            {proj.status}
          </span>
          <label 
            className="toggle-switch" 
            title={proj.status === 'Publicado' ? 'Desativar Produto' : 'Ativar Produto'} 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); handleToggleProjectStatus(proj.id); } }}
            role="button"
            tabIndex={0}
          >
            <input type="checkbox" checked={proj.status === 'Publicado'} onChange={() => handleToggleProjectStatus(proj.id)} />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div className="project-info">
        <div className="project-name">{proj.name}</div>
        <div className="project-url">
          <Smartphone size={14} /> {proj.url}
        </div>
        <div className="project-meta">
          <span className="project-meta-item"><Calendar size={14} /> {proj.lastEdited}</span>
          <span className="project-meta-item"><Users size={14} /> {proj.users.toLocaleString('pt-BR')} usuários</span>
        </div>
      </div>
      <style>{`
        .delete-project-btn {
          opacity: 0.6;
          transition: all 0.2s ease;
          color: var(--text-muted);
        }
        .delete-project-btn:hover {
          opacity: 1;
          color: #ff4d4d;
          background: rgba(255, 77, 77, 0.1);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
