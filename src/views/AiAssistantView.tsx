import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  Anchor,
  FileText,
  Video,
  Scissors,
  Send,
  Copy,
  Check,
  Plus,
  ArrowRight,
  RefreshCw,
  Wand2,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ContentCategory, PlatformType } from '../types';
import { PlatformIcon } from '../components/PlatformIcon';

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
      console.error('Generation failed:', err);
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

        {/* 1. IDEAS VIEW RESULTS */}
        {activeSubTab === 'ideas' && (
          <div className="space-y-3">
            {ideasResults.map((idea, index) => (
              <div
                key={index}
                className="creator-card-interactive p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      {idea.potential || 'High engagement potential'}
                    </span>
                    <span className="text-[11px] text-pink-300 font-semibold">{idea.category || category}</span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-pink-300 transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4 text-pink-400 flex-shrink-0" />
                    <span>{idea.title}</span>
                  </h4>

                  <p className="text-xs text-slate-300 leading-relaxed pl-6">{idea.description}</p>
                  
                  {idea.hook && (
                    <div className="pl-6 pt-1">
                      <p className="text-[11px] font-mono text-pink-200/90 italic bg-pink-950/20 p-2 rounded-lg border border-pink-500/20">
                        🎙️ Hook: "{idea.hook}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                  <button
                    onClick={() => handleCopy(`${idea.title}\n\nHook: ${idea.hook}`, index)}
                    className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
                    title="Copy Idea"
                  >
                    {copiedIndex === index ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => handleUseInPost(idea)}
                    className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                  >
                    <span>Use in Post</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. HOOKS VIEW RESULTS */}
        {activeSubTab === 'hooks' && (
          <div className="space-y-3">
            {hooksResults.map((hook, index) => (
              <div key={index} className="creator-card-interactive p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                      {hook.viralCategory || 'Viral Formula'}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400">Score: {hook.potentialScore || '9.8/10'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(`Spoken: "${hook.spokenHook}"\nVisual: ${hook.visualHook}\nText: ${hook.onScreenText}`, index)}
                      className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleUseInPost(hook)}
                      className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white flex items-center gap-1"
                    >
                      <span>Create Post</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#0b0d17] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Spoken Hook (0-3s)</span>
                    <p className="text-white font-medium">"{hook.spokenHook}"</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0b0d17] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Visual Hook</span>
                    <p className="text-slate-300">{hook.visualHook}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0b0d17] border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-pink-400">On-Screen Text</span>
                    <p className="text-pink-200 font-bold font-mono">{hook.onScreenText}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 3. SCRIPTS VIEW RESULTS */}
        {activeSubTab === 'scripts' && scriptResult && (
          <div className="creator-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h4 className="text-base font-bold text-white">{scriptResult.title}</h4>
                <p className="text-xs text-pink-300 font-medium">45-Second High-Retention Script</p>
              </div>

              <button
                onClick={() => handleUseInPost(scriptResult)}
                className="pink-glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
              >
                <span>Export to Scheduler</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Hook */}
            <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase text-pink-400 tracking-wider">Opening Hook (0:00 - 0:04)</span>
              <p className="text-sm font-semibold text-pink-100">"{scriptResult.hook}"</p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Body & Visual Steps</span>
              {scriptResult.body?.map((step: string, i: number) => (
                <div key={i} className="p-3 rounded-xl bg-[#0b0d17] border border-white/5 flex items-start gap-3 text-xs">
                  <span className="w-5 h-5 rounded-full bg-pink-600/30 text-pink-300 flex items-center justify-center font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-slate-200 leading-relaxed">{step}</p>
                </div>
              ))}
            </div>

            {/* CTA & Caption */}
            <div className="p-3.5 rounded-xl bg-[#0b0d17] border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Call to Action (CTA)</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Conversion Tuned</span>
              </div>
              <p className="text-white font-medium">{scriptResult.cta}</p>
              {scriptResult.caption && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-slate-400 text-[11px] whitespace-pre-line">{scriptResult.caption}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SHOT LIST VIEW RESULTS */}
        {activeSubTab === 'shotlist' && shotListResult && (
          <div className="creator-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h4 className="text-base font-bold text-white">Production Shot List & Editing Guide</h4>
                <p className="text-xs text-slate-400">Duration: {shotListResult.totalDuration} • Music: {shotListResult.recommendedMusic}</p>
              </div>

              <button
                onClick={() => handleCopy(JSON.stringify(shotListResult, null, 2), 99)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Specs</span>
              </button>
            </div>

            <div className="space-y-3">
              {shotListResult.shots?.map((shot: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-[#0b0d17] border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-pink-600/30 text-pink-300 font-mono font-bold">
                        Shot #{shot.shotNumber || idx + 1}
                      </span>
                      <span className="font-bold text-white">{shot.type} • {shot.angle}</span>
                    </div>
                    <span className="font-mono text-[10px] text-pink-400">{shot.duration}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-slate-300">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Camera & Visual</span>
                      <p>{shot.visual}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Voiceover / Audio</span>
                      <p className="text-slate-200 italic">"{shot.audio}"</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Editing Tips */}
            {shotListResult.editingTips && (
              <div className="p-3.5 rounded-xl bg-pink-950/20 border border-pink-500/20 text-xs space-y-1.5">
                <span className="font-bold text-pink-300 flex items-center gap-1">
                  <Scissors className="w-3.5 h-3.5 text-pink-400" />
                  Editing & Retention Tips
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
                  {shotListResult.editingTips.map((tip: string, i: number) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
