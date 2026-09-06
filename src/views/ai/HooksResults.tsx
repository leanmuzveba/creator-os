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
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--accent-20)] text-[var(--accent)] border border-[var(--accent-30)]">
              {hook.viralCategory || 'Viral Formula'}
            </span>
            <span className="text-[10px] font-semibold text-[var(--accent-positive)]">Score: {hook.potentialScore || '9.8/10'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                onCopy(`Spoken: "${hook.spokenHook}"\nVisual: ${hook.visualHook}\nText: ${hook.onScreenText}`, index)
              }
              className="p-1.5 rounded-lg bg-[var(--overlay-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onUse(hook)}
              className="px-3 py-1.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-xs font-bold text-[var(--accent-text)] flex items-center gap-1"
            >
              <span>Create Post</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Spoken Hook (0-3s)</span>
            <p className="text-[var(--text-primary)] font-medium">"{hook.spokenHook}"</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">Visual Hook</span>
            <p className="text-[var(--text-secondary)]">{hook.visualHook}</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-color)] space-y-1">
            <span className="text-[10px] font-bold uppercase text-[var(--accent)]">On-Screen Text</span>
            <p className="text-[var(--accent)] font-bold font-mono">{hook.onScreenText}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
);
