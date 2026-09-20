import { useState, useEffect } from 'react';
import { ToastMessage, ToastType, BuilderBlock } from './types';
import { projectService } from './services/projectService';
import { createInitialProjectWorkspace, useAppStore } from './store/useAppStore';

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
  const setView = useAppStore(state => state.setView);
  const loadProject = useAppStore(state => state.loadProject);
  const initializeProjects = useAppStore(state => state.initializeProjects);
  const setIsLoading = useAppStore(state => state.setIsLoading);
  const projects = useAppStore(state => state.projects);
  const setProjects = useAppStore(state => state.setProjects);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        await initializeProjects();
      } catch (error) {
        console.error(error);
        setIsLoading(false);
        showToast('Não foi possível abrir a pasta local de projetos.', 'error');
      }
    }
    void init();
  }, []);

  const handleOpenProject = async (projectId: number, projectName: string) => {
    showToast('Carregando projeto...', 'loading');
    if (projectId === 0) {
      try {
        const name = projectName || 'Novo App';
        const project = await projectService.createProject(name, createInitialProjectWorkspace(name));
        setProjects(prev => [project, ...prev]);
        await loadProject(project.id);
        showToast('Projeto criado com sucesso!', 'success');
      } catch (error) {
        console.error(error);
        showToast('Falha ao criar o projeto local.', 'error');
      }
    } else {
      try {
        await loadProject(projectId);
        showToast('Projeto pronto!', 'success');
      } catch (error) {
        console.error(error);
        setView('projects');
        showToast('Não foi possível abrir o projeto.', 'error');
      }
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
    const confirmed = window.confirm(
      projectService.isDesktop()
        ? 'Tem certeza que deseja mover este app para a Lixeira?'
        : 'Tem certeza que deseja excluir este app?'
    );
    if (!confirmed) return;

    try {
      showToast('Excluindo projeto...', 'loading');
      await projectService.deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      showToast(projectService.isDesktop() ? 'Projeto movido para a Lixeira.' : 'Projeto excluído.', 'success');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível excluir o projeto.', 'error');
    }
  };

  const handleDuplicateProject = async (projectId: number) => {
    try {
      const duplicated = await projectService.duplicateProject(projectId);
      setProjects(prev => [duplicated, ...prev]);
      showToast('Projeto duplicado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível duplicar o projeto.', 'error');
    }
  };

  const handleExportBackup = async (projectId: number) => {
    try {
      const result = await projectService.exportBackup(projectId);
      if (!result.canceled) showToast('Backup exportado com sucesso!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Não foi possível exportar o backup.', 'error');
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await projectService.importBackup();
      if (result.project) {
        setProjects(prev => [result.project!, ...prev]);
        showToast('Projeto importado com sucesso!', 'success');
      }
    } catch (error) {
      console.error(error);
      showToast('Não foi possível importar o backup.', 'error');
    }
  };

  return {
    projects,
    handleOpenProject,
    handleToggleProjectStatus,
    handleDeleteProject,
    handleDuplicateProject,
    handleExportBackup,
    handleImportBackup,
  };
}

export function useBuilderActions(showToast: (msg: string, type?: ToastType) => void) {
  const appName = useAppStore(state => state.appName);
  const modules = useAppStore(state => state.modules);
  const deleteModule = useAppStore(state => state.deleteModule);
  const deleteSubmodule = useAppStore(state => state.deleteSubmodule);
  const addSubmodule = useAppStore(state => state.addSubmodule);
  const updateSubmoduleContent = useAppStore(state => state.updateSubmoduleContent);
  const setEditingSubmodule = useAppStore(state => state.setEditingSubmodule);

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

  const onUpdateSubmoduleContent = (modId: number, subId: number, content: string, builderData: BuilderBlock[], htmlMode?: 'visual' | 'code') => {
    updateSubmoduleContent({ modId, subId, content, contentHtml: content, builderData, htmlMode });
    setEditingSubmodule(null);
    showToast('Página salva e renderizada com sucesso!', 'success');
  };

  return {
    handlePublish,
    handleDeleteModule,
    handleDeleteSubmodule,
    handleAddSubmodule,
    handleUpdateSubmoduleContent: onUpdateSubmoduleContent
  };
}
