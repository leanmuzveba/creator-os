/**
 * Creator OS account routes: signup, login, logout, current-user, and a
 * `/api/config` check the frontend uses to decide whether to show a login
 * screen at all (see server/authMiddleware.ts — off by default).
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, getUserById } from '../db.ts';
import { isAuthRequired } from '../authMiddleware.ts';
import { logger } from '../logger.ts';

export const authRouter = Router();

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

authRouter.get('/api/config', (req, res) => {
  res.json({ requireAuth: isAuthRequired() });
});

authRouter.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (getUserByEmail(normalizedEmail)) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = createUser(normalizedEmail, passwordHash, (name || normalizedEmail.split('@')[0]).trim());
    req.session.userId = user.id;
    res.status(201).json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    logger.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

authRouter.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = getUserByEmail(email.trim().toLowerCase());
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

authRouter.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      logger.error('Session destroy error:', err);
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

authRouter.get('/api/auth/me', (req, res) => {
  const userId = req.session?.userId;
  const user = userId ? getUserById(userId) : null;
  res.json({ user: user ? { id: user.id, email: user.email, name: user.name } : null });
});
