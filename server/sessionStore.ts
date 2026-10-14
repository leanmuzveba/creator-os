/**
 * Postgres-backed express-session store, so sessions survive server restarts.
 * Implements the small `session.Store` interface directly against the
 * `sessions` table in server/db.ts.
 */
import session from 'express-session';
import { getSessionRow, setSessionRow, destroySessionRow, pruneExpiredSessions } from './db.ts';
import { logger } from './logger.ts';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const DEFAULT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class DbSessionStore extends session.Store {
  constructor() {
    super();
    // Periodic cleanup of expired rows; unref so it never keeps the process alive.
    setInterval(() => pruneExpiredSessions().catch((err) => logger.error('Session prune error:', err)), 60 * 60 * 1000).unref();
  }

  get(sid: string, callback: (err: unknown, session?: session.SessionData | null) => void): void {
    getSessionRow(sid).then(
      (row) => callback(null, !row || row.expiresAt < Date.now() ? null : JSON.parse(row.data)),
      (err) => callback(err)
    );
  }

  set(sid: string, sessionData: session.SessionData, callback?: (err?: unknown) => void): void {
    const maxAge = (sessionData.cookie as { maxAge?: number } | undefined)?.maxAge ?? DEFAULT_MAX_AGE_MS;
    setSessionRow(sid, JSON.stringify(sessionData), Date.now() + maxAge).then(() => callback?.(), (err) => callback?.(err));
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    destroySessionRow(sid).then(() => callback?.(), (err) => callback?.(err));
  }
}
