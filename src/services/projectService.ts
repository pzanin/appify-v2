import { Project, AppState, Module, SubModule } from '../types';
import { supabase } from './supabaseService';

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, status, last_edited, color, url, pwa_config')
      .order('last_edited', { ascending: false });

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
      lastEdited: p.last_edited,
      users: 0,
      color: p.color,
      url: p.url,
      logoBase64: p.pwa_config?.logoBase64 || null
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
          coverImageUrl:cover_image_url,
          externalLink:external_link,
          releaseType:release_type,
          dripDays:drip_days,
          checkoutUrl:checkout_url,
          subs:submodules (
            id,
            name,
            type,
            content_html,
            builder_data,
            position,
            coverImageUrl:cover_image_url,
            externalLink:external_link
          )
        `)
        .eq('project_id', projectId)
        .order('position', { foreignTable: 'modules' });

      if (modError) throw modError;

      return {
        ...initialState,
        appName: project.name || initialState.appName,
        pwaConfig: project.pwa_config ? { ...initialState.pwaConfig, ...project.pwa_config } : initialState.pwaConfig,
        activeLocale: project.active_locale || initialState.activeLocale,
        translations: project.translations || initialState.translations,
        modules: (modulesData || []).map((m: any) => ({
          ...m,
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
      // 1. Save project-level config
      await supabase
        .from('projects')
        .update({
          name: state.appName,
          pwa_config: state.pwaConfig,
          active_locale: state.activeLocale,
          translations: state.translations,
          last_edited: new Date().toISOString()
        })
        .eq('id', projectId);

      // 2. Upsert all modules
      if (state.modules && state.modules.length > 0) {
        const modulesPayload = state.modules.map((m, index) => ({
          id: m.id,
          project_id: projectId,
          name: m.name,
          icon_name: m.iconName || 'BookOpen',
          status: m.status || 'Ativo',
          position: index,
          cover_image_url: m.coverImageUrl || null,
          external_link: m.externalLink || null,
          release_type: m.releaseType || 'immediate',
          drip_days: m.dripDays || 0,
          checkout_url: m.checkoutUrl || null,
        }));

        const { error: modError } = await supabase
          .from('modules')
          .upsert(modulesPayload, { onConflict: 'id' });

        if (modError) console.error('[SUPABASE] Error saving modules:', modError);

        // 3. Upsert all submodules
        const subsPayload = state.modules.flatMap(m =>
          (m.subs || []).map((s, index) => ({
            id: s.id,
            module_id: m.id,
            name: s.name,
            type: s.type || 'HTML Nativo',
            content_html: s.content_html || '',
            builder_data: s.builder_data || [],
            position: index,
            cover_image_url: (s as any).coverImageUrl || null,
            external_link: (s as any).externalLink || null,
          }))
        );

        if (subsPayload.length > 0) {
          const { error: subError } = await supabase
            .from('submodules')
            .upsert(subsPayload, { onConflict: 'id' });

          if (subError) console.error('[SUPABASE] Error saving submodules:', subError);
        }

        // 4. Delete modules removed from state
        const { data: dbModules } = await supabase
          .from('modules')
          .select('id')
          .eq('project_id', projectId);

        if (dbModules) {
          const stateModuleIds = state.modules.map(m => m.id);
          const toDeleteMods = dbModules.filter(m => !stateModuleIds.includes(m.id)).map(m => m.id);
          if (toDeleteMods.length > 0) {
            await supabase.from('modules').delete().in('id', toDeleteMods);
          }
        }
      }

      console.log('[SUPABASE] Full app state saved for project', projectId);
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
  },

  deleteProject: async (projectId: number): Promise<void> => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }
};
