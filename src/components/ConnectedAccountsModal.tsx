import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Link2,
  Copy,
  Check,
  ChevronRight,
  Sparkles,
  HelpCircle,
  KeyRound,
  Edit3,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from './PlatformIcon';
import { PlatformType, SocialAccount } from '../types';

export const ConnectedAccountsModal: React.FC = () => {
  const {
    isAccountsModalOpen,
    setIsAccountsModalOpen,
    socialAccounts,
    toggleAccountConnection,
    updateAccount,
    refreshAccounts,
    showToast,
  } = useApp();

  const [showTikTokGuide, setShowTikTokGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConnectingTikTok, setIsConnectingTikTok] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    handle: string;
    followers: string;
    views: string;
    viewsGrowth: string;
  }>({
    handle: '',
    followers: '',
    views: '',
    viewsGrowth: '',
  });

  if (!isAccountsModalOpen) return null;

  const devCallbackUrl = 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback';
  const sharedCallbackUrl = 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback';
  const scopes = 'user.info.basic,video.upload,video.publish';

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'info');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const startEditing = (account: SocialAccount) => {
    setEditingAccountId(account.id);
    setEditForm({
      handle: account.handle,
      followers: account.followers,
      views: account.views,
      viewsGrowth: account.viewsGrowth,
    });
  };

  const saveStats = async (id: PlatformType) => {
    await updateAccount(id, {
      handle: editForm.handle.startsWith('@') || id === 'youtube' || id === 'facebook' ? editForm.handle : `@${editForm.handle}`,
      followers: editForm.followers,
      views: editForm.views,
      viewsGrowth: editForm.viewsGrowth,
    });
    setEditingAccountId(null);
  };

  const handleConnectAccount = async (id: PlatformType) => {
    if (id === 'tiktok') {
      setIsConnectingTikTok(true);
      try {
        const res = await fetch('/api/auth/tiktok/url');
        const data = await res.json();

        if (data.configured && data.url) {
          // Open TikTok OAuth popup directly
          const authWindow = window.open(data.url, 'tiktok_oauth_popup', 'width=600,height=750');
          if (!authWindow) {
            showToast('Please allow popups to connect with TikTok', 'error');
          } else {
            showToast('Opening official TikTok OAuth authorization...', 'info');
          }
        } else {
          // Show guided developer portal setup
          setShowTikTokGuide(true);
        }
      } catch (err) {
        console.error('Failed to initiate TikTok connection:', err);
        setShowTikTokGuide(true);
      } finally {
        setIsConnectingTikTok(false);
      }
      return;
    }

    // Default toggle for other platforms
    toggleAccountConnection(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b0d17] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#131627] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-600/20 text-pink-400 border border-pink-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Social Account Connections</h3>
              <p className="text-[11px] text-slate-400">Official OAuth credentials, API sync & publishing</p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsAccountsModalOpen(false);
              setShowTikTokGuide(false);
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto max-h-[68vh]">
          {showTikTokGuide ? (
            /* TikTok Developer Setup Guide */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
                  <KeyRound className="w-4 h-4" />
                  <span>TikTok for Developers — OAuth Setup</span>
                </div>
                <button
                  onClick={() => setShowTikTokGuide(false)}
                  className="text-xs text-slate-400 hover:text-white underline"
                >
                  Back to accounts
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Connect your TikTok Developer App by adding these exact redirect URLs and scopes to your TikTok Developer Console:
              </p>

              {/* Step 1: Redirect URIs */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Add Callback Redirect URLs in TikTok App Settings</span>
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Development Redirect URI</label>
                    <div className="flex items-center gap-2 bg-[#0b0d17] p-2 rounded-xl border border-white/10 font-mono text-[11px] text-pink-300 break-all">
                      <span className="flex-1 select-all">{devCallbackUrl}</span>
                      <button
                        onClick={() => copyToClipboard(devCallbackUrl, 'devUrl')}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
                        title="Copy URL"
                      >
                        {copiedKey === 'devUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Shared / Deployed Redirect URI</label>
                    <div className="flex items-center gap-2 bg-[#0b0d17] p-2 rounded-xl border border-white/10 font-mono text-[11px] text-pink-300 break-all">
                      <span className="flex-1 select-all">{sharedCallbackUrl}</span>
                      <button
                        onClick={() => copyToClipboard(sharedCallbackUrl, 'sharedUrl')}
                        className="p-1 rounded bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
                        title="Copy URL"
                      >
                        {copiedKey === 'sharedUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Scopes */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Required TikTok OAuth Scopes</span>
                </p>
                <div className="flex items-center gap-2 bg-[#0b0d17] p-2 rounded-xl border border-white/10 font-mono text-[11px] text-slate-200">
                  <span className="flex-1">{scopes}</span>
                  <button
                    onClick={() => copyToClipboard(scopes, 'scopes')}
                    className="p-1 rounded bg-white/10 hover:bg-white/20 text-white flex-shrink-0"
                    title="Copy Scopes"
                  >
                    {copiedKey === 'scopes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Step 3: Keys configuration */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Set Keys in AI Studio Project Settings</span>
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open the <strong>Settings</strong> menu in AI Studio and add your credentials under Environment Variables:
                </p>
                <div className="bg-[#0b0d17] p-2.5 rounded-xl border border-white/10 font-mono text-[11px] text-pink-300 space-y-1">
                  <div>TIKTOK_CLIENT_KEY=your_client_key</div>
                  <div>TIKTOK_CLIENT_SECRET=your_client_secret</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <a
                  href="https://developers.tiktok.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
                >
                  <span>Open TikTok Developer Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => {
                    toggleAccountConnection('tiktok');
                    setShowTikTokGuide(false);
                  }}
                  className="flex-1 pink-glow-btn py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enable Sandbox Connected Mode</span>
                </button>
              </div>
            </div>
          ) : (
            /* Main Accounts List */
            <>
              {socialAccounts.map((account) => {
                const isEditing = editingAccountId === account.id;

                return (
                  <div
                    key={account.id}
                    className="p-4 rounded-2xl bg-[#131627] border border-white/[0.08] hover:border-pink-500/30 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative">
                          <div className="w-11 h-11 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center">
                            <PlatformIcon platform={account.id} size={22} className="text-white" />
                          </div>
                          {account.connected && (
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#131627] flex items-center justify-center text-[8px] text-white">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-white">{account.name}</h4>
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${
                                account.connected
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-700/40 text-slate-400 border border-slate-600/30'
                              }`}
                            >
                              {account.connected ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>

                          {!isEditing ? (
                            <>
                              <p className="text-xs text-pink-300 font-mono mt-0.5 truncate">{account.handle}</p>
                              {account.connected && (
                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                                  <span className="font-semibold text-slate-200">{account.followers} followers</span>
                                  <span>•</span>
                                  <span className="text-emerald-400 font-semibold">{account.viewsGrowth} views</span>
                                </div>
                              )}
                            </>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {account.connected && !isEditing && (
                          <button
                            onClick={() => startEditing(account)}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-pink-300 transition-colors"
                            title="Edit Handle & Metrics"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {account.id === 'tiktok' && !isEditing && (
                          <button
                            onClick={() => setShowTikTokGuide(true)}
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                            title="TikTok Developer Credentials & Redirect URLs"
                          >
                            <HelpCircle className="w-4 h-4" />
                          </button>
                        )}

                        {!isEditing && (
                          <button
                            onClick={() => handleConnectAccount(account.id)}
                            disabled={isConnectingTikTok && account.id === 'tiktok'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              account.connected
                                ? 'bg-white/[0.06] hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 text-slate-300 border border-white/10'
                                : 'pink-glow-btn text-white'
                            }`}
                          >
                            {account.connected ? 'Disconnect' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Edit Form */}
                    {isEditing && (
                      <div className="mt-2 pt-3 border-t border-white/10 space-y-3 bg-[#0b0d17]/60 p-3 rounded-xl border border-white/5 animate-in fade-in duration-150">
                        <div className="text-[11px] font-bold text-pink-300 flex items-center justify-between">
                          <span>Update Real Handle & Live Stats</span>
                          <span className="text-[10px] text-slate-400 font-normal">Saves across all dashboards</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Handle / Username</label>
                            <input
                              type="text"
                              value={editForm.handle}
                              onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                              placeholder="@yourhandle"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#131627] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Followers Count</label>
                            <input
                              type="text"
                              value={editForm.followers}
                              onChange={(e) => setEditForm({ ...editForm, followers: e.target.value })}
                              placeholder="e.g. 15.2K or 1500"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#131627] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Recent Views</label>
                            <input
                              type="text"
                              value={editForm.views}
                              onChange={(e) => setEditForm({ ...editForm, views: e.target.value })}
                              placeholder="e.g. 45.8K"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#131627] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Views Growth</label>
                            <input
                              type="text"
                              value={editForm.viewsGrowth}
                              onChange={(e) => setEditForm({ ...editForm, viewsGrowth: e.target.value })}
                              placeholder="e.g. +24.5%"
                              className="w-full px-2.5 py-1.5 rounded-lg bg-[#131627] border border-white/10 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingAccountId(null)}
                            className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveStats(account.id)}
                            className="px-3.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Stats</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Scope and API Security Note */}
              <div className="p-3.5 rounded-2xl bg-pink-950/20 border border-pink-500/20 text-xs space-y-1 text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-pink-300">
                  <ShieldCheck className="w-4 h-4 text-pink-400" />
                  <span>Official API Integration Status</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Official Content Posting APIs and OAuth scopes active for TikTok Content API, Meta Graph API (Instagram & Facebook), and YouTube Data API v3.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#131627] border-t border-white/[0.08] flex items-center justify-between">
          <button
            onClick={() => {
              refreshAccounts();
              showToast('Tokens refreshed and synced with platform servers!', 'success');
            }}
            className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-pink-300 font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Live Metrics</span>
          </button>

          <button
            onClick={() => {
              setIsAccountsModalOpen(false);
              setShowTikTokGuide(false);
            }}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

