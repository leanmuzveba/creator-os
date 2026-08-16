import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI client lazily if key exists
let genAiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAiClient && process.env.GEMINI_API_KEY) {
    genAiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAiClient;
}

// In-memory data store for Creator OS
export interface PostItem {
  id: string;
  title: string;
  category: 'Tech Education' | 'Breaking Into Tech' | 'Free Tech Resources' | 'Student & Academic Life' | 'Microsoft Journey';
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

const defaultPosts: PostItem[] = [
  {
    id: 'post-1',
    title: 'AI Tools Every Student Should Know',
    category: 'Free Tech Resources',
    platforms: ['tiktok', 'instagram'],
    status: 'published',
    publishedDate: '2025-05-15',
    caption: 'These AI tools changed the way I study! 🚀 Save this for later!\n\nStop wasting hours summarizing papers when you can automate your revision and project workflows.',
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
        'Tool 3: Notion AI to turn lecture voice notes into flashcards.'
      ],
      cta: 'Comment "AI" and I will DM you the complete student toolkit list!',
      shotList: [
        { shot: 1, visual: 'Direct close-up speaking with urgency, holding phone', audio: 'Stop scrolling if you are a student in tech...', timing: '0:00 - 0:04' },
        { shot: 2, visual: 'Screen record overlay showing PDF summarizer speed', audio: 'Instead of skimming 40 pages, drop the link here...', timing: '0:05 - 0:18' },
        { shot: 3, visual: 'Split screen Notion template live demo', audio: 'Next, convert those notes into exam flashcards...', timing: '0:19 - 0:35' },
        { shot: 4, visual: 'Lean pointing to screen + sticker animation', audio: 'Save this and follow for daily tech guides!', timing: '0:36 - 0:45' }
      ]
    }
  },
  {
    id: 'post-2',
    title: 'How I Got My First Tech Internship',
    category: 'Breaking Into Tech',
    platforms: ['youtube', 'tiktok'],
    status: 'published',
    publishedDate: '2025-05-13',
    caption: 'No CS degree? Here is the exact portfolio strategy I used to get interviews at top tech companies as a student.',
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
    status: 'published',
    publishedDate: '2025-05-12',
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
    status: 'draft',
    caption: '3 Python one-liners that will make your code look senior level ✨',
    hashtags: ['#python', '#learntocode', '#programming', '#softwareengineer'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    duration: '00:35'
  },
  {
    id: 'post-5',
    title: 'GitHub Portfolio Guide',
    category: 'Breaking Into Tech',
    platforms: ['instagram', 'youtube'],
    status: 'scheduled',
    scheduledDate: '2025-05-20',
    scheduledTime: '10:00 AM',
    caption: 'How to structure your GitHub README so recruiters actually look at your code. Full step-by-step breakdown!',
    hashtags: ['#github', '#portfoliotips', '#techstudents', '#softwaredev'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80',
    duration: '00:50'
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
    duration: '01:10'
  }
];

// Connected platforms default status
const defaultSocialAccounts = [
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
    status: 'active'
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
    status: 'active'
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
    status: 'active'
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
    status: 'active'
  }
];

let posts: PostItem[] = [...defaultPosts];
let socialAccounts = [...defaultSocialAccounts];

let tiktokTokens: {
  accessToken?: string;
  refreshToken?: string;
  openId?: string;
  expiresAt?: number;
} = {};

let metaTokens: {
  instagram?: { accessToken: string; expiresAt: number; userId?: string };
  facebook?: { accessToken: string; expiresAt: number; pageId?: string };
} = {};

let googleTokens: {
  youtube?: { accessToken: string; refreshToken?: string; expiresAt: number; channelId?: string };
} = {};

const STORAGE_FILE = path.join(process.cwd(), 'creator_storage.json');

function loadStorage() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.posts && Array.isArray(data.posts) && data.posts.length > 0) {
        posts = data.posts;
      }
      if (data.socialAccounts && Array.isArray(data.socialAccounts) && data.socialAccounts.length > 0) {
        socialAccounts = defaultSocialAccounts.map((defAcc) => {
          const saved = data.socialAccounts.find((s: any) => s.id === defAcc.id);
          return saved ? { ...defAcc, ...saved } : defAcc;
        });
      }
      if (data.googleTokens) googleTokens = { ...googleTokens, ...data.googleTokens };
      if (data.tiktokTokens) tiktokTokens = { ...tiktokTokens, ...data.tiktokTokens };
      if (data.metaTokens) metaTokens = { ...metaTokens, ...data.metaTokens };
      console.log('✅ Persistent store loaded successfully from disk.');
    }
  } catch (err) {
    console.error('Failed to load storage file:', err);
  }
}

function saveStorage() {
  try {
    const data = {
      posts,
      socialAccounts,
      googleTokens,
      tiktokTokens,
      metaTokens,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write storage file:', err);
  }
}

// Initial storage load
loadStorage();

// Trends feed
const trendsFeed = [
  {
    id: 'trend-1',
    topic: 'AI Tools',
    hashtag: '#AITools',
    growth: '↑ 120%',
    platform: 'tiktok',
    volume: '2.4M posts',
    category: 'Free Tech Resources',
    summary: 'Students and early career devs are searching for AI workflow accelerators for revision, coding prompts, and study summaries.',
    whyItWorks: 'High utility value. People instantly save bookmarks and share with classmates to reference during exams or deadlines.',
    hookFormula: '"If you are still doing [boring manual task] in 2025, you need to see this free AI tool..."',
    leanAdaptation: 'Show 3 lesser-known AI productivity tools specifically tailored for student developers or non-traditional tech learners.'
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
    leanAdaptation: 'A 45-second vlog showing your real daily routine balancing university assignments, coding practice, and content creation.'
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
    hookFormula: '"Most people use ChatGPT like Google. Here are 3 prompts that make it act like a Senior Developer mentor."',
    leanAdaptation: 'Demonstrate a live prompt that reviews your resume or debugs a React/Python code snippet.'
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
    leanAdaptation: 'Breakdown of the 3 portfolio projects that actually get recruiter callbacks, avoiding generic clone apps.'
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
    leanAdaptation: 'Step-by-step walkthrough of the Microsoft Learn Student Hub and free exam voucher pathways.'
  }
];

// --- ROUTES ---

// 1. Get All Posts
app.get('/api/posts', (req, res) => {
  const { status, category, platform } = req.query;
  let filtered = [...posts];

  if (status && status !== 'all') {
    filtered = filtered.filter(p => p.status === status);
  }
  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }
  if (platform && platform !== 'all') {
    filtered = filtered.filter(p => p.platforms.includes(platform as any));
  }

  res.json(filtered);
});

