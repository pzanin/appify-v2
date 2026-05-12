import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
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

import { useAppStore } from './store/useAppStore';
import { useToast, useProjects, useBuilderActions } from './hooks';
import { Header } from './components/CommonComponents';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { BuilderLayout } from './components/BuilderLayout';

function AppContent() {
  const currentView = useAppStore(state => state.currentView);
  const isLoading = useAppStore(state => state.isLoading);
  const [isPhoneDark, setIsPhoneDark] = useState<boolean>(true);

  const { toasts, showToast } = useToast();
  const { projects, handleOpenProject, handleToggleProjectStatus, handleDeleteProject } = useProjects(showToast);
  const builderActions = useBuilderActions(showToast);

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
        <div className="logo" style={{ fontSize: '32px' }}>App<span>ify</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted)' }}>
          <Loader2 className="spin" size={24} />
          <span style={{ fontFamily: 'Syne', fontWeight: 500 }}>Conectando ao Supabase...</span>
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
        handleExportZip={builderActions.handleExportZip} 
        handlePublish={builderActions.handlePublish} 
        showToast={showToast}
      />
      
      {currentView === 'projects' ? (
        <ProjectsDashboard 
          projects={projects} 
          handleOpenProject={handleOpenProject} 
          handleToggleProjectStatus={handleToggleProjectStatus} 
          handleDeleteProject={handleDeleteProject}
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
    <div className="appify-root">
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </div>
  ); 
}
