import React, { useState } from 'react';
import { FolderOpen, Plus, X, Users, GraduationCap, PackageOpen, Calendar, Rss, User, Zap, Grid } from 'lucide-react';
import { Project } from '../types';
import { ProjectCard } from './CommonComponents';
import { useAppStore } from '../store/useAppStore';

interface ProjectsDashboardProps { projects: Project[]; handleOpenProject: (id: number, name: string) => void; handleToggleProjectStatus: (id: number) => void; handleDeleteProject: (id: number) => void; }

export function ProjectsDashboard({ projects, handleOpenProject, handleToggleProjectStatus, handleDeleteProject }: ProjectsDashboardProps) {
  const isNewProjectModalOpen = useAppStore(state => state.isNewProjectModalOpen);
  const setIsNewProjectModalOpen = useAppStore(state => state.setIsNewProjectModalOpen);
  const safeProjects = Array.isArray(projects) ? projects : [];
  
  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1 className="projects-title">Meus Aplicativos</h1>
          <p className="projects-subtitle">Crie, gerencie e publique suas experiências digitais.</p>
        </div>
      </div>
      {safeProjects.length === 0 ? (
        <div className="empty-state" style={{ minHeight: '400px' }}>
          <div className="empty-state-icon"><FolderOpen size={32} /></div>
          <h3 className="empty-state-title">Nenhum projeto encontrado</h3>
          <p className="empty-state-desc">Seu painel está vazio. Comece a construir seu primeiro aplicativo inteligente em poucos minutos, usando templates ou gerando tudo através de Inteligência Artificial.</p>
          <button className="btn-primary" onClick={() => setIsNewProjectModalOpen(true)}><Plus size={16} /> Criar Primeiro Projeto</button>
        </div>
      ) : (
        <div className="projects-grid">
          <div 
            className="new-project-card" 
            onClick={() => setIsNewProjectModalOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') setIsNewProjectModalOpen(true); }}
            role="button"
            tabIndex={0}
          >
            <div className="new-project-card-icon"><Plus size={24} /></div>
            <span style={{fontFamily: 'Syne', fontWeight: 600}}>Criar Novo App</span>
            <span style={{fontSize: 12}}>Comece do zero ou use a nossa IA</span>
          </div>
          {safeProjects.map(proj => (
            <ProjectCard 
              key={proj.id} 
              proj={proj} 
              handleOpenProject={handleOpenProject} 
              handleToggleProjectStatus={handleToggleProjectStatus} 
              handleDeleteProject={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {isNewProjectModalOpen && (
        <TemplateModal 
          onClose={() => setIsNewProjectModalOpen(false)} 
          onConfirm={(name) => {
            handleOpenProject(0, name);
            setIsNewProjectModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}

function TemplateModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: (name: string) => void }) {
  const [name, setName] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
        <div className="modal-header">
          <h2 className="modal-title">Novo Projeto</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '16px' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '16px', 
              background: 'var(--surface)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--accent)'
            }}>
              <Plus size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Começar do Zero</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
              Dê um nome ao seu novo aplicativo para iniciarmos a configuração do seu ambiente de trabalho.
            </p>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Nome do Projeto</label>
            <input 
              type="text" 
              className="vpb-input" 
              placeholder="Ex: Meu App Incrível" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onConfirm(name); }}
              autoFocus
            />
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button 
            className="btn-primary" 
            disabled={!name.trim()} 
            onClick={() => onConfirm(name)}
          >
            Criar Projeto em Branco
          </button>
        </div>
      </div>
    </div>
  );
}
