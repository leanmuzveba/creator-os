/**
 * AI content-generation route backed by Anthropic's Claude API.
 *
 * Builds a pillar-aware prompt for the requested output type (ideas, hooks,
 * scripts, shot list, trend analysis) and returns structured JSON. When no
 * `ANTHROPIC_API_KEY` is configured, or a generation call fails, it returns a
 * high-quality curated fallback so the UI always has content to render.
 */
import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../logger.ts';

export const aiRouter = Router();

// Lazily initialize the Anthropic client if an API key is present.
let anthropicClient: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

aiRouter.post('/api/ai/generate', async (req, res) => {
  const { type, prompt, category, platform } = req.body;
  const ai = getAnthropic();

  const selectedCategory = category || 'Free Tech Resources';
  const targetPlatform = platform || 'All Platforms';

  if (!ai) {
    // Fallback high-quality curated creator responses if no API key is set yet.
    const fallbackResults = generateFallbackAI({ type, prompt, category: selectedCategory, platform: targetPlatform });
    return res.json({ result: fallbackResults, isMock: true });
  }

  try {
    const systemInstruction = `You are the specialized AI Content Intelligence Engine for "Creator OS", built specifically for Lean — a tech creator, computer science student, and Microsoft Student Ambassador.
Lean produces high-engagement short-form content for TikTok, Instagram Reels, YouTube Shorts, and Facebook.
Her 5 Core Content Pillars are:
1. Tech Education (Coding tips, software concepts, developer tutorials)
2. Breaking Into Tech (Non-traditional pathways, resumes, portfolio tips, interviews)
3. Free Tech Resources (Free tools, APIs, learning hubs, certification vouchers)
4. Student & Academic Life (Study systems, GPA tips, balancing work and uni, tech college hacks)
5. Microsoft Journey (Azure credits, Microsoft Learn certifications, student programs)

Always format outputs in clean, structured JSON with engaging hooks, viral formulas, retention techniques, and specific calls to action.
Respond with ONLY the raw JSON — no markdown code fences, no commentary before or after.`;

    const userPrompt = buildUserPrompt(type, prompt, selectedCategory, targetPlatform);

    const response = await ai.messages.create({
      model: 'claude-opus-5',
      max_tokens: 4096,
      system: systemInstruction,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    const text = textBlock?.text?.trim() || '{}';
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    const parsed = JSON.parse(jsonText);
    res.json({ result: parsed, isMock: false });
  } catch (err: any) {
    logger.error('Claude generation error, falling back:', err);
    const fallback = generateFallbackAI({ type, prompt, category: selectedCategory, platform: targetPlatform });
    res.json({ result: fallback, isMock: true, error: err.message });
  }
});

/** Build the Gemini user prompt for a given generation type. */
function buildUserPrompt(type: string, prompt: string, selectedCategory: string, targetPlatform: string): string {
  if (type === 'ideas') {
    return `Generate 4 viral, high-retention video content ideas for the pillar "${selectedCategory}" targeted at ${targetPlatform}.
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
  }
  if (type === 'hooks') {
    return `Generate 5 viral video hooks for a video about "${prompt || selectedCategory}" within the "${selectedCategory}" pillar for ${targetPlatform}.
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
  }
  if (type === 'scripts') {
    return `Generate a complete 45-60 second short-form video script for "${prompt || 'Free AI Tools for Students'}" in category "${selectedCategory}".
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
  }
  if (type === 'shotlist') {
    return `Generate a comprehensive video Shot List and Production Guide for a 60-second video on "${prompt || selectedCategory}".
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
  }
  if (type === 'trend_analysis') {
    return `Analyze the trend "${prompt}" for creator Lean.
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
  }
  return `Generate creative suggestions for creator Lean about "${prompt}". Return JSON format.`;
}

/** Curated, deterministic fallback content used when the AI client is unavailable. */
export function generateFallbackAI({ type, prompt, category, platform }: any) {
  if (type === 'ideas') {
    return [
      {
        title: `Top 10 Free Websites Every ${category === 'Student & Academic Life' ? 'Student' : 'Developer'} Should Bookmark`,
        potential: 'High engagement potential',
        description: 'Curated list of hidden gems that solve immediate pain points without requiring paid subscriptions.',
        hook: 'If you are still paying for developer tools or study software, stop right now.',
        category: category,
        bestPlatform: platform === 'All Platforms' ? 'TikTok' : platform,
      },
      {
        title: `Free AI Tools Students Can Use in 2025 (That Aren't ChatGPT)`,
        potential: 'Viral potential',
        description: 'Breakdown of specialized academic and coding AI agents that speed up research and debugging.',
        hook: 'ChatGPT is great, but these 3 free AI tools will literally 10x your semester.',
        category: category,
        bestPlatform: 'Instagram',
      },
      {
        title: `How to Get Free Certifications That Actually Boost Your CV`,
        potential: 'High engagement potential',
        description: 'Direct step-by-step guide to Microsoft, Google, and AWS free student pathways and badges.',
        hook: 'Want to put Microsoft certified on your resume before you graduate? Here is how.',
        category: category,
        bestPlatform: 'YouTube',
      },
      {
        title: `The 3 Portfolio Projects That Got Me Recruiter DMs`,
        potential: 'Medium engagement potential',
        description: 'Why generic weather apps fail and what fullstack architecture hiring managers actually look for.',
        hook: 'Stop building todo apps. Build these 3 projects if you want interviews.',
        category: category,
        bestPlatform: 'TikTok',
      },
    ];
  }
  if (type === 'hooks') {
    return [
      {
        spokenHook: 'If you are still doing this manually in tech, stop scrolling right now.',
        visualHook: 'Lean looking intensely at camera, holding up phone showing error screen',
        onScreenText: 'STOP DOING THIS IN 2025 ❌',
        viralCategory: 'Negative Hook',
        potentialScore: '9.9/10',
      },
      {
        spokenHook: 'I tested 50 free developer tools so you do not have to. Here are the only 3 you need.',
        visualHook: 'Fast montage swipe of website tabs with cursor clicks',
        onScreenText: 'ONLY 3 FREE TOOLS YOU NEED 💻',
        viralCategory: 'Authority/Result',
        potentialScore: '9.6/10',
      },
      {
        spokenHook: 'How I passed my technical interview with zero CS degree and zero connections.',
        visualHook: 'Lean showing laptop with acceptance email blur effect',
        onScreenText: 'NO DEGREE? NO PROBLEM 🚀',
        viralCategory: 'Relatable Pain Point',
        potentialScore: '9.4/10',
      },
      {
        spokenHook: 'This hidden Microsoft program pays for all your cloud certifications.',
        visualHook: 'Holding up student ID and clicking "Redeem Voucher"',
        onScreenText: 'FREE MICROSOFT CERTIFICATIONS 🎓',
        viralCategory: 'Curiosity Gap',
        potentialScore: '9.7/10',
      },
    ];
  }
  if (type === 'scripts') {
    return {
      title: 'Top Free AI Tools Every Student Developer Needs in 2025',
      hook: 'Stop spending hours fixing simple bugs and summarizing research papers manually.',
      body: [
        'Tool 1 is Phind AI: A search engine specifically engineered for developers that cites exact GitHub repos and documentation.',
        'Tool 2 is NotebookLM: Upload your course lecture slides and it generates a conversational podcast and interactive study guide in 30 seconds.',
        'Tool 3 is GitHub Student Developer Pack: Gives you $200k in free developer software, cloud credits, and domain names.',
      ],
      cta: 'Comment "STUDENT" below and I will send you the direct signup links for all three!',
      caption:
        'These 3 free AI and student developer tools will save you hundreds of hours this semester 🚀 Comment STUDENT to get the curated link pack!\n\n#techstudent #aitools #learntocode #studytips #creatoros',
      hashtags: ['#techstudent', '#aitools', '#coding', '#softwareengineer', '#studytok'],
      shotList: [
        { shot: 1, visual: 'Lean close-up with laptop in background', audio: 'Stop spending hours fixing simple bugs manually...', timing: '0:00 - 0:04' },
        { shot: 2, visual: 'Screen demo of Phind answering tricky React query', audio: 'Tool 1 is Phind AI: A dev search engine...', timing: '0:05 - 0:18' },
        { shot: 3, visual: 'Split screen NotebookLM lecture podcast generator', audio: 'Tool 2 is NotebookLM: Drop in your slides...', timing: '0:19 - 0:33' },
        { shot: 4, visual: 'Lean smiling and pointing down at comment section', audio: 'Comment STUDENT and save this video for later!', timing: '0:34 - 0:45' },
      ],
    };
  }
  if (type === 'shotlist') {
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
          duration: '3s',
        },
        {
          shotNumber: 2,
          type: 'Screen Recording',
          angle: 'Full 9:16 display',
          visual: 'Interactive website walkthrough highlighting free registration button',
          audio: 'This platform gives you complete career roadmaps and free projects.',
          onScreenGraphics: 'FREE ROADMAPS 🗺️',
          duration: '15s',
        },
        {
          shotNumber: 3,
          type: 'Medium Shot (MS)',
          angle: 'Slight side angle at desk',
          visual: 'Lean typing code on MacBook, RGB ambient backlight',
          audio: 'Spend 20 minutes a day on these guided exercises.',
          onScreenGraphics: '20 MINS / DAY ⏳',
          duration: '18s',
        },
        {
          shotNumber: 4,
          type: 'Outro (MS)',
          angle: 'Front center',
          visual: 'Lean pointing to screen bookmark icon and waving',
          audio: 'Save this post and follow for the full series!',
          onScreenGraphics: 'SAVE & FOLLOW 🔔',
          duration: '9s',
        },
      ],
      editingTips: [
        'Keep cuts fast (under 3 seconds per shot)',
        'Add bold yellow and white captions with word-by-word animation',
        'Add soft ambient whoosh sound on graphic pop-ups',
      ],
    };
  }
  return {
    topic: prompt || 'AI Tools',
    summary: 'High-velocity trend around practical AI accelerators for college students and developers.',
    whyItWorks: 'Direct ROI and instant utility value. Viewers save the video immediately to reference later.',
    hookFormula: '"If you are still doing [Action] the old way, watch this..."',
    leanAdaptation:
      'Create a 3-part series demonstrating how you use these tools in your actual daily student workflow at Microsoft and university.',
    suggestedTitle: '3 Free AI Tools That Will Save Your Semester',
    suggestedHashtags: ['#AITools', '#StudentLife', '#TechEducation', '#CreatorOS'],
  };
}
