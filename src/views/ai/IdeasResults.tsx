/**
 * Renders the list of AI-generated content ideas in the AI Assistant view.
 * Each idea can be copied to the clipboard or pushed into the scheduler.
 */
import React from 'react';
import { ChevronRight, Copy, Check, ArrowRight } from 'lucide-react';

interface IdeasResultsProps {
  ideas: any[];
  category: string;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
  onUse: (item: any) => void;
}

export const IdeasResults: React.FC<IdeasResultsProps> = ({ ideas, category, copiedIndex, onCopy, onUse }) => (
  <div className="space-y-3">
    {ideas.map((idea, index) => (
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
            onClick={() => onCopy(`${idea.title}\n\nHook: ${idea.hook}`, index)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
            title="Copy Idea"
          >
            {copiedIndex === index ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onUse(idea)}
            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
          >
            <span>Use in Post</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    ))}
  </div>
);
