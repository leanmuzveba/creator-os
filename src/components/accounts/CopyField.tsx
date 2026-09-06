/**
 * A monospace value box with a copy-to-clipboard button, optionally labelled.
 *
 * Used throughout the account setup guides to present redirect URIs, domains,
 * and scopes that the user copies into a developer console. Consolidates a
 * pattern that was previously repeated a dozen-plus times inline.
 */
import React from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyFieldProps {
  /** The value to display and copy. */
  value: string;
  /** Unique key identifying this field, used to show the "copied" checkmark. */
  copyKey: string;
  /** The currently-copied field key (from parent state). */
  copiedKey: string | null;
  /** Copy handler supplied by the parent. */
  onCopy: (text: string, key: string) => void;
  /** Optional small label rendered above the value box. */
  label?: string;
  /** Tailwind color class for the value text (defaults to muted slate). */
  valueClass?: string;
  /** Tooltip for the copy button. */
  title?: string;
}

export const CopyField: React.FC<CopyFieldProps> = ({
  value,
  copyKey,
  copiedKey,
  onCopy,
  label,
  valueClass = 'text-[var(--text-primary)]',
  title = 'Copy',
}) => (
  <div>
    {label && <label className="text-[10px] text-[var(--text-secondary)] block mb-0.5">{label}</label>}
    <div className="flex items-center gap-2 bg-[var(--bg-page)] p-2 rounded-xl border border-[var(--border-color)] font-mono text-[11px] break-all">
      <span className={`flex-1 select-all ${valueClass}`}>{value}</span>
      <button
        onClick={() => onCopy(value, copyKey)}
        className="p-1 rounded bg-[var(--overlay-hover)] hover:opacity-80 text-[var(--text-primary)] flex-shrink-0"
        title={title}
      >
        {copiedKey === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  </div>
);
