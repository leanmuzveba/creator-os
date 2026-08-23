/**
 * Setup guide for connecting TikTok via TikTok for Developers (redirect URIs,
 * scopes, credentials, and the sandbox target-user note). Shown inside the
 * connected accounts modal when TikTok OAuth is not configured.
 */
import React from 'react';
import { KeyRound, ExternalLink, Sparkles } from 'lucide-react';
import { CopyField } from './CopyField';
import { TIKTOK_DEV_CALLBACK_URL, TIKTOK_SHARED_CALLBACK_URL, TIKTOK_SCOPES } from './oauthConfig';

interface TikTokGuideProps {
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onBack: () => void;
  onEnable: () => void;
}

const StepHeading: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <p className="font-bold text-white flex items-center gap-1.5">
    <span className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center text-[10px]">{n}</span>
    <span>{children}</span>
  </p>
);

export const TikTokGuide: React.FC<TikTokGuideProps> = ({ copiedKey, onCopy, onBack, onEnable }) => (
  <div className="space-y-4 animate-in fade-in duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
        <KeyRound className="w-4 h-4" />
        <span>TikTok for Developers — OAuth Setup</span>
      </div>
      <button onClick={onBack} className="text-xs text-slate-400 hover:text-white underline">
        Back to accounts
      </button>
    </div>

    <p className="text-xs text-slate-300 leading-relaxed">
      Connect your TikTok Developer App by adding these exact redirect URLs and scopes to your TikTok Developer Console:
    </p>

    {/* Step 1: Redirect URIs */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={1}>Add Callback Redirect URLs in TikTok App Settings</StepHeading>
      <div className="space-y-2 pt-1">
        <CopyField label="Development Redirect URI" value={TIKTOK_DEV_CALLBACK_URL} copyKey="devUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-pink-300" title="Copy URL" />
        <CopyField label="Shared / Deployed Redirect URI" value={TIKTOK_SHARED_CALLBACK_URL} copyKey="sharedUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-pink-300" title="Copy URL" />
      </div>
    </div>

    {/* Step 2: Scopes */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={2}>Required TikTok OAuth Scopes</StepHeading>
      <CopyField value={TIKTOK_SCOPES} copyKey="scopes" copiedKey={copiedKey} onCopy={onCopy} title="Copy Scopes" />
    </div>

    {/* Step 3: Keys configuration */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={3}>Set Keys in AI Studio Project Settings</StepHeading>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Open the <strong>Settings</strong> menu in AI Studio and add your credentials under Environment Variables:
      </p>
      <div className="bg-[#0b0d17] p-2.5 rounded-xl border border-white/10 font-mono text-[11px] text-pink-300 space-y-1">
        <div>TIKTOK_CLIENT_KEY=your_client_key</div>
        <div>TIKTOK_CLIENT_SECRET=your_client_secret</div>
      </div>
    </div>

    {/* Step 4: TikTok Sandbox Target User Note */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
      <p className="font-bold text-amber-300 flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-[10px]">4</span>
        <span>Why TikTok Sandbox creates a demo account:</span>
      </p>
      <p className="text-[11px] text-amber-200/80 leading-relaxed">
        TikTok sandbox apps automatically simulate a virtual demo user unless you add your real TikTok username under{' '}
        <strong>Sandbox ➔ Target Users</strong> in the TikTok Developer Portal and accept the invite.
      </p>
      <p className="text-[11px] text-slate-300 leading-relaxed">
        💡 <em>You can also click the <strong>Pencil (Edit)</strong> button directly on TikTok below to set your exact real username, follower count, and metrics!</em>
      </p>
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
        onClick={onEnable}
        className="flex-1 pink-glow-btn py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Enable Sandbox Connected Mode</span>
      </button>
    </div>
  </div>
);
