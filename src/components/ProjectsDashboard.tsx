import React, { useState } from 'react';
import { FolderOpen, Plus, X, Users, GraduationCap, PackageOpen, Calendar, Rss, User, Zap, Grid } from 'lucide-react';
import { Project } from '../types';
import { ProjectCard } from './CommonComponents';

interface ProjectsDashboardProps { projects: Project[]; handleOpenProject: (id: number, name: string) => void; handleToggleProjectStatus: (id: number) => void; }

export function ProjectsDashboard({ projects, handleOpenProject, handleToggleProjectStatus }: ProjectsDashboardProps) {
  const [showTemplateModal, setShowTemplateModal] = useState(false);
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
          <button className="btn-primary" onClick={() => setShowTemplateModal(true)}><Plus size={16} /> Criar Primeiro Projeto</button>
        </div>
      ) : (
        <div className="projects-grid">
          <div 
            className="new-project-card" 
            onClick={() => setShowTemplateModal(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') setShowTemplateModal(true); }}
            role="button"
            tabIndex={0}
          >
            <div className="new-project-card-icon"><Plus size={24} /></div>
            <span style={{fontFamily: 'Syne', fontWeight: 600}}>Criar Novo App</span>
            <span style={{fontSize: 12}}>Comece do zero ou use a nossa IA</span>
          </div>
          {safeProjects.map(proj => <ProjectCard key={proj.id} proj={proj} handleOpenProject={handleOpenProject} handleToggleProjectStatus={handleToggleProjectStatus} />)}
        </div>
      )}

      {showTemplateModal && (
        <TemplateModal 
          onClose={() => setShowTemplateModal(false)} 
          onConfirm={(name) => {
            handleOpenProject(0, name);
            setShowTemplateModal(false);
          }} 
        />
      )}
    </div>
  );
}

function TemplateModal({ onClose, onConfirm }: { onClose: () => void, onConfirm: (name: string) => void }) {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = [
    { id: 'community', name: 'Comunidade VIP', icon: <Users size={24} />, desc: 'Para grupos e membros' },
    { id: 'course', name: 'E-Learning', icon: <GraduationCap size={24} />, desc: 'Cursos e treinamentos' },
    { id: 'delivery', name: 'Delivery & Menu', icon: <PackageOpen size={24} />, desc: 'Restaurantes e lojas' },
    { id: 'booking', name: 'Agendamento', icon: <Calendar size={24} />, desc: 'Serviços e clínicas' },
    { id: 'blog', name: 'Blog & News', icon: <Rss size={24} />, desc: 'Conteúdo e notícias' },
    { id: 'portfolio', name: 'Portfólio', icon: <User size={24} />, desc: 'Showcase profissional' },
    { id: 'events', name: 'Eventos', icon: <Zap size={24} />, desc: 'Tickets e networking' },
    { id: 'shop', name: 'Loja Lite', icon: <Grid size={24} />, desc: 'Vendas simples' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', width: '90%' }}>
        <div className="modal-header">
          <h2 className="modal-title">Escolha um Template</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Nome do Projeto</label>
            <input 
              type="text" 
              className="vpb-input" 
              placeholder="Ex: Meu App Incrível" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="templates-grid">
            {templates.map(t => (
              <div 
                key={t.id}
                className="template-item"
                onClick={() => { setSelectedTemplate(t.id); if(!name) setName(t.name); }}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: '2px solid',
                  borderColor: selectedTemplate === t.id ? 'var(--accent)' : 'var(--border)',
                  background: selectedTemplate === t.id ? 'var(--accent-glow)' : 'var(--surface2)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px', 
                  background: 'var(--surface)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: selectedTemplate === t.id ? 'var(--accent)' : 'var(--muted)'
                }}>
                  {t.icon}
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600 }}>{t.name}</h4>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)', lineHeight: '1.3' }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button 
            className="btn-primary" 
            disabled={!name.trim()} 
            onClick={() => onConfirm(name)}
          >
            Começar Construção
          </button>
        </div>
      </div>
    </div>
  );
}
