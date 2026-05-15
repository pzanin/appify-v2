export type ProjectStatus = 'Publicado' | 'Rascunho';
export type ModuleStatus = 'Ativo' | 'Rascunho';
export type StepStatus = 'done' | 'active' | 'todo';
export type AppView = 'projects' | 'builder';
export type ToastType = 'success' | 'error' | 'loading';

export interface Award {
  id: string;
  title: string;
  icon: string;
  points: number;
  criteria: 'lesson_count' | 'module_complete' | 'streak_days' | 'first_login';
  criteriaValue: number;
}

export interface PwaConfig {
  appName: string;
  tagline: string;
  themeColor: string;
  textColor: string;
  bgColor: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  titleColor: string;
  bodyColor: string;
  orientation: string;
  display: string;
  icon: string | null;
  logo: string | null;
  logoBase64: string | null;
  iconBase64: string | null;
  domain: string;
  language: string;
  description: string;
  noIndex: boolean;
  showAdvanced?: boolean;
  offlineMode: boolean;
  customSplash: boolean;
  startUrl: string;
  version: string;
  changelogNotes: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  carouselInterval?: number;
  defaultTheme: 'light' | 'dark';
  banners: Array<{ id: number; imageUrl: string; link: string }>;
  supportConfig: { type: 'whatsapp' | 'email' | 'none'; contact: string };
  gamification: {
    enabled: boolean;
    progressStyle: 'bar' | 'ring' | 'none';
    enableStreaks: boolean;
    streakIcon: string;
    enableCelebration: boolean;
    enablePoints: boolean;
    enableBadges: boolean;
    awardsConfig: Award[];
  };
}

export interface Version {
  version: string;
  date: string;
  notes: string;
  status: 'publicado' | 'rascunho';
}

export interface BuilderBlock {
  id: string;
  type: string;
  subtype?: string | null;
  props: {
    bgColor?: string;
    padding?: string | number;
    align?: string;
    fontFamily?: string;
    color?: string;
    fontSize?: string | number;
    fontWeight?: number | string;
    fontStyle?: string;
    lineHeight?: number | string;
    letterSpacing?: number | string;
    marginTop?: number | string;
    marginBottom?: number | string;
    text?: string;
    subtext?: string;
    src?: string;
    href?: string;
    label?: string;
    height?: number | string;
    columns?: number;
    title?: string;
    subtitle?: string;
    content?: string;
    alt?: string;
    width?: string | number;
    url?: string;
    style?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    dividerColor?: string;
    thickness?: string | number;
    imageSrc?: string;
    imageAlt?: string;
    imagePosition?: string;
    quote?: string;
    author?: string;
    role?: string;
    quoteColor?: string;
    quoteSize?: string | number;
    buttonText?: string;
    titleColor?: string;
    subtitleColor?: string;
    col1Title?: string;
    col1Text?: string;
    col2Title?: string;
    col2Text?: string;
    col3Title?: string;
    col3Text?: string;
    cardBgColor?: string;
    cardPadding?: string | number;
    leftTitle?: string;
    leftText?: string;
    rightTitle?: string;
    rightText?: string;
    columnBgColor?: string;
    columnPadding?: string | number;
  };
}

export type SupportedLocale = 'pt-BR' | 'en-US' | 'es' | 'fr';

export interface LocaleConfig {
  code: SupportedLocale;
  label: string;
  flag: string;
  direction: 'ltr';
}

export interface AppTranslations {
  locale: SupportedLocale;
  strings: Record<string, string>;
}

export interface AnalyticsData {
  upsellClicks: { total: number; clicks: number };
  dropOffByModule: Array<{ name: string; rate: number }>;
  gamificationStats: { activeStreaks: number; celebrationTriggers: number };
  pwaAdoption: { web: number; installed: number };
  activeUsers: number;
  sessionsToday: number;
  avgConsumptionMinutes: number;
  retentionRate: number;
  retentionFunnel: Array<{ label: string; val: number; pc: number; op: number }>;
}

export interface AppState {
  currentView: AppView;
  activeStep: number;
  appName: string;
  modules: Module[];
  selectedModuleId: number | null;
  pwaConfig: PwaConfig;
  editingSubmodule: { modId: number, subId: number } | null;
  activeLocale: SupportedLocale;
  translations?: Record<SupportedLocale, AppTranslations>;
  splashActive: boolean;
  mockupOnboardingCompleted: boolean;
  analytics: AnalyticsData;
}

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  lastEdited: string;
  users: number;
  color: string;
  url: string;
  logoBase64?: string;
}

export interface SubModule {
  id: number;
  name: string;
  type: string;
  contentType: 'web' | 'html' | 'youtube' | 'vimeo' | 'panda';
  contentUrl?: string;
  contentHtml?: string;
  content_html?: string; // Maintain for compatibility
  builder_data?: BuilderBlock[];
  coverImageUrl?: string;
  externalLink?: string;
  gamificationConfig?: { timeGateSeconds: number; enableCelebration: boolean };
  releaseType?: 'immediate' | 'drip' | 'locked';
  dripDays?: number;
  checkoutUrl?: string;
}

export interface Module {
  id: number;
  name: string;
  iconName: string;
  status: ModuleStatus;
  subs: SubModule[];
  coverImageUrl?: string;
  externalLink?: string;
  releaseType?: 'immediate' | 'drip' | 'locked' | 'upsell' | 'points';
  dripDays?: number;
  checkoutUrl?: number | string;
  requiredPoints?: number;
  gamificationConfig?: { enabled: boolean; progressStyle: 'bar' | 'ring' | 'none' };
}

export interface PipelineStep {
  id: number;
  label: string;
  desc: string;
  status: StepStatus;
  icon?: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}
