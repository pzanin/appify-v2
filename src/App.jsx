import React, { useState, createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { 
  Plus, Lock, Unlock, LayoutTemplate, Settings, Link as LinkIcon, 
  Image as ImageIcon, Smartphone, Home, Rss, User, PlayCircle, 
  ArrowLeft, Crown, Trash2, ExternalLink, Bell, Send, Grid, 
  ChevronRight, Sparkles, Loader2, CheckCircle2, XCircle, 
  AlertTriangle, X, Download, Users, MessageCircle, Heart, ImagePlus, Check, Clock, FolderPlus, ShieldAlert, EyeOff, Eye, Mail
} from 'lucide-react';

// ==========================================
// CONFIGURAÇÃO DO SUPABASE (Simulação)
// ==========================================
const supabaseUrl = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL : 'https://placeholder.supabase.co';
const supabaseAnonKey = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : 'placeholder';

// ==========================================
// UTILITÁRIOS
// ==========================================
const isValidUrl = (url) => {
  if (!url) return true;
  try { new URL(url); return true; } catch (e) { return false; }
};

const getEmbedUrl = (url) => {
  if (!url) return '';
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  return url;
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

// ==========================================
// INTEGRAÇÃO COM BACKEND (API Gemini)
// ==========================================
const GEMINI_SESSION_LIMIT = 5;
const GEMINI_SESSION_STORAGE_KEY = 'gemini_calls_count';

const getSessionGeminiCalls = () => {
  try {
    if (typeof window === 'undefined') return 0;
    const raw = window.sessionStorage.getItem(GEMINI_SESSION_STORAGE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
};

const incrementSessionGeminiCalls = () => {
  try {
    if (typeof window === 'undefined') return;
    const nextCount = getSessionGeminiCalls() + 1;
    window.sessionStorage.setItem(GEMINI_SESSION_STORAGE_KEY, String(nextCount));
  } catch {
    // Ignore sessionStorage failures to avoid breaking UI flow.
  }
};

const callBackendAPI = async (prompt, schema = null) => {
  if (getSessionGeminiCalls() >= GEMINI_SESSION_LIMIT) {
    throw new Error('Limite de chamadas de IA por sessão atingido.');
  }

  incrementSessionGeminiCalls();
  const url = '/api/gemini';
  const payload = { prompt, schema };
  const delays = [1000, 2000, 4000, 8000, 16000];
  
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      return data.text;
    } catch (error) {
      if (i === 4) throw error;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

const fetchGeminiContent = async (prompt, schema = null) => {
  try { return await callBackendAPI(prompt, schema); } 
  catch (error) {
    // Never log raw backend error objects; they may contain sensitive details.
    throw new Error(error?.message || 'Erro na comunicação com o backend.');
  }
};

// ==========================================
// INTERNACIONALIZAÇÃO (i18n)
// ==========================================
const i18n = {
  'pt-BR': { 
    home: 'Início', feed: 'Feed', comm: 'Comunidade', profile: 'Perfil', locked: 'Conteúdo Bloqueado', 
    unlock: 'Desbloquear', access: 'Acessar', complete: 'Marcar como Concluída', completed: 'Concluído', 
    install: 'Instalar Aplicativo', cancel: 'Cancelar', installBtn: 'Instalar App', news: 'Novidade', 
    progress: 'Progresso', content: 'Seus Conteúdos', empty: 'Nenhum conteúdo.', login: 'Entrar na Conta', 
    email: 'E-mail', pass: 'Senha', whatAreYouThinking: 'O que você está pensando?', publish: 'Publicar',
    supportTitle: 'Central de Suporte', 
    supportDesc: 'Precisa de ajuda? Envie um e-mail para nossa equipe de suporte através do endereço abaixo:',
    copyBtn: 'Copiar',
    copyToast: 'E-mail copiado para a área de transferência!',
    notifyTitle: 'Deseja Enviar Notificações',
    notifyDesc: 'As notificações podem incluir alertas, sons e avisos nos ícones.',
    notifyAllow: 'Permitir',
    notifyDeny: 'Não Permitir',
    installAppHeader: 'Instalar aplicativo',
    accessAccount: 'Acesse sua conta',
    emailPlaceholder: 'Insira aqui seu e-mail da compra',
    enterBtn: 'ENTRAR'
  },
  'en-US': { 
    home: 'Home', feed: 'Feed', comm: 'Community', profile: 'Profile', locked: 'Locked Content', 
    unlock: 'Unlock', access: 'Access', complete: 'Mark as Completed', completed: 'Completed', 
    install: 'Install App', cancel: 'Cancel', installBtn: 'Install App', news: 'News', 
    progress: 'Progress', content: 'Your Content', empty: 'No content.', login: 'Login', 
    email: 'Email', pass: 'Password', whatAreYouThinking: 'What are you thinking?', publish: 'Publish',
    supportTitle: 'Support Center',
    supportDesc: 'Need help? Send an email to our support team at the address below:',
    copyBtn: 'Copy',
    copyToast: 'Email copied to clipboard!',
    notifyTitle: 'Would Like to Send You Notifications',
    notifyDesc: 'Notifications may include alerts, sounds, and icon badges.',
    notifyAllow: 'Allow',
    notifyDeny: 'Don\'t Allow',
    installAppHeader: 'Install application',
    accessAccount: 'Access your account',
    emailPlaceholder: 'Enter your purchase email here',
    enterBtn: 'ENTER'
  },
  'es-ES': { 
    home: 'Inicio', feed: 'Feed', comm: 'Comunidad', profile: 'Perfil', locked: 'Contenido Bloqueado', 
    unlock: 'Desbloquear', access: 'Acceder', complete: 'Marcar como Completada', completed: 'Completado', 
    install: 'Instalar Aplicación', cancel: 'Cancelar', installBtn: 'Instalar App', news: 'Novedad', 
    progress: 'Progreso', content: 'Tus Contenidos', empty: 'Sin contenido.', login: 'Ingresar', 
    email: 'Correo', pass: 'Contraseña', whatAreYouThinking: '¿Qué estás pensando?', publish: 'Publicar',
    supportTitle: 'Centro de Soporte',
    supportDesc: '¿Necesita ayuda? Envíe un correo electrónico a nuestro equipo de soporte a la dirección de abajo:',
    copyBtn: 'Copiar',
    copyToast: '¡Correo electrónico copiado al portapapeles!',
    notifyTitle: 'Quiere enviarte notificaciones',
    notifyDesc: 'Las notificaciones pueden incluir alertas, sonidos y globos en los íconos.',
    notifyAllow: 'Permitir',
    notifyDeny: 'No Permitir',
    installAppHeader: 'Instalar aplicación',
    accessAccount: 'Accede a tu cuenta',
    emailPlaceholder: 'Ingrese aquí su correo electrónico de compra',
    enterBtn: 'ENTRAR'
  },
  'fr-FR': { 
    home: 'Accueil', feed: 'Flux', comm: 'Communauté', profile: 'Profil', locked: 'Contenu Verrouillé', 
    unlock: 'Déverrouiller', access: 'Accéder', complete: 'Marquer comme Terminé', completed: 'Terminé', 
    install: 'Installer l\'App', cancel: 'Annuler', installBtn: 'Installer l\'App', news: 'Nouveauté', 
    progress: 'Progrès', content: 'Vos Contenus', empty: 'Aucun contenu.', login: 'Se Connecter', 
    email: 'E-mail', pass: 'Mot de passe', whatAreYouThinking: 'À quoi pensez-vous ?', publish: 'Publier',
    supportTitle: 'Centre d\'Assistance',
    supportDesc: 'Besoin d\'aide ? Envoyez un e-mail à notre équipe d\'assistance à l\'adresse ci-dessous :',
    copyBtn: 'Copier',
    copyToast: 'E-mail copié dans le presse-papiers !',
    notifyTitle: 'Souhaite vous envoyer des notifications',
    notifyDesc: 'Les notifications peuvent inclure des alertes, des sons et des pastilles sur les icônes.',
    notifyAllow: 'Autoriser',
    notifyDeny: 'Refuser',
    installAppHeader: 'Installer l\'application',
    accessAccount: 'Accédez à votre compte',
    emailPlaceholder: 'Entrez ici votre e-mail d\'achat',
    enterBtn: 'ENTRER'
  },
  'it-IT': { 
    home: 'Home', feed: 'Feed', comm: 'Comunità', profile: 'Profilo', locked: 'Contenuto Bloccato', 
    unlock: 'Sblocca', access: 'Accedi', complete: 'Segna come Completato', completed: 'Completato', 
    install: 'Installa App', cancel: 'Annulla', installBtn: 'Installa App', news: 'Novità', 
    progress: 'Progresso', content: 'I Tuoi Contenuti', empty: 'Nessun contenuto.', login: 'Accedi', 
    email: 'E-mail', pass: 'Password', whatAreYouThinking: 'A cosa stai pensando?', publish: 'Pubblica',
    supportTitle: 'Centro di Supporto',
    supportDesc: 'Hai bisogno di aiuto? Invia un\'e-mail al nostro team di supporto all\'indirizzo sottostante:',
    copyBtn: 'Copia',
    copyToast: 'E-mail copiata negli appunti!',
    notifyTitle: 'Desidera inviarti notifiche',
    notifyDesc: 'Le notifiche possono includere avvisi, suoni e badge sulle icone.',
    notifyAllow: 'Consenti',
    notifyDeny: 'Non consentire',
    installAppHeader: 'Installa applicazione',
    accessAccount: 'Accedi al tuo account',
    emailPlaceholder: 'Inserisci qui la tua email di acquisto',
    enterBtn: 'ENTRA'
  }
};

// ==========================================
// DADOS PADRÃO E TEMPLATES
// ==========================================
const defaultProjects = [{
  id: 1, nome: 'Fórmula do Engajamento', pwaShortName: 'Fórmula', pwaDescription: 'Aprenda a engajar seu público e escalar vendas.',
  dominio: 'app.meusite.com', corPrimaria: '#111827', corTexto: '#ffffff', logoUrl: '', idioma: 'pt-BR', 
  whatsappNumber: '5511999999999', supportEmail: 'suporte@meusite.com', supportIconUrl: '',
  pwaBgColor: '#ffffff', pwaDisplay: 'standalone', pwaNoIndex: true,
  banners: [{ id: 1, imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=600&auto=format&fit=crop', link: '' }],
  modulos: [
    { id: 1, titulo: 'Desafio Detox 7 Dias', type: 'PDF / Web', isLocked: false, iframeUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ', coverImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=400' },
    { id: 2, titulo: 'Protocolo Extremo', type: 'Upsell', isLocked: true, checkoutUrl: 'https://pay.kiwify.com.br/teste', coverImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=400' }
  ]
}];

const defaultUserData = { nome: 'Usuário VIP', email: 'aluno@mundify.com', avatarUrl: '', completedModules: [] };

const templatesDatabase = [
  { id: 101, categoria: 'Emagrecimento', nome: 'Seca Barriga Pro', corPrimaria: '#2563eb', corTexto: '#ffffff', idioma: 'pt-BR', pwaShortName: 'Seca Pro', pwaBgColor: '#ffffff', pwaDisplay: 'standalone', pwaNoIndex: true, dominio: 'emagrecimento.app.com', whatsappNumber: '', supportEmail: '', supportIconUrl: '', banners: [], modulos: [] },
  { id: 102, categoria: 'Relacionamento', nome: 'Atração Magnética', corPrimaria: '#e11d48', corTexto: '#ffffff', idioma: 'pt-BR', pwaShortName: 'Atração', pwaBgColor: '#ffffff', pwaDisplay: 'standalone', pwaNoIndex: true, dominio: 'amor.app.com', banners: [], modulos: [] }
];

// ==========================================
// REDUCERS
// ==========================================
const projectsReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PROJECTS': return action.payload;
    case 'ADD_PROJECT': return [...state, action.payload];
    case 'DELETE_PROJECT': return state.filter(p => p.id !== action.payload.id);
    case 'UPDATE_PROJECT': return state.map(p => p.id === action.payload.projectId ? { ...p, ...action.payload.updates } : p);
    case 'ADD_MODULE': return state.map(p => p.id === action.payload.projectId ? { ...p, modulos: [...p.modulos, action.payload.modulo] } : p);
    case 'UPDATE_MODULE': return state.map(p => p.id === action.payload.projectId ? { ...p, modulos: p.modulos.map(m => m.id === action.payload.moduleId ? { ...m, ...action.payload.updates } : m) } : p);
    case 'DELETE_MODULE': return state.map(p => p.id === action.payload.projectId ? { ...p, modulos: p.modulos.filter(m => m.id !== action.payload.moduleId) } : p);
    default: return state;
  }
};

// ==========================================
// CONTEXTOS
// ==========================================
const UIContext = createContext();
export const useUIContext = () => useContext(UIContext);
export const UIProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState('dashboard');
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ isVisible: false, title: '', message: '', onConfirm: null });
  const showToast = (message, type = 'info') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 4000);
  };
  const showConfirm = (title, message, onConfirmCallback) => setConfirmModal({ isVisible: true, title, message, onConfirm: onConfirmCallback });
  const closeConfirm = () => setConfirmModal({ isVisible: false, title: '', message: '', onConfirm: null });
  const value = useMemo(() => ({ viewMode, setViewMode, toast, showToast, confirmModal, showConfirm, closeConfirm }), [viewMode, toast, confirmModal]);
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

const ProjectContext = createContext();
export const useProjectContext = () => useContext(ProjectContext);
export const ProjectProvider = ({ children }) => {
  const { showToast, showConfirm, closeConfirm, setViewMode } = useUIContext();
  const [projects, dispatchProjects] = useReducer(projectsReducer, defaultProjects);
  const [activeProjectId, setActiveProjectId] = useState(() => {
    if (typeof window !== 'undefined') { const saved = localStorage.getItem('appBuilder_activeProjectId'); return saved ? Number(saved) : 1; } return 1;
  });
  useEffect(() => { if (activeProjectId !== null) localStorage.setItem('appBuilder_activeProjectId', activeProjectId.toString()); }, [activeProjectId]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingApp, setIsGeneratingApp] = useState(false);
  const [userData, setUserData] = useState(defaultUserData);
  const [isPwaLoggedIn, setIsPwaLoggedIn] = useState(true);
  const activeProject = projects.find(p => p.id === activeProjectId) || projects[0] || null;
  const appData = activeProject ? { ...activeProject } : {};
  const modulos = activeProject?.modulos || [];

  const handleGenerateAppWithAI = async (idiomaSelecionado = 'pt-BR', isFaceless = false) => {
    if (!aiPrompt.trim()) return showToast("Descreva sua ideia primeiro.", "warning");
    setIsGeneratingApp(true);
    try {
      const schema = { type: "OBJECT", properties: { nome: { type: "STRING" }, dominio: { type: "STRING" }, corPrimaria: { type: "STRING" }, modulos: { type: "ARRAY", items: { type: "OBJECT", properties: { titulo: { type: "STRING" }, isLocked: { type: "BOOLEAN" } } } } } };
      let prompt = `Especialista em SaaS. Crie um app PWA para: "${aiPrompt}". Idioma: ${idiomaSelecionado}.`;
      if (isFaceless) prompt += " Produto Faceless (PLR).";
      const res = await fetchGeminiContent(prompt, schema);
      const data = JSON.parse(res);
      const newProject = {
        id: Date.now(), nome: data.nome || "Novo App", dominio: data.dominio || "app.novo.com",
        corPrimaria: data.corPrimaria || "#3b82f6", corTexto: '#ffffff', logoUrl: '', idioma: idiomaSelecionado, 
        banners: [], whatsappNumber: '', supportEmail: '', supportIconUrl: '', pwaBgColor: '#ffffff', pwaDisplay: 'standalone', pwaNoIndex: true,
        modulos: (data.modulos || []).map((m, i) => ({ id: i + 1, titulo: m.titulo, isLocked: m.isLocked, iframeUrl: '', coverImage: '' }))
      };
      dispatchProjects({ type: 'ADD_PROJECT', payload: newProject });
      setActiveProjectId(newProject.id); setViewMode('admin'); setAiPrompt("");
      showToast("App gerado!", "success");
    } catch (e) { showToast("Erro na geração.", "error"); } 
    finally { setIsGeneratingApp(false); }
  };

  const createNewProject = () => {
    const p = { id: Date.now(), nome: 'Novo Aplicativo', dominio: 'app.meu.com', corPrimaria: '#3b82f6', corTexto: '#ffffff', logoUrl: '', idioma: 'pt-BR', whatsappNumber: '', supportEmail: '', supportIconUrl: '', pwaBgColor: '#ffffff', pwaDisplay: 'standalone', pwaNoIndex: true, banners: [], modulos: [] };
    dispatchProjects({ type: 'ADD_PROJECT', payload: p }); setActiveProjectId(p.id); setViewMode('admin');
  };

  const cloneTemplate = (t) => {
    const p = { ...t, id: Date.now() };
    dispatchProjects({ type: 'ADD_PROJECT', payload: p }); setActiveProjectId(p.id); setViewMode('admin');
  };

  const deleteProject = (id, e) => {
    e.stopPropagation();
    showConfirm("Excluir Projeto", "Tem certeza que deseja excluir este projeto?", () => {
      dispatchProjects({ type: 'DELETE_PROJECT', payload: { id } });
      const rem = projects.filter(p => p.id !== id);
      if (activeProjectId === id) setActiveProjectId(rem[0]?.id ?? null);
      closeConfirm();
    });
  };

  const handleAppChange = (e) => {
    if (!activeProject) return;
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    dispatchProjects({ type: 'UPDATE_PROJECT', payload: { projectId: activeProjectId, updates: { [e.target.name]: val } } });
  };

  const handleImageUpload = async (e, field = 'logoUrl', isModule = false, moduleId = null) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64Url = await fileToBase64(file);
        if (isModule && moduleId) updateModulo(moduleId, field, base64Url);
        else dispatchProjects({ type: 'UPDATE_PROJECT', payload: { projectId: activeProjectId, updates: { [field]: base64Url } } });
      } catch (err) { showToast("Erro no upload.", "error"); }
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64Url = await fileToBase64(file);
      const currentBanners = activeProject.banners || [];
      if (currentBanners.length >= 3) {
        showToast("Você já atingiu o limite de 3 banners.", "warning");
        return;
      }
      const newBanner = { id: Date.now(), imageUrl: base64Url, link: '' };
      dispatchProjects({ type: 'UPDATE_PROJECT', payload: { projectId: activeProjectId, updates: { banners: [...currentBanners, newBanner] } } });
    } catch (err) {
      showToast("Erro ao processar imagem do banner.", "error");
    }
  };

  const removeBanner = (bannerId) => {
    const currentBanners = activeProject.banners || [];
    dispatchProjects({ type: 'UPDATE_PROJECT', payload: { projectId: activeProjectId, updates: { banners: currentBanners.filter(b => b.id !== bannerId) } } });
  };

  const updateBannerLink = (bannerId, link) => {
    const currentBanners = activeProject.banners || [];
    dispatchProjects({ type: 'UPDATE_PROJECT', payload: { projectId: activeProjectId, updates: { banners: currentBanners.map(b => b.id === bannerId ? { ...b, link } : b) } } });
  };

  const addModulo = () => {
    const id = modulos.length > 0 ? Math.max(...modulos.map(m => m.id)) + 1 : 1;
    dispatchProjects({ type: 'ADD_MODULE', payload: { projectId: activeProjectId, modulo: { id, titulo: 'Novo Módulo', isLocked: false, iframeUrl: '', coverImage: '' } } });
  };

  const updateModulo = (id, field, value) => {
    const updates = { [field]: value };
    if (field === 'iframeUrl' || field === 'checkoutUrl') updates[`${field}Invalid`] = !isValidUrl(value);
    dispatchProjects({ type: 'UPDATE_MODULE', payload: { projectId: activeProjectId, moduleId: id, updates } });
  };

  const deleteModulo = (id) => {
    showConfirm("Excluir Módulo", "Deseja excluir este módulo?", () => {
      dispatchProjects({ type: 'DELETE_MODULE', payload: { projectId: activeProjectId, moduleId: id } });
      closeConfirm();
    });
  };

  const toggleModuleCompletion = (moduleId) => {
    setUserData(prev => {
      const completed = prev.completedModules || [];
      const isCompleted = completed.includes(moduleId);
      return { ...prev, completedModules: isCompleted ? completed.filter(id => id !== moduleId) : [...completed, moduleId] };
    });
  };

  const value = useMemo(() => ({
    projects, dispatchProjects, appData, modulos, activeProjectId, aiPrompt, setAiPrompt, isGeneratingApp,
    userData, setUserData, isPwaLoggedIn, setIsPwaLoggedIn, defaultUserData,
    handleGenerateAppWithAI, createNewProject, cloneTemplate, openProject: (id) => { setActiveProjectId(id); setViewMode('admin'); }, deleteProject, handleAppChange, 
    handleImageUpload, handleBannerUpload, removeBanner, updateBannerLink,
    addModulo, updateModulo, deleteModulo, toggleModuleCompletion
  }), [projects, appData, modulos, activeProjectId, aiPrompt, isGeneratingApp, userData, isPwaLoggedIn]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

const NotificationContext = createContext();
export const useNotificationContext = () => useContext(NotificationContext);
export const NotificationProvider = ({ children }) => {
  const { showToast, showConfirm, closeConfirm } = useUIContext();
  const { appData, modulos } = useProjectContext();
  const [feedPosts, setFeedPosts] = useState([{ id: 1, title: 'Bem-vindo!', time: 'Agora', content: 'Aproveite seu novo aplicativo.', type: 'system' }]);
  const [communityPosts, setCommunityPosts] = useState([{ id: 1, user: 'Admin', avatar: '', time: 'Hoje', content: 'Olá comunidade!', likes: 5, comments: 2, likedByMe: false }]);
  const [pushData, setPushData] = useState({ title: '', message: '', imageUrl: '', scheduledDate: '' });
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingPush, setIsGeneratingPush] = useState(false);

  const handleGeneratePushWithAI = async () => {
    setIsGeneratingPush(true);
    try {
      const schema = { type: "OBJECT", properties: { title: { type: "STRING" }, message: { type: "STRING" } } };
      const modulosAbertos = modulos.filter(m => !m.isLocked).map(m => m.titulo).join(", ");
      const modulosFechados = modulos.filter(m => m.isLocked).map(m => m.titulo).join(", ");
      const systemPrompt = `Aja como um Copywriter especialista em neuromarketing. Escreva uma notificação Push para os usuários do app "${appData.nome}". Conteúdos gratuitos: [${modulosAbertos}]. Ofertas: [${modulosFechados}]. Idioma da resposta deve ser o código ${appData.idioma || 'pt-BR'}.`;
      
      const jsonResponse = await fetchGeminiContent(systemPrompt, schema);
      const result = JSON.parse(jsonResponse);
      setPushData({ ...pushData, title: result.title, message: result.message });
      showToast("Copywrite gerado com sucesso!", "success");
    } catch (error) { showToast("Erro ao gerar copy com a IA.", "error"); } 
    finally { setIsGeneratingPush(false); }
  };

  const handlePushChange = (e) => setPushData({ ...pushData, [e.target.name]: e.target.value });
  
  const handlePushImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setPushData({ ...pushData, imageUrl: base64 });
      } catch (err) { showToast("Erro ao anexar imagem.", "error"); }
    }
  };

  const handleSendPush = () => {
    if (!pushData.title || !pushData.message) return showToast('Preencha o título e a mensagem.', 'warning');
    setIsSending(true);
    setTimeout(() => {
      const isScheduled = pushData.scheduledDate && new Date(pushData.scheduledDate) > new Date();
      const newPost = { 
        id: Date.now(), 
        title: pushData.title, 
        time: isScheduled ? new Date(pushData.scheduledDate).toLocaleString() : 'Agora', 
        content: pushData.message, 
        imageUrl: pushData.imageUrl, 
        type: 'system',
        status: isScheduled ? 'scheduled' : 'published',
        scheduledDate: pushData.scheduledDate
      };
      setFeedPosts(prev => [newPost, ...prev]);
      showToast(isScheduled ? 'Push agendado com sucesso!' : 'Push disparado e adicionado ao Feed!', 'success');
      setPushData({ title: '', message: '', imageUrl: '', scheduledDate: '' });
      setIsSending(false);
    }, 1200);
  };

  const deleteFeedPost = (id) => {
    showConfirm("Excluir Post", "Tem certeza que deseja excluir?", () => {
      setFeedPosts(prev => prev.filter(post => post.id !== id));
      showToast("Removido.", "success");
      closeConfirm();
    });
  };

  const addCommunityPost = (content, imageUrl = '') => {
    const newPost = { id: Date.now(), user: 'Você', avatar: '', time: 'Agora', content, imageUrl, likes: 0, comments: 0, likedByMe: false };
    setCommunityPosts(prev => [newPost, ...prev]);
  };

  const toggleLike = (id) => {
    setCommunityPosts(prev => prev.map(post => {
      if(post.id === id) return { ...post, likedByMe: !post.likedByMe, likes: post.likedByMe ? post.likes - 1 : post.likes + 1 };
      return post;
    }));
  };

  const value = useMemo(() => ({ feedPosts, setFeedPosts, communityPosts, addCommunityPost, toggleLike, pushData, setPushData, isSending, isGeneratingPush, handleGeneratePushWithAI, handlePushChange, handlePushImageUpload, handleSendPush, deleteFeedPost }), [feedPosts, communityPosts, pushData, isSending, isGeneratingPush, appData, modulos]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

const DatabaseContext = createContext();
export const useDatabaseContext = () => useContext(DatabaseContext);
export const DatabaseProvider = ({ children }) => {
  const { projects, dispatchProjects, userData, setUserData } = useProjectContext();
  const { feedPosts, setFeedPosts } = useNotificationContext();
  const [user, setUser] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); 
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    if (!window.supabaseClient) return;
    const initAuth = async () => {
      if (supabaseUrl === 'https://placeholder.supabase.co') { setUser({ id: 'mock-user' }); return; }
      try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
          await window.supabaseClient.auth.signInAnonymously();
          const { data: newSession } = await window.supabaseClient.auth.getSession();
          setUser(newSession?.session?.user ?? null);
        } else setUser(session.user);
      } catch (error) { setUser({ id: 'fallback-user' }); }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!user || supabaseUrl === 'https://placeholder.supabase.co') { setIsDataLoaded(true); return; }
    const fetchData = async () => {
      try {
        const { data } = await window.supabaseClient.from('app_settings').select('*').eq('user_id', user.id).single();
        if (data) {
          isRemoteUpdate.current = true;
          if (data.projects) dispatchProjects({ type: 'SET_PROJECTS', payload: data.projects });
          if (data.feed_posts) setFeedPosts(data.feed_posts);
          if (data.user_data) setUserData(data.user_data);
        }
      } finally { setIsDataLoaded(true); }
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (!user || !isDataLoaded || supabaseUrl === 'https://placeholder.supabase.co') return;
    if (isRemoteUpdate.current) { isRemoteUpdate.current = false; return; }

    setSaveStatus('saving');
    const saveData = async () => {
      try {
        await window.supabaseClient.from('app_settings').upsert({ user_id: user.id, projects, feed_posts: feedPosts, user_data: userData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      } finally { setSaveStatus('saved'); }
    };
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [projects, feedPosts, userData, user, isDataLoaded]);

  if (!isDataLoaded) return (<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" /></div>);
  return <DatabaseContext.Provider value={{ saveStatus }}>{children}</DatabaseContext.Provider>;
};

export const AppProviders = ({ children }) => (
  <UIProvider><ProjectProvider><NotificationProvider><DatabaseProvider>{children}</DatabaseProvider></NotificationProvider></ProjectProvider></UIProvider>
);

// ==========================================
// COMPONENTES PRESENTATION
// ==========================================

function GlobalFeedback() {
  const { toast, confirmModal, closeConfirm } = useUIContext();
  return (
    <>
      <div className={`fixed top-6 right-6 z-[100] transition-all transform ${toast.isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className={`px-4 py-3 rounded-lg shadow-lg border bg-white flex items-center gap-3 ${toast.type === 'error' ? 'border-red-200 text-red-700' : 'border-green-200 text-green-700'}`}>
          {toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      </div>
      {confirmModal.isVisible && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 id="confirm-modal-title" className="text-lg font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={closeConfirm} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={confirmModal.onConfirm} className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PushNotificationEditor() {
  const { pushData, handlePushChange, handlePushImageUpload, handleSendPush, isSending, handleGeneratePushWithAI, isGeneratingPush, feedPosts, deleteFeedPost } = useNotificationContext();

  return (
    <section className="mb-12">
      <div className="flex items-center mb-6 border-b border-gray-100 pb-2"><h2 className="text-sm font-semibold flex items-center"><Bell className="w-4 h-4 mr-2" /> 6. Comunicação & Feed</h2></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
          <div className="flex justify-between mb-4"><h3 className="text-sm font-bold flex items-center"><Send className="w-4 h-4 mr-2 text-blue-600" /> Novo Push</h3>
            <button onClick={handleGeneratePushWithAI} disabled={isGeneratingPush} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-md flex items-center gap-1.5">
              {isGeneratingPush ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} IA
            </button>
          </div>
          <div className="space-y-4">
            <input type="text" name="title" value={pushData.title} onChange={handlePushChange} placeholder="Título" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
            <textarea name="message" value={pushData.message} onChange={handlePushChange} rows={3} placeholder="Mensagem" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm resize-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label htmlFor="push-image" className="block text-xs font-medium text-gray-500 mb-1">Imagem Anexa (Opcional)</label>
                 <input id="push-image" type="file" accept="image/*" onChange={handlePushImageUpload} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-gray-100" />
               </div>
               <div>
                 <label htmlFor="push-scheduled-date" className="block text-xs font-medium text-gray-500 mb-1">Programar Envio (Opcional)</label>
                 <input id="push-scheduled-date" type="datetime-local" name="scheduledDate" value={pushData.scheduledDate || ''} onChange={handlePushChange} className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-700" />
               </div>
            </div>
            {pushData.imageUrl && <div className="mt-2 w-full h-24 rounded-lg overflow-hidden border"><img src={pushData.imageUrl} className="w-full h-full object-cover" /></div>}
            <button onClick={handleSendPush} disabled={isSending} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm flex justify-center items-center gap-2">
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Disparar / Agendar</>}
            </button>
          </div>
        </div>
        <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm max-h-[500px] overflow-y-auto">
          <h3 className="text-sm font-bold mb-4 flex items-center"><Rss className="w-4 h-4 mr-2 text-orange-500" /> Histórico</h3>
          {feedPosts.map(post => {
            const isScheduled = post.status === 'scheduled' && new Date(post.scheduledDate) > new Date();
            return (
            <div key={post.id} className={`p-4 border rounded-xl mb-3 relative group transition-colors ${isScheduled ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
              <button aria-label="Excluir post do histórico" onClick={() => deleteFeedPost(post.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 bg-white p-1 rounded opacity-0 group-hover:opacity-100 shadow-sm"><Trash2 className="w-3 h-3" /></button>
              {post.imageUrl && <img src={post.imageUrl} className="w-full h-32 object-cover rounded-lg mb-3" />}
              <div className="flex items-center gap-2 pr-6">
                {isScheduled && <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                <p className="text-sm font-bold truncate">{post.title}</p>
              </div>
              <p className={`text-[10px] uppercase mt-1 mb-2 font-bold ${isScheduled ? 'text-amber-600' : 'text-gray-500'}`}>
                {isScheduled ? `Agendado: ${post.time}` : post.time}
              </p>
              <p className="text-xs text-gray-600 line-clamp-3">{post.content}</p>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
}

function ModuleEditor({ modulo }) {
  const { updateModulo, deleteModulo, handleImageUpload } = useProjectContext();
  const isIframeInvalid = modulo.iframeUrl && !isValidUrl(modulo.iframeUrl);
  const isCheckoutInvalid = modulo.checkoutUrl && !isValidUrl(modulo.checkoutUrl);

  const handleAddSub = () => {
    const currentSubs = modulo.subModulos || [];
    const newId = currentSubs.length > 0 ? Math.max(...currentSubs.map(s => s.id)) + 1 : 1;
    updateModulo(modulo.id, 'subModulos', [...currentSubs, { id: newId, titulo: 'Nova Aula', iframeUrl: '', coverImage: '' }]);
  };
  
  const handleUpdateSub = (subId, field, value) => {
    const currentSubs = modulo.subModulos || [];
    updateModulo(modulo.id, 'subModulos', currentSubs.map(s => s.id === subId ? { ...s, [field]: value } : s));
  };
  
  const handleDeleteSub = (subId) => {
    const currentSubs = modulo.subModulos || [];
    updateModulo(modulo.id, 'subModulos', currentSubs.filter(s => s.id !== subId));
  };

  const handleSubImageUpload = async (e, subId) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const base64Url = await fileToBase64(file);
        handleUpdateSub(subId, 'coverImage', base64Url);
      } catch (err) {}
    }
  };

  return (
    <div className={`border rounded-xl p-6 bg-gray-50/50 shadow-sm relative group transition-all duration-300 ${isIframeInvalid || isCheckoutInvalid ? 'border-red-300 shadow-red-500/10' : 'border-gray-200 hover:border-gray-300'}`}>
      <button aria-label="Excluir módulo" onClick={() => deleteModulo(modulo.id)} className="absolute -top-3 -right-3 bg-white border border-gray-200 text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-50" title="Excluir"><Trash2 className="w-4 h-4" /></button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <label htmlFor={`module-title-${modulo.id}`} className="block text-xs font-medium text-gray-500 mb-1">Título do Módulo</label>
          <input id={`module-title-${modulo.id}`} type="text" value={modulo.titulo} onChange={(e) => updateModulo(modulo.id, 'titulo', e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900/20 focus:border-gray-900" />
        </div>
        <div>
          <label htmlFor={`module-strategy-${modulo.id}`} className="block text-xs font-medium text-gray-500 mb-1">Estratégia</label>
          <select 
            id={`module-strategy-${modulo.id}`}
            value={modulo.isDrip ? 'drip' : (modulo.isLocked ? 'upsell' : 'open')}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'open') { updateModulo(modulo.id, 'isLocked', false); updateModulo(modulo.id, 'isDrip', false); }
              else if (val === 'upsell') { updateModulo(modulo.id, 'isLocked', true); updateModulo(modulo.id, 'isDrip', false); }
              else if (val === 'drip') { updateModulo(modulo.id, 'isLocked', true); updateModulo(modulo.id, 'isDrip', true); }
            }}
            className={`w-full border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-gray-900/20 ${modulo.isDrip ? 'bg-blue-50 border-blue-200 text-blue-700' : modulo.isLocked ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}
          >
            <option value="open">Aberto</option>
            <option value="upsell">Bloqueado (Upsell)</option>
            <option value="drip">Liberação Programada (Drip)</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center pt-1 pb-2 border-b border-gray-100">
          <input type="checkbox" id={`folder-${modulo.id}`} checked={!!modulo.isFolder} onChange={(e) => updateModulo(modulo.id, 'isFolder', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 mr-2 cursor-pointer" />
          <label htmlFor={`folder-${modulo.id}`} className="text-sm font-bold text-gray-700 cursor-pointer flex items-center">
            <FolderPlus className="w-4 h-4 mr-1.5 text-blue-500"/> Transformar em Pasta (Agrupar Sub-Aulas)
          </label>
        </div>

        <div>
          <label htmlFor={`module-cover-${modulo.id}`} className="block text-xs font-medium text-gray-500 mb-1">Capa do Módulo</label>
          <div className="flex items-center shadow-sm">
            <span className="p-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 text-gray-400"><ImageIcon className="w-4 h-4" /></span>
            <input id={`module-cover-${modulo.id}`} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage', true, modulo.id)} className="w-full border border-gray-300 rounded-r-lg px-3 py-1.5 text-sm bg-white file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700" />
          </div>
          {modulo.coverImage && (
            <div className="mt-3 w-32 h-20 rounded-lg overflow-hidden border border-gray-200 relative group"><img src={modulo.coverImage} className="w-full h-full object-cover" />
              <button aria-label="Remover capa do módulo" onClick={() => updateModulo(modulo.id, 'coverImage', '')} className="absolute top-1 right-1 bg-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 shadow"><Trash2 className="w-3 h-3 text-red-500" /></button>
            </div>
          )}
        </div>
        {!modulo.isFolder && (
          <div>
            <label htmlFor={`module-content-${modulo.id}`} className={`block text-xs font-medium mb-1 ${isIframeInvalid ? 'text-red-500' : 'text-green-600'}`}>Conteúdo (Link de Vídeo, Site ou PDF)</label>
            <input id={`module-content-${modulo.id}`} type="text" value={modulo.iframeUrl || ''} onChange={(e) => updateModulo(modulo.id, 'iframeUrl', e.target.value)} className={`w-full border rounded-lg px-3 py-2 text-sm bg-white ${isIframeInvalid ? 'border-red-300 focus:border-red-500 text-red-600' : 'border-gray-300 focus:border-gray-900'}`} placeholder="Ex: https://youtube.com/watch?v=... ou https://seu-site.com/aula" />
          </div>
        )}
        {modulo.isFolder && (
          <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-gray-800 flex items-center">Conteúdos da Pasta</h4>
              <button onClick={handleAddSub} className="text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-medium flex items-center transition-colors shadow-sm">
                <Plus className="w-3 h-3 mr-1" /> Adicionar Aula
              </button>
            </div>
            <div className="space-y-3">
              {(modulo.subModulos || []).map(sub => (
                <div key={sub.id} className="bg-white border border-gray-200 rounded-lg p-3 relative group shadow-sm">
                  <button aria-label="Excluir subaula" onClick={() => handleDeleteSub(sub.id)} className="absolute -top-2 -right-2 bg-white border border-gray-200 text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-opacity"><X className="w-3 h-3" /></button>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label htmlFor={`sub-title-${modulo.id}-${sub.id}`} className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Título da Aula</label>
                        <input id={`sub-title-${modulo.id}-${sub.id}`} type="text" value={sub.titulo} onChange={(e) => handleUpdateSub(sub.id, 'titulo', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:outline-none" />
                      </div>
                      <div className="w-1/3">
                        <label className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Capa</label>
                        <div className="flex items-center gap-2">
                           <label htmlFor={`sub-cover-${modulo.id}-${sub.id}`} className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded border border-gray-300 flex items-center justify-center transition-colors">
                              <ImageIcon className="w-4 h-4 text-gray-500"/>
                              <input id={`sub-cover-${modulo.id}-${sub.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleSubImageUpload(e, sub.id)} />
                           </label>
                           {sub.coverImage && <img src={sub.coverImage} className="w-10 h-7 object-cover rounded border" />}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor={`sub-content-${modulo.id}-${sub.id}`} className="block text-[10px] font-medium text-gray-500 mb-1 uppercase">Link de Conteúdo</label>
                      <input id={`sub-content-${modulo.id}-${sub.id}`} type="text" value={sub.iframeUrl || ''} onChange={(e) => handleUpdateSub(sub.id, 'iframeUrl', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:outline-none" placeholder="https://..." />
                    </div>
                  </div>
                </div>
              ))}
              {(!modulo.subModulos || modulo.subModulos.length === 0) && (
                <div className="text-center py-4 bg-white rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs font-medium">
                  Pasta vazia. Clique em "Adicionar Aula".
                </div>
              )}
            </div>
          </div>
        )}
        {modulo.isLocked && !modulo.isDrip && (
          <div>
            <label htmlFor={`module-checkout-${modulo.id}`} className="block text-xs font-medium mb-1 text-amber-600">URL de Checkout</label>
            <input id={`module-checkout-${modulo.id}`} type="text" value={modulo.checkoutUrl || ''} onChange={(e) => updateModulo(modulo.id, 'checkoutUrl', e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white border-amber-300 focus:border-amber-500" placeholder="https://pay..." />
          </div>
        )}
        {modulo.isDrip && (
          <div>
            <label htmlFor={`module-drip-${modulo.id}`} className="block text-xs font-medium mb-1 text-blue-600">Liberar quantos dias após a compra?</label>
            <input id={`module-drip-${modulo.id}`} type="number" min="0" value={modulo.dripDays || 0} onChange={(e) => updateModulo(modulo.id, 'dripDays', parseInt(e.target.value) || 0)} className="w-full border rounded-lg px-3 py-2 text-sm bg-white border-blue-300 focus:border-blue-500" placeholder="Ex: 8" />
          </div>
        )}
      </div>
    </div>
  );
}

function ClientPWA({ isMockup = false }) {
  const { showToast } = useUIContext();
  const { appData, modulos, userData, setUserData, isPwaLoggedIn, setIsPwaLoggedIn, toggleModuleCompletion, defaultUserData } = useProjectContext();
  const { feedPosts, communityPosts, addCommunityPost, toggleLike } = useNotificationContext();
  
  const [activeIframe, setActiveIframe] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempUserData, setTempUserData] = useState(userData);
  const [checkoutModal, setCheckoutModal] = useState({ isVisible: false, url: '' });
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [showSupportEmailModal, setShowSupportEmailModal] = useState(false);
  const [newCommPost, setNewCommPost] = useState("");
  const [newCommImage, setNewCommImage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Novos estados para a tela de login
  const [loginEmail, setLoginEmail] = useState(defaultUserData.email || "");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [shake, setShake] = useState(false);

  const t = i18n[appData.idioma] || i18n['pt-BR'];
  const progressPercent = modulos.length > 0 ? Math.round(((userData.completedModules?.length || 0) / modulos.length) * 100) : 0;

  useEffect(() => { setTempUserData(userData); }, [userData]);
  
  // Lógica Nativa PWA - Captura prompt de instalação
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Gatilhos de Popups Nativos (Notificações e Instalação) - Apenas após o login!
  useEffect(() => { 
    if (isPwaLoggedIn) {
      const timerNotif = setTimeout(() => setShowNotificationPrompt(true), 2000);
      const timerInstall = setTimeout(() => setShowInstallPrompt(true), 8000); 
      return () => { clearTimeout(timerNotif); clearTimeout(timerInstall); };
    }
  }, [isPwaLoggedIn]);

  // SEO: Injeção de Meta Robots para NoIndex
  useEffect(() => {
    if (!isMockup) {
      let meta = document.querySelector('meta[name="robots"]');
      if (appData.pwaNoIndex) {
        if (!meta) {
          meta = document.createElement('meta');
          meta.name = 'robots';
          meta.content = 'noindex, nofollow';
          document.head.appendChild(meta);
        }
      } else if (meta) {
        document.head.removeChild(meta);
      }
    }
    return () => {
      if (!isMockup) {
        const meta = document.querySelector('meta[name="robots"]');
        if (meta) document.head.removeChild(meta);
      }
    };
  }, [appData.pwaNoIndex, isMockup]);

  // Passagem automática dos banners
  useEffect(() => {
    if (!appData.banners || appData.banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % appData.banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [appData.banners]);

  // Geração Dinâmica do Manifest e Service Worker
  useEffect(() => {
    const manifest = {
      name: appData.nome || 'SaaS App',
      short_name: appData.pwaShortName || appData.nome || 'App',
      description: appData.pwaDescription || '',
      start_url: '/',
      display: appData.pwaDisplay || 'standalone',
      background_color: appData.pwaBgColor || '#ffffff',
      theme_color: appData.corPrimaria || '#000000',
      icons: [{ src: appData.logoUrl || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/png' }]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    let link = document.querySelector('link[rel="manifest"]');
    if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link); }
    link.href = manifestUrl;

    const swCode = `self.addEventListener('install', e => self.skipWaiting()); self.addEventListener('fetch', e => {});`;
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);
    if ('serviceWorker' in navigator && !isMockup) navigator.serviceWorker.register(swUrl).catch(err => {});

    return () => { URL.revokeObjectURL(manifestUrl); URL.revokeObjectURL(swUrl); };
  }, [appData, isMockup]);

  const handlePwaLogout = () => { setUserData(defaultUserData); setActiveTab('home'); setActiveFolder(null); setIsPwaLoggedIn(false); };
  
  const handleCommunityUpload = async (e) => {
    const file = e.target.files[0];
    if(file) { const base64 = await fileToBase64(file); setNewCommImage(base64); }
  };
  
  const submitCommunityPost = () => {
    if(newCommPost.trim() || newCommImage) {
      addCommunityPost(newCommPost, newCommImage);
      setNewCommPost(""); setNewCommImage("");
    }
  };

  const handleSimulatedLogin = () => {
    setIsLoggingIn(true);
    setLoginError("");

    setTimeout(() => {
      // Validação de E-mail existente
      if (loginEmail.trim().toLowerCase() !== defaultUserData.email.toLowerCase()) {
        setLoginError("E-mail não encontrado");
        setShake(true);
        setIsLoggingIn(false);
        setTimeout(() => setShake(false), 500);
        return;
      }
      
      // Validação simples de senha
      if (!loginPassword.trim()) {
        setLoginError("Senha incorreta ou vazia");
        setShake(true);
        setIsLoggingIn(false);
        setTimeout(() => setShake(false), 500);
        return;
      }

      setUserData(defaultUserData);
      setIsPwaLoggedIn(true);
      setIsLoggingIn(false);
    }, 1000);
  };

  const handleInstallClick = async () => {
    setShowInstallPrompt(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('App instalado com sucesso!', 'success');
      }
      setDeferredPrompt(null);
    } else {
      if (!isMockup) {
        showToast('Para instalar, use a opção "Adicionar à Tela Inicial" no menu do navegador (Safari/Chrome).', 'info');
      } else {
        showToast('Instalação simulada com sucesso!', 'success');
      }
    }
  };

  const handleNotificationAllow = () => {
    setShowNotificationPrompt(false);
    if (!isMockup && 'Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          showToast('Notificações ativadas!', 'success');
        } else {
          showToast('Permissão negada.', 'warning');
        }
      });
    } else {
       showToast('Notificações ativadas (Simulação)!', 'success');
    }
  };

  if (!isPwaLoggedIn) {
    return (
      <div className={`flex flex-col bg-slate-900 ${isMockup ? 'flex-1 h-full w-full absolute inset-0 z-50' : 'min-h-screen'}`}>
        
        {/* Banner Superior de Instalação */}
        <div className="pt-10 pb-2 px-6 flex justify-center">
           <button onClick={() => setShowInstallPrompt(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-colors backdrop-blur-md">
              <Download className="w-4 h-4" />
              {t.installAppHeader}
           </button>
        </div>

        {/* Modal de Acesso (Card Branco) */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-20">
          <div className={`bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300 ${shake ? 'animate-shake' : ''}`}>
            <div className="w-24 h-24 mb-5 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 flex-shrink-0">
              {appData.logoUrl ? <img src={appData.logoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${appData.corPrimaria}10`, color: appData.corPrimaria }}><Smartphone className="w-10 h-10" /></div>}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center tracking-tight line-clamp-2">{appData.nome}</h2>
            <p className="text-[15px] font-medium text-gray-500 mb-8 text-center">{t.accessAccount}</p>
            
            <div className="w-full space-y-4">
              <input 
                type="email" 
                placeholder={t.emailPlaceholder} 
                className={`w-full border rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 focus:bg-white text-gray-900 ${loginError.includes('E-mail') ? 'border-red-400' : 'border-gray-200'}`} 
                value={loginEmail} 
                onChange={(e) => { setLoginEmail(e.target.value); setLoginError(""); }}
              />
              
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder={t.pass} 
                  className={`w-full border rounded-xl px-5 py-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-50 focus:bg-white text-gray-900 ${loginError.includes('Senha') ? 'border-red-400' : 'border-gray-200'}`}
                  value={loginPassword}
                  onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                />
                <button 
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {loginError && <p className="text-red-500 text-xs font-bold text-center mt-1">{loginError}</p>}

              <button 
                onClick={handleSimulatedLogin} 
                disabled={isLoggingIn} 
                className="w-full py-4 font-bold rounded-xl shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-80 text-white bg-blue-600 hover:bg-blue-700"
              >
                {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : t.enterBtn}
              </button>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
               <Lock className="w-3 h-3" /> Ambiente Seguro
            </div>
          </div>
        </div>

        {/* Modal de Instalação sobreposto à tela de Login */}
        {showInstallPrompt && (
          <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
            <div role="dialog" aria-modal="true" aria-labelledby="install-login-title" className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 relative">
              <button aria-label="Fechar instalação" onClick={() => setShowInstallPrompt(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                  {appData.logoUrl ? <img src={appData.logoUrl} className="w-full h-full object-cover" /> : <Smartphone className="w-10 h-10 text-gray-400"/>}
                </div>
                <h3 id="install-login-title" className="text-xl font-bold text-gray-900 mb-1">{appData.pwaShortName || appData.nome}</h3>
                <p className="text-sm text-gray-500 mb-6">{appData.dominio}</p>
                
                <button 
                  onClick={handleInstallClick} 
                  className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30"
                >
                   <Download className="w-5 h-5" />
                   {t.installBtn}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleModuleClick = (mod) => {
    if (mod.isDrip) showToast(`Estará disponível em ${mod.dripDays || 0} dias.`, 'info');
    else if (mod.isLocked) setCheckoutModal({ isVisible: true, url: mod.checkoutUrl || '' });
    else if (mod.isFolder) setActiveFolder(mod);
    else setActiveIframe({ id: mod.id, url: getEmbedUrl(mod.iframeUrl), title: mod.titulo });
  };

  const handleSubModuleClick = (sub) => {
    setActiveIframe({ id: sub.id, url: getEmbedUrl(sub.iframeUrl), title: sub.titulo });
  };

  if (activeIframe) {
    const isCompleted = userData.completedModules?.includes(activeIframe.id);
    let iframeSrc = activeIframe.url;
    if (iframeSrc && iframeSrc.toLowerCase().includes('.pdf')) iframeSrc = `${iframeSrc}#toolbar=0&navpanes=0&scrollbar=0`;

    return (
      <div className={`flex flex-col bg-white ${isMockup ? 'flex-1 h-full w-full absolute inset-0 z-50' : 'min-h-screen'}`}>
        <header className="h-14 flex items-center justify-between px-4 gap-2" style={{ backgroundColor: appData.corPrimaria, color: appData.corTexto || '#ffffff' }}>
          <div className="flex items-center flex-1 min-w-0">
            <button aria-label="Voltar para conteúdos" onClick={() => setActiveIframe(null)} className="p-2 -ml-2 rounded-full hover:bg-white/10 shrink-0"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="ml-2 font-medium text-sm line-clamp-2 leading-tight break-words">{activeIframe.title}</h1>
          </div>
        </header>
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
           <span className="text-xs text-gray-500 font-medium">Aula Selecionada</span>
           <button onClick={() => toggleModuleCompletion(activeIframe.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
             {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Check className="w-4 h-4" />} {isCompleted ? t.completed : t.complete}
           </button>
        </div>
        <div className="flex-1 w-full bg-black flex flex-col relative">
           {activeIframe.url ? <iframe src={iframeSrc} className="w-full h-full md:max-h-[60vh] border-0 bg-black" allowFullScreen></iframe> : <div className="flex-1 flex flex-col items-center justify-center text-gray-500"><LayoutTemplate className="w-12 h-12 mb-3 opacity-20" /><p className="text-sm">Sem conteúdo.</p></div>}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-50 flex flex-col font-sans overflow-hidden relative ${isMockup ? 'flex-1 h-full w-full' : 'min-h-screen pb-20'}`}>
      
      {/* NATIVE NOTIFICATION MODAL (iOS Style) */}
      {showNotificationPrompt && (
        <div className="absolute inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" aria-labelledby="notification-modal-title" className="bg-[#f2f2f6]/95 backdrop-blur-xl w-full max-w-[270px] rounded-[14px] overflow-hidden shadow-2xl flex flex-col text-center animate-in zoom-in-95">
            <div className="p-4 pt-5 pb-4">
              <h3 id="notification-modal-title" className="text-black font-semibold text-[17px] leading-snug mb-1">
                "{appData.pwaShortName || appData.nome}" {t.notifyTitle}
              </h3>
              <p className="text-black/80 text-[13px] leading-tight px-1">
                {t.notifyDesc}
              </p>
            </div>
            <div className="flex border-t border-gray-300/60">
              <button 
                onClick={() => setShowNotificationPrompt(false)} 
                className="flex-1 py-3 text-[#007aff] text-[17px] border-r border-gray-300/60 active:bg-gray-200/50 transition-colors"
              >
                {t.notifyDeny}
              </button>
              <button 
                onClick={handleNotificationAllow} 
                className="flex-1 py-3 text-[#007aff] text-[17px] font-semibold active:bg-gray-200/50 transition-colors"
              >
                {t.notifyAllow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NATIVE INSTALL MODAL */}
      {showInstallPrompt && (
        <div className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div role="dialog" aria-modal="true" aria-labelledby="install-modal-title" className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 relative">
            <button aria-label="Fechar instalação" onClick={() => setShowInstallPrompt(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center shadow-sm border border-gray-100 mb-4">
                {appData.logoUrl ? <img src={appData.logoUrl} className="w-full h-full object-cover" /> : <Smartphone className="w-10 h-10 text-gray-400"/>}
              </div>
              <h3 id="install-modal-title" className="text-xl font-bold text-gray-900 mb-1">{appData.pwaShortName || appData.nome}</h3>
              <p className="text-sm text-gray-500 mb-6">{appData.dominio}</p>
              
              <button 
                onClick={handleInstallClick} 
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30"
              >
                 <Download className="w-5 h-5" />
                 {t.installBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {checkoutModal.isVisible && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title" className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 pb-safe animate-in slide-in-from-bottom-10">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock className="w-6 h-6" /></div>
            <h3 id="checkout-modal-title" className="text-lg font-bold text-center mb-2">{t.locked}</h3>
            <div className="space-y-3 mt-6">
              {checkoutModal.url ? <button onClick={() => { window.open(checkoutModal.url, '_blank'); setCheckoutModal({ isVisible: false, url: '' }); }} className="w-full py-3.5 bg-gray-900 text-white rounded-xl flex justify-center gap-2"><ExternalLink className="w-4 h-4" /> Checkout</button> : null}
              <button onClick={() => setCheckoutModal({ isVisible: false, url: '' })} className="w-full py-3.5 bg-gray-100 text-gray-600 rounded-xl">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}

      <div className={`pt-12 pb-6 px-6 shadow-sm flex justify-between items-center gap-2 ${isMockup ? '' : 'rounded-b-3xl'}`} style={{ backgroundColor: appData.corPrimaria, color: appData.corTexto || '#ffffff' }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="shrink-0">
            {appData.logoUrl ? <img src={appData.logoUrl} className="w-8 h-8 rounded bg-white object-cover" /> : <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center"><ImageIcon className="w-4 h-4" style={{ color: appData.corTexto || '#ffffff' }} /></div>}
          </div>
          <h2 className="font-semibold text-base leading-tight line-clamp-2 break-words">{appData.nome}</h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button aria-label="Abrir notificações" onClick={() => setShowNotificationPrompt(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><Bell className="w-5 h-5"/></button>
          <button aria-label="Abrir instalação do app" onClick={() => setShowInstallPrompt(true)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><Download className="w-5 h-5"/></button>
        </div>
      </div>

      <div className={`flex-1 min-h-0 overflow-y-auto p-5 space-y-4 hide-scrollbar ${isMockup ? 'pb-24' : 'max-w-md mx-auto w-full pb-24'}`}>
        {activeTab === 'home' && (
          <div className="animate-in fade-in duration-300">
            {!activeFolder ? (
              <>
                {/* Banner Carrossel Automático */}
                {appData.banners?.length > 0 && (
                   <div className="w-full mb-6 relative">
                      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm aspect-[16/9] bg-black" aria-live="polite" aria-atomic="true">
                         {appData.banners.map((banner, idx) => (
                            <div 
                              key={banner.id} 
                              className={`absolute inset-0 transition-opacity duration-700 ${idx === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
                            >
                               <img src={banner.imageUrl} className="w-full h-full object-cover opacity-90" />
                               {banner.link && (
                                  <a href={banner.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-20"></a>
                               )}
                            </div>
                         ))}
                         
                         {/* Indicadores (Bolinhas) */}
                         {appData.banners.length > 1 && (
                           <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-30">
                             {appData.banners.map((_, idx) => (
                               <button 
                                 key={idx}
                                 onClick={() => setCurrentBannerIndex(idx)}
                                aria-label={`Próximo banner ${idx + 1}`}
                                aria-current={idx === currentBannerIndex}
                                 className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBannerIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
                               />
                             ))}
                           </div>
                         )}
                      </div>
                   </div>
                )}

                {/* Barra de Progresso */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t.progress}</span>
                    <span className="text-xs font-bold" style={{ color: appData.corPrimaria }}>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                     <div className="h-full transition-all duration-500" style={{ width: `${progressPercent}%`, backgroundColor: appData.corPrimaria }}></div>
                  </div>
                </div>

                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t.content}</h3>

                {modulos.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed"><p className="text-sm font-medium">{t.empty}</p></div>
                ) : (
                  // GRID DE MÓDULOS
                  <div className="grid grid-cols-2 gap-4">
                    {modulos.map((mod) => (
                      <div key={mod.id} onClick={() => handleModuleClick(mod)} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform flex flex-col h-48 relative group">
                        <div className="h-32 w-full relative bg-gray-100 flex-shrink-0">
                          {mod.coverImage ? <img src={mod.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-30" style={{ color: appData.corPrimaria }}><LayoutTemplate className="w-8 h-8" /></div>}
                          {mod.isLocked && <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center"><Lock className="w-6 h-6 text-white" /></div>}
                          {mod.isFolder && <div className="absolute top-2 left-2 bg-black/60 text-white p-1.5 rounded-lg backdrop-blur-sm shadow-sm"><FolderPlus className="w-3.5 h-3.5"/></div>}
                          {userData.completedModules?.includes(mod.id) && !mod.isLocked && !mod.isFolder && <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full"><Check className="w-3 h-3"/></div>}
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{mod.titulo}</h4>
                          {mod.isDrip ? (
                            <span className="text-[10px] font-bold text-blue-600 flex items-center mt-1"><Clock className="w-3 h-3 mr-1" /> Disponível em {mod.dripDays || 0} dias</span>
                          ) : mod.isLocked ? (
                            <span className="text-[10px] font-bold text-amber-600 flex items-center mt-1"><Lock className="w-3 h-3 mr-1" /> {t.unlock}</span>
                          ) : mod.isFolder ? (
                            <span className="text-[10px] font-bold text-gray-500 flex items-center mt-1">{mod.subModulos?.length || 0} Aulas</span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // EXIBIÇÃO DE PASTA ABERTA
              <div className="animate-in slide-in-from-right-4 duration-300">
                 <div className="flex items-center mb-6">
                    <button aria-label="Voltar para módulos" onClick={() => setActiveFolder(null)} className="mr-3 p-2 bg-white rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"><ArrowLeft className="w-4 h-4 text-gray-700"/></button>
                    <div className="flex-1 overflow-hidden">
                       <h3 className="text-lg font-bold text-gray-900 leading-tight truncate">{activeFolder.titulo}</h3>
                       <p className="text-xs text-gray-500">{activeFolder.subModulos?.length || 0} Aulas nesta pasta</p>
                    </div>
                 </div>

                 {(!activeFolder.subModulos || activeFolder.subModulos.length === 0) ? (
                    <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed"><p className="text-sm font-medium">Pasta vazia.</p></div>
                 ) : (
                    <div className="grid grid-cols-2 gap-4">
                       {activeFolder.subModulos.map(sub => (
                          <div key={sub.id} onClick={() => handleSubModuleClick(sub)} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-95 transition-transform flex flex-col h-48 relative group">
                            <div className="h-32 w-full relative bg-gray-100 flex-shrink-0">
                              {sub.coverImage ? <img src={sub.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-30" style={{ color: appData.corPrimaria }}><PlayCircle className="w-8 h-8" /></div>}
                              {userData.completedModules?.includes(sub.id) && <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm"><Check className="w-3 h-3"/></div>}
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
                              <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight">{sub.titulo}</h4>
                            </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {feedPosts.filter(post => !post.scheduledDate || new Date(post.scheduledDate) <= new Date()).length === 0 ? (
               <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed"><p className="text-sm font-medium">Nenhuma novidade no feed.</p></div>
            ) : (
              feedPosts.filter(post => !post.scheduledDate || new Date(post.scheduledDate) <= new Date()).map(post => (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
                  {post.imageUrl && <img src={post.imageUrl} className="w-full h-48 object-cover" />}
                  <div className="p-4 relative">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{appData.pwaShortName || appData.nome}</p>
                      <p className="text-[10px] text-gray-400 uppercase">{post.time} • {t.news}</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1 ml-2">{post.title}</h4>
                  <p className="text-sm text-gray-700 leading-relaxed ml-2 whitespace-pre-wrap">{post.content}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'community' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* CRIAR POST */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                  {userData.avatarUrl ? <img src={userData.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-full h-full text-gray-400 p-2" />}
                </div>
                <div className="flex-1">
                  <textarea value={newCommPost} onChange={(e)=>setNewCommPost(e.target.value)} placeholder={t.whatAreYouThinking} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-400 min-h-[80px] resize-none" />
                  {newCommImage && <div className="relative mt-2 w-24 h-24 rounded-lg overflow-hidden border"><img src={newCommImage} className="w-full h-full object-cover"/><button aria-label="Remover imagem da postagem" onClick={()=>setNewCommImage("")} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><X className="w-3 h-3"/></button></div>}
                  <div className="flex justify-between items-center mt-3">
                    <label className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                      <ImagePlus className="w-5 h-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleCommunityUpload} />
                    </label>
                    <button onClick={submitCommunityPost} className="px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2" style={{ backgroundColor: appData.corPrimaria, color: appData.corTexto || '#ffffff' }}><Send className="w-4 h-4"/> {t.publish}</button>
                  </div>
                </div>
              </div>
            </div>

            {/* FEED COMUNIDADE */}
            <div className="space-y-4">
              {communityPosts.map(post => (
                <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                       {post.avatar ? <img src={post.avatar} className="w-full h-full object-cover" /> : <User className="w-full h-full text-gray-400 p-2" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{post.user}</p>
                      <p className="text-xs text-gray-500">{post.time}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-800 mb-3 whitespace-pre-wrap">{post.content}</p>
                  {post.imageUrl && <img src={post.imageUrl} className="w-full h-48 object-cover rounded-xl mb-3 border border-gray-100" />}
                  <div className="flex items-center gap-5 pt-3 border-t border-gray-50">
                    <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${post.likedByMe ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                      <Heart className={`w-5 h-5 ${post.likedByMe ? 'fill-current' : ''}`} /> {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-5 h-5" /> {post.comments}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {isEditingProfile ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center border-4 overflow-hidden relative group cursor-pointer" style={{ borderColor: `${appData.corPrimaria}20`, backgroundColor: `${appData.corPrimaria}05` }}>
                    {tempUserData.avatarUrl ? <img src={tempUserData.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-8 h-8" style={{ color: appData.corPrimaria }} />}
                    <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                      <ImageIcon className="w-4 h-4 text-white mb-1" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files[0]; if(file) setTempUserData({...tempUserData, avatarUrl: await fileToBase64(file)}); }} />
                    </label>
                  </div>
                </div>
                <div className="space-y-4 mb-6">
                  <div><label htmlFor="profile-name" className="block text-xs font-medium text-gray-500 mb-1">Nome Completo</label><input id="profile-name" type="text" value={tempUserData.nome} onChange={(e) => setTempUserData({...tempUserData, nome: e.target.value})} className="w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50" /></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setTempUserData(userData); setIsEditingProfile(false); }} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 rounded-xl">{t.cancel}</button>
                  <button onClick={() => { setUserData(tempUserData); setIsEditingProfile(false); }} className="flex-1 py-2.5 text-sm font-medium text-white rounded-xl" style={{ backgroundColor: appData.corPrimaria, color: appData.corTexto || '#ffffff' }}>Salvar</button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-4 overflow-hidden" style={{ borderColor: `${appData.corPrimaria}20`, backgroundColor: `${appData.corPrimaria}05` }}>
                  {userData.avatarUrl ? <img src={userData.avatarUrl} className="w-full h-full object-cover" /> : <User className="w-8 h-8" style={{ color: appData.corPrimaria }} />}
                </div>
                <h4 className="text-base font-bold text-gray-900">{userData.nome}</h4>
                <p className="text-sm text-gray-500 mb-6">{userData.email}</p>
                <div className="space-y-3">
                  <button onClick={() => { setTempUserData(userData); setIsEditingProfile(true); }} className="w-full py-3 bg-gray-50 text-gray-700 font-medium rounded-xl flex justify-center gap-2 border border-gray-100"><Settings className="w-4 h-4" /> Editar Perfil</button>
                  <button onClick={handlePwaLogout} className="w-full py-3 text-red-600 bg-red-50 font-medium rounded-xl">Sair</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className={`bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-3 z-40 ${isMockup ? 'absolute bottom-0 w-full' : 'fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 md:max-w-full md:left-0 md:translate-x-0'}`}>
        <ul className="flex justify-between items-center">
          {['home', 'feed', 'community', 'profile'].map((tab) => {
            const Icon = tab === 'home' ? Home : tab === 'feed' ? Rss : tab === 'community' ? Users : User;
            const label = tab === 'home' ? t.home : tab === 'feed' ? t.feed : tab === 'community' ? t.comm : t.profile;
            const isActive = activeTab === tab;
            const activeColor = (appData.corPrimaria?.toLowerCase() === '#ffffff' || appData.corPrimaria?.toLowerCase() === '#fff') ? '#111827' : appData.corPrimaria;
            return (
              <li key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 cursor-pointer transition-colors duration-300 ${isActive ? 'text-gray-900' : 'text-gray-400'}`} style={isActive ? { color: activeColor } : {}}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* FABs de Suporte (Email e/ou WhatsApp) */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-3 z-40">
        {appData.supportEmail && appData.supportEmail.trim() !== '' && (
          <button 
             aria-label="Abrir suporte por e-mail"
             onClick={() => setShowSupportEmailModal(true)} 
             className={`${!appData.whatsappNumber && appData.supportIconUrl ? 'p-0 bg-transparent' : 'bg-blue-500'} text-white w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center overflow-hidden`}
          >
             {!appData.whatsappNumber && appData.supportIconUrl ? <img src={appData.supportIconUrl} className="w-full h-full object-cover" /> : <Mail className="w-6 h-6" />}
          </button>
        )}
        {appData.whatsappNumber && appData.whatsappNumber.trim() !== '' && (
          <a href={`https://wa.me/${appData.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className={`${appData.supportIconUrl ? 'p-0 bg-transparent' : 'bg-[#25D366]'} text-white w-14 h-14 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center overflow-hidden`}>
             {appData.supportIconUrl ? <img src={appData.supportIconUrl} className="w-full h-full object-cover" /> : <MessageCircle className="w-6 h-6" />}
          </a>
        )}
      </div>

      {/* MODAL DE SUPORTE POR EMAIL DINÂMICO */}
      {showSupportEmailModal && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="support-email-modal-title" className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 pb-safe animate-in slide-in-from-bottom-10 relative">
            <button aria-label="Fechar suporte por e-mail" onClick={() => setShowSupportEmailModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1.5"><X className="w-4 h-4" /></button>
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Mail className="w-6 h-6" /></div>
            <h3 id="support-email-modal-title" className="text-lg font-bold text-center text-gray-900 mb-2">{t.supportTitle}</h3>
            <p className="text-sm text-gray-500 text-center mb-6">{t.supportDesc}</p>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3 mb-6">
               <span className="text-sm font-medium text-gray-800 truncate select-all">{appData.supportEmail?.trim()}</span>
               <button 
                 onClick={() => {
                   try {
                     const el = document.createElement('textarea');
                     el.value = appData.supportEmail.trim();
                     document.body.appendChild(el);
                     el.select();
                     document.execCommand('copy');
                     document.body.removeChild(el);
                     
                     showToast(t.copyToast, 'success');
                     setTimeout(() => setShowSupportEmailModal(false), 1500);
                   } catch (err) {
                     showToast('Erro ao copiar', 'error');
                   }
                 }}
                 className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center shrink-0"
               >
                 {t.copyBtn}
               </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; } 
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } 
        .pb-safe { padding-bottom: env(safe-area-inset-bottom, 20px); }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}} />
    </div>
  );
}

function DashboardScreen() {
  const { setViewMode } = useUIContext();
  const { projects, openProject, createNewProject, cloneTemplate, deleteProject, aiPrompt, setAiPrompt, handleGenerateAppWithAI, isGeneratingApp } = useProjectContext();
  const [filterLang, setFilterLang] = useState('Todos');
  const [isFaceless, setIsFaceless] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative">
      <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3 shadow-sm"><Grid className="w-4 h-4 text-white" /></div>
          <div><h1 className="text-lg font-semibold tracking-tight leading-none">Construtor SaaS</h1><p className="text-xs text-gray-500 mt-1">Painel & Templates</p></div>
        </div>
        <button onClick={createNewProject} className="bg-white border border-gray-300 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50"><Plus className="w-4 h-4" /> Criar Vazio</button>
      </div>

      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {/* TEMPLATE GALLERY */}
        <div className="mb-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Sparkles className="w-6 h-6"/> Galeria de Templates</h2>
           <p className="text-blue-100 mb-6 max-w-lg text-sm">Crie apps prontos para os nichos mais lucrativos em 1 clique, já traduzidos e otimizados para vendas.</p>
           
           <div className="flex gap-2 mb-6">
             {['Todos', 'pt-BR', 'en-US', 'es-ES', 'fr-FR', 'it-IT'].map(lang => (
                <button key={lang} onClick={()=>setFilterLang(lang)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${filterLang === lang ? 'bg-white text-blue-600' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
                  {lang === 'Todos' ? 'Todos' : lang === 'pt-BR' ? 'Português' : lang === 'en-US' ? 'Inglês' : lang === 'es-ES' ? 'Espanhol' : lang === 'fr-FR' ? 'Francês' : 'Italiano'}
                </button>
             ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              {templatesDatabase.filter(t => filterLang === 'Todos' || t.idioma === filterLang).map(template => (
                 <div key={template.id} onClick={() => cloneTemplate(template)} className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl p-4 cursor-pointer transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: template.corPrimaria }}>{template.nome.charAt(0)}</div>
                      <span className="text-[10px] bg-black/30 px-2 py-1 rounded uppercase tracking-wider">{template.categoria}</span>
                    </div>
                    <h3 className="font-bold text-lg">{template.nome}</h3>
                    <p className="text-xs text-blue-100 opacity-80 mt-1">{template.idioma}</p>
                 </div>
              ))}
           </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-2xl font-bold text-gray-900">Meus Aplicativos</h2>
          <div className="bg-white border rounded-xl p-3 shadow-sm max-w-md w-full flex items-center gap-3">
            <input type="text" placeholder="IA: Descreva seu App e Nicho..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} className="flex-1 bg-transparent text-sm focus:outline-none" />
            <select id="ai-lang" className="text-xs border-0 bg-gray-50 rounded-lg py-1 px-2 focus:ring-0 text-gray-500 font-medium">
              <option value="pt-BR">PT</option>
              <option value="en-US">EN</option>
              <option value="es-ES">ES</option>
              <option value="fr-FR">FR</option>
              <option value="it-IT">IT</option>
            </select>
            <div className="flex items-center gap-1 border-l pl-2 border-gray-200">
              <input type="checkbox" id="faceless-check" checked={isFaceless} onChange={(e) => setIsFaceless(e.target.checked)} className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3 h-3 cursor-pointer" />
              <label htmlFor="faceless-check" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer" title="Produto Faceless (Sem Rosto/PLR)">PLR</label>
            </div>
            <button onClick={() => handleGenerateAppWithAI(document.getElementById('ai-lang').value, isFaceless)} disabled={isGeneratingApp} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-70">
              {isGeneratingApp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Gerar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div key={project.id} onClick={() => openProject(project.id)} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col">
              <div className="h-2 w-full" style={{ backgroundColor: project.corPrimaria }}></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center border bg-gray-50 overflow-hidden">
                    {project.logoUrl ? <img src={project.logoUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-5 h-5 text-gray-400" />}
                  </div>
                  <button aria-label="Excluir projeto" onClick={(e) => deleteProject(project.id, e)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">{project.nome}</h3>
                <p className="text-xs text-gray-400 mb-4 font-mono truncate">{project.dominio}</p>
                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{project.idioma}</span>
                  <div className="text-sm font-bold text-blue-600 flex items-center">Editar <ChevronRight className="w-4 h-4 ml-1" /></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminScreen() {
  const { setViewMode } = useUIContext();
  const { appData, modulos, handleAppChange, handleImageUpload, handleBannerUpload, removeBanner, updateBannerLink, addModulo, dispatchProjects, activeProjectId } = useProjectContext();
  const { saveStatus } = useDatabaseContext();

  const isNameEmpty = !appData.nome?.trim();
  const isDomainInvalid = appData.dominio && !appData.dominio.includes('.');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          <button aria-label="Voltar para dashboard" onClick={() => setViewMode('dashboard')} className="mr-4 p-2 text-gray-400 hover:text-gray-900"><ArrowLeft className="w-5 h-5" /></button>
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex justify-center items-center mr-3"><LayoutTemplate className="w-4 h-4 text-white" /></div>
          <div>
            <h1 className="text-lg font-bold leading-none">{appData.nome || 'Sem Nome'}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              Editando App • {saveStatus === 'saving' ? <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Salvando</span> : <span className="text-green-600 font-bold">Salvo</span>}
            </div>
          </div>
        </div>
        <button onClick={() => setViewMode('pwa')} className="bg-gray-900 text-white px-5 py-2 rounded-lg font-medium text-sm flex gap-2"><Smartphone className="w-4 h-4" /> Preview PWA</button>
      </div>

      <div className="flex-1 flex overflow-hidden h-[calc(100vh-73px)]">
        <div className="w-full lg:w-3/5 p-8 overflow-y-auto bg-white border-r">
          <div className="max-w-3xl mx-auto">
            
            {/* SECÇÃO 1: Identidade & Idioma */}
            <section className="mb-12">
              <h2 className="text-sm font-semibold mb-6 flex items-center border-b pb-2"><Settings className="w-4 h-4 mr-2" /> 1. Identidade & Idioma</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label htmlFor="app-name" className="block text-sm font-medium mb-1.5">Nome do App</label><input id="app-name" type="text" name="nome" value={appData.nome} onChange={handleAppChange} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${isNameEmpty?'border-red-300':'border-gray-300'}`} /></div>
                <div><label htmlFor="app-domain" className="block text-sm font-medium mb-1.5">Domínio</label><input id="app-domain" type="text" name="dominio" value={appData.dominio} onChange={handleAppChange} className={`w-full border rounded-lg px-4 py-2.5 text-sm ${isDomainInvalid?'border-red-300':'border-gray-300'}`} /></div>
                <div className="md:col-span-2">
                  <label htmlFor="app-language" className="block text-sm font-medium mb-1.5">Idioma (PWA)</label>
                  <select id="app-language" name="idioma" value={appData.idioma || 'pt-BR'} onChange={handleAppChange} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm">
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                    <option value="fr-FR">Français</option>
                    <option value="it-IT">Italiano</option>
                  </select>
                </div>
                <div className="flex gap-6 md:col-span-2">
                  <div className="flex-1"><label htmlFor="app-logo" className="block text-sm font-medium mb-1.5">Logo</label><input id="app-logo" type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} className="w-full text-sm" /></div>
                  <div><label htmlFor="app-primary-color" className="block text-sm font-medium mb-1.5">Cor Primária</label><input id="app-primary-color" type="color" name="corPrimaria" value={appData.corPrimaria || '#111827'} onChange={handleAppChange} className="w-12 h-10 p-1 border border-gray-300 rounded cursor-pointer bg-white" /></div>
                  <div><label htmlFor="app-text-color" className="block text-sm font-medium mb-1.5">Cor do Texto</label><input id="app-text-color" type="color" name="corTexto" value={appData.corTexto || '#ffffff'} onChange={handleAppChange} className="w-full h-10 p-1 border border-gray-300 rounded cursor-pointer bg-white" /></div>
                </div>
              </div>
            </section>

            {/* SECÇÃO 2: Suporte & Contato */}
            <section className="mb-12">
              <h2 className="text-sm font-semibold mb-6 flex items-center border-b pb-2"><MessageCircle className="w-4 h-4 mr-2" /> 2. Suporte & Contato</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 border rounded-xl bg-gray-50">
                <div className="space-y-4">
                  <div>
                     <label htmlFor="support-whatsapp" className="block text-sm font-medium mb-1.5">WhatsApp Suporte (Opcional)</label>
                     <input id="support-whatsapp" type="text" name="whatsappNumber" value={appData.whatsappNumber || ''} onChange={handleAppChange} placeholder="Ex: 5511999999999" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white" />
                  </div>
                  <div>
                     <label htmlFor="support-email" className="block text-sm font-medium mb-1.5">E-mail de Suporte (Opcional)</label>
                     <input id="support-email" type="email" name="supportEmail" value={appData.supportEmail || ''} onChange={handleAppChange} placeholder="Ex: suporte@meusite.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white" />
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <label className="block text-sm font-medium mb-1">Ícone Especial de Suporte</label>
                  <p className="text-xs text-gray-500 mb-4">Recomendado 200x200px</p>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-white overflow-hidden relative group cursor-pointer hover:border-blue-400 transition-colors">
                      {appData.supportIconUrl ? (
                        <>
                          <img src={appData.supportIconUrl} className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <ImageIcon className="w-5 h-5 text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'supportIconUrl')} />
                          </label>
                        </>
                      ) : (
                        <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
                          <Plus className="w-6 h-6 mb-1" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'supportIconUrl')} />
                        </label>
                      )}
                    </div>
                    {appData.supportIconUrl && (
                      <button onClick={() => dispatchProjects({ type: 'UPDATE_PROJECT', payload: { projectId: activeProjectId, updates: { supportIconUrl: '' } } })} className="text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">Remover</button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECÇÃO 3: Banners */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h2 className="text-sm font-semibold flex items-center"><ImagePlus className="w-4 h-4 mr-2" /> 3. Banners Promocionais</h2>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{appData.banners?.length || 0}/3</span>
              </div>
              <p className="text-xs text-gray-500 mb-5">Adicione até 3 banners para a tela inicial do seu app. Proporção ideal: <strong className="text-gray-700">16:9</strong> (ex: 800x450px).</p>
              <div className="space-y-4">
                {appData.banners?.map((banner) => (
                  <div key={banner.id} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                    <div className="w-24 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 border border-gray-300">
                       <img src={banner.imageUrl} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                       <input type="text" placeholder="Link de redirecionamento (opcional)" value={banner.link || ''} onChange={(e) => updateBannerLink(banner.id, e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-gray-900 focus:outline-none" />
                    </div>
                    <button aria-label="Remover banner" onClick={() => removeBanner(banner.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                {(!appData.banners || appData.banners.length < 3) && (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 hover:border-blue-400 hover:text-blue-500 cursor-pointer transition-colors group">
                     <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-blue-500">
                        <Plus className="w-6 h-6 mb-2" />
                        <p className="text-xs font-medium">Adicionar novo banner</p>
                     </div>
                     <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
                  </label>
                )}
              </div>
            </section>

            {/* SECÇÃO 4: Módulos */}
            <section>
              <div className="flex items-center justify-between mb-6 border-b pb-2">
                <h2 className="text-sm font-semibold flex items-center"><LayoutTemplate className="w-4 h-4 mr-2" /> 4. Módulos</h2>
                <button onClick={addModulo} className="text-xs bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center border hover:bg-gray-200 transition-colors"><Plus className="w-4 h-4 mr-1.5" /> Adicionar</button>
              </div>
              <div className="space-y-5">{modulos.map((m) => <ModuleEditor key={m.id} modulo={m} />)}</div>
            </section>
            
            {/* SECÇÃO 5: PWA Meta & Privacidade (Restaurada para o layout avançado) */}
            <section className="mt-12">
              <h2 className="text-sm font-semibold mb-6 flex items-center border-b pb-2"><Smartphone className="w-4 h-4 mr-2" /> 5. PWA Meta & Privacidade</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-6 border rounded-xl bg-gray-50">
                <div><label htmlFor="pwa-short-name" className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Nome Curto (App)</label><input id="pwa-short-name" type="text" name="pwaShortName" value={appData.pwaShortName || ''} onChange={handleAppChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-gray-900" placeholder="Fórmula" /></div>
                <div><label htmlFor="pwa-description" className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Descrição PWA</label><input id="pwa-description" type="text" name="pwaDescription" value={appData.pwaDescription || ''} onChange={handleAppChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-gray-900" placeholder="Aprenda a engajar seu público..." /></div>
                
                <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 space-y-4">
                  <div>
                    <label htmlFor="pwa-bg-color" className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Cor de Abertura (Splash)</label>
                    <div className="flex items-center gap-3">
                      <input id="pwa-bg-color" type="color" name="pwaBgColor" value={appData.pwaBgColor || '#ffffff'} onChange={handleAppChange} className="w-12 h-10 p-1 border border-gray-300 rounded cursor-pointer bg-white" />
                      <span className="text-xs text-gray-500 font-mono uppercase">{appData.pwaBgColor || '#ffffff'}</span>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="pwa-display" className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Modo de Exibição</label>
                    <select id="pwa-display" name="pwaDisplay" value={appData.pwaDisplay || 'standalone'} onChange={handleAppChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-gray-900">
                      <option value="standalone">Padrão (Sem barra URL)</option>
                      <option value="fullscreen">Tela Cheia (Imersivo)</option>
                    </select>
                  </div>
                </div>

                <div className="md:col-span-1 pt-4 border-t border-gray-200">
                   <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <input type="checkbox" name="pwaNoIndex" id="chk-noindex" checked={!!appData.pwaNoIndex} onChange={handleAppChange} className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded cursor-pointer" />
                      <label htmlFor="chk-noindex" className="cursor-pointer">
                         <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-0.5"><EyeOff className="w-3.5 h-3.5 text-gray-500"/> Ocultar do Google</div>
                         <p className="text-[10px] text-gray-500 leading-tight">Impede que seu app apareça em buscas públicas, protegendo contra espiões.</p>
                      </label>
                   </div>
                </div>
              </div>
            </section>

            {/* SECÇÃO 6: Comunicação */}
            <PushNotificationEditor />
          </div>
        </div>

        <div className="hidden lg:flex w-2/5 bg-gray-100 items-start justify-center relative overflow-y-auto hide-scrollbar pt-16 pb-8">
          <div className="absolute top-6 right-6 flex items-center gap-2 z-10"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-xs font-bold uppercase text-gray-400">Live Preview</span></div>
          <div className="w-[320px] h-[700px] shrink-0 bg-white rounded-[3rem] shadow-2xl border-[10px] border-gray-900 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-50"><div className="w-32 h-5 bg-gray-900 rounded-b-2xl"></div></div>
            <ClientPWA isMockup={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PWAPreviewScreen() {
  const { setViewMode } = useUIContext();
  return (
    <div className="min-h-screen bg-gray-900 flex justify-center relative">
      <div className="w-full max-w-md bg-white shadow-2xl relative overflow-hidden">
        <button onClick={() => setViewMode('admin')} className="absolute top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-medium backdrop-blur-md flex gap-2 hover:bg-black transition-colors"><Settings className="w-4 h-4" /> Voltar</button>
        <ClientPWA isMockup={false} />
      </div>
    </div>
  );
}

function AppRouter() {
  const { viewMode } = useUIContext();
  return (
    <>
      <GlobalFeedback />
      {viewMode === 'dashboard' && <DashboardScreen />}
      {viewMode === 'pwa' && <PWAPreviewScreen />}
      {viewMode === 'admin' && <AdminScreen />}
    </>
  );
}

export default function App() {
  const [supabaseReady, setSupabaseReady] = useState(false);
  useEffect(() => {
    if (window.supabase) { if (!window.supabaseClient) window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey); setSupabaseReady(true); return; }
    const script = document.createElement('script'); script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'; script.crossOrigin = 'anonymous';
    script.onload = () => { window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey); setSupabaseReady(true); };
    script.onerror = () => { window.supabaseClient = { auth: { getSession: async () => ({ data: { session: null } }), signInAnonymously: async () => ({}), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) }, from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }), upsert: async () => ({ error: null }) }), channel: () => ({ on: () => ({ subscribe: () => {} }) }), removeChannel: () => {} }; setSupabaseReady(true); };
    document.head.appendChild(script);
  }, []);
  if (!supabaseReady) return (<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" /></div>);
  return (<AppProviders><AppRouter /></AppProviders>);
}
