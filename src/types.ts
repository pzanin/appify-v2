export type ProjectStatus = 'Publicado' | 'Rascunho';
export type ModuleStatus = 'Ativo' | 'Rascunho';
export type StepStatus = 'done' | 'active' | 'todo';
export type AppView = 'projects' | 'builder';
export type ToastType = 'success' | 'error' | 'loading';

export interface PushNotification {
  id: number;
  title: string;
  body: string;
  imageUrl?: string;
  createdAt: number;
}

export interface FeedPost {
  id: number;
  author: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  createdAt?: number;
}

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
  language: SupportedLocale;
  description: string;
  noIndex: boolean;
  showAdvanced?: boolean;
  offlineMode: boolean;
  customSplash: boolean;
  engagementEnabled?: boolean;
  deploymentProvider?: 'netlify' | 'cloudflare';
  welcomeEnabled?: boolean;
  customerAccessMode?: 'open' | 'demo';
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

export type VideoProvider = 'youtube' | 'vimeo' | 'direct';
export type VideoAspectRatio = '16:9' | '9:16' | '1:1';
export type EntryAnimation = 'none' | 'fade' | 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right' | 'zoom';
export type CardLayout = 'grid' | 'horizontal' | 'compact';
export type AdvancedLayout = 'feature-split' | 'media-stack' | 'highlight-band' | 'masonry-lite';

export interface AccordionItem { id: string; title: string; content: string; }
export interface TabItem { id: string; label: string; content: string; }
export interface CardItem { id: string; title: string; text: string; image?: string; badge?: string; buttonText?: string; buttonUrl?: string; }
export interface CarouselItem { id: string; title?: string; text?: string; image?: string; buttonText?: string; buttonUrl?: string; }

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
    maxWidth?: string | number;
    columnAlign?: 'start' | 'center' | 'end' | 'stretch';
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
    gap?: string | number;
    borderRadius?: string | number;
    imgHeight?: string | number;
    imgBorderRadius?: string | number;
    imgObjectFit?: 'cover' | 'contain' | 'fill';
    titleFontFamily?: string;
    titleFontSize?: string | number;
    titleFontWeight?: string | number;
    titleMarginBottom?: string | number;
    imageWidth?: string | number;
    imageHeight?: string | number;
    imageBorderRadius?: string | number;
    imageObjectFit?: 'cover' | 'contain' | 'fill';
    videoProvider?: VideoProvider;
    videoUrl?: string;
    videoAspectRatio?: VideoAspectRatio;
    videoThumbnail?: string;
    videoAutoplay?: boolean;
    videoLoop?: boolean;
    videoMuted?: boolean;
    videoControls?: boolean;
    videoBorderRadius?: string | number;
    videoWidth?: string | number;
    containerMaxWidth?: string | number;
    accordionItems?: AccordionItem[];
    accordionAllowMultiple?: boolean;
    tabs?: TabItem[];
    tabsActiveIndex?: number;
    entryAnimation?: EntryAnimation;
    animationDurationMs?: number;
    animationDelayMs?: number;
    animationOnce?: boolean;
    cardItems?: CardItem[];
    cardLayout?: CardLayout;
    cardColumns?: 1 | 2 | 3;
    cardGap?: number;
    cardBorderRadius?: number;
    carouselItems?: CarouselItem[];
    carouselAutoplay?: boolean;
    carouselIntervalMs?: number;
    carouselShowDots?: boolean;
    carouselShowArrows?: boolean;
    carouselAspectRatio?: '16:9' | '4:3' | '1:1' | '9:16';
    advancedLayout?: AdvancedLayout;
    layoutGap?: number;
    layoutReverseMobile?: boolean;
    eyebrow?: string;
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
  feedPosts: FeedPost[];
  pushNotifications?: PushNotification[];
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

export interface ProjectFile {
  schemaVersion: 1;
  project: Project;
  workspace: AppState;
}

export interface ProjectOperationResult {
  canceled?: boolean;
  project?: Project;
}

export interface ProjectBuildResult {
  filename: string;
  filePath: string;
  size: number;
}

export interface AppifyDesktopApi {
  content?: { create: (html:string)=>Promise<string>; release: (url:string)=>Promise<void> };
  links: { openExternal: (url: string) => Promise<void> };
  projects: {
    list: () => Promise<Project[]>;
    create: (name: string, workspace: AppState) => Promise<Project>;
    open: (id: number) => Promise<ProjectFile>;
    save: (id: number, workspace: AppState) => Promise<Project>;
    duplicate: (id: number) => Promise<Project>;
    remove: (id: number) => Promise<void>;
    exportBackup: (id: number) => Promise<ProjectOperationResult>;
    importBackup: () => Promise<ProjectOperationResult>;
    saveBuild: (id: number, filename: string, bytes: Uint8Array) => Promise<ProjectBuildResult>;
  };
  lifecycle: {
    onBeforeClose: (listener: () => void | Promise<void>) => () => void;
    readyToClose: () => void;
  };
}

export interface SubModule {
  id: number;
  name: string;
  type: string;
  contentType: 'web' | 'html' | 'youtube' | 'vimeo' | 'panda';
  contentUrl?: string;
  contentHtml?: string;
  customHtml?: string;
  content_html?: string;
  builder_data?: BuilderBlock[];
  htmlMode?: 'visual' | 'code';
  htmlInteractive?: boolean;
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
