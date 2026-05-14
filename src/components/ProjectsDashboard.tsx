import React, { useState } from 'react';
import { FolderOpen, Plus, X, Search, ChevronDown } from 'lucide-react';
import { Project } from '../types';
import { ProjectCard } from './CommonComponents';
import { useAppStore } from '../store/useAppStore';

interface ProjectsDashboardProps { 
  projects: Project[]; 
  handleOpenProject: (id: number, name: string) => void; 
  handleToggleProjectStatus: (id: number) => void; 
  handleDeleteProject: (id: number) => void; 
}

export function ProjectsDashboard({ projects, handleOpenProject, handleToggleProjectStatus, handleDeleteProject }: ProjectsDashboardProps) {
  const isNewProjectModalOpen = useAppStore(state => state.isNewProjectModalOpen);
  const setIsNewProjectModalOpen = useAppStore(state => state.setIsNewProjectModalOpen);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('Mais recentes');
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
        <>
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 bg-[var(--surface2)]/50 p-4 rounded-2xl border border-[var(--border)]">
            <div className="relative w-full md:w-96 group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-accent transition-colors" />
              <input 
                type="text" 
                placeholder="Buscar aplicativo..." 
                className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-accent/5 transition-all placeholder:text-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] hidden md:block">Filtrar</span>
              <div className="relative w-full md:w-48">
                <select 
                  className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl py-2.5 px-4 pr-10 text-sm appearance-none focus:outline-none focus:border-[var(--accent)] cursor-pointer transition-all hover:border-[var(--border-active)]"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option>Mais recentes</option>
                  <option>Mais antigos</option>
                  <option>Publicados</option>
                  <option>Rascunhos</option>
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>
          </div>

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
        </>
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
