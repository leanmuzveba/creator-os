export type PlatformType = 'tiktok' | 'instagram' | 'youtube' | 'facebook';

export type PostStatus = 'draft' | 'scheduled' | 'published';

export type ContentCategory = 
  | 'Tech Education'
  | 'Breaking Into Tech'
  | 'Free Tech Resources'
  | 'Student & Academic Life'
  | 'Microsoft Journey';

export interface ShotItem {
  shot: number;
  visual: string;
  audio: string;
  timing: string;
}

export interface PostItem {
  id: string;
  title: string;
  category: ContentCategory;
  platforms: PlatformType[];
  status: PostStatus;
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // e.g. "10:00 AM"
  publishedDate?: string;
  caption: string;
  hashtags: string[];
  thumbnailUrl: string;
  videoUrl?: string;
  duration?: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  bookmarks?: number;
  metricsGrowth?: string;
  script?: {
    hook: string;
    body: string[];
    cta: string;
    shotList: ShotItem[];
  };
}

export interface SocialAccount {
  id: PlatformType;
  name: string;
  handle: string;
  connected: boolean;
  avatar: string;
  followers: string;
  views: string;
  viewsGrowth: string;
  color: string;
  accentColor: string;
  status: string;
}

export interface TrendItem {
  id: string;
  topic: string;
  hashtag: string;
  growth: string;
  platform: PlatformType;
  volume: string;
  category: ContentCategory;
  summary: string;
  whyItWorks: string;
  hookFormula: string;
  leanAdaptation: string;
}

export type ViewTab = 'dashboard' | 'content' | 'ai' | 'analytics' | 'trends' | 'calendar' | 'accounts';

export interface GeneratedIdea {
  title: string;
  potential: string;
  description: string;
  hook: string;
  category: ContentCategory;
  bestPlatform: string;
}

export interface GeneratedHook {
  spokenHook: string;
  visualHook: string;
  onScreenText: string;
  viralCategory: string;
  potentialScore: string;
}

export interface GeneratedScript {
  title: string;
  hook: string;
  body: string[];
  cta: string;
  caption: string;
  hashtags: string[];
  shotList: ShotItem[];
}

export interface GeneratedShotList {
  totalDuration: string;
  recommendedMusic: string;
  shots: {
    shotNumber: number;
    type: string;
    angle: string;
    visual: string;
    audio: string;
    onScreenGraphics: string;
    duration: string;
  }[];
  editingTips: string[];
}
