/**
 * Postgres data layer for CreatorOS. Production uses `DATABASE_URL`
 * (Supabase); without it — local dev and tests — an embedded PGlite Postgres
 * stores data in `DB_PATH` (default `.pgdata/`, `memory://` for tests), so
 * the same SQL runs everywhere. Every table carries `user_id`.
 */
import path from 'path';
import { randomUUID } from 'crypto';
import type { PostItem, SocialAccountRecord } from './store.ts';

/** The single local-owner user every pre-auth row belongs to. */
export const DEFAULT_LOCAL_USER_ID = 'local-owner';

/** Order the four platforms consistently, independent of row order. */
const PLATFORM_ORDER = ['tiktok', 'instagram', 'youtube', 'facebook'];

interface Queryable {
  query(sql: string, params?: unknown[]): Promise<{ rows: any[] }>;
}

let dbPromise: Promise<Queryable> | null = null;

/** Lazily open (and schema-init) the singleton connection. */
export function getDb(): Promise<Queryable> {
  dbPromise ??= openDb();
  return dbPromise;
}

async function openDb(): Promise<Queryable> {
  let database: Queryable;
  if (process.env.DATABASE_URL) {
    const { default: pg } = await import('pg');
    database = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Supabase's pooler cert isn't in Node's CA bundle
      max: 5,
    });
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    database = new PGlite(process.env.DB_PATH || path.join(process.cwd(), '.pgdata'));
  }
  for (const statement of SCHEMA) await database.query(statement);
  await database.query(`INSERT INTO users (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [DEFAULT_LOCAL_USER_ID, 'Local Owner']);
  return database;
}

async function all(sql: string, params: unknown[] = []): Promise<any[]> {
  return (await (await getDb()).query(sql, params)).rows;
}

async function one(sql: string, params: unknown[] = []): Promise<any | null> {
  return (await all(sql, params))[0] ?? null;
}

/** INSERT a row object; with `conflictKeys`, update the other columns on conflict instead of failing. */
async function insert(table: string, row: Record<string, unknown>, conflictKeys?: string[]): Promise<void> {
  const keys = Object.keys(row);
  let sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(', ')})`;
  if (conflictKeys) {
    const updates = keys.filter((k) => !conflictKeys.includes(k)).map((k) => `${k} = excluded.${k}`);
    sql += ` ON CONFLICT (${conflictKeys.join(', ')}) DO UPDATE SET ${updates.join(', ')}`;
  }
  await all(sql, Object.values(row));
}

