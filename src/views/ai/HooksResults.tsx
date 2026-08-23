/**
 * Renders AI-generated viral hooks (spoken / visual / on-screen text) in the
 * AI Assistant view. Each hook can be copied or turned into a post.
 */
import React from 'react';
import { Copy } from 'lucide-react';

interface HooksResultsProps {
  hooks: any[];
  onCopy: (text: string, index: number) => void;
  onUse: (item: any) => void;
}

export const HooksResults: React.FC<HooksResultsProps> = ({ hooks, onCopy, onUse }) => (
  <div className="space-y-3">
    {hooks.map((hook, index) => (
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
              onClick={() =>
                onCopy(`Spoken: "${hook.spokenHook}"\nVisual: ${hook.visualHook}\nText: ${hook.onScreenText}`, index)
              }
              className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:text-white"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUse(hook)}
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
);
