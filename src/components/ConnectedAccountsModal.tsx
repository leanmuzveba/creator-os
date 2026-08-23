/**
 * Connected Accounts modal.
 *
 * Lets the user connect/disconnect their social platforms via OAuth, view a
 * platform-specific developer setup guide when OAuth is not configured, and
 * edit each account's handle and live metrics. State and actions live here;
 * the setup guides and the per-account row are dedicated components under
 * `./accounts`.
 */
import React, { useState } from 'react';
import { X, RefreshCw, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformType, SocialAccount } from '../types';
import { logger } from '../utils/logger';
import { AccountRow, AccountEditForm } from './accounts/AccountRow';
import { TikTokGuide } from './accounts/TikTokGuide';
import { MetaGuide } from './accounts/MetaGuide';
import { YouTubeGuide } from './accounts/YouTubeGuide';

/** Endpoint + messaging for launching an OAuth popup for a given platform. */
interface OAuthLaunch {
  endpoint: string;
  popupName: string;
  openingMessage: string;
  popupBlockedMessage: string;
  showGuide: () => void;
}

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
  const [showMetaGuide, setShowMetaGuide] = useState(false);
  const [showYouTubeGuide, setShowYouTubeGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isConnectingPlatform, setIsConnectingPlatform] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AccountEditForm>({
    handle: '',
    followers: '',
    views: '',
    viewsGrowth: '',
  });

  if (!isAccountsModalOpen) return null;

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
    const needsAtPrefix = !editForm.handle.startsWith('@') && id !== 'youtube' && id !== 'facebook';
    await updateAccount(id, {
      handle: needsAtPrefix ? `@${editForm.handle}` : editForm.handle,
      followers: editForm.followers,
      views: editForm.views,
      viewsGrowth: editForm.viewsGrowth,
    });
    setEditingAccountId(null);
  };

  // Launch an OAuth popup for the given platform, falling back to the setup
  // guide when the backend reports the integration is not yet configured.
  const launchOAuth = async (platform: PlatformType, cfg: OAuthLaunch) => {
    setIsConnectingPlatform(platform);
    try {
      const res = await fetch(cfg.endpoint);
      const data = await res.json();
      if (data.configured && data.url) {
        const authWindow = window.open(data.url, cfg.popupName, 'width=600,height=750');
        showToast(authWindow ? cfg.openingMessage : cfg.popupBlockedMessage, authWindow ? 'info' : 'error');
      } else {
        cfg.showGuide();
      }
    } catch (err) {
      logger.error(`Failed to initiate ${platform} connection:`, err);
      cfg.showGuide();
    } finally {
      setIsConnectingPlatform(null);
    }
  };

  const oauthLaunchers: Partial<Record<PlatformType, OAuthLaunch>> = {
    tiktok: {
      endpoint: '/api/auth/tiktok/url',
      popupName: 'tiktok_oauth_popup',
      openingMessage: 'Opening official TikTok OAuth authorization...',
      popupBlockedMessage: 'Please allow popups to connect with TikTok',
      showGuide: () => setShowTikTokGuide(true),
    },
    instagram: {
      endpoint: '/api/auth/instagram/url',
      popupName: 'instagram_oauth_popup',
      openingMessage: 'Opening Meta Instagram Login authorization...',
      popupBlockedMessage: 'Please allow popups to connect with Instagram',
      showGuide: () => setShowMetaGuide(true),
    },
    facebook: {
      endpoint: '/api/auth/facebook/url',
      popupName: 'facebook_oauth_popup',
      openingMessage: 'Opening Meta Facebook Login authorization...',
      popupBlockedMessage: 'Please allow popups to connect with Facebook',
      showGuide: () => setShowMetaGuide(true),
    },
    youtube: {
      endpoint: '/api/auth/youtube/url',
      popupName: 'youtube_oauth_popup',
      openingMessage: 'Opening Google YouTube OAuth authorization...',
      popupBlockedMessage: 'Please allow popups to connect with YouTube',
      showGuide: () => setShowYouTubeGuide(true),
    },
  };

  const handleConnectAccount = (id: PlatformType) => {
    const launcher = oauthLaunchers[id];
    if (launcher) {
      launchOAuth(id, launcher);
      return;
    }
    // Default toggle for platforms without a dedicated OAuth flow.
    toggleAccountConnection(id);
  };

  const handleShowGuide = (id: PlatformType) => {
    if (id === 'tiktok') setShowTikTokGuide(true);
    else if (id === 'instagram' || id === 'facebook') setShowMetaGuide(true);
    else if (id === 'youtube') setShowYouTubeGuide(true);
  };

  const closeModal = () => {
    setIsAccountsModalOpen(false);
    setShowTikTokGuide(false);
    setShowMetaGuide(false);
    setShowYouTubeGuide(false);
  };

  // Decide what to render in the modal body: a setup guide, or the accounts list.
  const renderBody = () => {
    if (showYouTubeGuide) {
      return (
        <YouTubeGuide
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
          onBack={() => setShowYouTubeGuide(false)}
          onEnable={() => {
            toggleAccountConnection('youtube');
            setShowYouTubeGuide(false);
          }}
        />
      );
    }
    if (showMetaGuide) {
      return (
        <MetaGuide
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
          onBack={() => setShowMetaGuide(false)}
          onEnable={() => {
            toggleAccountConnection('instagram');
            toggleAccountConnection('facebook');
            setShowMetaGuide(false);
          }}
        />
      );
    }
    if (showTikTokGuide) {
      return (
        <TikTokGuide
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
          onBack={() => setShowTikTokGuide(false)}
          onEnable={() => {
            toggleAccountConnection('tiktok');
            setShowTikTokGuide(false);
          }}
        />
      );
    }

    return (
      <>
        {socialAccounts.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            isEditing={editingAccountId === account.id}
            isConnecting={isConnectingPlatform === account.id}
            editForm={editForm}
            onEditFormChange={setEditForm}
            onStartEditing={startEditing}
            onCancelEditing={() => setEditingAccountId(null)}
            onSaveStats={saveStats}
            onConnect={handleConnectAccount}
            onShowGuide={handleShowGuide}
          />
        ))}

        {/* Scope and API Security Note */}
        <div className="p-3 rounded-xl bg-pink-950/20 border border-pink-500/20 text-xs space-y-0.5 text-slate-300">
          <div className="flex items-center gap-1.5 font-bold text-pink-300 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
            <span>Official API Integration Status</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Official Content Posting APIs and OAuth scopes active for TikTok Content API, Meta Graph API (Instagram &amp;
            Facebook), and YouTube Data API v3.
          </p>
        </div>
      </>
    );
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
            onClick={closeModal}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto max-h-[68vh]">{renderBody()}</div>

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
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
