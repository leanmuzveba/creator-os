/**
 * Creator OS account routes: signup, login, logout, current-user, and a
 * `/api/config` check the frontend uses to decide whether to show a login
 * screen at all (see server/authMiddleware.ts — off by default).
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import {
  bumpPasswordResetAttempts,
  createUser,
  deletePasswordReset,
  destroyUserSessions,
  getPasswordReset,
  getUserByEmail,
  getUserById,
  setPasswordReset,
  updateUserPassword,
  upsertAccount,
} from '../db.ts';
import { isEmailConfigured, sendEmail } from '../email.ts';
import { isAuthRequired } from '../authMiddleware.ts';
import { logger } from '../logger.ts';
import { blankSocialAccounts } from '../store.ts';

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
    // The pre-auth local-owner got its rows from the one-time SQLite migration;
    // a fresh signup has none, so the Connected Accounts modal would otherwise
    // render with nothing to connect at all. Blank/disconnected only — see
    // blankSocialAccounts for why this can't reuse defaultSocialAccounts.
    for (const acc of blankSocialAccounts) {
      upsertAccount(user.id, { ...acc });
    }
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

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_RESEND_MS = 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

/**
 * Email a 6-digit reset code. Always answers the same way whether or not the
 * account exists, so this can't be used to probe which emails are signed up.
 */
authRouter.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body ?? {};
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (!isEmailConfigured()) {
    return res.status(503).json({ error: 'Password reset by email is not set up yet' });
  }

  const sent = { success: true, message: 'If an account exists for that email, a code is on its way.' };
  const user = getUserByEmail(email.trim().toLowerCase());
  if (!user?.email) return res.json(sent);

  const existing = getPasswordReset(user.id);
  if (existing && Date.now() - existing.createdAt < RESET_RESEND_MS) return res.json(sent);

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  try {
    setPasswordReset(user.id, await bcrypt.hash(code, 10), Date.now() + RESET_CODE_TTL_MS);
    await sendEmail(
      user.email,
      'Your Creator OS password reset code',
      `Your Creator OS password reset code is ${code}\n\nIt expires in 15 minutes. If you didn't ask for this, you can ignore this email.`
    );
    res.json(sent);
  } catch (err) {
    logger.error('Forgot-password error:', err);
    res.status(500).json({ error: 'Could not send the reset email. Please try again.' });
  }
});

/** Check the emailed code, set the new password, and log the user straight in. */
authRouter.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof code !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email, code and new password are required' });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
  }

  const invalid = () => res.status(400).json({ error: 'That code is invalid or has expired. Request a new one.' });
  const user = getUserByEmail(email.trim().toLowerCase());
  const reset = user ? getPasswordReset(user.id) : null;
  if (!user || !reset || reset.expiresAt < Date.now() || reset.attempts >= RESET_MAX_ATTEMPTS) return invalid();

  try {
    if (!(await bcrypt.compare(code.trim(), reset.codeHash))) {
      bumpPasswordResetAttempts(user.id);
      return invalid();
    }
    updateUserPassword(user.id, await bcrypt.hash(password, BCRYPT_ROUNDS));
    deletePasswordReset(user.id);
    destroyUserSessions(user.id);
    req.session.userId = user.id;
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    logger.error('Reset-password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
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
