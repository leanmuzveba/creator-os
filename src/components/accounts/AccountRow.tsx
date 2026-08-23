/**
 * A single connected-account row in the accounts modal: platform identity,
 * connection status, per-platform setup shortcuts, connect/disconnect action,
 * and an inline form for editing the handle and live metrics.
 */
import React from 'react';
import { RefreshCw, HelpCircle, KeyRound, Edit3, Save } from 'lucide-react';
import { PlatformIcon } from '../PlatformIcon';
import { PlatformType, SocialAccount } from '../../types';

/** Editable handle/metric fields for an account. */
export interface AccountEditForm {
  handle: string;
  followers: string;
  views: string;
  viewsGrowth: string;
}

interface AccountRowProps {
  account: SocialAccount;
  isEditing: boolean;
  isConnecting: boolean;
  editForm: AccountEditForm;
  onEditFormChange: (form: AccountEditForm) => void;
  onStartEditing: (account: SocialAccount) => void;
  onCancelEditing: () => void;
  onSaveStats: (id: PlatformType) => void;
  onConnect: (id: PlatformType) => void;
  onShowGuide: (id: PlatformType) => void;
}

export const AccountRow: React.FC<AccountRowProps> = ({
  account,
  isEditing,
  isConnecting,
  editForm,
  onEditFormChange,
  onStartEditing,
  onCancelEditing,
  onSaveStats,
  onConnect,
  onShowGuide,
}) => {
  const isMeta = account.id === 'instagram' || account.id === 'facebook';

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-[#131627] border border-white/[0.08] hover:border-pink-500/30 transition-all flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center">
              <PlatformIcon platform={account.id} size={16} className="text-white" />
            </div>
            {account.connected && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#131627] flex items-center justify-center text-[7px] font-bold text-white">
                ✓
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs font-bold text-white truncate">{account.name}</h4>
              <span
                className={`px-1 py-0.5 text-[8px] font-bold rounded leading-none ${
                  account.connected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700/40 text-slate-400 border border-slate-600/30'
                }`}
              >
                {account.connected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {!isEditing && (
              <div className="mt-0.5">
                <p className="text-[11px] text-pink-300 font-mono leading-tight truncate">{account.handle}</p>
                {account.connected && (
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                    <span className="font-semibold text-slate-200">{account.followers} fans</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-emerald-400 font-semibold">{account.viewsGrowth}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {account.connected && !isEditing && (
            <button
              onClick={() => onStartEditing(account)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-pink-300 transition-colors"
              title="Edit Handle & Metrics"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}

          {account.id === 'tiktok' && !isEditing && (
            <button
              onClick={() => onShowGuide('tiktok')}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
              title="TikTok Developer Credentials & Redirect URLs"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {isMeta && !isEditing && (
            <button
              onClick={() => onShowGuide(account.id)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-pink-400 hover:text-pink-300 transition-colors"
              title="Meta Developer Credentials & Redirect URLs"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}

          {account.id === 'youtube' && !isEditing && (
            <button
              onClick={() => onShowGuide('youtube')}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-red-400 hover:text-red-300 transition-colors"
              title="Google Cloud & YouTube API Credentials"
            >
              <KeyRound className="w-3.5 h-3.5" />
            </button>
          )}

          {!isEditing && (
            <button
              onClick={() => onConnect(account.id)}
              disabled={isConnecting}
              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all ${
                account.connected
                  ? 'bg-white/[0.06] hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 text-slate-300 border border-white/10'
                  : 'pink-glow-btn text-white'
              }`}
            >
              {isConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : account.connected ? 'Disconnect' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing && (
        <div className="mt-1 pt-2.5 border-t border-white/10 space-y-2 bg-[#0b0d17]/60 p-2.5 rounded-xl border border-white/5 animate-in fade-in duration-150">
          <div className="text-[10px] font-bold text-pink-300 flex items-center justify-between">
            <span>Update Real Handle & Live Stats</span>
            <span className="text-[9px] text-slate-400 font-normal">Saves across all dashboards</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Handle / Username</label>
              <input
                type="text"
                value={editForm.handle}
                onChange={(e) => onEditFormChange({ ...editForm, handle: e.target.value })}
                placeholder="@yourhandle"
                className="w-full px-2 py-1 rounded-md bg-[#131627] border border-white/10 text-[11px] text-white focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Followers Count</label>
              <input
                type="text"
                value={editForm.followers}
                onChange={(e) => onEditFormChange({ ...editForm, followers: e.target.value })}
                placeholder="e.g. 15.2K or 1500"
                className="w-full px-2 py-1 rounded-md bg-[#131627] border border-white/10 text-[11px] text-white focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Recent Views</label>
              <input
                type="text"
                value={editForm.views}
                onChange={(e) => onEditFormChange({ ...editForm, views: e.target.value })}
                placeholder="e.g. 45.8K"
                className="w-full px-2 py-1 rounded-md bg-[#131627] border border-white/10 text-[11px] text-white focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>

            <div>
              <label className="text-[9px] text-slate-400 block mb-0.5">Views Growth</label>
              <input
                type="text"
                value={editForm.viewsGrowth}
                onChange={(e) => onEditFormChange({ ...editForm, viewsGrowth: e.target.value })}
                placeholder="e.g. +24.5%"
                className="w-full px-2 py-1 rounded-md bg-[#131627] border border-white/10 text-[11px] text-white focus:outline-none focus:border-pink-500 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={onCancelEditing}
              className="px-2.5 py-1 rounded-md text-[10px] text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSaveStats(account.id)}
              className="px-2.5 py-1 rounded-md bg-pink-600 hover:bg-pink-500 text-[10px] font-bold text-white flex items-center gap-1 transition-colors"
            >
              <Save className="w-3 h-3" />
              <span>Save Stats</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
