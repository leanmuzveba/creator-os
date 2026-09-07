/**
 * SQLite data layer for CreatorOS — step 1 of the multi-tenant migration.
 *
 * Added as a parallel store alongside the existing JSON-file store
 * (`server/store.ts`). Nothing reads from or writes to this yet; routes
 * still run on the JSON store until a later step swaps them over. Schema
 * carries `user_id` from day one so that swap doesn't require another
 * migration.
 */
import path from 'path';
import Database from 'better-sqlite3';

const DB_FILE = path.join(process.cwd(), 'creator_os.db');

/** The single local-owner user every pre-auth row belongs to. */
export const DEFAULT_LOCAL_USER_ID = 'local-owner';

let db: Database.Database | null = null;

/** Lazily open (and schema-init) the singleton SQLite connection. */
export function getDb(): Database.Database {
  if (db) return db;
  db = new Database(DB_FILE);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
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
      script TEXT
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

/** Close the connection. Used by scripts/tests — the running server keeps it open. */
export function closeDb(): void {
  db?.close();
  db = null;
}
