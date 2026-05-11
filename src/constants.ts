import React from 'react';
import { BookOpen, GraduationCap, BarChart3, Sun, Moon, Bell, Download, Grid, LayoutGrid, Lock, Home, Rss, Users, User, Plus, Calendar, Smartphone, FolderOpen, Layers, PackageOpen, CheckCircle2, XCircle, Loader2, Trash2, ArrowLeft, Eye, Sparkles, Check, Settings, GripVertical, Pencil, MoreHorizontal, Construction, Menu, X, FileJson, Type, AlignLeft, Image as ImageIcon, Link as LinkIcon, Minus, SeparatorHorizontal, Quote, Zap, Columns, Send, MessageSquare, List, LucideProps } from 'lucide-react';
import { Project, Module, PipelineStep, PwaConfig, SupportedLocale, AppTranslations, LocaleConfig } from './types';

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷', direction: 'ltr' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸', direction: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', direction: 'ltr' },
];

export const DEFAULT_TRANSLATIONS: Record<SupportedLocale, AppTranslations> = {
  'pt-BR': {
    locale: 'pt-BR',
    strings: {
      "app.login.title": "Acesse sua conta",
      "app.login.emailPlaceholder": "Digite seu e-mail",
      "app.login.button": "ENTRAR",
      "onboarding.install.title": "Instalar na tela inicial?",
      "onboarding.install.subtitle": "Acesse o app com um toque",
      "onboarding.install.confirm": "Sim, instalar",
      "onboarding.install.skip": "Agora não",
      "onboarding.push.title": "Ativar notificações?",
      "onboarding.push.subtitle": "Fique por dentro de novidades, lembretes e conteúdo exclusivo.",
      "onboarding.push.confirm": "Sim, quero!",
      "content.locked.title": "Conteúdo Bloqueado",
      "content.locked.button": "Fazer Checkout",
      "content.locked.cancel": "Cancelar",
      "nav.home": "Início",
      "nav.content": "Conteúdo",
      "nav.community": "Comunidade",
      "nav.profile": "Perfil"
    }
  },
  'en-US': {
    locale: 'en-US',
    strings: {
      "app.login.title": "Access your account",
      "app.login.emailPlaceholder": "Enter your email",
      "app.login.button": "SIGN IN",
      "onboarding.install.title": "Add to home screen?",
      "onboarding.install.subtitle": "Access the app with one tap, no browser needed.",
      "onboarding.install.confirm": "Yes, install",
      "onboarding.install.skip": "Not now",
      "onboarding.push.title": "Enable notifications?",
      "onboarding.push.subtitle": "Stay updated with news, reminders and exclusive content.",
      "onboarding.push.confirm": "Yes, please!",
      "content.locked.title": "Locked Content",
      "content.locked.button": "Checkout",
      "content.locked.cancel": "Cancel",
      "nav.home": "Home",
      "nav.content": "Content",
      "nav.community": "Community",
      "nav.profile": "Profile"
    }
  },
  'es': {
    locale: 'es',
    strings: {
      "app.login.title": "Accede a tu cuenta",
      "app.login.emailPlaceholder": "Ingrese su correo",
      "app.login.button": "ENTRAR",
      "onboarding.install.title": "¿Instalar en pantalla de inicio?",
      "onboarding.install.subtitle": "Accede al app con un toque, sin necesidad del navegador.",
      "onboarding.install.confirm": "Sí, instalar",
      "onboarding.install.skip": "Ahora no",
      "onboarding.push.title": "¿Activar notificaciones?",
      "onboarding.push.subtitle": "¡Mantente al día con las novedades, recordatorios y contenido exclusivo!",
      "onboarding.push.confirm": "Sí, lo quiero",
      "content.locked.title": "Contenido Bloqueado",
      "content.locked.button": "Checkout",
      "content.locked.cancel": "Cancelar",
      "nav.home": "Inicio",
      "nav.content": "Contenido",
      "nav.community": "Comunidad",
      "nav.profile": "Perfil"
    }
  },
  'fr': {
    locale: 'fr',
    strings: {
      "app.login.title": "Accédez à votre compte",
      "app.login.emailPlaceholder": "Entrez votre email",
      "app.login.button": "CONNEXION",
      "onboarding.install.title": "Ajouter à l'écran d'accueil ?",
      "onboarding.install.subtitle": "Accédez à l'app en un tap, sans navigateur.",
      "onboarding.install.confirm": "Oui, installer",
      "onboarding.install.skip": "Pas maintenant",
      "onboarding.push.title": "Activer les notifications ?",
      "onboarding.push.subtitle": "Restez informé des nouveautés, rappels et contenus exclusifs.",
      "onboarding.push.confirm": "Oui, je veux !",
      "content.locked.title": "Contenu Verrouillé",
      "content.locked.button": "Accéder",
      "content.locked.cancel": "Annuler",
      "nav.home": "Accueil",
      "nav.content": "Contenu",
      "nav.community": "Communauté",
      "nav.profile": "Profil"
    }
  }
};

