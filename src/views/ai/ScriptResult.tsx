/**
 * Renders a single AI-generated video script (hook, body steps, CTA, caption)
 * in the AI Assistant view, with an action to export it to the scheduler.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ScriptResultProps {
  script: any;
  onUse: (item: any) => void;
}

export const ScriptResult: React.FC<ScriptResultProps> = ({ script, onUse }) => (
  <div className="creator-card p-5 space-y-4">
    <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
      <div>
        <h4 className="text-base font-bold text-white">{script.title}</h4>
        <p className="text-xs text-pink-300 font-medium">45-Second High-Retention Script</p>
      </div>

      <button
        onClick={() => onUse(script)}
        className="pink-glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
      >
        <span>Export to Scheduler</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>

    {/* Hook */}
    <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/30 space-y-1">
      <span className="text-[10px] font-bold uppercase text-pink-400 tracking-wider">Opening Hook (0:00 - 0:04)</span>
      <p className="text-sm font-semibold text-pink-100">"{script.hook}"</p>
    </div>

    {/* Body */}
    <div className="space-y-2">
      <span className="text-xs font-bold text-slate-300">Body & Visual Steps</span>
      {script.body?.map((step: string, i: number) => (
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
      <p className="text-white font-medium">{script.cta}</p>
      {script.caption && (
        <div className="mt-2 pt-2 border-t border-white/10">
          <p className="text-slate-400 text-[11px] whitespace-pre-line">{script.caption}</p>
        </div>
      )}
    </div>
  </div>
);
