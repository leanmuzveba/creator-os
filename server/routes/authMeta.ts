/**
 * Meta OAuth routes for Instagram and Facebook: build authorization URLs and
 * handle callbacks, exchanging the code for a token and syncing the connected
 * profile (Instagram business account / Facebook page) and follower stats.
 */
import { Router } from 'express';
import type { Request } from 'express';
import { store, saveStorage } from '../store.ts';
import { logger } from '../logger.ts';

export const authMetaRouter = Router();

/** Construct the Meta OAuth redirect URI for the given platform. */
function getMetaRedirectUri(req: Request, platform: 'instagram' | 'facebook'): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/${platform}/callback`;
}

// Instagram OAuth authorization URL.
authMetaRouter.get('/api/auth/instagram/url', (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = getMetaRedirectUri(req, 'instagram');
  const state = 'creator_os_ig_' + Math.random().toString(36).substring(2, 15);
  // Default to standard public_profile only so no unrequested permissions are sent.
  const scope = (req.query.scope as string) || 'public_profile';

  if (!appId) {
    return res.json({
      configured: false,
      redirectUri,
      devCallbackUrl: 'https://ais-dev-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/instagram/callback',
      sharedCallbackUrl: 'https://ais-pre-trgypbutyowyfjrxvbpubj-294594473820.europe-west1.run.app/api/auth/instagram/callback',
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

// Instagram OAuth callback endpoint.
authMetaRouter.get(['/api/auth/instagram/callback', '/api/auth/instagram/callback/'], async (req, res) => {
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
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = getMetaRedirectUri(req, 'instagram');

    if (!appId || !appSecret) {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head><title>Meta Credentials Missing</title></head>
          <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 440px; padding: 28px; border: 1px solid rgba(236,72,153,0.3); border-radius: 16px; background: #131627;">
              <h2 style="color: #ec4899; margin: 0 0 10px 0; font-size: 18px;">Meta App Credentials Missing</h2>
              <p style="color: #cbd5e1; font-size: 13px; line-height: 1.5; margin-bottom: 16px;">Please configure <code>META_APP_ID</code> and <code>META_APP_SECRET</code> in Settings to connect your real Instagram account.</p>
              <button onclick="window.close()" style="background: #db2777; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; font-weight: bold; cursor: pointer;">Close Window</button>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'instagram', error: 'META_APP_ID or META_APP_SECRET not configured' }, '*');
                }
              </script>
            </div>
          </body>
        </html>
      `);
    }

    // Exchange code for short-lived User Access Token.
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code: code as string,
    }).toString()}`;

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    logger.debug('Meta Instagram OAuth token response:', tokenData);

    if (tokenData.error || !tokenData.access_token) {
      const errorMsg = tokenData.error?.message || tokenData.error_description || 'Failed to obtain access token from Meta';
      logger.warn('Meta Instagram token error:', errorMsg);
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

    store.metaTokens.instagram = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in || 5184000) * 1000,
    };

    let profileDisplayName = 'Instagram User';
    let profileAvatar = '';
    let followersCount = '1';

    // 1. Query Connected Instagram Business Account via Pages.
    try {
      const accountsRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?fields=name,instagram_business_account{id,username,profile_picture_url,followers_count,media_count}&access_token=${tokenData.access_token}`
      );
      const accountsData = await accountsRes.json();
      logger.debug('Meta Instagram pages/business account response:', accountsData);

      if (accountsData.data && accountsData.data.length > 0) {
        for (const page of accountsData.data) {
          if (page.instagram_business_account) {
            const ig = page.instagram_business_account;
            if (ig.username) profileDisplayName = `@${ig.username}`;
            if (ig.profile_picture_url) profileAvatar = ig.profile_picture_url;
            if (ig.followers_count !== undefined) {
              const fc = Number(ig.followers_count);
              followersCount = fc >= 1000 ? `${(fc / 1000).toFixed(1)}K` : `${fc}`;
            }
            break;
          }
        }
      }
    } catch (igErr) {
      logger.warn('Could not fetch Instagram business profile:', igErr);
    }

    // 2. If no business account found, fallback to authenticated Meta profile (/me).
    if (profileDisplayName === 'Instagram User') {
      try {
        const userRes = await fetch(
          `https://graph.facebook.com/v19.0/me?fields=id,name,picture.width(300).height(300)&access_token=${tokenData.access_token}`
        );
        const userData = await userRes.json();
        if (userData.name) profileDisplayName = userData.name;
        if (userData.picture?.data?.url) profileAvatar = userData.picture.data.url;
      } catch (uErr) {
        logger.warn('Could not fetch Meta /me fallback:', uErr);
      }
    }

    const existingIgAcc = store.socialAccounts.find((a) => a.id === 'instagram');
    if (existingIgAcc) {
      existingIgAcc.connected = true;
      existingIgAcc.handle = profileDisplayName;
      if (profileAvatar) {
        existingIgAcc.avatar = profileAvatar;
      }
      existingIgAcc.status = 'active';
      if (followersCount !== '1') {
        existingIgAcc.followers = followersCount;
      }
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Instagram Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 32px; border: 1px solid rgba(236,72,153,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(236,72,153,0.2); border: 2px solid #ec4899; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">Instagram Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Account ${profileDisplayName} has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'instagram', handle: '${profileDisplayName}' }, '*');
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

// Facebook OAuth authorization URL.
authMetaRouter.get('/api/auth/facebook/url', (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = getMetaRedirectUri(req, 'facebook');
  const state = 'creator_os_fb_' + Math.random().toString(36).substring(2, 15);
  // Default to public_profile only (no email required).
  const scope = (req.query.scope as string) || 'public_profile';

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
authMetaRouter.get(['/api/auth/facebook/callback', '/api/auth/facebook/callback/'], async (req, res) => {
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
    const redirectUri = getMetaRedirectUri(req, 'facebook');

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
        `https://graph.facebook.com/v19.0/me/accounts?fields=name,id,fan_count,picture{url}&access_token=${tokenData.access_token}`
      );
      const pagesData = await pagesRes.json();
      logger.debug('Meta Facebook pages response:', pagesData);

      if (pagesData.data && pagesData.data.length > 0) {
        const page = pagesData.data[0];
        if (page.name) profileDisplayName = page.name;
        if (page.picture?.data?.url) profileAvatar = page.picture.data.url;
        if (page.fan_count !== undefined) {
          const count = Number(page.fan_count);
          followersCount = count >= 1000 ? `${(count / 1000).toFixed(1)}K` : `${count}`;
        }
      }
    } catch (fbErr) {
      logger.warn('Could not fetch Facebook pages:', fbErr);
    }

    const existingFbAcc = store.socialAccounts.find((a) => a.id === 'facebook');
    if (existingFbAcc) {
      existingFbAcc.connected = true;
      existingFbAcc.handle = profileDisplayName;
      if (profileAvatar) {
        existingFbAcc.avatar = profileAvatar;
      }
      existingFbAcc.status = 'active';
      if (followersCount !== '1') {
        existingFbAcc.followers = followersCount;
      }
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Facebook Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 420px; padding: 32px; border: 1px solid rgba(59,130,246,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(59,130,246,0.2); border: 2px solid #3b82f6; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">Facebook Account Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;"><strong>${profileDisplayName}</strong> has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'facebook', handle: '${profileDisplayName}', avatar: '${profileAvatar}' }, '*');
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