export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  BookOpen, GraduationCap, BarChart3, Sun, Moon, Bell, Download, Grid, LayoutGrid, Lock, Home, Rss, Users, User, Plus, Calendar, Smartphone, FolderOpen, Layers, PackageOpen, CheckCircle2, XCircle, Loader2, Trash2, ArrowLeft, Eye, Sparkles, Check, Settings, GripVertical, Pencil, MoreHorizontal, Construction, Menu, X, FileJson, Type, AlignLeft, Image: ImageIcon, Link: LinkIcon, Minus, SeparatorHorizontal, Quote, Zap, Columns, Send, MessageSquare, List
};

export const MOCK_PROJECTS: Project[] = [
  { id: 1, name: 'Kenshô App', status: 'Publicado', lastEdited: 'Hoje, 14:30', users: 1240, color: '#6b8af0', url: 'kensho.appify.com' },
  { id: 2, name: 'VendasPro', status: 'Rascunho', lastEdited: 'Ontem, 09:15', users: 0, color: '#2dc4b6', url: 'vendaspro.appify.com' },
  { id: 3, name: 'Comunidade Fit', status: 'Publicado', lastEdited: '12 Nov, 2023', users: 85, color: '#ff6b6b', url: 'fit.appify.com' }
];

export const INITIAL_MODULES: Module[] = [];

export const INITIAL_PWA_CONFIG: PwaConfig = {
  appName: 'Meu App',
  tagline: 'O melhor app do mundo',
  themeColor: '#6b8af0',
  textColor: '#FFFFFF',
  bgColor: '#161b22',
  fontFamily: 'DM Sans',
  fontWeight: '600',
  fontSize: 16,
  titleColor: '#FFFFFF',
  bodyColor: '#A0A0A0',
  orientation: 'portrait',
  display: 'standalone',
  icon: null,
  logo: null,
  logoBase64: null,
  iconBase64: null,
  domain: '',
  language: 'pt-BR',
  description: '',
  noIndex: false,
  offlineMode: true,
  customSplash: true,
  startUrl: '/',
  version: '1.0.0',
  changelogNotes: '',
  supabaseUrl: '',
  supabaseAnonKey: '',
  carouselInterval: 5,
  banners: [
    { id: 1, imageUrl: '', link: '' }
  ]
};

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: 0, label: 'Identidade', desc: 'Nome, cores, logo', status: 'done' },
  { id: 1, label: 'Configurações', desc: 'Manifest, ícones, offline', status: 'todo' },
  { id: 2, label: 'Módulos & Conteúdo', desc: 'Estrutura do app', status: 'active' },
  { id: 3, label: 'Engajamento', desc: 'Push & Comunidade', status: 'todo' },
  { id: 4, label: 'Publicação', desc: 'Deploy & domínio', status: 'todo' },
  { id: 5, label: 'Analytics', desc: 'Métricas & crescimento', status: 'todo' },
];

export const GOOGLE_FONTS = ['DM Sans','Roboto','Open Sans','Lato','Montserrat','Poppins','Raleway','Playfair Display','Merriweather','Oswald','Nunito','Ubuntu','Quicksand','Bitter','Crimson Text','Fira Sans','Work Sans','Mulish','Karla','Libre Baskerville'];
