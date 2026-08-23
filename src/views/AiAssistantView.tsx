/**
 * AI Assistant view.
 *
 * Owns the prompt/category/platform inputs and the sub-tab selection, calls the
 * `/api/ai/generate` backend, and renders the appropriate result component
 * (ideas, hooks, script, or shot list) for the active sub-tab.
 */
import React, { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, Anchor, FileText, Video, RefreshCw, Wand2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ContentCategory } from '../types';
import { logger } from '../utils/logger';
import { IdeasResults } from './ai/IdeasResults';
import { HooksResults } from './ai/HooksResults';
import { ScriptResult } from './ai/ScriptResult';
import { ShotListResult } from './ai/ShotListResult';

type AiSubTab = 'ideas' | 'hooks' | 'scripts' | 'shotlist';

export const AiAssistantView: React.FC = () => {
  const {
    openScheduleModalWithData,
    aiInitialPrompt,
    aiInitialCategory,
    aiInitialTab,
    showToast,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<AiSubTab>(aiInitialTab || 'ideas');
  const [promptInput, setPromptInput] = useState(
    aiInitialPrompt || 'Give me content ideas about free tech resources for students'
  );
  const [category, setCategory] = useState<ContentCategory>(aiInitialCategory || 'Free Tech Resources');
  const [platform, setPlatform] = useState<string>('All Platforms');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Result state
  const [ideasResults, setIdeasResults] = useState<any[]>([]);
  const [hooksResults, setHooksResults] = useState<any[]>([]);
  const [scriptResult, setScriptResult] = useState<any | null>(null);
  const [shotListResult, setShotListResult] = useState<any | null>(null);

  const categories: ContentCategory[] = [
    'Free Tech Resources',
    'Breaking Into Tech',
    'Tech Education',
    'Student & Academic Life',
    'Microsoft Journey',
  ];

  const platforms = ['All Platforms', 'TikTok', 'Instagram', 'YouTube', 'Facebook'];

  useEffect(() => {
    if (aiInitialPrompt) {
      setPromptInput(aiInitialPrompt);
    }
    if (aiInitialCategory) {
      setCategory(aiInitialCategory);
    }
    if (aiInitialTab) {
      setActiveSubTab(aiInitialTab);
    }
  }, [aiInitialPrompt, aiInitialCategory, aiInitialTab]);

  // Initial trigger if results are empty
  useEffect(() => {
    if (ideasResults.length === 0 && activeSubTab === 'ideas') {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeSubTab,
          prompt: promptInput,
          category,
          platform,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        let message = `AI generation error (${res.status})`;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error) message = parsed.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const data = await res.json();
      if (activeSubTab === 'ideas') {
        setIdeasResults(Array.isArray(data.result) ? data.result : [data.result]);
      } else if (activeSubTab === 'hooks') {
        setHooksResults(Array.isArray(data.result) ? data.result : [data.result]);
      } else if (activeSubTab === 'scripts') {
        setScriptResult(data.result);
      } else if (activeSubTab === 'shotlist') {
        setShotListResult(data.result);
      }

      showToast(`AI ${activeSubTab} generated! ✨`, 'success');
    } catch (err: any) {
      logger.error('Generation failed:', err);
      showToast(err.message || 'Generation failed, please try again', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUseInPost = (item: any) => {
    if (activeSubTab === 'ideas') {
      openScheduleModalWithData({
        title: item.title,
        category: item.category || category,
        caption: `${item.title}\n\n${item.description}\n\n#tech #students #aitools #creatoros`,
      });
    } else if (activeSubTab === 'hooks') {
      openScheduleModalWithData({
        title: item.onScreenText || 'Viral Tech Video',
        category,
        caption: `${item.spokenHook}\n\nSave this for later! 🚀 #learntocode #tech`,
      });
    } else if (activeSubTab === 'scripts') {
      openScheduleModalWithData({
        title: item.title || 'AI Tech Video',
        category,
        caption: item.caption || item.hook,
        script: {
          hook: item.hook,
          body: item.body || [],
          cta: item.cta || '',
          shotList: item.shotList || [],
        },
      });
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16 md:pb-6">
      {/* Header (matching Screen 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">AI Assistant</h1>
            <p className="text-xs text-slate-400">
              Generates high-performing concepts, viral hooks, full scripts & shot lists.
            </p>
          </div>
        </div>

        {/* 5 Content Pillars Quick Tag */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131627] border border-white/10 text-xs text-pink-300">
          <Wand2 className="w-3.5 h-3.5 text-pink-400" />
          <span>Tuned to Lean's 5 Brand Pillars</span>
        </div>
      </div>

      {/* Sub-tabs pills (matching Screen 3: Ideas, Hooks, Scripts, Shot List) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveSubTab('ideas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'ideas'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Ideas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hooks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'hooks'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
          }`}
        >
          <Anchor className="w-4 h-4" />
          <span>Hooks</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scripts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'scripts'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Scripts</span>
        </button>

        <button
          onClick={() => setActiveSubTab('shotlist')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'shotlist'
              ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
              : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Shot List</span>
        </button>
      </div>

      {/* Main Input Configuration Card (matching Screen 3) */}
      <div className="creator-card p-4 sm:p-5 space-y-4">
        {/* Prompt Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-200">Tell the AI what you need...</label>
            <span className="text-[11px] font-mono text-slate-400">{promptInput.length}/300</span>
          </div>

          <div className="relative">
            <textarea
              rows={3}
              maxLength={300}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="e.g. Give me content ideas about free tech resources for students..."
              className="w-full p-3.5 text-xs sm:text-sm bg-[#0b0d17] border border-white/10 rounded-2xl text-white focus:outline-none focus:border-pink-500 placeholder:text-slate-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Dropdowns row (Category & Platform) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Category Pillar</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ContentCategory)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#0b0d17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Platform Dropdown */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300">Target Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-[#0b0d17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Primary Action Button (matching Screen 3) */}
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full pink-glow-btn py-3 rounded-2xl text-xs sm:text-sm font-bold text-white flex items-center justify-center gap-2 transition-all transform active:scale-98 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-pink-300" />
              <span>Generating with Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-pink-300" />
              <span>
                {activeSubTab === 'ideas' && 'Generate Ideas'}
                {activeSubTab === 'hooks' && 'Generate Viral Hooks'}
                {activeSubTab === 'scripts' && 'Generate Full Video Script'}
                {activeSubTab === 'shotlist' && 'Generate Video Shot List'}
              </span>
            </>
          )}
        </button>
      </div>

      {/* Generated Results Section (matching Screen 3) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white capitalize">
            Generated {activeSubTab}
          </h3>
          <span className="text-xs text-slate-400">Click card to create post</span>
        </div>

        {/* Each sub-tab renders its own result component. */}
        {activeSubTab === 'ideas' && (
          <IdeasResults
            ideas={ideasResults}
            category={category}
            copiedIndex={copiedIndex}
            onCopy={handleCopy}
            onUse={handleUseInPost}
          />
        )}

        {activeSubTab === 'hooks' && (
          <HooksResults hooks={hooksResults} onCopy={handleCopy} onUse={handleUseInPost} />
        )}

        {activeSubTab === 'scripts' && scriptResult && (
          <ScriptResult script={scriptResult} onUse={handleUseInPost} />
        )}

        {activeSubTab === 'shotlist' && shotListResult && (
          <ShotListResult shotList={shotListResult} onCopy={handleCopy} />
        )}
      </div>
    </div>
  );
};
