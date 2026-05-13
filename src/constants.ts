import { BookOpen, GraduationCap, BarChart3, Sun, Moon, Bell, Download, Grid, LayoutGrid, Lock, Home, Rss, Users, User, Plus, Calendar, Smartphone, FolderOpen, Layers, PackageOpen, CheckCircle2, XCircle, Loader2, Trash2, ArrowLeft, Eye, Sparkles, Check, Settings, GripVertical, Pencil, MoreHorizontal, Construction, Menu, X, FileJson, Type, AlignLeft, Image as ImageIcon, Link as LinkIcon, Minus, SeparatorHorizontal, Quote, Zap, Columns, Send, MessageSquare, List, Trophy, Flame, Fingerprint, Megaphone, Globe, Headset, LucideProps } from 'lucide-react';
import { Project, Module, PipelineStep, PwaConfig, SupportedLocale, AppTranslations, LocaleConfig } from './types';

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷', direction: 'ltr' },
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸', direction: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', direction: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', direction: 'ltr' },
];

// Traduções movidas para src/locales/ via JSON para arquitetura mais limpa.


export const ICON_MAP: Record<string, React.FC<LucideProps>> = {
  BookOpen, GraduationCap, BarChart3, Sun, Moon, Bell, Download, Grid, LayoutGrid, Lock, Home, Rss, Users, User, Plus, Calendar, Smartphone, FolderOpen, Layers, PackageOpen, CheckCircle2, XCircle, Loader2, Trash2, ArrowLeft, Eye, Sparkles, Check, Settings, GripVertical, Pencil, MoreHorizontal, Construction, Menu, X, FileJson, Type, AlignLeft, Image: ImageIcon, Link: LinkIcon, Minus, SeparatorHorizontal, Quote, Zap, Columns, Send, MessageSquare, List, Trophy, Flame, Fingerprint, Megaphone, Globe, Headset
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
  defaultTheme: 'dark',
  banners: [
    { id: 1, imageUrl: '', link: '' }
  ],
  supportConfig: { type: 'none', contact: '' },
  gamification: { enabled: false, progressStyle: 'none', enableStreaks: false, streakIcon: '🔥', enableCelebration: false }
};

export const PIPELINE_STEPS: PipelineStep[] = [
  { id: 0, label: 'Identidade', desc: 'Nome, cores, logo', status: 'done', icon: 'Fingerprint' },
  { id: 1, label: 'Configurações', desc: 'Manifest, ícones, offline', status: 'todo', icon: 'Settings' },
  { id: 2, label: 'Módulos & Conteúdo', desc: 'Estrutura do app', status: 'active', icon: 'LayoutGrid' },
  { id: 3, label: 'Engajamento', desc: 'Push & Comunidade', status: 'todo', icon: 'Megaphone' },
  { id: 4, label: 'Suporte', desc: 'Canais de contato', status: 'todo', icon: 'Headset' },
  { id: 5, label: 'Publicação', desc: 'Deploy & domínio', status: 'todo', icon: 'Globe' },
  { id: 6, label: 'Analytics', desc: 'Métricas & crescimento', status: 'todo', icon: 'BarChart3' },
  { id: 7, label: 'Gamificação', desc: 'Retenção & recompensas', status: 'todo', icon: 'Trophy' },
];

export const GOOGLE_FONTS = ['DM Sans','Roboto','Open Sans','Lato','Montserrat','Poppins','Raleway','Playfair Display','Merriweather','Oswald','Nunito','Ubuntu','Quicksand','Bitter','Crimson Text','Fira Sans','Work Sans','Mulish','Karla','Libre Baskerville'];
