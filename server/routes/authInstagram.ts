/**
 * Instagram OAuth routes using Meta's "Instagram API with Instagram Login"
 * product: authorizes directly against instagram.com (no linked Facebook Page
 * required, unlike the old Facebook-Login-based flow), so the user logs into
 * the exact Instagram account they want rather than whichever Page happens to
 * have one linked. Uses its own app credentials (INSTAGRAM_APP_ID/SECRET),
 * separate from the Facebook Login app used by authFacebook.ts.
 */
import { Router } from 'express';
import type { Request } from 'express';
import { getAccount, upsertAccount, setOAuthToken, DEFAULT_LOCAL_USER_ID } from '../db.ts';
import { logger } from '../logger.ts';
import { computeGrowth } from '../metrics.ts';

export const authInstagramRouter = Router();

/** Construct the Instagram OAuth redirect URI. */
function getInstagramRedirectUri(req: Request): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/instagram/callback`;
}

// Instagram OAuth authorization URL (Instagram Login - authorizes on instagram.com).
authInstagramRouter.get('/api/auth/instagram/url', (req, res) => {
  const appId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = getInstagramRedirectUri(req);
  const state = 'creator_os_ig_' + Math.random().toString(36).substring(2, 15);
  // instagram_business_basic covers profile fields (username, account_type,
  // followers_count, media_count); instagram_business_manage_insights is
  // requested too since some accounts only expose follower counts once it's
  // granted.
  const scope = (req.query.scope as string) || 'instagram_business_basic,instagram_business_manage_insights';

  if (!appId) {
    return res.json({
      configured: false,
      redirectUri,
      devCallbackUrl: 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/instagram/callback',
      sharedCallbackUrl: 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/instagram/callback',
      scopes: scope,
      message: 'INSTAGRAM_APP_ID not configured in environment variables yet.',
    });
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
    state: state,
  });

  const authUrl = `https://www.instagram.com/oauth/authorize?${params.toString()}`;

  res.json({ configured: true, url: authUrl, redirectUri, state });
});

