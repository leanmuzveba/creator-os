/**
 * Facebook OAuth routes: build the authorization URL and handle the callback,
 * exchanging the code for a token and syncing the connected Page and follower
 * stats. Uses Meta's Facebook Login product (META_APP_ID/META_APP_SECRET).
 */
import { Router } from 'express';
import type { Request } from 'express';
import { store, saveStorage } from '../store.ts';
import { logger } from '../logger.ts';
import { computeGrowth } from '../metrics.ts';

export const authFacebookRouter = Router();

/** Construct the Facebook OAuth redirect URI. */
function getFacebookRedirectUri(req: Request): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/facebook/callback`;
}

// Facebook OAuth authorization URL.
authFacebookRouter.get('/api/auth/facebook/url', (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = getFacebookRedirectUri(req);
  const state = 'creator_os_fb_' + Math.random().toString(36).substring(2, 15);
  // pages_show_list + pages_read_engagement are needed for /me/accounts to return
  // any pages (and their fan/follower counts) at all; public_profile alone only
  // gets the user's own name via /me, which is why follower sync was silently
  // failing before this was added.
  const scope = (req.query.scope as string) || 'public_profile,pages_show_list,pages_read_engagement';

  if (!appId) {
    return res.json({
      configured: false,
      redirectUri,
      devCallbackUrl: 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/facebook/callback',
      sharedCallbackUrl: 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/facebook/callback',
      scopes: scope,
      message: 'META_APP_ID not configured in environment variables yet.',
    });
  }

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: scope,
    response_type: 'code',
    state: state,
  });

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

  res.json({ configured: true, url: authUrl, redirectUri, state });
});

// Facebook OAuth callback endpoint.
authFacebookRouter.get(['/api/auth/facebook/callback', '/api/auth/facebook/callback/'], async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error || !code) {
    const errorMsg = (error_description as string) || (error as string) || 'Access denied';
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Facebook Authorization Failed</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(59,130,246,0.3); border-radius: 16px; background: #131627;">
            <h2 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 18px;">Facebook Connection Notice</h2>
            <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorMsg}</p>
            <button onclick="window.close()" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'facebook', error: '${errorMsg}' }, '*');
              }
            </script>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = getFacebookRedirectUri(req);

    if (!appId || !appSecret) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Meta Credentials Missing</title></head>
          <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(59,130,246,0.3); border-radius: 16px; background: #131627;">
              <h2 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 18px;">Meta App Credentials Missing</h2>
              <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">Please configure <code>META_APP_ID</code> and <code>META_APP_SECRET</code> in the project Settings to connect your real Facebook account.</p>
              <button onclick="window.close()" style="background: #2563eb; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'facebook', error: 'META_APP_ID or META_APP_SECRET not configured' }, '*');
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Exchange authorization code for User Access Token with Meta Graph API.
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: code as string,
    }).toString()}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    logger.debug('Meta Facebook OAuth token response:', tokenData);

    if (tokenData.error || !tokenData.access_token) {
      const errorMsg = tokenData.error?.message || tokenData.error_description || 'Failed to obtain access token from Meta';
      logger.warn('Meta Facebook token error:', errorMsg);
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Facebook Authorization Failed</title></head>
          <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(244,63,94,0.3); border-radius: 16px; background: #131627;">
              <h2 style="color: #f43f5e; margin: 0 0 10px 0; font-size: 18px;">Facebook Authorization Failed</h2>
              <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">${errorMsg}</p>
              <button onclick="window.close()" style="background: #e11d48; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'facebook', error: '${errorMsg}' }, '*');
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    store.metaTokens.facebook = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
    };

    const oldFbFollowers = store.socialAccounts.find((a) => a.id === 'facebook')?.followers;
    let profileDisplayName = 'Facebook User';
    let profileAvatar = '';
    let followersCount = '1';

    // 1. Fetch authenticated Facebook User profile (/me).
    try {
      const userRes = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,picture.width(300).height(300),short_name&access_token=${tokenData.access_token}`
      );
      const userData = await userRes.json();
      logger.debug('Meta Facebook /me user profile:', userData);

      if (userData.name) {
        profileDisplayName = userData.name;
      }
      if (userData.picture?.data?.url) {
        profileAvatar = userData.picture.data.url;
      }
    } catch (uErr) {
      logger.warn('Could not fetch Facebook /me user info:', uErr);
    }

    // 2. Fetch Facebook Managed Pages (/me/accounts) if available.
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=name,id,fan_count,followers_count,picture{url}&access_token=${tokenData.access_token}`
      );
      const pagesData = await pagesRes.json();
      logger.debug('Meta Facebook pages response:', pagesData);

      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data[0];
        if (page.name) profileDisplayName = page.name;
        if (page.picture?.data?.url) profileAvatar = page.picture.data.url;
        // followers_count is the current field; fan_count is kept as a fallback
        // for older API behavior.
        const rawCount = page.followers_count ?? page.fan_count;
        if (rawCount !== undefined) {
          const count = Number(rawCount);
          followersCount = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
        }
      }
    } catch (fbErr) {
      logger.warn('Could not fetch Facebook pages:', fbErr);
    }

    // True only when a real accessible Facebook Page was found via /me/accounts -
    // the /me profile name alone (a personal profile) never exposes a follower
    // count via the Graph API, so it never counts as "synced".
    const metricsSynced = followersCount !== '1';

    const existingFbAcc = store.socialAccounts.find((a) => a.id === 'facebook');
    if (existingFbAcc) {
      existingFbAcc.connected = true;
      existingFbAcc.handle = profileDisplayName;
      if (profileAvatar) {
        existingFbAcc.avatar = profileAvatar;
      }
      existingFbAcc.status = 'active';
      if (metricsSynced) {
        existingFbAcc.followers = followersCount;
        existingFbAcc.viewsGrowth = computeGrowth(oldFbFollowers, followersCount);
      } else {
        // Real follower/fan count unavailable (no accessible Page) - don't leave
        // the account showing stale demo-seed numbers as if synced.
        existingFbAcc.followers = '0';
        existingFbAcc.viewsGrowth = '0%';
      }
      // Reach isn't fetched from the Graph API here (requires Page Insights
      // permissions), so it's never real - keep it at 0 rather than the
      // demo-seed placeholder.
      existingFbAcc.views = '0';
      saveStorage();
    }

    const statusHeading = metricsSynced ? 'Facebook Account Connected!' : 'Facebook Partially Connected';
    const statusMessage = metricsSynced
      ? `<strong>${profileDisplayName}</strong> has been linked to Creator OS.`
      : `We linked your personal profile (<strong>${profileDisplayName}</strong>), but Facebook only exposes follower/fan counts for Pages you manage - not personal profiles. Create or claim a Facebook Page for your creator brand, make sure you're an admin on it, then reconnect.`;

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>${statusHeading}</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 420px; padding: 32px; border: 1px solid rgba(59,130,246,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(59,130,246,0.2); border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">${metricsSynced ? '✓' : '⚠️'}</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">${statusHeading}</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0; line-height: 1.5;">${statusMessage}</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'facebook', handle: '${profileDisplayName}', avatar: '${profileAvatar}', metricsSynced: ${metricsSynced} }, '*');
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
    logger.error('Facebook OAuth error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange Facebook authorization'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'facebook', error: '${err.message || 'Facebook connection failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});
