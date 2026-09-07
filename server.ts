/**
 * CreatorOS backend entry point.
 *
 * Wires up the Express app: middleware, feature route modules (posts,
 * accounts, OAuth, trends, analytics, AI, legal pages), a JSON API 404/error
 * handler, static serving of the built Vite app, and SPA fallback routing.
 * All data lives in the in-memory store (`server/store.ts`); feature logic
 * lives in the route modules under `server/routes/`.
 */
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './server/logger.ts';
import { getDb } from './server/db.ts';
import { SqliteSessionStore } from './server/sessionStore.ts';
import { requireAuth, isAuthRequired } from './server/authMiddleware.ts';
import { authRouter } from './server/routes/auth.ts';
import { postsRouter } from './server/routes/posts.ts';
import { accountsRouter } from './server/routes/accounts.ts';
import { authTiktokRouter } from './server/routes/authTiktok.ts';
import { authFacebookRouter } from './server/routes/authFacebook.ts';
import { authInstagramRouter } from './server/routes/authInstagram.ts';
import { authYoutubeRouter } from './server/routes/authYoutube.ts';
import { trendsRouter } from './server/routes/trends.ts';
import { analyticsRouter } from './server/routes/analytics.ts';
import { aiRouter } from './server/routes/ai.ts';
import { legalRouter } from './server/routes/legal.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Open the SQLite store (creates the schema and local-owner user if needed)
// before serving requests.
getDb();

if (isAuthRequired() && !process.env.SESSION_SECRET) {
  logger.warn('REQUIRE_AUTH is on but SESSION_SECRET is not set — using an insecure default. Set SESSION_SECRET in .env.');
}

app.use(
  session({
    store: new SqliteSessionStore(),
    secret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

// Account routes (signup/login/logout/me/config) — unauthenticated on purpose.
app.use(authRouter);

// Everything past here needs req.userId. When REQUIRE_AUTH is off (the
// default), this is a no-op that attaches the single local-owner user, so
// behavior is unchanged until the flag is deliberately turned on.
app.use(requireAuth);
app.use(postsRouter);
app.use(accountsRouter);
app.use(authTiktokRouter);
app.use(authFacebookRouter);
app.use(authInstagramRouter);
app.use(authYoutubeRouter);
app.use(analyticsRouter);

// Not user-scoped — no auth needed.
app.use(trendsRouter);
app.use(aiRouter);
app.use(legalRouter);

// Fallback for unmatched API routes so they return JSON instead of HTML.
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.path} not found` });
});

// Global JSON error-handling middleware.
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err) {
    logger.error('Server request error:', err);
    if (err.type === 'entity.too.large' || err.status === 413) {
      return res.status(413).json({ error: 'Payload or file is too large. Please select a smaller file.' });
    }
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
  next();
});

// In production, serve the built Vite app.
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA routing: serve index.html for non-API paths.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      // In dev mode when dist/ doesn't exist yet, respond with a placeholder.
      res.status(200).send('Please wait for Vite dev server...');
    }
  });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Creator OS backend listening on http://0.0.0.0:${PORT}`);
});
