/**
 * Setup guide for connecting Instagram via Meta's "Instagram API with
 * Instagram Login" product (its own app credentials and redirect URI,
 * separate from the Facebook Login product used for Facebook). Shown inside
 * the connected accounts modal when Instagram OAuth is not configured.
 */
import React from 'react';
import { KeyRound, ExternalLink, Sparkles } from 'lucide-react';
import { CopyField } from './CopyField';
import { INSTAGRAM_DEV_CALLBACK_URL, INSTAGRAM_SHARED_CALLBACK_URL, INSTAGRAM_SCOPES } from './oauthConfig';

interface InstagramGuideProps {
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  onBack: () => void;
  onEnable: () => void;
}

const StepHeading: React.FC<{ n: number; children: React.ReactNode }> = ({ n, children }) => (
  <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
    <span className="w-4 h-4 rounded-full bg-[var(--accent)] text-[var(--accent-text)] flex items-center justify-center text-[10px]">{n}</span>
    <span>{children}</span>
  </p>
);

export const InstagramGuide: React.FC<InstagramGuideProps> = ({ copiedKey, onCopy, onBack, onEnable }) => (
  <div className="space-y-4 animate-in fade-in duration-200">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
        <KeyRound className="w-4 h-4" />
        <span>Meta for Developers — Instagram Login Setup</span>
      </div>
      <button onClick={onBack} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline">
        Back to accounts
      </button>
    </div>

    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
      Connect the <strong>Instagram API with Instagram Login</strong> product in your Meta Developer App so you log
      into Instagram directly and pick the exact account you want — no linked Facebook Page required.
    </p>

    {/* Step 1: Add the product */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs">
      <StepHeading n={1}>Add the "Instagram API setup with Instagram Login" product</StepHeading>
      <p className="text-[11px] text-[var(--text-secondary)]">
        In your Meta app, go to <strong>Add Product ➔ Instagram ➔ Instagram API setup with Instagram Login</strong>.
        This gives you a separate Instagram App ID and Secret from your Facebook Login app.
      </p>
    </div>

    {/* Step 2: Redirect URIs */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs">
      <StepHeading n={2}>Add OAuth Redirect URIs under Business Login settings</StepHeading>
      <div className="space-y-2 pt-1">
        <CopyField label="Development Redirect URI" value={INSTAGRAM_DEV_CALLBACK_URL} copyKey="igDevUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-[var(--accent)]" title="Copy URL" />
        <CopyField label="Shared / Deployed Redirect URI" value={INSTAGRAM_SHARED_CALLBACK_URL} copyKey="igSharedUrl" copiedKey={copiedKey} onCopy={onCopy} valueClass="text-[var(--accent)]" title="Copy URL" />
      </div>
    </div>

    {/* Step 3: Credentials */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs">
      <StepHeading n={3}>Add Instagram Credentials in AI Studio Settings</StepHeading>
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
        Copy the Instagram App ID/Secret from that product's settings page (not the Facebook App ID/Secret) and add
        them under Environment Variables:
      </p>
      <div className="bg-[var(--bg-page)] p-2.5 rounded-xl border border-[var(--border-color)] font-mono text-[11px] text-[var(--accent)] space-y-1">
        <div>INSTAGRAM_APP_ID=your_instagram_app_id</div>
        <div>INSTAGRAM_APP_SECRET=your_instagram_app_secret</div>
      </div>
    </div>

    {/* Step 4: Scopes */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs">
      <StepHeading n={4}>Instagram API Scopes</StepHeading>
      <CopyField value={INSTAGRAM_SCOPES} copyKey="igScopes" copiedKey={copiedKey} onCopy={onCopy} title="Copy Scopes" />
    </div>

    {/* Step 5: Professional account note */}
    <div className="space-y-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
      <p className="font-bold text-amber-300 flex items-center gap-1.5">
        <span className="w-4 h-4 rounded-full bg-amber-500 text-black font-black flex items-center justify-center text-[10px]">5</span>
        <span>Your Instagram account must be Professional:</span>
      </p>
      <p className="text-[11px] text-amber-200/80 leading-relaxed">
        Personal accounts can still log in, but Instagram won't share follower or insights data for them. In the
        Instagram app, go to <strong>Settings ➔ Account type</strong> and switch to Business or Creator.
      </p>
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
        While your app is in Development mode, also add your Instagram account as a tester under this product's
        settings and accept the invite from the Instagram app.
      </p>
    </div>

    {/* Action Buttons */}
    <div className="pt-2 flex flex-col sm:flex-row gap-2">
      <a
        href="https://developers.facebook.com/apps/"
        target="_blank"
        rel="noreferrer"
        className="flex-1 py-2.5 px-3 rounded-xl bg-[var(--overlay-hover)] hover:opacity-80 text-[var(--text-primary)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-[var(--border-color)]"
      >
        <span>Open Meta Developer Portal</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      <button
        onClick={onEnable}
        className="flex-1 pink-glow-btn py-2.5 px-3 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Toggle Instagram Account Online</span>
      </button>
    </div>
  </div>
);
