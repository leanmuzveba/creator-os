import { describe, it, expect, vi } from 'vitest';
import { createOAuthState, verifyOAuthState } from './oauthState';

describe('createOAuthState / verifyOAuthState', () => {
  it('accepts a state issued for the same user', () => {
    const state = createOAuthState('user-a');
    expect(verifyOAuthState('user-a', state)).toBe(true);
  });

  it('rejects a state issued for a different user (the CSRF case)', () => {
    // Attacker starts their own flow (state signed for "attacker"), then gets
    // a victim's session to hit the callback with it.
    const attackerState = createOAuthState('attacker');
    expect(verifyOAuthState('victim', attackerState)).toBe(false);
  });

  it('rejects a tampered state (userId swapped without a valid signature)', () => {
    const state = createOAuthState('user-a');
    const [, nonce, ts, signature] = state.split('.');
    const forged = `user-b.${nonce}.${ts}.${signature}`;
    expect(verifyOAuthState('user-b', forged)).toBe(false);
  });

  it('rejects malformed or missing state', () => {
    expect(verifyOAuthState('user-a', undefined)).toBe(false);
    expect(verifyOAuthState('user-a', '')).toBe(false);
    expect(verifyOAuthState('user-a', 'not-a-valid-state')).toBe(false);
    expect(verifyOAuthState('user-a', ['array', 'not', 'string'])).toBe(false);
  });

  it('rejects an expired state', () => {
    const realNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(realNow());
    const state = createOAuthState('user-a');
    vi.spyOn(Date, 'now').mockReturnValue(realNow() + 16 * 60 * 1000); // 16 minutes later
    expect(verifyOAuthState('user-a', state)).toBe(false);
    vi.restoreAllMocks();
  });
});
