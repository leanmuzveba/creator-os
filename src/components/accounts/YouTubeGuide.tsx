/**
 * Setup guide for connecting a YouTube channel via Google Cloud Console
 * (OAuth 2.0 web client + YouTube Data API v3). Shown inside the connected
 * accounts modal when YouTube OAuth is not yet configured.
 */
import React from 'react';
import { KeyRound, ExternalLink, Sparkles } from 'lucide-react';
import { CopyField } from './CopyField';
import { SITE_URL, YT_DEV_CALLBACK_URL, YT_SHARED_CALLBACK_URL, YT_SCOPES } from './oauthConfig';

interface YouTubeGuideProps {
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onBack: () => void;
  onEnable: () => void;
}

/** A numbered step heading used within a guide card. */
const StepHeading: React.FC<{ n: number; children: React.ReactNode; badge?: string }> = ({ n, children, badge = 'bg-red-600' }) => (
  <p className="font-bold text-white flex items-center gap-1.5">
    <span className={`w-4 h-4 rounded-full ${badge} text-white flex items-center justify-center text-[10px]`}>{n}</span>
    <span>{children}</span>
  </p>
);

export const YouTubeGuide: React.FC<YouTubeGuideProps> = ({ copiedKey, onCopy, onBack, onEnable }) => (
  <div className="space-y-4 animate-in fade-in duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold text-red-400">
        <KeyRound className="w-4 h-4" />
        <span>Google Cloud Console — YouTube API Setup</span>
      </div>
      <button onClick={onBack} className="text-xs text-slate-400 hover:text-white underline">
        Back to accounts
      </button>
    </div>

    <p className="text-xs text-slate-300 leading-relaxed">
      Connect your YouTube channel using Google OAuth 2.0 and YouTube Data API v3 in Google Cloud Console:
    </p>

    {/* Step 1: Authorized Origins & Redirect URIs */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={1}>Add OAuth 2.0 Web Client in Google Cloud Console</StepHeading>
      <p className="text-[11px] text-slate-400">
        Go to <strong>APIs &amp; Services ➔ Credentials ➔ Create Credentials ➔ OAuth client ID (Web application)</strong>:
      </p>

      <div className="space-y-2 pt-1">
        <CopyField label="Authorized JavaScript Origins" value={SITE_URL} copyKey="ytOrigin" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-red-300" title="Copy Origin" />
        <CopyField label="Authorized Redirect URI (Development)" value={YT_DEV_CALLBACK_URL} copyKey="ytDevUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-red-300" title="Copy Redirect URI" />
        <CopyField label="Authorized Redirect URI (Shared / Preview)" value={YT_SHARED_CALLBACK_URL} copyKey="ytSharedUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-red-300" title="Copy Redirect URI" />
      </div>
    </div>

    {/* Step 2: Enable YouTube Data API v3 */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={2}>Enable YouTube Data API v3</StepHeading>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        In Google Cloud Console, visit <strong>APIs &amp; Services ➔ Library</strong>, search for <strong>YouTube Data API v3</strong>, and click <strong>Enable</strong>.
      </p>
    </div>

    {/* Step 3: Google Client Credentials */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={3}>Add Google Client Keys in AI Studio Project Settings</StepHeading>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Open the <strong>Settings</strong> menu in AI Studio and add your credentials under Environment Variables:
      </p>
      <div className="bg-[#0b0d17] p-2.5 rounded-xl border border-white/10 font-mono text-[11px] text-red-300 space-y-1">
        <div>GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com</div>
        <div>GOOGLE_CLIENT_SECRET=your_client_secret</div>
      </div>
    </div>

    {/* Step 4: Scopes */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={4}>OAuth Scopes</StepHeading>
      <CopyField value={YT_SCOPES} copyKey="ytScopes" copiedKey={copiedKey} onCopy={onCopy} title="Copy Scopes" />
    </div>

    {/* Action Buttons */}
    <div className="pt-2 flex flex-col sm:flex-row gap-2">
      <a
        href="https://console.cloud.google.com/apis/credentials"
        target="_blank"
        rel="noreferrer"
        className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
      >
        <span>Google Cloud Credentials</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      <button
        onClick={onEnable}
        className="flex-1 pink-glow-btn py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Toggle YouTube Online</span>
      </button>
    </div>
  </div>
);
