/**
 * Google / YouTube OAuth routes: build the authorization URL and handle the
 * callback, exchanging the code for tokens and syncing channel details and
 * subscriber/view statistics via the YouTube Data API v3.
 */
import { Router } from 'express';
import type { Request } from 'express';
import { store, saveStorage } from '../store.ts';
import { logger } from '../logger.ts';
import { computeGrowth } from '../metrics.ts';

export const authYoutubeRouter = Router();

/** Construct the YouTube OAuth redirect URI from the request/host. */
function getYouTubeRedirectUri(req: Request): string {
  const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/$/, '')}/api/auth/youtube/callback`;
}

// YouTube OAuth authorization URL.
authYoutubeRouter.get('/api/auth/youtube/url', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = getYouTubeRedirectUri(req);
  const state = 'creator_os_yt_' + Math.random().toString(36).substring(2, 15);
  // Request YouTube readonly channel access and profile.
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ');

  if (!clientId) {
    return res.json({
      configured: false,
      message: 'GOOGLE_CLIENT_ID not found in environment variables',
      redirectUri,
    });
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  }).toString()}`;

  res.json({ configured: true, url: authUrl, redirectUri });
});

// YouTube OAuth callback handler.
authYoutubeRouter.get('/api/auth/youtube/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    logger.error('YouTube OAuth authorization error:', error, error_description);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3 style="color: #ef4444;">YouTube Authorization Cancelled</h3>
          <p>${error_description || error}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'youtube', error: '${error}' }, '*');
              setTimeout(() => window.close(), 2500);
            }
          </script>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Authorization code missing');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = getYouTubeRedirectUri(req);

    const existingYtAcc = store.socialAccounts.find((a) => a.id === 'youtube');
    const oldViews = existingYtAcc?.views;
    let channelTitle = existingYtAcc?.handle || 'YouTube Creator';
    let channelAvatar =
      existingYtAcc?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    if (clientId && clientSecret) {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: code as string,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      logger.debug('Google YouTube OAuth token response status:', tokenRes.status);

      if (tokenData.access_token) {
        store.googleTokens.youtube = {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: Date.now() + (tokenData.expires_in || 3600) * 1000,
        };

        // Fetch live YouTube channel details via YouTube Data API v3.
        try {
          const ytRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
          });
          const ytData = await ytRes.json();
          logger.debug('YouTube channels response:', ytData);

          if (ytData.items && ytData.items.length > 0) {
            const channel = ytData.items[0];
            if (channel.snippet?.title) {
              channelTitle = channel.snippet.customUrl || channel.snippet.title;
            }
            if (channel.snippet?.thumbnails?.default?.url) {
              channelAvatar = channel.snippet.thumbnails.default.url;
            }
            if (existingYtAcc && channel.statistics) {
              const subs = Number(channel.statistics.subscriberCount);
              if (!isNaN(subs)) {
                existingYtAcc.followers = subs >= 1000 ? `${(subs / 1000).toFixed(1)}K` : `${subs}`;
              }
              const views = Number(channel.statistics.viewCount);
              if (!isNaN(views)) {
                existingYtAcc.views =
                  views >= 1000000
                    ? `${(views / 1000000).toFixed(1)}M`
                    : views >= 1000
                    ? `${(views / 1000).toFixed(1)}K`
                    : `${views}`;
              }
            }
          }
        } catch (ytErr) {
          logger.warn('Could not fetch YouTube channel data:', ytErr);
        }
      }
    }

    if (existingYtAcc) {
      existingYtAcc.connected = true;
      existingYtAcc.handle = channelTitle;
      existingYtAcc.avatar = channelAvatar;
      existingYtAcc.status = 'active';
      existingYtAcc.viewsGrowth = computeGrowth(oldViews, existingYtAcc.views);
      saveStorage();
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>YouTube Connected</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0b0d17; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 400px; padding: 32px; border: 1px solid rgba(239,68,68,0.3); border-radius: 20px; background: #131627; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(239,68,68,0.2); border: 2px solid #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">✓</div>
            <h2 style="color: #fff; margin: 0 0 8px 0; font-size: 18px;">YouTube Connected!</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px 0;">Channel <strong>${channelTitle}</strong> has been linked to Creator OS.</p>
            <p style="color: #64748b; font-size: 11px;">This window should close automatically...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', platform: 'youtube', handle: '${channelTitle}' }, '*');
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
    logger.error('YouTube OAuth error:', err);
    return res.send(`
      <!DOCTYPE html>
      <html>
        <body style="font-family: system-ui; background: #0b0d17; color: #fff; text-align: center; padding: 40px;">
          <h3>Connection Error</h3>
          <p>${err.message || 'Failed to exchange YouTube authorization'}</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', platform: 'youtube', error: '${err.message || 'YouTube connection failed'}' }, '*');
            }
          </script>
        </body>
      </html>
    `);
  }
});
