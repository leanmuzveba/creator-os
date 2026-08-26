/**
 * TikTok OAuth routes: build the authorization URL and handle the callback,
 * exchanging the code for a token and syncing the creator's profile/stats.
 */
import { Router } from 'express';
import type { Request } from 'express';
import { store, saveStorage } from '../store.ts';
import { logger } from '../logger.ts';
import { computeGrowth } from '../metrics.ts';

export const authTiktokRouter = Router();

/** Construct the TikTok OAuth redirect URI from the request/host. */
function getTikTokRedirectUri(req: Request): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/tiktok/callback`;
}

/**
 * Fetch the authenticated TikTok user, retrying with basic fields only if the
 * extended stats fields are not approved for the app. Returns the user object
 * or null. Extracted to keep the callback handler shallow.
 */
async function fetchTikTokUser(accessToken: string): Promise<any | null> {
  let userRes = await fetch(
    'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  let userData = await userRes.json();
  logger.debug('TikTok user info response:', userData);

  if (!userData.data?.user && userData.error?.code && userData.error?.code !== 'ok') {
    logger.debug('Retrying user info with basic fields only...');
    userRes = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    userData = await userRes.json();
    logger.debug('TikTok fallback user info response:', userData);
  }

  return userData.data?.user ?? null;
}

/** Sum recent video views for the connected TikTok account (0 if unavailable). */
async function fetchTikTokTotalViews(accessToken: string): Promise<number> {
  const videoRes = await fetch(
    'https://open.tiktokapis.com/v2/video/list/?fields=id,title,view_count,like_count,comment_count,share_count',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ max_count: 20 }),
    }
  );
  const videoData = await videoRes.json();
  logger.debug('TikTok video list response:', videoData);
  if (videoData.data?.videos && Array.isArray(videoData.data.videos)) {
    return videoData.data.videos.reduce((acc: number, v: any) => acc + (Number(v.view_count) || 0), 0);
  }
  return 0;
}

/** Format a raw count as an abbreviated string (1200 → "1.2K"). */
function abbreviate(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
}

// Get TikTok OAuth authorization URL.
authTiktokRouter.get('/api/auth/tiktok/url', (req, res) => {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = getTikTokRedirectUri(req);
  const state = 'creator_os_' + Math.random().toString(36).substring(2, 15);
  // Default to user.info.basic for universal compatibility with all TikTok app tiers.
  const requestedScope = (req.query.scope as string) || 'user.info.basic';

  if (!clientKey) {
    return res.json({
      configured: false,
      redirectUri,
      devCallbackUrl: 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback',
      sharedCallbackUrl: 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/tiktok/callback',
      scopes: requestedScope,
      message: 'TIKTOK_CLIENT_KEY not configured in environment variables yet.',
    });
  }

  const params = new URLSearchParams({
    client_key: clientKey,
    scope: requestedScope,
    response_type: 'code',
    redirect_uri: redirectUri,
    state: state,
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;

  res.json({ configured: true, url: authUrl, redirectUri, state });
});

// TikTok OAuth callback endpoint (handles the redirect from TikTok).
authTiktokRouter.get(['/api/auth/tiktok/callback', '/api/auth/tiktok/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Access denied by user';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>TikTok Authorization Failed</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 24px; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; background: #131627;">
            <h2 style="color: #f43f5e; margin-bottom: 8px;">Authentication Failed</h2>
            <p style="color: #94a3b8; font-size: 14px;">${errorMsg}</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'tiktok', error: '${errorMsg}' }, '*');
                setTimeout(() => window.close(), 2500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const clientKey = process.env.TIKTOK_CLIENT_KEY;
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    const redirectUri = getTikTokRedirectUri(req);

    const existingTiktokAcc = store.socialAccounts.find((a) => a.id === 'tiktok');
    const oldViews = existingTiktokAcc?.views;
    let profileDisplayName = existingTiktokAcc?.handle || '@my_tiktok';
    let profileAvatar =
      existingTiktokAcc?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    if (clientKey && clientSecret) {
      // Exchange code for token.
      const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code as string,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }).toString(),
      });

      const tokenData = await tokenRes.json();
      logger.debug('TikTok OAuth token response:', tokenData);

      if (tokenData.error) {
        const errorDetail =
          tokenData.error_description ||
          (typeof tokenData.error === 'object' ? tokenData.error.message || tokenData.error.code : tokenData.error);
        logger.warn('TikTok token error received:', errorDetail);
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head><title>TikTok Authorization Failed</title></head>
            <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #131627;">
                <h2 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 18px;">TikTok Connection Notice</h2>
                <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorDetail || 'Could not verify token. In TikTok Sandbox mode, ensure your redirect URI matches and your user is whitelisted.'}</p>
                <button onclick="window.close()" style="background: #e11d48; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
                <script>
                  if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'tiktok', error: '${errorDetail || 'Authentication failed'}' }, '*');
                  }
                </script>
              </div>
            </body>
          </html>
        `);
      }

      if (tokenData.access_token) {
        store.tiktokTokens = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          openId: tokenData.open_id,
          expiresAt: Date.now() + (tokenData.expires_in || 86400) * 1000,
        };

        // Fetch user info & stats (with fallback if stats scope is unapproved).
        try {
          const user = await fetchTikTokUser(tokenData.access_token);
          if (user) {
            if (user.username) {
              profileDisplayName = `@${user.username}`;
            } else if (user.display_name) {
              profileDisplayName = `@${user.display_name.replace(/\s+/g, '_').toLowerCase()}`;
            }
            if (user.avatar_url) {
              profileAvatar = user.avatar_url;
            }

            const tiktokAcc = store.socialAccounts.find((a) => a.id === 'tiktok');
            if (tiktokAcc) {
              if (user.follower_count !== undefined && user.follower_count !== null) {
                tiktokAcc.followers = abbreviate(Number(user.follower_count));
              }
              if (user.likes_count !== undefined && user.likes_count !== null) {
                tiktokAcc.views = abbreviate(Number(user.likes_count));
              }
            }
          }
        } catch (uErr) {
          logger.warn('Could not fetch TikTok user info:', uErr);
        }

        // Attempt video query to calculate total video views/engagement.
        try {
          const totalViews = await fetchTikTokTotalViews(tokenData.access_token);
          const tiktokAcc = store.socialAccounts.find((a) => a.id === 'tiktok');
          if (tiktokAcc && totalViews > 0) {
            tiktokAcc.views = abbreviate(totalViews);
          }
        } catch (vErr) {
          logger.warn('Could not fetch TikTok videos:', vErr);
        }
      }
    }

    // Update in-memory TikTok account record.
    const tiktokAcc = store.socialAccounts.find((a) => a.id === 'tiktok');
    if (tiktokAcc) {
      tiktokAcc.connected = true;
      tiktokAcc.handle = profileDisplayName;
      tiktokAcc.avatar = profileAvatar;
      tiktokAcc.status = 'active';
      tiktokAcc.viewsGrowth = computeGrowth(oldViews, tiktokAcc.views);
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>TikTok Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 32px; border: 1px solid rgba(236,72,153,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(236,72,153,0.2); border: 2px solid #ec4899; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">TikTok Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Account ${profileDisplayName} has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'tiktok', handle: '${profileDisplayName}' }, '*');
                setTimeout(() => window.close(), 1200);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    logger.error('TikTok OAuth exchange error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange authorization code'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'tiktok', error: '${err.message || 'Token exchange failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});
