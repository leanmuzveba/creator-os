/**
 * Shared domain types for the CreatorOS frontend: the supported platforms,
 * post/account/trend shapes, and the AI-generated content result shapes.
 */

/** A social platform CreatorOS can connect to and publish on. */
export type PlatformType = 'tiktok' | 'instagram' | 'youtube' | 'facebook';

/** Lifecycle state of a content post. */
export type PostStatus = 'draft' | 'scheduled' | 'published';

/** One of Lean's five brand content pillars. */
export type ContentCategory =
  | 'Tech Education'
  | 'Breaking Into Tech'
  | 'Free Tech Resources'
  | 'Student & Academic Life'
  | 'Microsoft Journey';

/** A single shot in a video shot list (visual + audio + timing window). */
export interface ShotItem {
  shot: number;
  visual: string;
  audio: string;
  timing: string;
}

/** A content item tracked from idea through to publication. */
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

/** A connected social platform account and its cached profile/metrics. */
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

/** A discoverable trend with adaptation guidance for the creator. */
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

/** The selectable top-level navigation tabs / views. */
export type ViewTab = 'dashboard' | 'content' | 'ai' | 'analytics' | 'trends' | 'calendar' | 'accounts';

/** AI-generated content idea result. */
export interface GeneratedIdea {
  title: string;
  potential: string;
  description: string;
  hook: string;
  category: ContentCategory;
  bestPlatform: string;
}

/** AI-generated viral hook result (spoken/visual/on-screen). */
export interface GeneratedHook {
  spokenHook: string;
  visualHook: string;
  onScreenText: string;
  viralCategory: string;
  potentialScore: string;
}

/** AI-generated full video script result. */
export interface GeneratedScript {
  title: string;
  hook: string;
  body: string[];
  cta: string;
  caption: string;
  hashtags: string[];
  shotList: ShotItem[];
}

/** AI-generated production shot list and editing guide result. */
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
