/**
 * TrendModal: detail view for a selected trend — why it works, the hook
 * formula, and Lean's adaptation — with an action to send it to the AI
 * assistant for content generation.
 */
import React from 'react';
import { X, Sparkles, TrendingUp, ArrowRight, Lightbulb, Zap, HelpCircle, CheckCircle, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from './PlatformIcon';

export const TrendModal: React.FC = () => {
  const { selectedTrend, setSelectedTrend, navigateToAiWith, openScheduleModalWithData } = useApp();

  if (!selectedTrend) return null;

  const handleCreateContent = () => {
    const trend = selectedTrend;
    setSelectedTrend(null);
    navigateToAiWith(`Create content based on viral trend: "${trend.topic}" (${trend.hashtag})`, trend.category, 'scripts');
  };

  const handleSchedulePost = () => {
    const trend = selectedTrend;
    setSelectedTrend(null);
    openScheduleModalWithData({
      title: `${trend.topic}: How to 10x Your Workflow`,
      category: trend.category,
      caption: `Breaking down the ${trend.topic} trend ⚡ Here is how to use it for your study and developer workflow!\n\n${trend.hashtag} #tech #creatoros`,
      platforms: [trend.platform, 'instagram'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0b0d17] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#131627] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{selectedTrend.topic}</h3>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {selectedTrend.growth} Velocity
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{selectedTrend.hashtag} • {selectedTrend.volume}</p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTrend(null)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Platform & Pillar info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#131627] border border-white/[0.08] text-xs">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={selectedTrend.platform} size={16} />
              <span className="text-slate-300 capitalize">Originating on {selectedTrend.platform}</span>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 font-semibold text-[11px]">
              {selectedTrend.category}
            </span>
          </div>

          {/* 1. Trend Summary */}
          <div className="p-4 rounded-2xl bg-[#131627] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Trend Summary</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedTrend.summary}</p>
          </div>

          {/* 2. Why it Works */}
          <div className="p-4 rounded-2xl bg-[#131627] border border-white/[0.08] space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Why It Works (Virality & Psychology)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{selectedTrend.whyItWorks}</p>
          </div>

          {/* 3. Viral Hook Formula */}
          <div className="p-4 rounded-2xl bg-pink-950/30 border border-pink-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Viral Hook Formula</span>
            </div>
            <p className="text-xs font-mono text-pink-100 bg-black/40 p-2.5 rounded-xl border border-white/10 italic">
              {selectedTrend.hookFormula}
            </p>
          </div>

          {/* 4. How Lean Can Adapt It */}
          <div className="p-4 rounded-2xl bg-[#131627] border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>How Lean Can Adapt It (Customized Recommendation)</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">{selectedTrend.leanAdaptation}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#131627] border-t border-white/[0.08] flex items-center gap-3">
          <button
            onClick={handleSchedulePost}
            className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 transition-colors"
          >
            Direct Schedule
          </button>

          <button
            onClick={handleCreateContent}
            className="flex-1 pink-glow-btn py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all transform active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span>Generate Full AI Script with Gemini</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
