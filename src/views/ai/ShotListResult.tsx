/**
 * Renders an AI-generated production shot list and editing guide in the AI
 * Assistant view, with an action to copy the full specification.
 */
import React from 'react';
import { Copy, Scissors } from 'lucide-react';

interface ShotListResultProps {
  shotList: any;
  onCopy: (text: string, index: number) => void;
}

export const ShotListResult: React.FC<ShotListResultProps> = ({ shotList, onCopy }) => (
  <div className="creator-card p-5 space-y-4">
    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
      <div>
        <h4 className="text-base font-bold text-[var(--text-primary)]">Production Shot List & Editing Guide</h4>
        <p className="text-xs text-[var(--text-secondary)]">
          Duration: {shotList.totalDuration} • Music: {shotList.recommendedMusic}
        </p>
      </div>

      <button
        onClick={() => onCopy(JSON.stringify(shotList, null, 2), 99)}
        className="px-3 py-1.5 rounded-xl bg-[var(--overlay-hover)] hover:opacity-80 text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5"
      >
        <Copy className="w-3.5 h-3.5" />
        <span>Copy Specs</span>
      </button>
    </div>

    <div className="space-y-3">
      {shotList.shots?.map((shot: any, idx: number) => (
        <div key={idx} className="p-3.5 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-color)] space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-[var(--accent-30)] text-[var(--accent)] font-mono font-bold">
                Shot #{shot.shotNumber || idx + 1}
              </span>
              <span className="font-bold text-[var(--text-primary)]">
                {shot.type} • {shot.angle}
              </span>
            </div>
            <span className="font-mono text-[10px] text-[var(--accent)]">{shot.duration}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[var(--text-secondary)]">
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase block">Camera & Visual</span>
              <p>{shot.visual}</p>
            </div>
            <div>
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase block">Voiceover / Audio</span>
              <p className="text-[var(--text-primary)] italic">"{shot.audio}"</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Editing Tips */}
    {shotList.editingTips && (
      <div className="p-3.5 rounded-xl bg-[var(--accent-15)] border border-[var(--accent-20)] text-xs space-y-1.5">
        <span className="font-bold text-[var(--accent)] flex items-center gap-1">
          <Scissors className="w-3.5 h-3.5 text-[var(--accent)]" />
          Editing & Retention Tips
        </span>
        <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)] text-[11px]">
          {shotList.editingTips.map((tip: string, i: number) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);