// Millisecond timestamps are BIGINT, which node-postgres returns as strings.
const num = (v: unknown) => (v == null ? undefined : Number(v));

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password_hash TEXT,
    name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
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
    views BIGINT,
    likes BIGINT,
    comments BIGINT,
    shares BIGINT,
    bookmarks BIGINT,
    metrics_growth TEXT,
    script TEXT,
    created_at BIGINT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id)`,
  `CREATE TABLE IF NOT EXISTS social_accounts (
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
  )`,
  `CREATE TABLE IF NOT EXISTS oauth_tokens (
    user_id TEXT NOT NULL REFERENCES users(id),
    platform TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at BIGINT,
    extra TEXT,
    PRIMARY KEY (user_id, platform)
  )`,
  `CREATE TABLE IF NOT EXISTS instagram_jobs (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    run_at BIGINT NOT NULL,
    video_path TEXT NOT NULL,
    caption TEXT NOT NULL,
    status TEXT NOT NULL,
    error TEXT,
    media_id TEXT,
    PRIMARY KEY (user_id, post_id)
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS password_resets (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    code_hash TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at BIGINT NOT NULL
  )`,
];

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
    views: num(row.views),
    likes: num(row.likes),
    comments: num(row.comments),
    shares: num(row.shares),
    bookmarks: num(row.bookmarks),
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

/** All posts for a user, newest-created first. */
export async function listPosts(userId: string): Promise<PostItem[]> {
  return (await all(`SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC`, [userId])).map(rowToPost);
}

export async function insertPost(userId: string, post: PostItem, createdAt: number = Date.now()): Promise<void> {
  await insert('posts', postParams(userId, post, createdAt));
}

/** Merge `patch` onto the existing post and persist. Returns the merged post, or null if not found. */
export async function updatePostFields(userId: string, id: string, patch: Partial<PostItem>): Promise<PostItem | null> {
  const existingRow = await one(`SELECT * FROM posts WHERE user_id = $1 AND id = $2`, [userId, id]);
  if (!existingRow) return null;
  const merged: PostItem = { ...rowToPost(existingRow), ...patch, id };
  await insert('posts', postParams(userId, merged, Number(existingRow.created_at)), ['id']);
  return merged;
}

export async function deletePost(userId: string, id: string): Promise<void> {
  await all(`DELETE FROM posts WHERE user_id = $1 AND id = $2`, [userId, id]);
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

/** All connected accounts for a user, in a fixed platform order (tiktok, instagram, youtube, facebook). */
export async function listAccounts(userId: string): Promise<SocialAccountRecord[]> {
  const rows = await all(`SELECT * FROM social_accounts WHERE user_id = $1`, [userId]);
  return rows.map(rowToAccount).sort((a, b) => PLATFORM_ORDER.indexOf(a.id) - PLATFORM_ORDER.indexOf(b.id));
}

export async function getAccount(userId: string, platform: string): Promise<SocialAccountRecord | null> {
  const row = await one(`SELECT * FROM social_accounts WHERE user_id = $1 AND platform = $2`, [userId, platform]);
  return row ? rowToAccount(row) : null;
}

/** Insert-or-replace a full account row (used for creates, resets, and full syncs). */
export async function upsertAccount(userId: string, acc: SocialAccountRecord): Promise<void> {
  await insert(
    'social_accounts',
    {
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
    },
    ['user_id', 'platform']
  );
}

/** Merge `patch` onto the existing account and persist. Returns the merged account, or null if not found. */
export async function updateAccountFields(
  userId: string,
  platform: string,
  patch: Partial<SocialAccountRecord>
): Promise<SocialAccountRecord | null> {
  const existing = await getAccount(userId, platform);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  await upsertAccount(userId, merged);
  return merged;
}

// ---------------------------------------------------------------------------
// OAuth tokens (one table keyed by (user_id, platform))
// ---------------------------------------------------------------------------

export interface OAuthTokenRecord {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  /** Platform-specific extras (e.g. TikTok's openId, Instagram's userId, YouTube's channelId). */
  extra?: Record<string, unknown>;
}

export async function getOAuthToken(userId: string, platform: string): Promise<OAuthTokenRecord | null> {
  const row = await one(`SELECT * FROM oauth_tokens WHERE user_id = $1 AND platform = $2`, [userId, platform]);
  if (!row) return null;
  return {
    accessToken: row.access_token ?? undefined,
    refreshToken: row.refresh_token ?? undefined,
    expiresAt: num(row.expires_at),
    extra: row.extra ? JSON.parse(row.extra) : undefined,
  };
}

/** Full replace of the stored token for (userId, platform). */
export async function setOAuthToken(userId: string, platform: string, token: OAuthTokenRecord): Promise<void> {
  await insert(
    'oauth_tokens',
    {
      user_id: userId,
      platform,
      access_token: token.accessToken ?? null,
      refresh_token: token.refreshToken ?? null,
      expires_at: token.expiresAt ?? null,
      extra: token.extra ? JSON.stringify(token.extra) : null,
    },
    ['user_id', 'platform']
  );
}

// ---------------------------------------------------------------------------
// Users (Creator OS signup/login accounts — separate from the OAuth tokens
// used to connect a user's own TikTok/Instagram/Facebook/YouTube)
// ---------------------------------------------------------------------------

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
}

function rowToUser(row: any): UserRecord {
  return { id: row.id, email: row.email, passwordHash: row.password_hash, name: row.name };
}

export async function createUser(email: string, passwordHash: string, name: string): Promise<UserRecord> {
  const id = randomUUID();
  await insert('users', { id, email, password_hash: passwordHash, name });
  return { id, email, passwordHash, name };
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const row = await one(`SELECT * FROM users WHERE email = $1`, [email]);
  return row ? rowToUser(row) : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const row = await one(`SELECT * FROM users WHERE id = $1`, [id]);
  return row ? rowToUser(row) : null;
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await all(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, id]);
}

// ---------------------------------------------------------------------------
// Password reset codes (one live code per user; a new request replaces it)
// ---------------------------------------------------------------------------

export interface PasswordResetRecord {
  codeHash: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

export async function setPasswordReset(userId: string, codeHash: string, expiresAt: number): Promise<void> {
  await insert(
    'password_resets',
    { user_id: userId, code_hash: codeHash, expires_at: expiresAt, attempts: 0, created_at: Date.now() },
    ['user_id']
  );
}

export async function getPasswordReset(userId: string): Promise<PasswordResetRecord | null> {
  const row = await one(`SELECT * FROM password_resets WHERE user_id = $1`, [userId]);
  return row
    ? { codeHash: row.code_hash, expiresAt: Number(row.expires_at), attempts: row.attempts, createdAt: Number(row.created_at) }
    : null;
}

export async function bumpPasswordResetAttempts(userId: string): Promise<void> {
  await all(`UPDATE password_resets SET attempts = attempts + 1 WHERE user_id = $1`, [userId]);
}

export async function deletePasswordReset(userId: string): Promise<void> {
  await all(`DELETE FROM password_resets WHERE user_id = $1`, [userId]);
}

// ---------------------------------------------------------------------------
// Sessions (backs the express-session store in server/sessionStore.ts)
// ---------------------------------------------------------------------------

export async function getSessionRow(sid: string): Promise<{ data: string; expiresAt: number } | null> {
  const row = await one(`SELECT data, expires_at FROM sessions WHERE sid = $1`, [sid]);
  return row ? { data: row.data, expiresAt: Number(row.expires_at) } : null;
}

export async function setSessionRow(sid: string, data: string, expiresAt: number): Promise<void> {
  await insert('sessions', { sid, data, expires_at: expiresAt }, ['sid']);
}

export async function destroySessionRow(sid: string): Promise<void> {
  await all(`DELETE FROM sessions WHERE sid = $1`, [sid]);
}

/** Log a user out everywhere (e.g. after a password reset). */
export async function destroyUserSessions(userId: string): Promise<void> {
  await all(`DELETE FROM sessions WHERE data::json->>'userId' = $1`, [userId]);
}

export async function pruneExpiredSessions(): Promise<void> {
  await all(`DELETE FROM sessions WHERE expires_at < $1`, [Date.now()]);
}

// ---------------------------------------------------------------------------
// Instagram Reel publish jobs (one per post; replaced on reschedule)
// ---------------------------------------------------------------------------

export interface InstagramJob {
  postId: string;
  userId: string;
  runAt: number;
  videoPath: string;
  caption: string;
  status: 'pending' | 'running' | 'published' | 'failed';
  error?: string;
  mediaId?: string;
}

function rowToJob(row: any): InstagramJob {
  return {
    postId: row.post_id,
    userId: row.user_id,
    runAt: Number(row.run_at),
    videoPath: row.video_path,
    caption: row.caption,
    status: row.status,
    error: row.error ?? undefined,
    mediaId: row.media_id ?? undefined,
  };
}

export async function upsertInstagramJob(job: InstagramJob): Promise<void> {
  await insert(
    'instagram_jobs',
    {
      post_id: job.postId,
      user_id: job.userId,
      run_at: job.runAt,
      video_path: job.videoPath,
      caption: job.caption,
      status: job.status,
      error: job.error ?? null,
      media_id: job.mediaId ?? null,
    },
    ['user_id', 'post_id']
  );
}

export async function getInstagramJob(userId: string, postId: string): Promise<InstagramJob | null> {
  const row = await one(`SELECT * FROM instagram_jobs WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
  return row ? rowToJob(row) : null;
}

/** Pending jobs whose time has come, oldest first. */
export async function listDueInstagramJobs(now: number): Promise<InstagramJob[]> {
  return (await all(`SELECT * FROM instagram_jobs WHERE status = 'pending' AND run_at <= $1 ORDER BY run_at`, [now])).map(rowToJob);
}

/** A job left "running" means the server died mid-publish; flag it rather than risk posting twice. */
export async function failInterruptedInstagramJobs(): Promise<void> {
  await all(`UPDATE instagram_jobs SET status = 'failed', error = 'Server restarted while publishing' WHERE status = 'running'`);
}
