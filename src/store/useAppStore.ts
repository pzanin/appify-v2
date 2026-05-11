import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppState, AppView, PwaConfig, BuilderBlock, SupportedLocale } from '../types';
import { INITIAL_MODULES, INITIAL_PWA_CONFIG, DEFAULT_TRANSLATIONS } from '../constants';
import { projectService } from '../services/projectService';

interface AppStore extends AppState {
  isLoading: boolean;
  currentProjectId: number | null;
  setIsLoading: (loading: boolean) => void;
  loadProject: (id: number) => Promise<void>;
  initializeProjects: () => Promise<void>;
  setView: (view: AppView) => void;
  setStep: (step: number) => void;
  setAppName: (name: string) => void;
  setSelectedModule: (id: number | null) => void;
  updatePwaConfig: (config: Partial<PwaConfig>) => void;
  setEditingSubmodule: (editing: { modId: number, subId: number } | null) => void;
  addModule: (payload: { name: string; iconName: string }) => void;
  deleteModule: (id: number) => void;
  renameModule: (payload: { id: number; name: string }) => void;
  toggleModuleStatus: (id: number) => void;
  setModuleIcon: (payload: { id: number; iconName: string }) => void;
  updateModuleCover: (payload: { id: number; coverImageUrl: string; externalLink?: string }) => void;
  updateSubmoduleCover: (payload: { modId: number; subId: number; coverImageUrl: string; externalLink?: string }) => void;
  addSubmodule: (modId: number) => void;
  deleteSubmodule: (payload: { modId: number; subId: number }) => void;
  renameSubmodule: (payload: { modId: number; subId: number; name: string }) => void;
  updateSubmoduleContent: (payload: { modId: number; subId: number; content: string; builderData: BuilderBlock[] }) => void;
  reorderSubmodule: (payload: { modId: number; dragId: number; overId: number }) => void;
  duplicateSubmodule: (payload: { modId: number; subId: number }) => void;
  moveSubmodule: (payload: { fromModId: number; subId: number; toModId: number }) => void;
  setLocale: (locale: SupportedLocale) => void;
  setSplash: (active: boolean) => void;
  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
}

