import { useState, useEffect } from 'react';
import { Project, ToastMessage, ToastType, BuilderBlock } from './types';
import { projectService } from './services/projectService';
import { useAppStore } from './store/useAppStore';

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
  
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    const data = await projectService.getProjects();
    setProjects(data);
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
        showToast(`Erro ao criar: ${err.message || 'Verifique o Supabase'}`, 'error');
        return;
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
      showToast(`Erro ao excluir: ${err.message}`, 'error');
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

  const handleExportZip = () => { 
    showToast('Gerando PWA Shell, manifest e indexando módulos...', 'loading'); 
    console.log("=========================================");
    console.log(`[ZIP EXPORT ENGINE] Iniciando empacotamento do PWA: ${appName}`);
    modules.forEach(mod => { 
      mod.subs.forEach(sub => { 
        console.log(`-> /modules/${mod.id}_${sub.id}.html gerado (Tamanho: ${sub.content_html ? sub.content_html.length : 0} bytes)`); 
      }); 
    });
    console.log("=========================================");
    setTimeout(() => showToast('Projeto PWA exportado! (Verifique o console)', 'success'), 2000); 
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