// Instagram OAuth callback endpoint.
authInstagramRouter.get(['/api/auth/instagram/callback', '/api/auth/instagram/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Access denied';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Instagram Authorization Failed</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #131627;">
            <h2 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 18px;">Instagram Connection Notice</h2>
            <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorMsg}</p>
            <button onclick="window.close()" style="background: #e11d48; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'instagram', error: '${errorMsg}' }, '*');
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const redirectUri = getInstagramRedirectUri(req);

    if (!appId || !appSecret) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Instagram Credentials Missing</title></head>
          <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(236,72,153,0.3); border-radius: 16px; background: #131627;">
              <h2 style="color: #ec4899; margin: 0 0 10px 0; font-size: 18px;">Instagram App Credentials Missing</h2>
              <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">Please configure <code>INSTAGRAM_APP_ID</code> and <code>INSTAGRAM_APP_SECRET</code> in Settings to connect your real Instagram account.</p>
              <button onclick="window.close()" style="background: #db2777; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'instagram', error: 'INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET not configured' }, '*');
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Exchange code for a short-lived token. Unlike the Facebook Login flow,
    // this endpoint requires a form-urlencoded POST body, not a query string.
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code: code as string,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    logger.debug('Instagram Login OAuth token response:', tokenData);

    if (tokenData.error_message || !tokenData.access_token) {
      const errorMsg = tokenData.error_message || tokenData.error_description || 'Failed to obtain access token from Instagram';
      logger.warn('Instagram Login token error:', errorMsg);
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Instagram Authorization Failed</title></head>
          <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #131627;">
              <h2 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 18px;">Instagram Authorization Failed</h2>
              <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorMsg}</p>
              <button onclick="window.close()" style="background: #e11d48; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'instagram', error: '${errorMsg}' }, '*');
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Exchange the short-lived token for a long-lived one (~60 days). If this
    // fails, fall back to the short-lived token rather than failing the whole
    // connection - a first sync can still succeed with it.
    let accessToken = tokenData.access_token;
    let expiresIn = tokenData.expires_in || 3600;
    try {
      const longLivedRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${tokenData.access_token}`
      );
      const longLivedData = await longLivedRes.json();
      if (longLivedData.access_token) {
        accessToken = longLivedData.access_token;
        expiresIn = longLivedData.expires_in || expiresIn;
      } else {
        logger.warn('Instagram long-lived token exchange did not return a token:', longLivedData);
      }
    } catch (llErr) {
      logger.warn('Could not exchange Instagram token for a long-lived one:', llErr);
    }

    setOAuthToken(DEFAULT_LOCAL_USER_ID, 'instagram', {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      extra: tokenData.user_id ? { userId: tokenData.user_id } : undefined,
    });

    const igAcc = getAccount(DEFAULT_LOCAL_USER_ID, 'instagram');
    const oldIgFollowers = igAcc?.followers;
    let profileDisplayName = 'Instagram User';
    let profileAvatar = '';
    let followersCount = '0';
    let metricsSynced = false;

    try {
      const profileRes = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=id,username,account_type,followers_count,media_count,profile_picture_url&access_token=${accessToken}`
      );
      const profileData = await profileRes.json();
      logger.debug('Instagram profile response:', profileData);

      if (profileData.username) profileDisplayName = `@${profileData.username}`;
      if (profileData.profile_picture_url) profileAvatar = profileData.profile_picture_url;

      // Follower counts are only exposed for Professional (Business/Creator)
      // accounts - a Personal account authorizes fine but never returns them.
      const isProfessional = profileData.account_type === 'BUSINESS' || profileData.account_type === 'CREATOR';
      if (isProfessional && profileData.followers_count !== undefined) {
        const fc = Number(profileData.followers_count);
        followersCount = fc >= 1000 ? `${(fc / 1000).toFixed(1)}K` : `${fc}`;
        metricsSynced = true;
      }
    } catch (profileErr) {
      logger.warn('Could not fetch Instagram profile:', profileErr);
    }

    if (igAcc) {
      igAcc.connected = true;
      igAcc.handle = profileDisplayName;
      if (profileAvatar) {
        igAcc.avatar = profileAvatar;
      }
      igAcc.status = 'active';
      if (metricsSynced) {
        igAcc.followers = followersCount;
        igAcc.viewsGrowth = computeGrowth(oldIgFollowers, followersCount);
      } else {
        // Personal account - no follower data available. Don't leave stale
        // demo-seed numbers looking like a real sync.
        igAcc.followers = '0';
        igAcc.viewsGrowth = '0%';
      }
      // Reach isn't fetched here (requires additional Insights permissions),
      // so it's never real - keep it at 0 rather than a demo-seed placeholder.
      igAcc.views = '0';
      upsertAccount(DEFAULT_LOCAL_USER_ID, igAcc);
    }

    const statusHeading = metricsSynced ? 'Instagram Connected!' : 'Instagram Partially Connected';
    const statusMessage = metricsSynced
      ? `Account ${profileDisplayName} has been linked to Creator OS.`
      : `We connected your Instagram account (${profileDisplayName}), but it's a Personal account, so Instagram doesn't expose follower or insights data. In the Instagram app, go to Settings → Account type and switch to Professional (Business or Creator), then reconnect.`;

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>${statusHeading}</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 420px; padding: 32px; border: 1px solid rgba(236,72,153,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(236,72,153,0.2); border: 2px solid #ec4899; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">${metricsSynced ? '✓' : '⚠️'}</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">${statusHeading}</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0; line-height: 1.5;">${statusMessage}</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'instagram', handle: '${profileDisplayName}', metricsSynced: ${metricsSynced} }, '*');
                setTimeout(() => window.close(), ${metricsSynced ? '1200' : '4000'});
              } else {
                setTimeout(() => { window.location.href = '/'; }, 1500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    logger.error('Instagram OAuth error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange Instagram authorization'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'instagram', error: '${err.message || 'Instagram connection failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});
