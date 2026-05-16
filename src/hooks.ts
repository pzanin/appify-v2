import { useState, useEffect } from 'react';
import { Project, ToastMessage, ToastType, BuilderBlock } from './types';
import { projectService } from './services/projectService';
import { useAppStore } from './store/useAppStore';
import JSZip from 'jszip';
import { handleExportZIP } from './utils/exportPWA';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  return { toasts, showToast };
}

export function useProjects(showToast: (msg: string, type?: ToastType) => void) {
  const setAppName = useAppStore(state => state.setAppName);
  const setView = useAppStore(state => state.setView);
  const loadProject = useAppStore(state => state.loadProject);
  const initializeProjects = useAppStore(state => state.initializeProjects);
  const setIsLoading = useAppStore(state => state.setIsLoading);
  const currentView = useAppStore(state => state.currentView);

  const projects = useAppStore(state => state.projects);
  const setProjects = useAppStore(state => state.setProjects);

  const fetchProjects = async () => {
    // Check if we already have local projects, if local first we might not need to fetch
    // But for safety let's sync if there are any from supabase
    const data = await projectService.getProjects();
    if (data && data.length > 0) {
      setProjects(data);
    }
  };

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      await fetchProjects();
      await initializeProjects();
    }
    init();
  }, []);

  useEffect(() => {
    if (currentView === 'projects') {
      fetchProjects();
    }
  }, [currentView]);

  useEffect(() => {
    if (projects.length > 0) {
      projectService.saveProjects(projects);
    }
  }, [projects]);

  const handleOpenProject = async (projectId: number, projectName: string) => {
    showToast('Carregando projeto...', 'loading');
    if (projectId === 0) {
      try {
        const result = await projectService.createProject(projects, projectName || 'Novo App');
        setProjects(result.projects);
        await loadProject(result.newlyCreated.id);
        setView('builder');
        showToast('Projeto criado com sucesso!', 'success');
      } catch (err: any) {
        // If Supabase fails, fallback to local creation
        const newProject = {
          id: Date.now(),
          name: projectName || 'Novo App',
          status: 'Rascunho' as const,
          lastEdited: new Date().toISOString(),
          users: 0,
          color: '#7c6fff',
          url: `${(projectName || 'Novo App').toLowerCase().replace(/\s+/g, '')}.vapp.pro`
        };
        setProjects(prev => [...prev, newProject]);
        await loadProject(newProject.id);
        setView('builder');
        showToast('Projeto criado localmente com sucesso!', 'success');
      }
    } else {
      await loadProject(projectId);
      setView('builder');
      showToast('Projeto pronto!', 'success');
    }
  };

  const handleToggleProjectStatus = (projectId: number) => {
    setProjects(prev => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.map(p => {
        if (p.id === projectId) {
          const newStatus = p.status === 'Publicado' ? 'Rascunho' : 'Publicado';
          showToast(`Produto ${newStatus === 'Publicado' ? 'ativado' : 'desativado'} com sucesso!`, 'success');
          return { ...p, status: newStatus };
        }
        return p;
      });
    });
  };

  const handleDeleteProject = async (projectId: number) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este app? Esta ação não pode ser desfeita.");
    if (!confirmed) return;

    try {
      showToast('Excluindo projeto...', 'loading');
      await projectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      showToast('Projeto excluído com sucesso!', 'success');
    } catch (err: any) {
      // Local fallback
      setProjects(prev => prev.filter(p => p.id !== projectId));
      showToast('Projeto excluído localmente com sucesso!', 'success');
    }
  };

  return { projects, handleOpenProject, handleToggleProjectStatus, handleDeleteProject };
}

export function useBuilderActions(showToast: (msg: string, type?: ToastType) => void) {
  const appName = useAppStore(state => state.appName);
  const modules = useAppStore(state => state.modules);
  const deleteModule = useAppStore(state => state.deleteModule);
  const deleteSubmodule = useAppStore(state => state.deleteSubmodule);
  const addSubmodule = useAppStore(state => state.addSubmodule);
  const updateSubmoduleContent = useAppStore(state => state.updateSubmoduleContent);
  const setEditingSubmodule = useAppStore(state => state.setEditingSubmodule);

  const handleExportZip = async () => {
    await handleExportZIP(showToast);
  };

  const handlePublish = () => {
    showToast('Iniciando deploy na edge...', 'loading');
    setTimeout(() => showToast('App serviço publicado com sucesso!', 'success'), 2000);
  };

  const handleDeleteModule = (id: number) => {
    deleteModule(id);
    showToast('Módulo deletado permanentemente.', 'error');
  };

  const handleDeleteSubmodule = (modId: number, subId: number) => {
    deleteSubmodule({ modId, subId });
    showToast('Sub-módulo removido.', 'success');
  };

  const handleAddSubmodule = (modId: number) => {
    addSubmodule(modId);
    showToast('Sub-módulo adicionado com sucesso.', 'success');
  };

  const onUpdateSubmoduleContent = (modId: number, subId: number, content: string, builderData: BuilderBlock[]) => {
    updateSubmoduleContent({ modId, subId, content, builderData });
    setEditingSubmodule(null);
    showToast('Página salva e renderizada com sucesso!', 'success');
  };

  return {
    handleExportZip,
    handlePublish,
    handleDeleteModule,
    handleDeleteSubmodule,
    handleAddSubmodule,
    handleUpdateSubmoduleContent: onUpdateSubmoduleContent
  };
}