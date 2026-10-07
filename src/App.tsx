import React, { useState, Component, ErrorInfo, ReactNode, Suspense } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { ScreenErrorBoundary } from './components/ScreenErrorBoundary';

import { getProjectWorkspaceSnapshot, useAppStore } from './store/useAppStore';
import { projectService } from './services/projectService';
import { useToast, useProjects, useBuilderActions } from './hooks';
import { Header } from './components/CommonComponents';
import i18n from './i18n';
import { CustomerEntry } from './components/CustomerEntry';
import { AppifyLogo } from './components/AppLogo';
import { CleanYouTubePreviewEnhancer } from './components/CleanYouTubePreviewEnhancer';
import ProjectsDashboard from './components/ProjectsDashboard';
import BuilderLayout from './components/BuilderLayout';

const PWARuntime = React.lazy(() => import('./components/PWARuntime').then(m => ({ default: m.PWARuntime })));

const buildTarget = (import.meta as any).env?.VITE_BUILD_TARGET;

export function PWABootstrap({ isPhoneDark, setIsPhoneDark }: { isPhoneDark: boolean, setIsPhoneDark: (val: boolean) => void }) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    fetch('./app-data.json?nocache=' + new Date().getTime())
      .then(res => {
        if (!res.ok) throw new Error("Não foi possível ler o app-data.json");
        return res.json();
      })
      .then(data => {
        useAppStore.setState(data);
        const lang = data.pwaConfig?.language || data.activeLocale || 'pt-BR';
        document.documentElement.lang = lang;
        i18n.changeLanguage(lang.split('-')[0]);
        setLoaded(true);
      })
      .catch(() => {
        console.error('[Appify] Operação não concluída.');
        setError(true);
      });
  }, []);

  const t=i18n.getFixedT((document.documentElement.lang || navigator.language || 'pt').split('-')[0]);
  if (error) return <div style={{width:'100vw',height:'100vh',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',background:'#111',color:'#ff4a4a',fontFamily:'sans-serif',padding:20,textAlign:'center'}}>
    <p>{t('app.errors.dataError')}</p><button className="btn-primary" onClick={()=>window.location.reload()}>{t('app.errors.retry')}</button>
  </div>;

  if (!loaded) {
    return (
      <div style={{width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f7f9fc', color: '#172033', fontFamily: 'sans-serif', fontSize: '18px'}}>
        <div style={{textAlign:'center'}}>
          <img src="./icon-192x192.png" alt="" style={{width:80,height:80,borderRadius:22,margin:'0 auto 20px'}} />
          <h1 style={{fontSize:24,marginBottom:12}}>{document.title}</h1>
          <p role="status">{t('experience.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<Loader2 className="animate-spin text-white" size={32} />}>
      <CustomerEntry config={useAppStore.getState().pwaConfig}><PWARuntime analyticsLive isPhoneDark={isPhoneDark} setIsPhoneDark={setIsPhoneDark} /></CustomerEntry>
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
      } catch {
        console.error('[Appify] Falha ao salvar antes de fechar:');
      } finally {
        lifecycle.readyToClose();
      }
    });
  }, []);

  const isStandaloneMode = new URLSearchParams(window.location.search).get('mode') === 'app';

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
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <CleanYouTubePreviewEnhancer />
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
      <ScreenErrorBoundary product={buildTarget==='pwa' || new URLSearchParams(window.location.search).get('mode')==='app'}>
        <AppContent />
      </ScreenErrorBoundary>
    </div>
  );
}
