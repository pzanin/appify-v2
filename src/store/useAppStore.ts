import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppState, AppView, PwaConfig, BuilderBlock, SupportedLocale, FeedPost, Project } from '../types';
import { INITIAL_MODULES, INITIAL_PWA_CONFIG } from '../constants';
import { projectService } from '../services/projectService';
import i18n from '../i18n';

interface AppStore extends AppState {
  projects: Project[];
  setProjects: (projects: Project[] | ((prev: Project[]) => Project[])) => void;
  isLoading: boolean;
  currentProjectId: number | null;
  builderLocale: SupportedLocale;
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
  updateModule: (id: number, payload: Partial<any>) => void;
  updateSubmoduleCover: (payload: { modId: number; subId: number; coverImageUrl: string; externalLink?: string }) => void;
  addSubmodule: (modId: number) => void;
  deleteSubmodule: (payload: { modId: number; subId: number }) => void;
  renameSubmodule: (payload: { modId: number; subId: number; name: string }) => void;
  updateSubmoduleContent: (payload: {
    modId: number;
    subId: number;
    content?: string;
    builderData?: BuilderBlock[];
    name?: string;
    contentType?: 'web' | 'html' | 'youtube' | 'vimeo' | 'panda';
    contentUrl?: string;
    contentHtml?: string;
    htmlMode?: 'visual' | 'code';
    gamificationConfig?: { timeGateSeconds: number; enableCelebration: boolean }
  }) => void;
  updateSubmoduleAccess: (payload: { modId: number; subId: number; releaseType?: 'immediate' | 'drip' | 'locked'; dripDays?: number; checkoutUrl?: string }) => void;
  reorderSubmodule: (payload: { modId: number; dragId: number; overId: number }) => void;
  duplicateSubmodule: (payload: { modId: number; subId: number }) => void;
  moveSubmodule: (payload: { fromModId: number; subId: number; toModId: number }) => void;
  setLocale: (locale: SupportedLocale) => void;
  setBuilderLocale: (locale: SupportedLocale) => void;
  setSplash: (active: boolean) => void;
  setMockupOnboardingCompleted: (completed: boolean) => void;
  resetMockupOnboarding: () => void;
  isNewProjectModalOpen: boolean;
  setIsNewProjectModalOpen: (open: boolean) => void;
  setFeedPosts: (posts: FeedPost[]) => void;
  addFeedPost: (post: FeedPost) => void;
  deleteFeedPost: (id: number) => void;
  addPushNotification: (push: any) => void;
  deletePushNotification: (id: number) => void;
}

const initialState: AppState = {
  currentView: 'projects',
  activeStep: 0,
  appName: 'Meu App',
  modules: INITIAL_MODULES,
  selectedModuleId: 1,
  pwaConfig: INITIAL_PWA_CONFIG,
  editingSubmodule: null,
  activeLocale: 'pt-BR',
  splashActive: false,
  mockupOnboardingCompleted: false,
  analytics: {
    activeUsers: 0,
    sessionsToday: 0,
    avgConsumptionMinutes: 0,
    retentionRate: 0,
    retentionFunnel: [],
    upsellClicks: { total: 0, clicks: 0 },
    dropOffByModule: [],
    gamificationStats: { activeStreaks: 0, celebrationTriggers: 0 },
    pwaAdoption: { web: 0, installed: 0 }
  },
  feedPosts: [],
  pushNotifications: []
};

export function createInitialProjectWorkspace(name = 'Meu App'): AppState {
  return {
    ...initialState,
    appName: name,
    pwaConfig: { ...INITIAL_PWA_CONFIG, appName: name },
    modules: [],
    analytics: { ...initialState.analytics },
    feedPosts: [],
    pushNotifications: [],
  };
}

