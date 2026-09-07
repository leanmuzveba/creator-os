/**
 * SQLite-backed express-session store, so sessions survive server restarts.
 * (The npm `better-sqlite3-session-store` package is at 0.1.0 — too
 * immature to depend on for something session/auth-related — so this
 * implements the small `session.Store` interface directly against the
 * `sessions` table in server/db.ts.)
 */
import session from 'express-session';
import { getSessionRow, setSessionRow, destroySessionRow, pruneExpiredSessions } from './db.ts';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    // Periodic cleanup of expired rows; unref so it never keeps the process alive.
    setInterval(() => pruneExpiredSessions(), 60 * 60 * 1000).unref();
  }

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void): void {
    try {
      const row = getSessionRow(sid);
      if (!row || row.expiresAt < Date.now()) return callback(null, null);
      callback(null, JSON.parse(row.data));
    } catch (err) {
      callback(err);
    }
  }

  set(sid: string, sessionData: session.SessionData, callback?: (err?: unknown) => void): void {
    try {
      const maxAge = (sessionData.cookie as { maxAge?: number } | undefined)?.maxAge ?? DEFAULT_MAX_AGE_MS;
      setSessionRow(sid, JSON.stringify(sessionData), Date.now() + maxAge);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    try {
      destroySessionRow(sid);
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }
}
