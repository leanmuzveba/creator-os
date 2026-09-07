/**
 * One-time migration: import `creator_storage.json` into the SQLite store
 * under a single "local owner" user row. Idempotent — does nothing if that
 * user already exists. Run with `npm run db:migrate`.
 *
 * This does not change what the running app reads from — `server.ts` still
 * serves everything off the JSON store until a later migration step.
 */
import { loadStorage, store } from './store.ts';
import { getDb, closeDb, DEFAULT_LOCAL_USER_ID } from './db.ts';
import { logger } from './logger.ts';

function migrate(): void {
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(DEFAULT_LOCAL_USER_ID);
  if (existing) {
    logger.info('SQLite migration: local-owner user already exists, skipping.');
    return;
  }

  // Populates `store` from creator_storage.json merged over the seed defaults
  // — the same data the app itself would load on startup.
  loadStorage();

  const insertUser = db.prepare(`INSERT INTO users (id, email, password_hash, name) VALUES (?, NULL, NULL, ?)`);

  const insertPost = db.prepare(`
    INSERT INTO posts (
      id, user_id, title, category, platforms, status, scheduled_date, scheduled_time,
      published_date, caption, hashtags, thumbnail_url, video_url, duration,
      views, likes, comments, shares, bookmarks, metrics_growth, script
    ) VALUES (
      @id, @user_id, @title, @category, @platforms, @status, @scheduled_date, @scheduled_time,
      @published_date, @caption, @hashtags, @thumbnail_url, @video_url, @duration,
      @views, @likes, @comments, @shares, @bookmarks, @metrics_growth, @script
    )
  `);

  const insertAccount = db.prepare(`
    INSERT INTO social_accounts (
      user_id, platform, name, handle, connected, avatar, followers, views, views_growth, color, accent_color, status
    ) VALUES (
      @user_id, @platform, @name, @handle, @connected, @avatar, @followers, @views, @views_growth, @color, @accent_color, @status
    )
  `);

  const insertToken = db.prepare(`
    INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at, extra)
    VALUES (@user_id, @platform, @access_token, @refresh_token, @expires_at, @extra)
  `);

  const runAll = db.transaction(() => {
    insertUser.run(DEFAULT_LOCAL_USER_ID, 'Local Owner');

    for (const post of store.posts) {
      insertPost.run({
        id: post.id,
        user_id: DEFAULT_LOCAL_USER_ID,
        title: post.title,
        category: post.category,
        platforms: JSON.stringify(post.platforms),
        status: post.status,
        scheduled_date: post.scheduledDate ?? null,
        scheduled_time: post.scheduledTime ?? null,
        published_date: post.publishedDate ?? null,
        caption: post.caption,
        hashtags: JSON.stringify(post.hashtags),
        thumbnail_url: post.thumbnailUrl,
        video_url: post.videoUrl ?? null,
        duration: post.duration ?? null,
        views: post.views ?? null,
        likes: post.likes ?? null,
        comments: post.comments ?? null,
        shares: post.shares ?? null,
        bookmarks: post.bookmarks ?? null,
        metrics_growth: post.metricsGrowth ?? null,
        script: post.script ? JSON.stringify(post.script) : null,
      });
    }

    for (const acc of store.socialAccounts) {
      insertAccount.run({
        user_id: DEFAULT_LOCAL_USER_ID,
        platform: acc.id,
        name: acc.name,
        handle: acc.handle,
        connected: acc.connected ? 1 : 0,
        avatar: acc.avatar ?? null,
        followers: acc.followers ?? null,
        views: acc.views ?? null,
        views_growth: acc.viewsGrowth ?? null,
        color: acc.color ?? null,
        accent_color: acc.accentColor ?? null,
        status: acc.status ?? null,
      });
    }

    // Unifies the three separate token shapes (TiktokTokens/MetaTokens/GoogleTokens)
    // into one table keyed by (user_id, platform).
    if (store.tiktokTokens?.accessToken) {
      insertToken.run({
        user_id: DEFAULT_LOCAL_USER_ID,
        platform: 'tiktok',
        access_token: store.tiktokTokens.accessToken ?? null,
        refresh_token: store.tiktokTokens.refreshToken ?? null,
        expires_at: store.tiktokTokens.expiresAt ?? null,
        extra: store.tiktokTokens.openId ? JSON.stringify({ openId: store.tiktokTokens.openId }) : null,
      });
    }
    if (store.metaTokens?.instagram) {
      const t = store.metaTokens.instagram;
      insertToken.run({
        user_id: DEFAULT_LOCAL_USER_ID,
        platform: 'instagram',
        access_token: t.accessToken ?? null,
        refresh_token: null,
        expires_at: t.expiresAt ?? null,
        extra: t.userId ? JSON.stringify({ userId: t.userId }) : null,
      });
    }
    if (store.metaTokens?.facebook) {
      const t = store.metaTokens.facebook;
      insertToken.run({
        user_id: DEFAULT_LOCAL_USER_ID,
        platform: 'facebook',
        access_token: t.accessToken ?? null,
        refresh_token: null,
        expires_at: t.expiresAt ?? null,
        extra: t.pageId ? JSON.stringify({ pageId: t.pageId }) : null,
      });
    }
    if (store.googleTokens?.youtube) {
      const t = store.googleTokens.youtube;
      insertToken.run({
        user_id: DEFAULT_LOCAL_USER_ID,
        platform: 'youtube',
        access_token: t.accessToken ?? null,
        refresh_token: t.refreshToken ?? null,
        expires_at: t.expiresAt ?? null,
        extra: t.channelId ? JSON.stringify({ channelId: t.channelId }) : null,
      });
    }
  });

  runAll();
  logger.info(
    `✅ SQLite migration complete: ${store.posts.length} posts, ${store.socialAccounts.length} accounts migrated to user "${DEFAULT_LOCAL_USER_ID}".`
  );
}

migrate();
closeDb();