export function getProjectWorkspaceSnapshot(state = useAppStore.getState()): AppState {
  return {
    currentView: state.currentView,
    activeStep: state.activeStep,
    appName: state.appName,
    modules: state.modules,
    selectedModuleId: state.selectedModuleId,
    pwaConfig: state.pwaConfig,
    editingSubmodule: state.editingSubmodule,
    activeLocale: state.activeLocale,
    splashActive: state.splashActive,
    mockupOnboardingCompleted: state.mockupOnboardingCompleted,
    analytics: state.analytics,
    feedPosts: state.feedPosts,
    pushNotifications: state.pushNotifications,
  };
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector(
      (set, get) => ({
        ...initialState,
        projects: [],
        setProjects: (updater) => set((state) => ({
          projects: typeof updater === 'function' ? updater(state.projects) : updater
        })),
        isLoading: false,
        currentProjectId: null,
        builderLocale: (localStorage.getItem('appify-builder-locale') as SupportedLocale) || 'pt-BR',
        isNewProjectModalOpen: false,

        setIsLoading: (loading) => set({ isLoading: loading }),
        setIsNewProjectModalOpen: (open) => set({ isNewProjectModalOpen: open }),

        loadProject: async (id) => {
          set({ isLoading: true });
          const document = await projectService.openProject(id);
          set({ ...document.workspace, currentProjectId: id, currentView: 'builder', isLoading: false });
        },

        initializeProjects: async () => {
          const projects = await projectService.getProjects();
          set({ projects, isLoading: false, currentView: 'projects', activeStep: 0, currentProjectId: null });
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
            subs: [],
            releaseType: 'immediate',
            gamificationConfig: {
              enabled: state.pwaConfig.gamification?.enabled || false,
              progressStyle: state.pwaConfig.gamification?.progressStyle || 'linear'
            }
          } as any] // <-- O 'as any' é o nosso passe livre que cala o aviso
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

        updateModule: (id, payload) => set((state) => ({
          modules: state.modules.map(m => m.id === id ? { ...m, ...payload } : m)
        })),

        updateSubmoduleCover: (payload) => set((state) => ({
          modules: state.modules.map(m => m.id === payload.modId
            ? {
              ...m, subs: m.subs.map(s => s.id === payload.subId
                ? { ...s, coverImageUrl: payload.coverImageUrl, externalLink: payload.externalLink }
                : s
              )
            }
            : m
          )
        })),

        addSubmodule: (modId) => set((state) => ({
          modules: state.modules.map(mod => mod.id === modId
            ? {
              ...mod, subs: [...mod.subs, {
                id: Date.now(),
                name: 'Nova Aula',
                type: 'HTML Nativo',
                contentType: 'html',
                content_html: '',
                contentHtml: '',
                contentUrl: '',
                builder_data: [],
                htmlMode: 'visual',
                gamificationConfig: {
                  timeGateSeconds: 0,
                  enableCelebration: state.pwaConfig.gamification?.enableCelebration || false
                },
                releaseType: 'immediate'
              }]
            }
            : mod)
        })),

        deleteSubmodule: (payload) => set((state) => ({
          modules: state.modules.map(m => m.id === payload.modId ? { ...m, subs: m.subs.filter(s => s.id !== payload.subId) } : m),
          editingSubmodule: state.editingSubmodule?.subId === payload.subId ? null : state.editingSubmodule
        })),

        renameSubmodule: (payload) => set((state) => ({
          modules: state.modules.map(m => m.id === payload.modId
            ? { ...m, subs: m.subs.map(s => s.id === payload.subId ? { ...s, name: payload.name } : s) }
            : m
          )
        })),

        updateSubmoduleContent: (payload) => set((state) => ({
          modules: state.modules.map(mod => mod.id === payload.modId
            ? {
              ...mod, subs: mod.subs.map(sub => sub.id === payload.subId ? {
                ...sub,
                content_html: payload.content ?? sub.content_html,
                contentHtml: payload.contentHtml ?? sub.contentHtml,
                contentUrl: payload.contentUrl ?? sub.contentUrl,
                contentType: payload.contentType ?? sub.contentType,
                builder_data: payload.builderData ?? sub.builder_data,
                name: payload.name ?? sub.name,
                htmlMode: payload.htmlMode ?? sub.htmlMode,
                gamificationConfig: payload.gamificationConfig ?? sub.gamificationConfig
              } : sub)
            }
            : mod)
        })),

        updateSubmoduleAccess: (payload) => set((state) => ({
          modules: state.modules.map(m => m.id === payload.modId
            ? {
              ...m, subs: m.subs.map(s => s.id === payload.subId
                ? { ...s, releaseType: payload.releaseType, dripDays: payload.dripDays, checkoutUrl: payload.checkoutUrl }
                : s
              )
            }
            : m
          )
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
        setBuilderLocale: (locale) => {
          localStorage.setItem('appify-builder-locale', locale);
          void i18n.changeLanguage(locale.split('-')[0]);
          set({ builderLocale: locale });
        },
        setSplash: (active) => set({ splashActive: active }),
        setMockupOnboardingCompleted: (completed) => set({ mockupOnboardingCompleted: completed }),
        resetMockupOnboarding: () => set({ mockupOnboardingCompleted: false }),
        setFeedPosts: (posts) => set({ feedPosts: posts }),
        addFeedPost: (post) => set((state) => ({ feedPosts: [post, ...state.feedPosts] })),
        deleteFeedPost: (id) => set((state) => ({ feedPosts: state.feedPosts.filter(p => p.id !== id) })),
        addPushNotification: (push) => set((state) => ({ pushNotifications: [push, ...(state.pushNotifications || [])] })),
        deletePushNotification: (id) => set((state) => ({ pushNotifications: (state.pushNotifications || []).filter(p => p.id !== id) })),
      })
  ));

let saveTimer: ReturnType<typeof setTimeout> | null = null;
useAppStore.subscribe(
  (state) => ({
    currentProjectId: state.currentProjectId,
    isLoading: state.isLoading,
    currentView: state.currentView,
    activeStep: state.activeStep,
    appName: state.appName,
    modules: state.modules,
    selectedModuleId: state.selectedModuleId,
    pwaConfig: state.pwaConfig,
    editingSubmodule: state.editingSubmodule,
    activeLocale: state.activeLocale,
    splashActive: state.splashActive,
    mockupOnboardingCompleted: state.mockupOnboardingCompleted,
    analytics: state.analytics,
    feedPosts: state.feedPosts,
    pushNotifications: state.pushNotifications,
  }),
  (state) => {
    if (!state.currentProjectId || state.isLoading) {
      if (saveTimer) clearTimeout(saveTimer);
      return;
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const currentWorkspace = getProjectWorkspaceSnapshot(state as AppStore);
      try {
        const savedProject = await projectService.saveProject(state.currentProjectId, currentWorkspace);
        useAppStore.getState().setProjects(prevProjects => prevProjects.map(project => (
          project.id === savedProject.id ? savedProject : project
        )));
      } catch (error) {
        console.error('[Appify] Falha no autosave local:', error);
      }
    }, 1000);
  },
  {
    fireImmediately: false,
    equalityFn: (previous, current) => (
      previous.currentProjectId === current.currentProjectId
      && previous.isLoading === current.isLoading
      && previous.currentView === current.currentView
      && previous.activeStep === current.activeStep
      && previous.appName === current.appName
      && previous.modules === current.modules
      && previous.selectedModuleId === current.selectedModuleId
      && previous.pwaConfig === current.pwaConfig
      && previous.editingSubmodule === current.editingSubmodule
      && previous.activeLocale === current.activeLocale
      && previous.splashActive === current.splashActive
      && previous.mockupOnboardingCompleted === current.mockupOnboardingCompleted
      && previous.analytics === current.analytics
      && previous.feedPosts === current.feedPosts
      && previous.pushNotifications === current.pushNotifications
    ),
  }
);

void i18n.changeLanguage(useAppStore.getState().builderLocale.split('-')[0]);