// 2. Create Post
app.post('/api/posts', (req, res) => {
  const newPost: PostItem = {
    id: `post-${Date.now()}`,
    title: req.body.title || 'Untitled Post',
    category: req.body.category || 'Tech Education',
    platforms: req.body.platforms || ['tiktok'],
    status: req.body.status || 'draft',
    scheduledDate: req.body.scheduledDate,
    scheduledTime: req.body.scheduledTime,
    publishedDate: req.body.status === 'published' ? new Date().toISOString().split('T')[0] : undefined,
    caption: req.body.caption || '',
    hashtags: req.body.hashtags || [],
    thumbnailUrl: req.body.thumbnailUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    videoUrl: req.body.videoUrl,
    duration: req.body.duration || '00:45',
    views: req.body.status === 'published' ? Math.floor(Math.random() * 50000) + 5000 : undefined,
    likes: req.body.status === 'published' ? Math.floor(Math.random() * 5000) + 500 : undefined,
    comments: req.body.status === 'published' ? Math.floor(Math.random() * 200) + 20 : undefined,
    shares: req.body.status === 'published' ? Math.floor(Math.random() * 150) + 10 : undefined,
    bookmarks: req.body.status === 'published' ? Math.floor(Math.random() * 400) + 50 : undefined,
    metricsGrowth: '↑ ' + (Math.floor(Math.random() * 20) + 5) + '%',
    script: req.body.script
  };

  posts.unshift(newPost);
  saveStorage();
  res.status(201).json(newPost);
});

// 3. Update Post
app.put('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  posts[index] = {
    ...posts[index],
    ...req.body
  };

  saveStorage();
  res.json(posts[index]);
});

// 4. Delete Post
app.delete('/api/posts/:id', (req, res) => {
  const { id } = req.params;
  posts = posts.filter(p => p.id !== id);
  saveStorage();
  res.json({ success: true, id });
});

// 5. Social Accounts
app.get('/api/accounts', (req, res) => {
  res.json(socialAccounts);
});

// Batch sync/save social accounts state from client
app.post('/api/accounts/sync', (req, res) => {
  const incomingAccounts = req.body;
  if (Array.isArray(incomingAccounts) && incomingAccounts.length > 0) {
    socialAccounts = socialAccounts.map(existing => {
      const matched = incomingAccounts.find((inc: any) => inc.id === existing.id);
      if (matched) {
        return {
          ...existing,
          ...matched,
          connected: matched.connected !== undefined ? matched.connected : existing.connected,
        };
      }
      return existing;
    });
    saveStorage();
  }
  res.json(socialAccounts);
});

// Reset social accounts to default state
app.post('/api/accounts/reset', (req, res) => {
  socialAccounts = defaultSocialAccounts.map(a => ({ ...a }));
  saveStorage();
  res.json(socialAccounts);
});

