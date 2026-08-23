/**
 * In-memory data store and disk persistence for the CreatorOS backend.
 *
 * Holds the seed content (posts, connected social accounts, trends feed) plus
 * the mutable runtime state and OAuth tokens. Route modules import the shared
 * {@link store} object and mutate it directly, then call {@link saveStorage}
 * to persist to `creator_storage.json`.
 */
import path from 'path';
import fs from 'fs';
import { logger } from './logger.ts';

/** A single content item (draft, scheduled, or published post). */
export interface PostItem {
  id: string;
  title: string;
  category:
    | 'Tech Education'
    | 'Breaking Into Tech'
    | 'Free Tech Resources'
    | 'Student & Academic Life'
    | 'Microsoft Journey';
  platforms: ('tiktok' | 'instagram' | 'youtube' | 'facebook')[];
  status: 'draft' | 'scheduled' | 'published';
  scheduledDate?: string; // YYYY-MM-DD
  scheduledTime?: string; // HH:mm AM/PM
  publishedDate?: string;
  caption: string;
  hashtags: string[];
  thumbnailUrl: string;
  videoUrl?: string;
  duration?: string; // e.g. "00:45"
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
    shotList: { shot: number; visual: string; audio: string; timing: string }[];
  };
}

/** A connected social platform account record. */
export interface SocialAccountRecord {
  id: string;
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

export interface TiktokTokens {
  accessToken?: string;
  refreshToken?: string;
  openId?: string;
  expiresAt?: number;
}

export interface MetaTokens {
  instagram?: { accessToken: string; expiresAt: number; userId?: string };
  facebook?: { accessToken: string; expiresAt: number; pageId?: string };
}

export interface GoogleTokens {
  youtube?: { accessToken: string; refreshToken?: string; expiresAt: number; channelId?: string };
}

/** Get a date `offsetDays` from today as a `YYYY-MM-DD` string. */
const getRelativeDateStr = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const defaultPosts: PostItem[] = [
  {
    id: 'post-1',
    title: 'AI Tools Every Student Should Know',
    category: 'Free Tech Resources',
    platforms: ['tiktok', 'instagram'],
    status: 'published',
    publishedDate: getRelativeDateStr(-3),
    caption:
      'These AI tools changed the way I study! 🚀 Save this for later!\n\nStop wasting hours summarizing papers when you can automate your revision and project workflows.',
    hashtags: ['#students', '#aitools', '#tech', '#studytok', '#creatoros'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    duration: '00:45',
    views: 128400,
    likes: 12400,
    comments: 384,
    shares: 305,
    bookmarks: 1200,
    metricsGrowth: '↑ 24%',
    script: {
      hook: 'If you are still reading 40-page research papers manually, stop doing this right now.',
      body: [
        'Tool 1: ChatPDF for instant paper digestion and citations.',
        'Tool 2: Perplexity AI for academic verification and real sources.',
        'Tool 3: Notion AI to turn lecture voice notes into flashcards.',
      ],
      cta: 'Comment "AI" and I will DM you the complete student toolkit list!',
      shotList: [
        { shot: 1, visual: 'Direct close-up speaking with urgency, holding phone', audio: 'Stop scrolling if you are a student in tech...', timing: '0:00 - 0:04' },
        { shot: 2, visual: 'Screen record overlay showing PDF summarizer speed', audio: 'Instead of skimming 40 pages, drop the link here...', timing: '0:05 - 0:18' },
        { shot: 3, visual: 'Split screen Notion template live demo', audio: 'Next, convert those notes into exam flashcards...', timing: '0:19 - 0:35' },
        { shot: 4, visual: 'Lean pointing to screen + sticker animation', audio: 'Save this and follow for daily tech guides!', timing: '0:36 - 0:45' },
      ],
    },
  },
  {
    id: 'post-2',
    title: 'How I Got My First Tech Internship',
    category: 'Breaking Into Tech',
    platforms: ['youtube', 'tiktok'],
    status: 'published',
    publishedDate: getRelativeDateStr(-1),
    caption:
      'No CS degree? Here is the exact portfolio strategy I used to get interviews at top tech companies as a student.',
    hashtags: ['#techinternship', '#codingjourney', '#careers', '#techjobs'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
    duration: '01:20',
    views: 56700,
    likes: 6420,
    comments: 215,
    shares: 480,
    bookmarks: 920,
    metricsGrowth: '↑ 14%',
  },
  {
    id: 'post-3',
    title: 'Free Websites Every Developer Needs',
    category: 'Free Tech Resources',
    platforms: ['instagram', 'facebook'],
    status: 'scheduled',
    scheduledDate: getRelativeDateStr(0),
    scheduledTime: '10:00 AM',
    caption: 'Bookmark these 5 insane developer resources before building your next fullstack project 💻',
    hashtags: ['#webdev', '#freecode', '#developer', '#codingtips'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
    duration: '00:58',
    views: 89400,
    likes: 8920,
    comments: 184,
    shares: 750,
    bookmarks: 1840,
    metricsGrowth: '↑ 18%',
  },
  {
    id: 'post-4',
    title: 'Python Tips for Beginners',
    category: 'Tech Education',
    platforms: ['tiktok'],
    status: 'scheduled',
    scheduledDate: getRelativeDateStr(2),
    scheduledTime: '02:00 PM',
    caption: '3 Python one-liners that will make your code look senior level ✨',
    hashtags: ['#python', '#learntocode', '#programming', '#softwareengineer'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    duration: '00:35',
  },
  {
    id: 'post-5',
    title: 'GitHub Portfolio Guide',
    category: 'Breaking Into Tech',
    platforms: ['instagram', 'youtube'],
    status: 'scheduled',
    scheduledDate: getRelativeDateStr(4),
    scheduledTime: '11:30 AM',
    caption:
      'How to structure your GitHub README so recruiters actually look at your code. Full step-by-step breakdown!',
    hashtags: ['#github', '#portfoliotips', '#techstudents', '#softwaredev'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
    duration: '00:50',
  },
  {
    id: 'post-6',
    title: 'Microsoft Learn Path',
    category: 'Microsoft Journey',
    platforms: ['facebook', 'youtube'],
    status: 'draft',
    caption: 'Free Microsoft Cloud & Azure certifications you can take this semester completely free!',
    hashtags: ['#microsoft', '#azure', '#cloudcomputing', '#studentambassador'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    duration: '01:10',
  },
];

export const defaultSocialAccounts: SocialAccountRecord[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@lean.muzveba',
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    followers: '128.4K',
    views: '124.8K',
    viewsGrowth: '+18.6%',
    color: '#000000',
    accentColor: '#25f4ee',
    status: 'active',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@lean_codes',
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    followers: '89.4K',
    views: '89.4K',
    viewsGrowth: '+12.4%',
    color: '#e1306c',
    accentColor: '#f77737',
    status: 'active',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: 'Lean in Tech',
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    followers: '56.7K',
    views: '56.7K',
    viewsGrowth: '+9.3%',
    color: '#ff0000',
    accentColor: '#cc0000',
    status: 'active',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'Lean Tech Page',
    connected: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    followers: '23.1K',
    views: '23.1K',
    viewsGrowth: '+6.8%',
    color: '#1877f2',
    accentColor: '#0c5ec7',
    status: 'active',
  },
];

/** Curated trending topics surfaced in the Trends view. */
export const trendsFeed = [
  {
    id: 'trend-1',
    topic: 'AI Tools',
    hashtag: '#AITools',
    growth: '↑ 120%',
    platform: 'tiktok',
    volume: '2.4M posts',
    category: 'Free Tech Resources',
    summary:
      'Students and early career devs are searching for AI workflow accelerators for revision, coding prompts, and study summaries.',
    whyItWorks:
      'High utility value. People instantly save bookmarks and share with classmates to reference during exams or deadlines.',
    hookFormula: '"If you are still doing [boring manual task] in 2025, you need to see this free AI tool..."',
    leanAdaptation:
      'Show 3 lesser-known AI productivity tools specifically tailored for student developers or non-traditional tech learners.',
  },
  {
    id: 'trend-2',
    topic: 'Study Motivation',
    hashtag: '#StudyTok',
    growth: '↑ 85%',
    platform: 'tiktok',
    volume: '5.1M posts',
    category: 'Student & Academic Life',
    summary: 'Aesthetic desk setups combined with actionable time-blocking and study sprints.',
    whyItWorks: 'Visually calming and motivates action; viewers rewatch while working.',
    hookFormula: '"My 3-step study system that helped me maintain a 3.9 GPA while learning to code on the side."',
    leanAdaptation:
      'A 45-second vlog showing your real daily routine balancing university assignments, coding practice, and content creation.',
  },
  {
    id: 'trend-3',
    topic: 'ChatGPT Tips',
    hashtag: '#ChatGPT',
    growth: '↑ 78%',
    platform: 'instagram',
    volume: '1.8M posts',
    category: 'Tech Education',
    summary: 'Prompt engineering cheat sheets and multi-turn persona tricks.',
    whyItWorks: 'Bite-sized, practical knowledge that people can test immediately.',
    hookFormula:
      '"Most people use ChatGPT like Google. Here are 3 prompts that make it act like a Senior Developer mentor."',
    leanAdaptation: 'Demonstrate a live prompt that reviews your resume or debugs a React/Python code snippet.',
  },
  {
    id: 'trend-4',
    topic: 'Tech Career',
    hashtag: '#TechCareers',
    growth: '↑ 65%',
    platform: 'youtube',
    volume: '940K posts',
    category: 'Breaking Into Tech',
    summary: 'Real talk about tech job market, interview prep, and cold outreach on LinkedIn.',
    whyItWorks: 'Empathetic and aspirational; addresses high student anxiety around hiring.',
    hookFormula: '"What nobody tells you about getting your first tech internship with zero prior experience..."',
    leanAdaptation:
      'Breakdown of the 3 portfolio projects that actually get recruiter callbacks, avoiding generic clone apps.',
  },
  {
    id: 'trend-5',
    topic: 'Microsoft Learn',
    hashtag: '#MicrosoftLearn',
    growth: '↑ 62%',
    platform: 'facebook',
    volume: '420K posts',
    category: 'Microsoft Journey',
    summary: 'Free certification vouchers, student ambassador programs, and Azure student credits.',
    whyItWorks: 'Direct monetary benefit (saving $100+ on exam fees) and prestige credential.',
    hookFormula: '"How to get official Microsoft & Azure certifications for $0 before graduating."',
    leanAdaptation: 'Step-by-step walkthrough of the Microsoft Learn Student Hub and free exam voucher pathways.',
  },
];

/**
 * Mutable runtime state shared across route modules. Routes read and reassign
 * fields on this object (e.g. `store.posts = store.posts.filter(...)`).
 */
export const store: {
  posts: PostItem[];
  socialAccounts: SocialAccountRecord[];
  tiktokTokens: TiktokTokens;
  metaTokens: MetaTokens;
  googleTokens: GoogleTokens;
} = {
  posts: [...defaultPosts],
  socialAccounts: [...defaultSocialAccounts],
  tiktokTokens: {},
  metaTokens: {},
  googleTokens: {},
};

const STORAGE_FILE = path.join(process.cwd(), 'creator_storage.json');

/** Load persisted state from disk into {@link store}, merging over defaults. */
export function loadStorage(): void {
  try {
    if (!fs.existsSync(STORAGE_FILE)) return;
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
      store.posts = data.posts;
    }
    if (data.socialAccounts && Array.isArray(data.socialAccounts) && data.socialAccounts.length > 0) {
      store.socialAccounts = defaultSocialAccounts.map((defAcc) => {
        const saved = data.socialAccounts.find((s: any) => s.id === defAcc.id);
        return saved ? { ...defAcc, ...saved } : defAcc;
      });
    }
    if (data.googleTokens) store.googleTokens = { ...store.googleTokens, ...data.googleTokens };
    if (data.tiktokTokens) store.tiktokTokens = { ...store.tiktokTokens, ...data.tiktokTokens };
    if (data.metaTokens) store.metaTokens = { ...store.metaTokens, ...data.metaTokens };
    logger.info('✅ Persistent store loaded successfully from disk.');
  } catch (err) {
    logger.error('Failed to load storage file:', err);
  }
}

/** Persist the current {@link store} state to disk. */
export function saveStorage(): void {
  try {
    const data = {
      posts: store.posts,
      socialAccounts: store.socialAccounts,
      googleTokens: store.googleTokens,
      tiktokTokens: store.tiktokTokens,
      metaTokens: store.metaTokens,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    logger.error('Failed to write storage file:', err);
  }
}