const initialState: AppState = { 
  currentView: 'projects', 
  activeStep: 1, 
  appName: 'Meu App', 
  modules: INITIAL_MODULES, 
  selectedModuleId: 1, 
  pwaConfig: INITIAL_PWA_CONFIG, 
  editingSubmodule: null,
  activeLocale: 'pt-BR',
  translations: DEFAULT_TRANSLATIONS,
  splashActive: false
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    isLoading: true,
    currentProjectId: null,
    isNewProjectModalOpen: false,

    setIsLoading: (loading) => set({ isLoading: loading }),
    setIsNewProjectModalOpen: (open) => set({ isNewProjectModalOpen: open }),

    loadProject: async (id) => {
      set({ isLoading: true, currentProjectId: id });
      const state = await projectService.getAppState(initialState, id);
      set({ ...state, isLoading: false });
    },

    initializeProjects: async () => {
      // This is basically to just ensure we start in 'projects' view
      set({ isLoading: false, currentView: 'projects' });
    },

    setView: (view) => set({ currentView: view }),
    setStep: (step) => set({ activeStep: step }),
    setAppName: (name) => set({ appName: name }),
    setSelectedModule: (id) => set({ selectedModuleId: id }),
    updatePwaConfig: (config) => set((state) => ({ pwaConfig: { ...state.pwaConfig, ...config } })),
    setEditingSubmodule: (editing) => set({ editingSubmodule: editing }),
    
    addModule: (payload) => set((state) => ({
      modules: [...state.modules, {
        id: Date.now(),
        name: payload.name,
        iconName: payload.iconName || 'BookOpen',
        status: 'Ativo',
        subs: []
      }]
    })),

    deleteModule: (id) => set((state) => ({
      modules: state.modules.filter(m => m.id !== id),
      selectedModuleId: state.selectedModuleId === id ? null : state.selectedModuleId
    })),

    renameModule: (payload) => set((state) => ({
      modules: state.modules.map(m => m.id === payload.id ? { ...m, name: payload.name } : m)
    })),

    toggleModuleStatus: (id) => set((state) => ({
      modules: state.modules.map(m => m.id === id 
        ? { ...m, status: m.status === 'Ativo' ? 'Rascunho' : 'Ativo' } 
        : m
      )
    })),

    setModuleIcon: (payload) => set((state) => ({
      modules: state.modules.map(m => m.id === payload.id ? { ...m, iconName: payload.iconName } : m)
    })),
    
    updateModuleCover: (payload) => set((state) => ({
      modules: state.modules.map(m => m.id === payload.id 
        ? { ...m, coverImageUrl: payload.coverImageUrl, externalLink: payload.externalLink } 
        : m
      )
    })),

    updateSubmoduleCover: (payload) => set((state) => ({
      modules: state.modules.map(m => m.id === payload.modId
        ? { ...m, subs: m.subs.map(s => s.id === payload.subId 
            ? { ...s, coverImageUrl: payload.coverImageUrl, externalLink: payload.externalLink }
            : s
          )}
        : m
      )
    })),

    addSubmodule: (modId) => set((state) => ({
      modules: state.modules.map(mod => mod.id === modId 
        ? { ...mod, subs: [...mod.subs, { id: Date.now(), name: 'Nova Aula', type: 'HTML Nativo', content_html: '', builder_data: [] }] } 
        : mod)
    })),

    deleteSubmodule: (payload) => set((state) => ({
      modules: state.modules.map(m => m.id === payload.modId ? { ...m, subs: m.subs.filter(s => s.id !== payload.subId) } : m)
    })),

    renameSubmodule: (payload) => set((state) => ({
      modules: state.modules.map(m => m.id === payload.modId
        ? { ...m, subs: m.subs.map(s => s.id === payload.subId ? { ...s, name: payload.name } : s) }
        : m
      )
    })),

    updateSubmoduleContent: (payload) => set((state) => ({
      modules: state.modules.map(mod => mod.id === payload.modId 
        ? { ...mod, subs: mod.subs.map(sub => sub.id === payload.subId ? { ...sub, content_html: payload.content, builder_data: payload.builderData } : sub) } 
        : mod)
    })),

    reorderSubmodule: (payload) => set((state) => {
      const { modId, dragId, overId } = payload;
      return {
        modules: state.modules.map(mod => {
          if (mod.id === modId) {
            const newSubs = [...mod.subs];
            const dragIndex = newSubs.findIndex(s => s.id === dragId);
            const overIndex = newSubs.findIndex(s => s.id === overId);
            const [draggedItem] = newSubs.splice(dragIndex, 1);
            newSubs.splice(overIndex, 0, draggedItem);
            return { ...mod, subs: newSubs };
          }
          return mod;
        })
      };
    }),

    duplicateSubmodule: (payload) => set((state) => {
      const mod = state.modules.find(m => m.id === payload.modId);
      const sub = mod?.subs.find(s => s.id === payload.subId);
      if (!sub) return state;
      const clone = { ...sub, id: Date.now(), name: `${sub.name} (cópia)` };
      return {
        modules: state.modules.map(m => m.id === payload.modId ? { ...m, subs: [...m.subs, clone] } : m)
      };
    }),

    moveSubmodule: (payload) => set((state) => {
      const { fromModId, subId, toModId } = payload;
      let movedSub: any = null;
      const newModules = state.modules.map(m => {
        if (m.id === fromModId) {
          movedSub = m.subs.find(s => s.id === subId);
          return { ...m, subs: m.subs.filter(s => s.id !== subId) };
        }
        return m;
      }).map(m => {
        if (m.id === toModId && movedSub) {
          return { ...m, subs: [...m.subs, { ...movedSub, id: Date.now() }] };
        }
        return m;
      });
      return { modules: newModules };
    }),

    setLocale: (locale) => set({ activeLocale: locale }),
    setSplash: (active) => set({ splashActive: active }),
  }))
);

// Subscribe to state changes to save app state (debounced 1.5s)
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useAppStore.subscribe(
  (state) => state,
  (state) => {
    if (!state.currentProjectId || state.isLoading) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const appState: AppState = {
        currentView: state.currentView,
        activeStep: state.activeStep,
        appName: state.appName,
        modules: state.modules,
        selectedModuleId: state.selectedModuleId,
        pwaConfig: state.pwaConfig,
        editingSubmodule: state.editingSubmodule,
        activeLocale: state.activeLocale,
        translations: state.translations,
        splashActive: state.splashActive,
      };
      await projectService.saveAppState(appState, state.currentProjectId!);
    }, 1500);
  },
  { fireImmediately: false }
);

export function useTranslation() {
  const activeLocale = useAppStore(state => state.activeLocale);
  const translations = useAppStore(state => state.translations);
  
  const t = (key: string): string => {
    return translations[activeLocale]?.strings[key] 
      ?? translations['pt-BR']?.strings[key] 
      ?? key;
  };
  
  return { t, locale: activeLocale };
}