// TikTok OAuth helper to construct redirect URI
function getTikTokRedirectUri(req: express.Request): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/tiktok/callback`;
}

// 5a. Get TikTok OAuth authorization URL
app.get('/api/auth/tiktok/url', (req, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = getTikTokRedirectUri(req);
  const state = 'creator_os_' + Math.random().toString(36).substring(2, 15);
  // Default to user.info.basic for universal compatibility with all TikTok app tiers
  const requestedScope = (req.query.scope as string) || 'user.info.basic';

  if (!clientKey) {
    return res.json({
      configured: false,
      redirectUri,
      devCallbackUrl: 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback',
      sharedCallbackUrl: 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback',
      scopes: requestedScope,
      message: 'TIKTOK_CLIENT_KEY not configured in environment variables yet.',
    });
  }

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: requestedScope,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state,
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
    state,
  });
});

// 5b. TikTok OAuth Callback Endpoint (handles redirect from TikTok)
app.get(['/api/auth/tiktok/callback', '/api/auth/tiktok/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Access denied by user';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>TikTok Authorization Failed</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #131627;">
            <h2 style="color: #f43f5e; margin-bottom: 8px;">Authentication Failed</h2>
            <p style="color: #94a3b8; font-size: 14px;">${errorMsg}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'tiktok', error: '${errorMsg}' }, '*');
                setTimeout(() => window.close(), 2500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = getTikTokRedirectUri(req);

    const existingTiktokAcc = socialAccounts.find((a) => a.id === 'tiktok');
    let profileDisplayName = existingTiktokAcc?.handle || '@my_tiktok';
    let profileAvatar = existingTiktokAcc?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    if (clientKey && clientSecret) {
      // Exchange code for token
      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      console.log('TikTok OAuth token response:', tokenData);

      if (tokenData.error) {
        const errorDetail = tokenData.error_description || (typeof tokenData.error === 'object' ? tokenData.error.message || tokenData.error.code : tokenData.error);
        console.warn('TikTok token error received:', errorDetail);
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>TikTok Authorization Failed</title></head>
            <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #131627;">
                <h2 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 18px;">TikTok Connection Notice</h2>
                <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorDetail || 'Could not verify token. In TikTok Sandbox mode, ensure your redirect URI matches and your user is whitelisted.'}</p>
                <button onclick="window.close()" style="background: #e11d48; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'tiktok', error: '${errorDetail || 'Authentication failed'}' }, '*');
                  }
                </script>
              </div>
            </body>
          </html>
        `);
      }

      if (tokenData.access_token) {
        tiktokTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          openId: tokenData.open_id,
          expiresAt: Date.now() + (tokenData.expires_in || 86400) * 1000,
        };

        // Fetch User Info & Stats from TikTok API v2 (with fallback if stats scope is unapproved)
        try {
          let userRes = await fetch(
            'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count',
            {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            }
          );
          let userData = await userRes.json();
          console.log('TikTok user info response:', userData);

          // If stats fields caused an error code, fallback to basic fields
          if (!userData.data?.user && userData.error?.code && userData.error?.code !== 'ok') {
            console.log('Retrying user info with basic fields only...');
            userRes = await fetch(
              'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
              {
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                },
              }
            );
            userData = await userRes.json();
            console.log('TikTok fallback user info response:', userData);
          }

          if (userData.data?.user) {
            const u = userData.data.user;
            if (u.username) {
              profileDisplayName = `@${u.username}`;
            } else if (u.display_name) {
              profileDisplayName = `@${u.display_name.replace(/\s+/g, '_').toLowerCase()}`;
            }
            if (u.avatar_url) {
              profileAvatar = u.avatar_url;
            }

            const tiktokAcc = socialAccounts.find((a) => a.id === 'tiktok');
            if (tiktokAcc) {
              if (u.follower_count !== undefined && u.follower_count !== null) {
                const count = Number(u.follower_count);
                tiktokAcc.followers = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
              }
              if (u.likes_count !== undefined && u.likes_count !== null) {
                const likes = Number(u.likes_count);
                tiktokAcc.views = likes >= 1000 ? `${(likes / 1000).toFixed(1)}K` : `${likes}`;
              }
            }
          }
        } catch (uErr) {
          console.warn('Could not fetch TikTok user info:', uErr);
        }

        // Also attempt video query to calculate total video views/engagement
        try {
          const videoRes = await fetch('https://open.tiktokapis.com/v2/video/list/?fields=id,title,view_count,like_count,comment_count,share_count', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ max_count: 20 }),
          });
          const videoData = await videoRes.json();
          console.log('TikTok video list response:', videoData);
          if (videoData.data?.videos && Array.isArray(videoData.data.videos)) {
            const videos = videoData.data.videos;
            const totalViews = videos.reduce((acc: number, v: any) => acc + (Number(v.view_count) || 0), 0);
            const tiktokAcc = socialAccounts.find((a) => a.id === 'tiktok');
            if (tiktokAcc && totalViews > 0) {
              tiktokAcc.views = totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : `${totalViews}`;
            }
          }
        } catch (vErr) {
          console.warn('Could not fetch TikTok videos:', vErr);
        }
      }
    }

    // Update in-memory TikTok account record
    const tiktokAcc = socialAccounts.find((a) => a.id === 'tiktok');
    if (tiktokAcc) {
      tiktokAcc.connected = true;
      tiktokAcc.handle = profileDisplayName;
      tiktokAcc.avatar = profileAvatar;
      tiktokAcc.status = 'active';
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>TikTok Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 32px; border: 1px solid rgba(236,72,153,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(236,72,153,0.2); border: 2px solid #ec4899; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">TikTok Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Account ${profileDisplayName} has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'tiktok', handle: '${profileDisplayName}' }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('TikTok OAuth exchange error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange authorization code'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'tiktok', error: '${err.message || 'Token exchange failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});

// Meta (Instagram & Facebook) OAuth helper to construct redirect URI
function getMetaRedirectUri(req: express.Request, platform: 'instagram' | 'facebook'): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/${platform}/callback`;
}

// 5c. Instagram OAuth Authorization URL
app.get('/api/auth/instagram/url', (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = getMetaRedirectUri(req, 'instagram');
  const state = 'creator_os_ig_' + Math.random().toString(36).substring(2, 15);
  // Default to standard public_profile only so no unrequested permissions are sent
  const scope = (req.query.scope as string) || 'public_profile';

  if (!appId) {
    return res.json({
      configured: false,
      redirectUri,
      devCallbackUrl: 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/instagram/callback',
      sharedCallbackUrl: 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/instagram/callback',
      scopes: scope,
      message: 'META_APP_ID not configured in environment variables yet.',
    });
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
    state: state,
  });

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
    state,
  });
});

// 5d. Instagram OAuth Callback Endpoint
app.get(['/api/auth/instagram/callback', '/api/auth/instagram/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Access denied';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Instagram Authorization Failed</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #131627;">
            <h2 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 18px;">Instagram Connection Notice</h2>
            <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorMsg}</p>
            <button onclick="window.close()" style="background: #e11d48; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'instagram', error: '${errorMsg}' }, '*');
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = getMetaRedirectUri(req, 'instagram');

    const existingIgAcc = socialAccounts.find((a) => a.id === 'instagram');
    let profileDisplayName = existingIgAcc?.handle || '@creator_ig';
    let profileAvatar = existingIgAcc?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    if (appId && appSecret) {
      // Exchange code for short-lived User Access Token
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code as string,
      }).toString()}`;

      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();
      console.log('Meta Instagram OAuth token response:', tokenData);

      if (tokenData.access_token) {
        metaTokens.instagram = {
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
        };

        // Query Connected Instagram Business Account via Pages
        try {
          const accountsRes = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account{id,username,profile_picture_url,followers_count,media_count}&access_token=${tokenData.access_token}`
          );
          const accountsData = await accountsRes.json();
          console.log('Meta Instagram pages/business account response:', accountsData);

          if (accountsData.data && accountsData.data.length > 0) {
            for (const page of accountsData.data) {
              if (page.instagram_business_account) {
                const ig = page.instagram_business_account;
                if (ig.username) profileDisplayName = `@${ig.username}`;
                if (ig.profile_picture_url) profileAvatar = ig.profile_picture_url;
                if (existingIgAcc && ig.followers_count !== undefined) {
                  const fc = Number(ig.followers_count);
                  existingIgAcc.followers = fc >= 1000 ? `${(fc / 1000).toFixed(1)}K` : `${fc}`;
                }
                break;
              }
            }
          }
        } catch (igErr) {
          console.warn('Could not fetch Instagram business profile:', igErr);
        }
      }
    }

    if (existingIgAcc) {
      existingIgAcc.connected = true;
      existingIgAcc.handle = profileDisplayName;
      existingIgAcc.avatar = profileAvatar;
      existingIgAcc.status = 'active';
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Instagram Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 32px; border: 1px solid rgba(236,72,153,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(236,72,153,0.2); border: 2px solid #ec4899; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">Instagram Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Account ${profileDisplayName} has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'instagram', handle: '${profileDisplayName}' }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Instagram OAuth error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange Instagram authorization'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'instagram', error: '${err.message || 'Instagram connection failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});

// 5e. Facebook OAuth Authorization URL
app.get('/api/auth/facebook/url', (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = getMetaRedirectUri(req, 'facebook');
  const state = 'creator_os_fb_' + Math.random().toString(36).substring(2, 15);
  // Default to public_profile only (no email required)
  const scope = (req.query.scope as string) || 'public_profile';

  if (!appId) {
    return res.json({
      configured: false,
      redirectUri,
      devCallbackUrl: 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/facebook/callback',
      sharedCallbackUrl: 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/facebook/callback',
      scopes: scope,
      message: 'META_APP_ID not configured in environment variables yet.',
    });
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
    state: state,
  });

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
    state,
  });
});

// 5f. Facebook OAuth Callback Endpoint
app.get(['/api/auth/facebook/callback', '/api/auth/facebook/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Access denied';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Facebook Authorization Failed</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(59,130,246,0.3); border-radius: 16px; background: #131627;">
            <h2 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 18px;">Facebook Connection Notice</h2>
            <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorMsg}</p>
            <button onclick="window.close()" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'facebook', error: '${errorMsg}' }, '*');
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = getMetaRedirectUri(req, 'facebook');

    const existingFbAcc = socialAccounts.find((a) => a.id === 'facebook');
    let profileDisplayName = existingFbAcc?.handle || 'Creator Page';
    let profileAvatar = existingFbAcc?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    if (appId && appSecret) {
      const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code: code as string,
      }).toString()}`;

      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();
      console.log('Meta Facebook OAuth token response:', tokenData);

      if (tokenData.access_token) {
        metaTokens.facebook = {
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
        };

        // Query Managed Facebook Pages
        try {
          const pagesRes = await fetch(
            `https://graph.facebook.com/v19.0/me/accounts?fields=name,id,fan_count,picture{url}&access_token=${tokenData.access_token}`
          );
          const pagesData = await pagesRes.json();
          console.log('Meta Facebook pages response:', pagesData);

          if (pagesData.data && pagesData.data.length > 0) {
            const page = pagesData.data[0];
            if (page.name) profileDisplayName = page.name;
            if (page.picture?.data?.url) profileAvatar = page.picture.data.url;
            if (existingFbAcc && page.fan_count !== undefined) {
              const count = Number(page.fan_count);
              existingFbAcc.followers = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
            }
          }
        } catch (fbErr) {
          console.warn('Could not fetch Facebook pages:', fbErr);
        }
      }
    }

    if (existingFbAcc) {
      existingFbAcc.connected = true;
      existingFbAcc.handle = profileDisplayName;
      existingFbAcc.avatar = profileAvatar;
      existingFbAcc.status = 'active';
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Facebook Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 32px; border: 1px solid rgba(59,130,246,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(59,130,246,0.2); border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">Facebook Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Page ${profileDisplayName} has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'facebook', handle: '${profileDisplayName}' }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Facebook OAuth error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange Facebook authorization'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'facebook', error: '${err.message || 'Facebook connection failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});

// Google / YouTube OAuth helper
function getYouTubeRedirectUri(req: express.Request): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/youtube/callback`;
}

// 5e. YouTube OAuth Authorization URL
app.get('/api/auth/youtube/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getYouTubeRedirectUri(req);
  const state = 'creator_os_yt_' + Math.random().toString(36).substring(2, 15);
  // Request YouTube readonly channel access and profile
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/userinfo.profile'
  ].join(' ');

  if (!clientId) {
    return res.json({
      configured: false,
      message: 'GOOGLE_CLIENT_ID not found in environment variables',
      redirectUri,
    });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  }).toString()}`;

  res.json({
    configured: true,
    url: authUrl,
    redirectUri,
  });
});

// 5f. YouTube OAuth Callback Handler
app.get('/api/auth/youtube/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    console.error('YouTube OAuth authorization error:', error, error_description);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3 style="color: #ef4444;">YouTube Authorization Cancelled</h3>
          <p>${error_description || error}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'youtube', error: '${error}' }, '*');
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getYouTubeRedirectUri(req);

    const existingYtAcc = socialAccounts.find((a) => a.id === 'youtube');
    let channelTitle = existingYtAcc?.handle || 'YouTube Creator';
    let channelAvatar = existingYtAcc?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    if (clientId && clientSecret) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      console.log('Google YouTube OAuth token response status:', tokenRes.status);

      if (tokenData.access_token) {
        googleTokens.youtube = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
        };

        // Fetch live YouTube channel details via YouTube Data API v3
        try {
          const ytRes = await fetch(
            'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
            {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            }
          );
          const ytData = await ytRes.json();
          console.log('YouTube channels response:', ytData);

          if (ytData.items && ytData.items.length > 0) {
            const channel = ytData.items[0];
            if (channel.snippet?.title) {
              channelTitle = channel.snippet.customUrl || channel.snippet.title;
            }
            if (channel.snippet?.thumbnails?.default?.url) {
              channelAvatar = channel.snippet.thumbnails.default.url;
            }
            if (existingYtAcc && channel.statistics) {
              const subs = Number(channel.statistics.subscriberCount);
              if (!isNaN(subs)) {
                existingYtAcc.followers = subs >= 1000 ? `${(subs / 1000).toFixed(1)}K` : `${subs}`;
              }
              const views = Number(channel.statistics.viewCount);
              if (!isNaN(views)) {
                existingYtAcc.views = views >= 1000000 ? `${(views / 1000000).toFixed(1)}M` : views >= 1000 ? `${(views / 1000).toFixed(1)}K` : `${views}`;
              }
            }
          }
        } catch (ytErr) {
          console.warn('Could not fetch YouTube channel data:', ytErr);
        }
      }
    }

    if (existingYtAcc) {
      existingYtAcc.connected = true;
      existingYtAcc.handle = channelTitle;
      existingYtAcc.avatar = channelAvatar;
      existingYtAcc.status = 'active';
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>YouTube Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 32px; border: 1px solid rgba(239,68,68,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(239,68,68,0.2); border: 2px solid #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">YouTube Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Channel <strong>${channelTitle}</strong> has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'youtube', handle: '${channelTitle}' }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('YouTube OAuth error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange YouTube authorization'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'youtube', error: '${err.message || 'YouTube connection failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});


app.post('/api/accounts/:id/toggle', (req, res) => {
  const { id } = req.params;
  const account = socialAccounts.find(a => a.id === id);
  if (account) {
    account.connected = !account.connected;
    saveStorage();
    res.json(account);
  } else {
    res.status(404).json({ error: 'Account not found' });
  }
});

// Update specific account metrics/handle
app.put('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const account = socialAccounts.find(a => a.id === id);
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  const { handle, followers, views, viewsGrowth, avatar } = req.body;
  if (handle !== undefined) account.handle = handle;
  if (followers !== undefined) account.followers = followers;
  if (views !== undefined) account.views = views;
  if (viewsGrowth !== undefined) account.viewsGrowth = viewsGrowth;
  if (avatar !== undefined) account.avatar = avatar;

  saveStorage();
  res.json(account);
});

// 6. Trends Feed
app.get('/api/trends', (req, res) => {
  const { platform } = req.query;
  if (platform && platform !== 'all' && platform !== 'for_you') {
    res.json(trendsFeed.filter(t => t.platform === platform));
  } else {
    res.json(trendsFeed);
  }
});

// 7. Analytics Data (Dynamically aggregated from connected social accounts)
function parseMetricServer(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().toUpperCase().replace(/,/g, '');
  if (str.endsWith('B')) return (parseFloat(str.slice(0, -1)) || 0) * 1000000000;
  if (str.endsWith('M')) return (parseFloat(str.slice(0, -1)) || 0) * 1000000;
  if (str.endsWith('K')) return (parseFloat(str.slice(0, -1)) || 0) * 1000;
  return parseFloat(str) || 0;
}

function formatMetricServer(num: number): string {
  if (isNaN(num) || num <= 0) return '0';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return Math.round(num).toLocaleString();
}

app.get('/api/analytics', (req, res) => {
  const range = (req.query.range as string) || '7d';

  const tiktokAcc = socialAccounts.find((a) => a.id === 'tiktok');
  const igAcc = socialAccounts.find((a) => a.id === 'instagram');
  const ytAcc = socialAccounts.find((a) => a.id === 'youtube');
  const fbAcc = socialAccounts.find((a) => a.id === 'facebook');

  const tiktokViews = parseMetricServer(tiktokAcc?.views);
  const igViews = parseMetricServer(igAcc?.views);
  const ytViews = parseMetricServer(ytAcc?.views);
  const fbViews = parseMetricServer(fbAcc?.views);

  const tiktokFollowers = parseMetricServer(tiktokAcc?.followers);
  const igFollowers = parseMetricServer(igAcc?.followers);
  const ytFollowers = parseMetricServer(ytAcc?.followers);
  const fbFollowers = parseMetricServer(fbAcc?.followers);

  const totalViews = tiktokViews + igViews + ytViews + fbViews;
  const totalFollowers = tiktokFollowers + igFollowers + ytFollowers + fbFollowers;
  const totalReach = Math.round(totalViews * 0.72);
  const totalEngagement = Math.round(totalViews * 0.095);
  const newFollowers = Math.round(totalFollowers * 0.024);

  // Generate dynamic time-series points ending at the current latest view counts
  let numDays = 7;
  if (range === '14d') numDays = 14;
  else if (range === '30d') numDays = 30;
  else if (range === '90d') numDays = 12; // weekly intervals
  else if (range === 'all') numDays = 12; // monthly/quarterly intervals

  const now = new Date();
  const viewSeries = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * (range === '90d' ? 7 : range === 'all' ? 30 : 1));
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Progression ratio from ~60% up to 100% on the final day
    const progress = 1 - (i / (numDays - 1 || 1)) * 0.4;
    // Add small realistic daily fluctuation
    const noise = i === 0 ? 1 : 0.96 + ((i * 17) % 9) * 0.01;
    const factor = progress * noise;

    const curTt = Math.round(tiktokViews * factor);
    const curIg = Math.round(igViews * factor);
    const curYt = Math.round(ytViews * factor);
    const curFb = Math.round(fbViews * factor);

    viewSeries.push({
      date: dateLabel,
      tiktok: curTt,
      instagram: curIg,
      youtube: curYt,
      facebook: curFb,
      total: curTt + curIg + curYt + curFb,
    });
  }

  const overview = {
    views: { value: formatMetricServer(totalViews), numericValue: totalViews, growth: '+16.8%', trend: 'up' },
    reach: { value: formatMetricServer(totalReach), numericValue: totalReach, growth: '+12.3%', trend: 'up' },
    engagement: { value: formatMetricServer(totalEngagement), numericValue: totalEngagement, growth: '+9.6%', trend: 'up' },
    newFollowers: { value: formatMetricServer(newFollowers), numericValue: newFollowers, growth: '+10.1%', trend: 'up' }
  };

  const platformPerformance = [
    {
      platform: 'TikTok',
      views: tiktokAcc?.views || formatMetricServer(tiktokViews),
      reach: formatMetricServer(tiktokViews * 0.74),
      engagement: formatMetricServer(tiktokViews * 0.099),
      growth: tiktokAcc?.viewsGrowth || '+18.6%',
      color: '#25f4ee',
      postsCount: 14,
      connected: tiktokAcc?.connected || false,
    },
    {
      platform: 'Instagram',
      views: igAcc?.views || formatMetricServer(igViews),
      reach: formatMetricServer(igViews * 0.76),
      engagement: formatMetricServer(igViews * 0.099),
      growth: igAcc?.viewsGrowth || '+12.4%',
      color: '#e1306c',
      postsCount: 11,
      connected: igAcc?.connected || false,
    },
    {
      platform: 'YouTube',
      views: ytAcc?.views || formatMetricServer(ytViews),
      reach: formatMetricServer(ytViews * 0.78),
      engagement: formatMetricServer(ytViews * 0.113),
      growth: ytAcc?.viewsGrowth || '+9.3%',
      color: '#ff0000',
      postsCount: 8,
      connected: ytAcc?.connected || false,
    },
    {
      platform: 'Facebook',
      views: fbAcc?.views || formatMetricServer(fbViews),
      reach: formatMetricServer(fbViews * 0.78),
      engagement: formatMetricServer(fbViews * 0.099),
      growth: fbAcc?.viewsGrowth || '+6.8%',
      color: '#1877f2',
      postsCount: 5,
      connected: fbAcc?.connected || false,
    }
  ];

  const categoryBreakdown = [
    { category: 'Free Tech Resources', percentage: 38, views: formatMetricServer(totalViews * 0.38), color: '#8b5cf6' },
    { category: 'Breaking Into Tech', percentage: 26, views: formatMetricServer(totalViews * 0.26), color: '#06b6d4' },
    { category: 'Tech Education', percentage: 18, views: formatMetricServer(totalViews * 0.18), color: '#ec4899' },
    { category: 'Student & Academic Life', percentage: 12, views: formatMetricServer(totalViews * 0.12), color: '#10b981' },
    { category: 'Microsoft Journey', percentage: 6, views: formatMetricServer(totalViews * 0.06), color: '#f59e0b' }
  ];

  res.json({
    range,
    overview,
    viewSeries,
    platformPerformance,
    categoryBreakdown,
    topPost: posts[0]
  });
});

