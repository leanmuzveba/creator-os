/**
 * Signs the OAuth `state` param to the initiating user's id, closing the
 * account-linking CSRF gap: without this, an attacker could start their own
 * OAuth flow, then trick a logged-in victim's browser into hitting the
 * callback URL with the attacker's code+state, linking the attacker's
 * social account onto the victim's Creator OS account.
 */
import crypto from 'crypto';

const STATE_TTL_MS = 15 * 60 * 1000; // 15 minutes - plenty for a real login, short for replay

function secret(): string {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Build a signed state value binding this OAuth attempt to `userId`. */
export function createOAuthState(userId: string): string {
  const nonce = crypto.randomBytes(9).toString('base64url');
  const payload = `${userId}.${nonce}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

/** Verify a callback's `state` was issued for `userId` and hasn't expired. */
export function verifyOAuthState(userId: string, state: unknown): boolean {
  if (typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 4) return false;
  const [stateUserId, nonce, tsRaw, signature] = parts;

  const expected = sign(`${stateUserId}.${nonce}.${tsRaw}`);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
    return false;
  }

  if (stateUserId !== userId) return false;

  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || Date.now() - ts > STATE_TTL_MS) return false;

  return true;
}
