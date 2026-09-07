/**
 * SQLite data layer for CreatorOS — the multi-tenant migration's persistence
 * layer. Schema carries `user_id` from day one; every route currently calls
 * these functions with `DEFAULT_LOCAL_USER_ID` (see server/db.ts callers) so
 * swapping in real per-request user ids later is a call-site change, not a
 * schema change.
 */
import path from 'path';
import Database from 'better-sqlite3';
import type { PostItem, SocialAccountRecord } from './store.ts';

const DB_FILE = path.join(process.cwd(), 'creator_os.db');

/** The single local-owner user every pre-auth row belongs to. */
export const DEFAULT_LOCAL_USER_ID = 'local-owner';

/** Order the four platforms consistently, independent of SQLite row order. */
const PLATFORM_ORDER = ['tiktok', 'instagram', 'youtube', 'facebook'];

let db: Database.Database | null = null;

/** Lazily open (and schema-init) the singleton SQLite connection. */
export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  ensureDefaultUser(db);
  return db;
}

function initSchema(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      platforms TEXT NOT NULL,
      status TEXT NOT NULL,
      scheduled_date TEXT,
      scheduled_time TEXT,
      published_date TEXT,
      caption TEXT NOT NULL,
      hashtags TEXT NOT NULL,
      thumbnail_url TEXT NOT NULL,
      video_url TEXT,
      duration TEXT,
      views INTEGER,
      likes INTEGER,
      comments INTEGER,
      shares INTEGER,
      bookmarks INTEGER,
      metrics_growth TEXT,
      script TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);

    CREATE TABLE IF NOT EXISTS social_accounts (
      user_id TEXT NOT NULL REFERENCES users(id),
      platform TEXT NOT NULL,
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      connected INTEGER NOT NULL DEFAULT 0,
      avatar TEXT,
      followers TEXT,
      views TEXT,
      views_growth TEXT,
      color TEXT,
      accent_color TEXT,
      status TEXT,
      PRIMARY KEY (user_id, platform)
    );

    CREATE TABLE IF NOT EXISTS oauth_tokens (
      user_id TEXT NOT NULL REFERENCES users(id),
      platform TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      expires_at INTEGER,
      extra TEXT,
      PRIMARY KEY (user_id, platform)
    );
  `);
}

/**
 * Guarantee the local-owner user row exists so the FK-constrained tables
 * above are always writable, even if `npm run db:migrate` was never run
 * (e.g. a fresh clone with no `creator_storage.json`).
 */
function ensureDefaultUser(database: Database.Database): void {
  database.prepare(`INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)`).run(DEFAULT_LOCAL_USER_ID, 'Local Owner');
}

/** Close the connection. Used by scripts/tests — the running server keeps it open. */
export function closeDb(): void {
  db?.close();
  db = null;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

function rowToPost(row: any): PostItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    platforms: JSON.parse(row.platforms),
    status: row.status,
    scheduledDate: row.scheduled_date ?? undefined,
    scheduledTime: row.scheduled_time ?? undefined,
    publishedDate: row.published_date ?? undefined,
    caption: row.caption,
    hashtags: JSON.parse(row.hashtags),
    thumbnailUrl: row.thumbnail_url,
    videoUrl: row.video_url ?? undefined,
    duration: row.duration ?? undefined,
    views: row.views ?? undefined,
    likes: row.likes ?? undefined,
    comments: row.comments ?? undefined,
    shares: row.shares ?? undefined,
    bookmarks: row.bookmarks ?? undefined,
    metricsGrowth: row.metrics_growth ?? undefined,
    script: row.script ? JSON.parse(row.script) : undefined,
  };
}

function postParams(userId: string, post: PostItem, createdAt: number) {
  return {
    id: post.id,
    user_id: userId,
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
    created_at: createdAt,
  };
}

/** All posts for a user, newest-created first (matches the old `unshift` ordering). */
export function listPosts(userId: string): PostItem[] {
  const rows = getDb().prepare(`SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC`).all(userId) as any[];
  return rows.map(rowToPost);
}

/**
 * Insert a new post. `createdAt` defaults to now (route usage); the
 * migration script passes explicit small values to preserve seed-post order.
 */
export function insertPost(userId: string, post: PostItem, createdAt: number = Date.now()): void {
  getDb()
    .prepare(
      `
      INSERT INTO posts (
        id, user_id, title, category, platforms, status, scheduled_date, scheduled_time,
        published_date, caption, hashtags, thumbnail_url, video_url, duration,
        views, likes, comments, shares, bookmarks, metrics_growth, script, created_at
      ) VALUES (
        @id, @user_id, @title, @category, @platforms, @status, @scheduled_date, @scheduled_time,
        @published_date, @caption, @hashtags, @thumbnail_url, @video_url, @duration,
        @views, @likes, @comments, @shares, @bookmarks, @metrics_growth, @script, @created_at
      )
    `
    )
    .run(postParams(userId, post, createdAt));
}

/** Merge `patch` onto the existing post and persist. Returns the merged post, or null if not found. */
export function updatePostFields(userId: string, id: string, patch: Partial<PostItem>): PostItem | null {
  const database = getDb();
  const existingRow = database.prepare(`SELECT * FROM posts WHERE user_id = ? AND id = ?`).get(userId, id);
  if (!existingRow) return null;

  const merged: PostItem = { ...rowToPost(existingRow), ...patch, id };
  const createdAt = (existingRow as any).created_at;
  database
    .prepare(
      `
      UPDATE posts SET
        title=@title, category=@category, platforms=@platforms, status=@status,
        scheduled_date=@scheduled_date, scheduled_time=@scheduled_time, published_date=@published_date,
        caption=@caption, hashtags=@hashtags, thumbnail_url=@thumbnail_url, video_url=@video_url,
        duration=@duration, views=@views, likes=@likes, comments=@comments, shares=@shares,
        bookmarks=@bookmarks, metrics_growth=@metrics_growth, script=@script
      WHERE user_id=@user_id AND id=@id
    `
    )
    .run(postParams(userId, merged, createdAt));
  return merged;
}

export function deletePost(userId: string, id: string): void {
  getDb().prepare(`DELETE FROM posts WHERE user_id = ? AND id = ?`).run(userId, id);
}

// ---------------------------------------------------------------------------
// Social accounts
// ---------------------------------------------------------------------------

function rowToAccount(row: any): SocialAccountRecord {
  return {
    id: row.platform,
    name: row.name,
    handle: row.handle,
    connected: !!row.connected,
    avatar: row.avatar,
    followers: row.followers,
    views: row.views,
    viewsGrowth: row.views_growth,
    color: row.color,
    accentColor: row.accent_color,
    status: row.status,
  };
}

function accountParams(userId: string, acc: SocialAccountRecord) {
  return {
    user_id: userId,
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
  };
}

/** All connected accounts for a user, in a fixed platform order (tiktok, instagram, youtube, facebook). */
export function listAccounts(userId: string): SocialAccountRecord[] {
  const rows = getDb().prepare(`SELECT * FROM social_accounts WHERE user_id = ?`).all(userId) as any[];
  return rows.map(rowToAccount).sort((a, b) => PLATFORM_ORDER.indexOf(a.id) - PLATFORM_ORDER.indexOf(b.id));
}

export function getAccount(userId: string, platform: string): SocialAccountRecord | null {
  const row = getDb().prepare(`SELECT * FROM social_accounts WHERE user_id = ? AND platform = ?`).get(userId, platform);
  return row ? rowToAccount(row) : null;
}

/** Insert-or-replace a full account row (used for creates, resets, and full syncs). */
export function upsertAccount(userId: string, account: SocialAccountRecord): void {
  getDb()
    .prepare(
      `
      INSERT INTO social_accounts (user_id, platform, name, handle, connected, avatar, followers, views, views_growth, color, accent_color, status)
      VALUES (@user_id, @platform, @name, @handle, @connected, @avatar, @followers, @views, @views_growth, @color, @accent_color, @status)
      ON CONFLICT(user_id, platform) DO UPDATE SET
        name=excluded.name, handle=excluded.handle, connected=excluded.connected, avatar=excluded.avatar,
        followers=excluded.followers, views=excluded.views, views_growth=excluded.views_growth,
        color=excluded.color, accent_color=excluded.accent_color, status=excluded.status
    `
    )
    .run(accountParams(userId, account));
}

/** Merge `patch` onto the existing account and persist. Returns the merged account, or null if not found. */
export function updateAccountFields(
  userId: string,
  platform: string,
  patch: Partial<SocialAccountRecord>
): SocialAccountRecord | null {
  const existing = getAccount(userId, platform);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  upsertAccount(userId, merged);
  return merged;
}

// ---------------------------------------------------------------------------
// OAuth tokens (unifies the old TiktokTokens/MetaTokens/GoogleTokens shapes
// into one table keyed by (user_id, platform))
// ---------------------------------------------------------------------------

export interface OAuthTokenRecord {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  /** Platform-specific extras (e.g. TikTok's openId, Instagram's userId, YouTube's channelId). */
  extra?: Record<string, unknown>;
}

export function getOAuthToken(userId: string, platform: string): OAuthTokenRecord | null {
  const row = getDb().prepare(`SELECT * FROM oauth_tokens WHERE user_id = ? AND platform = ?`).get(userId, platform) as
    | any
    | undefined;
  if (!row) return null;
  return {
    accessToken: row.access_token ?? undefined,
    refreshToken: row.refresh_token ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    extra: row.extra ? JSON.parse(row.extra) : undefined,
  };
}

/** Full replace of the stored token for (userId, platform) — matches the old routes' assign-whole-object pattern. */
export function setOAuthToken(userId: string, platform: string, token: OAuthTokenRecord): void {
  getDb()
    .prepare(
      `
      INSERT INTO oauth_tokens (user_id, platform, access_token, refresh_token, expires_at, extra)
      VALUES (@user_id, @platform, @access_token, @refresh_token, @expires_at, @extra)
      ON CONFLICT(user_id, platform) DO UPDATE SET
        access_token=excluded.access_token, refresh_token=excluded.refresh_token,
        expires_at=excluded.expires_at, extra=excluded.extra
    `
    )
    .run({
      user_id: userId,
      platform,
      access_token: token.accessToken ?? null,
      refresh_token: token.refreshToken ?? null,
      expires_at: token.expiresAt ?? null,
      extra: token.extra ? JSON.stringify(token.extra) : null,
    });
}