// 8. Gemini AI Assistant endpoint
app.post('/api/ai/generate', async (req, res) => {
  const { type, prompt, category, platform } = req.body;
  const ai = getGenAI();

  const selectedCategory = category || 'Free Tech Resources';
  const targetPlatform = platform || 'All Platforms';

  if (!ai) {
    // Fallback high-quality curated creator responses if no API key is set yet
    const fallbackResults = generateFallbackAI({ type, prompt, category: selectedCategory, platform: targetPlatform });
    return res.json({ result: fallbackResults, isMock: true });
  }

  try {
    let systemInstruction = `You are the specialized AI Content Intelligence Engine for "Creator OS", built specifically for Lean — a tech creator, computer science student, and Microsoft Student Ambassador.
Lean produces high-engagement short-form content for TikTok, Instagram Reels, YouTube Shorts, and Facebook.
Her 5 Core Content Pillars are:
1. Tech Education (Coding tips, software concepts, developer tutorials)
2. Breaking Into Tech (Non-traditional pathways, resumes, portfolio tips, interviews)
3. Free Tech Resources (Free tools, APIs, learning hubs, certification vouchers)
4. Student & Academic Life (Study systems, GPA tips, balancing work and uni, tech college hacks)
5. Microsoft Journey (Azure credits, Microsoft Learn certifications, student programs)

Always format outputs in clean, structured JSON with engaging hooks, viral formulas, retention techniques, and specific calls to action.`;

    let userPrompt = '';

    if (type === 'ideas') {
      userPrompt = `Generate 4 viral, high-retention video content ideas for the pillar "${selectedCategory}" targeted at ${targetPlatform}.
User input/topic: "${prompt || 'Trending tech hacks for students'}"

Return JSON matching this schema:
[
  {
    "title": "Clear punchy video title",
    "potential": "High engagement potential" | "Viral potential" | "Medium engagement potential",
    "description": "Brief 1-2 sentence concept explanation",
    "hook": "Spoken opening hook (first 3 seconds)",
    "category": "${selectedCategory}",
    "bestPlatform": "TikTok" | "Instagram" | "YouTube" | "Facebook"
  }
]`;
    } else if (type === 'hooks') {
      userPrompt = `Generate 5 viral video hooks for a video about "${prompt || selectedCategory}" within the "${selectedCategory}" pillar for ${targetPlatform}.
Include visual hook, spoken hook, and on-screen text for each.
Return JSON matching this schema:
[
  {
    "spokenHook": "What Lean says in the first 3 seconds",
    "visualHook": "What is shown on camera (e.g. split screen, holding phone, pointing)",
    "onScreenText": "BOLD TEXT on screen",
    "viralCategory": "Negative Hook" | "Curiosity Gap" | "Authority/Result" | "Relatable Pain Point",
    "potentialScore": "9.8/10"
  }
]`;
    } else if (type === 'scripts') {
      userPrompt = `Generate a complete 45-60 second short-form video script for "${prompt || 'Free AI Tools for Students'}" in category "${selectedCategory}".
Return JSON matching this schema:
{
  "title": "Video title",
  "hook": "Opening 0-4s spoken hook",
  "body": [
    "Point 1 with clear punchy explanation (0:05 - 0:18)",
    "Point 2 with actionable demo tip (0:19 - 0:34)",
    "Point 3 / key takeaway (0:35 - 0:45)"
  ],
  "cta": "Strong conversion CTA (e.g. comment 'TOOL' or follow)",
  "caption": "Ready-to-paste caption with emojis and hashtags",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "shotList": [
    {"shot": 1, "visual": "Visual camera action description", "audio": "Voiceover line", "timing": "0:00 - 0:04"},
    {"shot": 2, "visual": "Screen share or b-roll demo", "audio": "Voiceover line", "timing": "0:05 - 0:18"},
    {"shot": 3, "visual": "Action shot or UI walkthrough", "audio": "Voiceover line", "timing": "0:19 - 0:34"},
    {"shot": 4, "visual": "Outro pointing to subscribe / comment", "audio": "CTA voiceover line", "timing": "0:35 - 0:45"}
  ]
}`;
    } else if (type === 'shotlist') {
      userPrompt = `Generate a comprehensive video Shot List and Production Guide for a 60-second video on "${prompt || selectedCategory}".
Return JSON:
{
  "totalDuration": "00:55",
  "recommendedMusic": "Lo-Fi study beat or trending electronic tech sound",
  "shots": [
    {
      "shotNumber": 1,
      "type": "Close-up (CU)",
      "angle": "Eye level",
      "visual": "Lean sitting at desk with laptop open looking directly into camera with energized expression",
      "audio": "Did you know you can get free certifications that recruiters actually care about?",
      "onScreenGraphics": "FREE TECH CERTIFICATIONS 🎓",
      "duration": "4s"
    },
    {
      "shotNumber": 2,
      "type": "Over-the-shoulder (OTS) / Screen capture",
      "angle": "High angle screen focus",
      "visual": "Browser showing Microsoft Learn portal and free exam voucher button",
      "audio": "Head to this specific portal and sign in with your student email...",
      "onScreenGraphics": "Step 1: Student Verification 🔐",
      "duration": "14s"
    },
    {
      "shotNumber": 3,
      "type": "Medium Shot (MS)",
      "angle": "Slight low angle dynamic",
      "visual": "Lean holding notebook or certificate preview on iPad",
      "audio": "Once completed, add this badge directly to your LinkedIn header.",
      "onScreenGraphics": "Instant LinkedIn Badge 🚀",
      "duration": "12s"
    }
  ],
  "editingTips": [
    "Keep jump cuts every 2.5 seconds to maintain high viewer retention",
    "Add sound effects (whoosh / pop) on every on-screen text banner",
    "Color grade with high contrast and slight cool tones for clean modern aesthetic"
  ]
}`;
    } else if (type === 'trend_analysis') {
      userPrompt = `Analyze the trend "${prompt}" for creator Lean.
Return JSON:
{
  "topic": "${prompt}",
  "summary": "What is driving this trend right now",
  "whyItWorks": "Psychological/algorithmic reason behind virality",
  "hookFormula": "Exact template formula to replicate",
  "leanAdaptation": "Actionable 3-step recommendation for Lean to adapt this to her tech/student community",
  "suggestedTitle": "Proposed video title",
  "suggestedHashtags": ["#tag1", "#tag2", "#tag3"]
}`;
    } else {
      userPrompt = `Generate creative suggestions for creator Lean about "${prompt}". Return JSON format.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.8,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json({ result: parsed, isMock: false });
  } catch (err: any) {
    console.error('Gemini generation error, falling back:', err);
    const fallback = generateFallbackAI({ type, prompt, category: selectedCategory, platform: targetPlatform });
    res.json({ result: fallback, isMock: true, error: err.message });
  }
});

function generateFallbackAI({ type, prompt, category, platform }: any) {
  if (type === 'ideas') {
    return [
      {
        title: `Top 10 Free Websites Every ${category === 'Student & Academic Life' ? 'Student' : 'Developer'} Should Bookmark`,
        potential: 'High engagement potential',
        description: 'Curated list of hidden gems that solve immediate pain points without requiring paid subscriptions.',
        hook: 'If you are still paying for developer tools or study software, stop right now.',
        category: category,
        bestPlatform: platform === 'All Platforms' ? 'TikTok' : platform
      },
      {
        title: `Free AI Tools Students Can Use in 2025 (That Aren't ChatGPT)`,
        potential: 'Viral potential',
        description: 'Breakdown of specialized academic and coding AI agents that speed up research and debugging.',
        hook: 'ChatGPT is great, but these 3 free AI tools will literally 10x your semester.',
        category: category,
        bestPlatform: 'Instagram'
      },
      {
        title: `How to Get Free Certifications That Actually Boost Your CV`,
        potential: 'High engagement potential',
        description: 'Direct step-by-step guide to Microsoft, Google, and AWS free student pathways and badges.',
        hook: 'Want to put Microsoft certified on your resume before you graduate? Here is how.',
        category: category,
        bestPlatform: 'YouTube'
      },
      {
        title: `The 3 Portfolio Projects That Got Me Recruiter DMs`,
        potential: 'Medium engagement potential',
        description: 'Why generic weather apps fail and what fullstack architecture hiring managers actually look for.',
        hook: 'Stop building todo apps. Build these 3 projects if you want interviews.',
        category: category,
        bestPlatform: 'TikTok'
      }
    ];
  } else if (type === 'hooks') {
    return [
      {
        spokenHook: 'If you are still doing this manually in tech, stop scrolling right now.',
        visualHook: 'Lean looking intensely at camera, holding up phone showing error screen',
        onScreenText: 'STOP DOING THIS IN 2025 ❌',
        viralCategory: 'Negative Hook',
        potentialScore: '9.9/10'
      },
      {
        spokenHook: 'I tested 50 free developer tools so you do not have to. Here are the only 3 you need.',
        visualHook: 'Fast montage swipe of website tabs with cursor clicks',
        onScreenText: 'ONLY 3 FREE TOOLS YOU NEED 💻',
        viralCategory: 'Authority/Result',
        potentialScore: '9.6/10'
      },
      {
        spokenHook: 'How I passed my technical interview with zero CS degree and zero connections.',
        visualHook: 'Lean showing laptop with acceptance email blur effect',
        onScreenText: 'NO DEGREE? NO PROBLEM 🚀',
        viralCategory: 'Relatable Pain Point',
        potentialScore: '9.4/10'
      },
      {
        spokenHook: 'This hidden Microsoft program pays for all your cloud certifications.',
        visualHook: 'Holding up student ID and clicking "Redeem Voucher"',
        onScreenText: 'FREE MICROSOFT CERTIFICATIONS 🎓',
        viralCategory: 'Curiosity Gap',
        potentialScore: '9.7/10'
      }
    ];
  } else if (type === 'scripts') {
    return {
      title: 'Top Free AI Tools Every Student Developer Needs in 2025',
      hook: 'Stop spending hours fixing simple bugs and summarizing research papers manually.',
      body: [
        'Tool 1 is Phind AI: A search engine specifically engineered for developers that cites exact GitHub repos and documentation.',
        'Tool 2 is NotebookLM: Upload your course lecture slides and it generates a conversational podcast and interactive study guide in 30 seconds.',
        'Tool 3 is GitHub Student Developer Pack: Gives you $200k in free developer software, cloud credits, and domain names.'
      ],
      cta: 'Comment "STUDENT" below and I will send you the direct signup links for all three!',
      caption: 'These 3 free AI and student developer tools will save you hundreds of hours this semester 🚀 Comment STUDENT to get the curated link pack!\n\n#techstudent #aitools #learntocode #studytips #creatoros',
      hashtags: ['#techstudent', '#aitools', '#coding', '#softwareengineer', '#studytok'],
      shotList: [
        { shot: 1, visual: 'Lean close-up with laptop in background', audio: 'Stop spending hours fixing simple bugs manually...', timing: '0:00 - 0:04' },
        { shot: 2, visual: 'Screen demo of Phind answering tricky React query', audio: 'Tool 1 is Phind AI: A dev search engine...', timing: '0:05 - 0:18' },
        { shot: 3, visual: 'Split screen NotebookLM lecture podcast generator', audio: 'Tool 2 is NotebookLM: Drop in your slides...', timing: '0:19 - 0:33' },
        { shot: 4, visual: 'Lean smiling and pointing down at comment section', audio: 'Comment STUDENT and save this video for later!', timing: '0:34 - 0:45' }
      ]
    };
  } else if (type === 'shotlist') {
    return {
      totalDuration: '00:45',
      recommendedMusic: 'Lo-Fi upbeat electronic / TikTok viral acoustic beat',
      shots: [
        {
          shotNumber: 1,
          type: 'Close-Up (CU)',
          angle: 'Front eye-level',
          visual: 'Lean speaking directly to camera with high energy and natural smile',
          audio: 'Stop scrolling if you are trying to break into tech this year.',
          onScreenGraphics: 'BREAK INTO TECH 2025 ⚡',
          duration: '3s'
        },
        {
          shotNumber: 2,
          type: 'Screen Recording',
          angle: 'Full 9:16 display',
          visual: 'Interactive website walkthrough highlighting free registration button',
          audio: 'This platform gives you complete career roadmaps and free projects.',
          onScreenGraphics: 'FREE ROADMAPS 🗺️',
          duration: '15s'
        },
        {
          shotNumber: 3,
          type: 'Medium Shot (MS)',
          angle: 'Slight side angle at desk',
          visual: 'Lean typing code on MacBook, RGB ambient backlight',
          audio: 'Spend 20 minutes a day on these guided exercises.',
          onScreenGraphics: '20 MINS / DAY ⏳',
          duration: '18s'
        },
        {
          shotNumber: 4,
          type: 'Outro (MS)',
          angle: 'Front center',
          visual: 'Lean pointing to screen bookmark icon and waving',
          audio: 'Save this post and follow for the full series!',
          onScreenGraphics: 'SAVE & FOLLOW 🔔',
          duration: '9s'
        }
      ],
      editingTips: [
        'Keep cuts fast (under 3 seconds per shot)',
        'Add bold yellow and white captions with word-by-word animation',
        'Add soft ambient whoosh sound on graphic pop-ups'
      ]
    };
  } else {
    return {
      topic: prompt || 'AI Tools',
      summary: 'High-velocity trend around practical AI accelerators for college students and developers.',
      whyItWorks: 'Direct ROI and instant utility value. Viewers save the video immediately to reference later.',
      hookFormula: '"If you are still doing [Action] the old way, watch this..."',
      leanAdaptation: 'Create a 3-part series demonstrating how you use these tools in your actual daily student workflow at Microsoft and university.',
      suggestedTitle: '3 Free AI Tools That Will Save Your Semester',
      suggestedHashtags: ['#AITools', '#StudentLife', '#TechEducation', '#CreatorOS']
    };
  }
}

// Dedicated Privacy Policy endpoint for Meta & TikTok App verification
app.get(['/privacy', '/privacy-policy'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Privacy Policy - Creator OS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0d17; color: #e2e8f0; line-height: 1.6; padding: 40px 20px; margin: 0; }
          .container { max-width: 760px; margin: 0 auto; background: #131627; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; }
          h1 { color: #fff; font-size: 28px; margin-top: 0; }
          h2 { color: #f43f5e; font-size: 18px; margin-top: 28px; }
          p, li { color: #94a3b8; font-size: 14px; }
          ul { padding-left: 20px; }
          .badge { display: inline-block; background: rgba(244,63,94,0.15); color: #f43f5e; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
          a { color: #38bdf8; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">Legal Document</div>
          <h1>Privacy Policy</h1>
          <p><strong>Effective Date:</strong> January 1, 2026 | <strong>Last Updated:</strong> August 15, 2026</p>
          
          <p>Creator OS ("we", "our", or "us") operates the Creator OS content creation and scheduling platform. This Privacy Policy describes how we collect, use, and protect your information when you authenticate through social media platforms including Meta (Facebook and Instagram) and TikTok.</p>

          <h2>1. Information We Collect</h2>
          <p>When you connect your social media accounts via OAuth, we only collect the minimum information required to display your creator stats and manage content:</p>
          <ul>
            <li><strong>Public Profile Information:</strong> Display name, username/handle, and avatar image.</li>
            <li><strong>Creator Analytics:</strong> Follower counts, video/post performance statistics, views, likes, and engagement figures.</li>
            <li><strong>Authorization Tokens:</strong> Secure OAuth access tokens used strictly on your behalf to fetch analytics or schedule posts.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use your information exclusively to provide and enhance Creator OS services:</p>
          <ul>
            <li>Displaying unified multi-platform analytics on your creator dashboard.</li>
            <li>Enabling content scheduling and automated publishing to your linked accounts.</li>
            <li>Generating AI-assisted video scripts and hooks tailored to your content niche.</li>
          </ul>

          <h2>3. Data Storage & Security</h2>
          <p>We implement industry-standard encryption protocols. We never sell, trade, or rent your personal data or social media tokens to third parties.</p>

          <h2>4. User Rights & Data Deletion</h2>
          <p>You can revoke access to your connected accounts at any time through the <strong>Connected Accounts</strong> settings modal in Creator OS or through your account settings on Facebook, Instagram, or TikTok. Upon disconnection, stored authorization tokens are immediately purged.</p>

          <h2>5. Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact our support team at <a href="mailto:leanne1mu@gmail.com">leanne1mu@gmail.com</a>.</p>
        </div>
      </body>
    </html>
  `);
});

// Dedicated Terms of Service endpoint for Meta & TikTok App verification
app.get(['/terms', '/terms-of-service'], (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Terms of Service - Creator OS</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0d17; color: #e2e8f0; line-height: 1.6; padding: 40px 20px; margin: 0; }
          .container { max-width: 760px; margin: 0 auto; background: #131627; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px; }
          h1 { color: #fff; font-size: 28px; margin-top: 0; }
          h2 { color: #38bdf8; font-size: 18px; margin-top: 28px; }
          p, li { color: #94a3b8; font-size: 14px; }
          ul { padding-left: 20px; }
          .badge { display: inline-block; background: rgba(56,189,248,0.15); color: #38bdf8; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="badge">Terms & Conditions</div>
          <h1>Terms of Service</h1>
          <p><strong>Effective Date:</strong> January 1, 2026</p>
          <p>By using Creator OS, you agree to comply with these terms, as well as the platform terms and developer policies of Meta (Facebook, Instagram) and TikTok.</p>
          <h2>1. Use of Services</h2>
          <p>You agree to use Creator OS solely for lawful creator workflow management, scheduling, and analytics tracking.</p>
          <h2>2. Intellectual Property</h2>
          <p>You retain full ownership of all scripts, video assets, and content created or scheduled via Creator OS.</p>
        </div>
      </body>
    </html>
  `);
});

// Fallback for unmatched API routes so they return JSON instead of HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
});

// Global JSON error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    console.error('Server request error:', err);
    if (err.type === 'entity.too.large' || err.status === 413) {
      return res.status(413).json({ error: 'Payload or file is too large. Please select a smaller file.' });
    }
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
  next();
});

// In production, serve the built Vite app
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// For SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In dev mode when dist/ doesn't exist yet, pass to next
      res.status(200).send('Please wait for Vite dev server...');
    }
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Creator OS backend listening on http://0.0.0.0:${PORT}`);
});
