/**
 * Auth gate for the multi-tenant migration. `REQUIRE_AUTH` defaults off, so
 * by default `requireAuth` is a no-op that attaches the Step-1 default user
 * — the app behaves exactly as it did before login existed, no login
 * screen, until this is explicitly turned on.
 */
import type { Request, Response, NextFunction } from 'express';
import { DEFAULT_LOCAL_USER_ID } from './db.ts';
import './sessionStore.ts'; // for the SessionData.userId module augmentation

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function isAuthRequired(): boolean {
  return process.env.REQUIRE_AUTH === 'true';
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!isAuthRequired()) {
    req.userId = DEFAULT_LOCAL_USER_ID;
    next();
    return;
  }

  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  req.userId = userId;
  next();
}
