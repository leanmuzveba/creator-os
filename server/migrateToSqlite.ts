/**
 * One-time migration: import `creator_storage.json` into the SQLite store
 * under a single "local owner" user row. Idempotent — does nothing if that
 * user's posts have already been migrated. Run with `npm run db:migrate`.
 */
import { loadStorage, store } from './store.ts';
import { getDb, closeDb, insertPost, upsertAccount, setOAuthToken, DEFAULT_LOCAL_USER_ID } from './db.ts';
import { logger } from './logger.ts';

function migrate(): void {
  const db = getDb();

  const alreadyMigrated = db.prepare('SELECT 1 FROM posts WHERE user_id = ? LIMIT 1').get(DEFAULT_LOCAL_USER_ID);
  if (alreadyMigrated) {
    logger.info('SQLite migration: local-owner already has posts, skipping.');
    return;
  }

  // Populates `store` from creator_storage.json merged over the seed defaults
  // — the same data the app itself would load on startup.
  loadStorage();

  const runAll = db.transaction(() => {
    // Descending created_at values so `ORDER BY created_at DESC` reproduces the
    // original seed array order (post-1 first); any post created afterwards via
    // the API gets `Date.now()`, which is always larger, so it sorts above all
    // seed posts — matching the old array's `unshift`-to-front behavior.
    store.posts.forEach((post, index) => {
      insertPost(DEFAULT_LOCAL_USER_ID, post, store.posts.length - index);
    });

    for (const acc of store.socialAccounts) {
      upsertAccount(DEFAULT_LOCAL_USER_ID, acc);
    }

    // Unifies the three separate token shapes (TiktokTokens/MetaTokens/GoogleTokens)
    // into one table keyed by (user_id, platform).
    if (store.tiktokTokens?.accessToken) {
      setOAuthToken(DEFAULT_LOCAL_USER_ID, 'tiktok', {
        accessToken: store.tiktokTokens.accessToken,
        refreshToken: store.tiktokTokens.refreshToken,
        expiresAt: store.tiktokTokens.expiresAt,
        extra: store.tiktokTokens.openId ? { openId: store.tiktokTokens.openId } : undefined,
      });
    }
    if (store.metaTokens?.instagram) {
      const t = store.metaTokens.instagram;
      setOAuthToken(DEFAULT_LOCAL_USER_ID, 'instagram', {
        accessToken: t.accessToken,
        expiresAt: t.expiresAt,
        extra: t.userId ? { userId: t.userId } : undefined,
      });
    }
    if (store.metaTokens?.facebook) {
      const t = store.metaTokens.facebook;
      setOAuthToken(DEFAULT_LOCAL_USER_ID, 'facebook', {
        accessToken: t.accessToken,
        expiresAt: t.expiresAt,
        extra: t.pageId ? { pageId: t.pageId } : undefined,
      });
    }
    if (store.googleTokens?.youtube) {
      const t = store.googleTokens.youtube;
      setOAuthToken(DEFAULT_LOCAL_USER_ID, 'youtube', {
        accessToken: t.accessToken,
        refreshToken: t.refreshToken,
        expiresAt: t.expiresAt,
        extra: t.channelId ? { channelId: t.channelId } : undefined,
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
