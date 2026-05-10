import { Project, AppState, Module, SubModule } from '../types';
import { supabase } from './supabaseService';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('last_edited', { ascending: false }); // Corrigido para last_edited

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    console.log('Projetos carregados:', data);

    // Mapeando snake_case do DB para camelCase no app
    return data.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      lastEdited: p.last_edited, // Corrigido
      users: 0, // Mockado por enquanto, já que não temos a coluna users no DB
      color: p.color,
      url: p.url
    }));
  },

  saveProjects: async (projects: Project[]): Promise<void> => {
    const mapped = projects.map(p => ({
      id: p.id,
      name: p.name,
      status: p.status,
      last_edited: p.lastEdited, // Corrigido para o DB
      color: p.color,
      url: p.url
    }));
    
    const { error } = await supabase
      .from('projects')
      .upsert(mapped);

    if (error) console.error('Error saving projects:', error);
  },

  createProject: async (currentProjects: Project[], newProjectName: string): Promise<any> => {
    console.log("Tentando criar projeto:", newProjectName);
    
    const newProject = {
      name: newProjectName,
      status: 'Rascunho',
      last_edited: new Date().toISOString(), // Corrigido para o DB
      color: '#7c6fff',
      url: `${newProjectName.toLowerCase().replace(/\s+/g, '')}.appify.com`
    };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single();

      if (error) {
        console.error("ERRO AO SALVAR NO SUPABASE:", error);
        throw error;
      }

      const newlyCreated = {
        id: data.id,
        name: data.name,
        status: data.status,
        lastEdited: data.last_edited,
        users: 0,
        color: data.color,
        url: data.url
      };

      console.log("Projeto salvo no banco com sucesso:", newlyCreated);
      return { projects: [...currentProjects, newlyCreated], newlyCreated };
    } catch (err) {
      console.error("ERRO AO SALVAR NO SUPABASE (try/catch):", err);
      throw err;
    }
  },

  getAppState: async (initialState: AppState, projectId?: number): Promise<AppState> => {
    if (!projectId) return initialState;

    try {
      // 1. Fetch project config
      const { data: project, error: projError } = await supabase
        .from('projects')
        .select('name, pwa_config, active_locale, translations')
        .eq('id', projectId)
        .single();

      if (projError) throw projError;

      // 2. Fetch modules and submodules
      const { data: modulesData, error: modError } = await supabase
        .from('modules')
        .select(`
          id,
          name,
          iconName:icon_name,
          status,
          position,
          subs:submodules (
            id,
            name,
            type,
            content_html,
            builder_data,
            position
          )
        `)
        .eq('project_id', projectId)
        .order('position', { foreignTable: 'modules' }); // Corrigido de order_index para position

      if (modError) throw modError;

      return {
        ...initialState,
        appName: project.name || initialState.appName,
        pwaConfig: project.pwa_config ? { ...initialState.pwaConfig, ...project.pwa_config } : initialState.pwaConfig,
        activeLocale: project.active_locale || initialState.activeLocale,
        translations: project.translations || initialState.translations,
        modules: (modulesData || []).map((m: any) => ({
          ...m,
          // Corrigido de order_index para position
          subs: (m.subs || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        }))
      };
    } catch (e) {
      console.error('Error loading app state:', e);
      return initialState;
    }
  },

  saveAppState: async (state: AppState, projectId: number): Promise<void> => {
    if (!projectId) return;

    try {
      await supabase
        .from('projects')
        .update({
          name: state.appName,
          pwa_config: state.pwaConfig,
          active_locale: state.activeLocale,
          translations: state.translations,
          last_edited: new Date().toISOString() // Corrigido para o DB
        })
        .eq('id', projectId);
      
      console.log('[SUPABASE] App state updated for project', projectId);
    } catch (e) {
      console.error('Error saving app state:', e);
    }
  },

  updateModule: async (moduleId: number, payload: Partial<Module>): Promise<void> => {
    const { error } = await supabase
      .from('modules')
      .update({
        name: payload.name,
        icon_name: payload.iconName,
        status: payload.status
      })
      .eq('id', moduleId);
    if (error) console.error('Error updating module:', error);
  },

  updateSubmodule: async (subId: number, payload: Partial<SubModule>): Promise<void> => {
    const { error } = await supabase
      .from('submodules')
      .update({
        name: payload.name,
        content_html: payload.content_html,
        builder_data: payload.builder_data
      })
      .eq('id', subId);
    if (error) console.error('Error updating submodule:', error);
  }
};
