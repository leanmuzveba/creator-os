/**
 * Setup guide for connecting Instagram and Facebook via Meta for Developers
 * (app domains, OAuth redirect URIs, credentials, and Graph API scopes).
 * Shown inside the connected accounts modal when Meta OAuth is not configured.
 */
import React from 'react';
import { KeyRound, ExternalLink, Sparkles } from 'lucide-react';
import { CopyField } from './CopyField';
import {
  APP_DOMAIN,
  SITE_URL,
  PRIVACY_POLICY_URL,
  TERMS_URL,
  META_IG_DEV_CALLBACK_URL,
  META_FB_DEV_CALLBACK_URL,
  META_SCOPES,
} from './oauthConfig';

interface MetaGuideProps {
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

export const MetaGuide: React.FC<MetaGuideProps> = ({ copiedKey, onCopy, onBack, onEnable }) => (
  <div className="space-y-4 animate-in fade-in duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold text-pink-400">
        <KeyRound className="w-4 h-4" />
        <span>Meta for Developers — Instagram &amp; Facebook Setup</span>
      </div>
      <button onClick={onBack} className="text-xs text-slate-400 hover:text-white underline">
        Back to accounts
      </button>
    </div>

    <p className="text-xs text-slate-300 leading-relaxed">
      Connect your Meta Developer App to link your real Instagram Creator/Business accounts and Facebook Pages:
    </p>

    {/* Step 1: App Domains & Website Platform */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={1}>Set App Domains &amp; Website in Meta Basic Settings</StepHeading>
      <p className="text-[11px] text-slate-400">
        Go to <strong>App settings ➔ Basic</strong> in Meta Developer Portal:
      </p>
      <div className="space-y-2 pt-1">
        <CopyField label="App Domains (Paste here)" value={APP_DOMAIN} copyKey="appDomain" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-emerald-300" title="Copy Domain" />
        <CopyField label="Website Platform URL (Scroll to bottom ➔ Add Platform ➔ Website ➔ Site URL)" value={SITE_URL} copyKey="siteUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-emerald-300" title="Copy Site URL" />
        <CopyField label="Privacy Policy URL (Required to switch to Live Mode)" value={PRIVACY_POLICY_URL} copyKey="privacyPolicyUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-cyan-300" title="Copy Privacy Policy URL" />
        <CopyField label="Terms of Service URL (Optional)" value={TERMS_URL} copyKey="termsUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-cyan-300" title="Copy Terms URL" />
      </div>
    </div>

    {/* Step 2: Redirect URIs */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={2}>Add Valid OAuth Redirect URIs in Facebook Login Settings</StepHeading>
      <p className="text-[11px] text-slate-400">
        Go to <strong>Facebook Login ➔ Settings ➔ Valid OAuth Redirect URIs</strong>:
      </p>
      <div className="space-y-2 pt-1">
        <CopyField label="Instagram Callback URI" value={META_IG_DEV_CALLBACK_URL} copyKey="metaIgUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-pink-300" title="Copy URL" />
        <CopyField label="Facebook Callback URI" value={META_FB_DEV_CALLBACK_URL} copyKey="metaFbUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-blue-300" title="Copy URL" />
      </div>
    </div>

    {/* Step 3: Meta App Credentials */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={3}>Add Meta Credentials in AI Studio Settings</StepHeading>
      <p className="text-[11px] text-slate-400 leading-relaxed">Add these under Environment Variables in AI Studio Settings:</p>
      <div className="bg-[#0b0d17] p-2.5 rounded-xl border border-white/10 font-mono text-[11px] text-pink-300 space-y-1">
        <div>META_APP_ID=your_app_id</div>
        <div>META_APP_SECRET=your_app_secret</div>
      </div>
    </div>

    {/* Step 4: Meta Scopes */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[#131627] border border-white/10 text-xs">
      <StepHeading n={4}>Meta Graph API Scopes</StepHeading>
      <CopyField value={META_SCOPES} copyKey="metaScopes" copiedKey={copiedKey} onCopy={onCopy} title="Copy Scopes" />
    </div>

    {/* Action Buttons */}
    <div className="pt-2 flex flex-col sm:flex-row gap-2">
      <a
        href="https://developers.facebook.com/apps/"
        target="_blank"
        rel="noreferrer"
        className="flex-1 py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-white/10"
      >
        <span>Open Meta Developer Portal</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      <button
        onClick={onEnable}
        className="flex-1 pink-glow-btn py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Toggle Meta Accounts Online</span>
      </button>
    </div>
  </div>
);
