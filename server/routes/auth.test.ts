import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import type { Server } from 'http';

// Throwaway DB, and capture outgoing emails instead of calling Brevo.
process.env.DB_PATH = 'memory://';
delete process.env.DATABASE_URL;
process.env.BREVO_API_KEY = 'test';
process.env.MAIL_FROM_EMAIL = 'noreply@test.local';
const sent: string[] = [];
vi.mock('../email.ts', () => ({
  isEmailConfigured: () => true,
  sendEmail: async (_to: string, _subject: string, text: string) => void sent.push(text),
}));

let server: Server;
let base = '';

beforeAll(async () => {
  const express = (await import('express')).default;
  const session = (await import('express-session')).default;
  const { authRouter } = await import('./auth.ts');
  const { DbSessionStore } = await import('../sessionStore.ts');
  const app = express();
  app.use(express.json());
  app.use(session({ store: new DbSessionStore(), secret: 'test', resave: false, saveUninitialized: false }));
  app.use(authRouter);
  server = app.listen(0);
  base = `http://localhost:${(server.address() as any).port}`;
}, 60_000);
afterAll(() => server?.close());

const post = (url: string, body: object) =>
  fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const latestCode = () => sent.at(-1)!.match(/\b(\d{6})\b/)![1];

test('forgot → reset → login with the new password', async () => {
  expect((await post('/api/auth/signup', { email: 'a@test.local', password: 'oldpassword', name: 'A' })).status).toBe(201);

  // Unknown email answers identically and sends nothing.
  const unknown = await post('/api/auth/forgot-password', { email: 'nobody@test.local' });
  expect(unknown.status).toBe(200);
  expect(sent).toHaveLength(0);

  // A session logged in before the reset (e.g. an attacker's) must not survive it.
  const oldLogin = await post('/api/auth/login', { email: 'a@test.local', password: 'oldpassword' });
  const oldCookie = oldLogin.headers.get('set-cookie')!.split(';')[0];
  const me = async () => (await (await fetch(base + '/api/auth/me', { headers: { cookie: oldCookie } })).json()).user;
  expect(await me()).toBeTruthy();

  expect((await post('/api/auth/forgot-password', { email: 'A@test.local ' })).status).toBe(200);
  expect(sent).toHaveLength(1);
  const code = latestCode();

  // Resend within 60s is silently throttled.
  await post('/api/auth/forgot-password', { email: 'a@test.local' });
  expect(sent).toHaveLength(1);

  const wrong = code === '000000' ? '111111' : '000000';
  expect((await post('/api/auth/reset-password', { email: 'a@test.local', code: wrong, password: 'newpassword' })).status).toBe(400);
  expect((await post('/api/auth/reset-password', { email: 'a@test.local', code, password: 'short' })).status).toBe(400);

  const ok = await post('/api/auth/reset-password', { email: 'a@test.local', code, password: 'newpassword' });
  expect(ok.status).toBe(200);
  expect(ok.headers.get('set-cookie')).toBeTruthy();
  expect(await me()).toBeNull();

  // Code is single-use; old password is dead, new one works.
  expect((await post('/api/auth/reset-password', { email: 'a@test.local', code, password: 'another1' })).status).toBe(400);
  expect((await post('/api/auth/login', { email: 'a@test.local', password: 'oldpassword' })).status).toBe(401);
  expect((await post('/api/auth/login', { email: 'a@test.local', password: 'newpassword' })).status).toBe(200);
}, 60_000);

test('code locks after 5 wrong attempts', async () => {
  await post('/api/auth/signup', { email: 'b@test.local', password: 'oldpassword', name: 'B' });
  await post('/api/auth/forgot-password', { email: 'b@test.local' });
  const code = latestCode();
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 5; i++) {
    await post('/api/auth/reset-password', { email: 'b@test.local', code: wrong, password: 'newpassword' });
  }
  expect((await post('/api/auth/reset-password', { email: 'b@test.local', code, password: 'newpassword' })).status).toBe(400);
}, 60_000);
