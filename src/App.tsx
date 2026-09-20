import React, { useState, Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#ff6b6b' }}>
          <h1>Algo deu errado</h1>
          <p>{error?.message}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Recarregar App</button>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

import { getProjectWorkspaceSnapshot, useAppStore } from './store/useAppStore';
import { projectService } from './services/projectService';
import { useToast, useProjects, useBuilderActions } from './hooks';
import { Header } from './components/CommonComponents';
import i18n from './i18n';
import { AppifyLogo } from './components/AppLogo';
import { PhoneMockup } from './components/PhoneMockup';
import ProjectsDashboard from './components/ProjectsDashboard';
import BuilderLayout from './components/BuilderLayout';

// Lazy loading exclusivo para o PWA no build final
const PWARuntime = React.lazy(() => import('./components/PWARuntime').then(m => ({ default: m.PWARuntime })));

const buildTarget = (import.meta as any).env?.VITE_BUILD_TARGET;

function PWABootstrap({ isPhoneDark, setIsPhoneDark }: { isPhoneDark: boolean, setIsPhoneDark: (val: boolean) => void }) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    fetch('/app-data.json?nocache=' + new Date().getTime())
      .then(res => {
        if (!res.ok) throw new Error("Não foi possível ler o app-data.json");
        return res.json();
      })
      .then(data => {
        // Hidrata o Zustand com os dados do cliente de forma segura
        useAppStore.setState(data);
        
        // Altera o idioma do i18n para corresponder ao configurado no PWA
        const lang = data.pwaConfig?.language || data.activeLocale || 'pt-BR';
        i18n.changeLanguage(lang.split('-')[0]);
        
        setLoaded(true);
      })
      .catch(err => {
        console.error(err);
        setError(true);
      });
  }, []);

  // Mensagens dinâmicas agnósticas antes de inicializar o PWA (i18n Compliance)
  const browserLang = navigator.language || 'pt';
  const isEn = browserLang.startsWith('en');
  const isEs = browserLang.startsWith('es');
  const isFr = browserLang.startsWith('fr');

  if (error) {
    const errorText = isEn 
      ? 'An error occurred while loading the application data.' 
      : isEs 
      ? 'Ocurrió un error al cargar los datos de la aplicación.' 
      : isFr 
      ? 'Une erreur est survenue lors du chargement des données de l\'application.' 
      : 'Ocorreu um erro ao carregar os dados do aplicativo.';

    return (
      <div style={{width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#111', color: '#ff4a4a', fontFamily: 'sans-serif', padding: '20px', textAlign: 'center'}}>
        {errorText}
      </div>
    );
  }

  if (!loaded) {
    const loadingText = isEn 
      ? 'Loading App...' 
      : isEs 
      ? 'Cargando App...' 
      : isFr 
      ? 'Chargement de l\'App...' 
      : 'Carregando App...';

    return (
      <div style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff', fontFamily: 'sans-serif', fontSize: '18px'}}>
        {loadingText}
      </div>
    );
  }

  // SÓ MONTA O APP QUANDO OS DADOS ESTIVEREM 100% PRONTOS
  return (
    <Suspense fallback={<Loader2 className="animate-spin text-white" size={32} />}>
      <PWARuntime isPhoneDark={isPhoneDark} setIsPhoneDark={setIsPhoneDark} />
    </Suspense>
  );
}

function AppContent() {
  const currentView = useAppStore(state => state.currentView);
  const isLoading = useAppStore(state => state.isLoading);
  const [isPhoneDark, setIsPhoneDark] = useState<boolean>(true);

  const { toasts, showToast } = useToast();
  const {
    projects,
    handleOpenProject,
    handleToggleProjectStatus,
    handleDeleteProject,
    handleDuplicateProject,
    handleExportBackup,
    handleImportBackup,
  } = useProjects(showToast);
  const builderActions = useBuilderActions(showToast);

  React.useEffect(() => {
    const lifecycle = window.appifyDesktop?.lifecycle;
    if (!lifecycle) return;
    return lifecycle.onBeforeClose(async () => {
      try {
        const state = useAppStore.getState();
        if (state.currentProjectId) {
          await projectService.saveProject(state.currentProjectId, getProjectWorkspaceSnapshot(state));
        }
      } catch (error) {
        console.error('[Appify] Falha ao salvar antes de fechar:', error);
      } finally {
        lifecycle.readyToClose();
      }
    });
  }, []);

  // Check if we are in standalone/production mode via URL
  const isStandaloneMode = new URLSearchParams(window.location.search).get('mode') === 'app';

  // Modo PWA Exclusivo (via Variável de Ambiente) ou Fallback via URL
  if (buildTarget === 'pwa' || isStandaloneMode) {
    return (
      <div className="standalone-app-wrapper w-screen h-screen flex items-center justify-center bg-[#000]">
        <PWABootstrap isPhoneDark={isPhoneDark} setIsPhoneDark={setIsPhoneDark} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--surface)',
        gap: '20px'
      }}>
        <AppifyLogo className="text-5xl mb-4 animate-pulse" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
          <Loader2 className="spin" size={24} />
          <span style={{ fontFamily: 'Syne', fontWeight: 500 }}>Abrindo projetos locais...</span>
        </div>
        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Header 
        handleOpenProject={handleOpenProject} 
        handlePublish={builderActions.handlePublish} 
        showToast={showToast}
      />
      
      <div className="appify-builder-root">
        {currentView === 'projects' ? (
          <ProjectsDashboard 
            projects={projects} 
            handleOpenProject={handleOpenProject} 
            handleToggleProjectStatus={handleToggleProjectStatus} 
            handleDeleteProject={handleDeleteProject}
            handleDuplicateProject={handleDuplicateProject}
            handleExportBackup={handleExportBackup}
            handleImportBackup={handleImportBackup}
          />
        ) : (
          <BuilderLayout 
            isPhoneDark={isPhoneDark} 
            setIsPhoneDark={setIsPhoneDark} 
            handleDeleteModule={builderActions.handleDeleteModule} 
            handleDeleteSubmodule={builderActions.handleDeleteSubmodule} 
            handleAddSubmodule={builderActions.handleAddSubmodule}
            handleUpdateSubmoduleContent={builderActions.handleUpdateSubmoduleContent} 
            showToast={showToast}
          />
        )}
      </div>

      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast">
            <div className={`toast-icon ${toast.type}`}>
              {toast.type === 'success' && <CheckCircle2 size={18} />}
              {toast.type === 'error' && <XCircle size={18} />}
              {toast.type === 'loading' && <Loader2 size={18} />}
            </div>
            <div className="toast-title">{toast.message}</div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function App() { 
  return (
    <div className="v-root">
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </div>
  ); 
}
