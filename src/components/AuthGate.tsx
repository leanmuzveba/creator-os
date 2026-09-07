/**
 * Gates the app behind Creator OS login, but only when the backend reports
 * `REQUIRE_AUTH` is on (`/api/config`) — which defaults off, so by default
 * this renders `children` immediately with no login screen at all. Wraps
 * `AppProvider` in App.tsx so the app's own data fetching never starts
 * until the gate has resolved.
 */
import React, { useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

type GateStatus = 'checking' | 'open' | 'authenticated' | 'anonymous';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<GateStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const configRes = await fetch('/api/config');
        const config = await configRes.json();
        if (cancelled) return;

        if (!config.requireAuth) {
          setStatus('open');
          return;
        }

        const meRes = await fetch('/api/auth/me');
        const me = await meRes.json();
        if (cancelled) return;
        setStatus(me.user ? 'authenticated' : 'anonymous');
      } catch {
        // If the config check itself fails, fail open to the app's existing
        // no-login behavior rather than stranding the user on a dead screen.
        if (!cancelled) setStatus('open');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return <div className="min-h-screen bg-[var(--bg-page)]" />;
  }

  if (status === 'anonymous') {
    return <AuthForms onAuthenticated={() => setStatus('authenticated')} />;
  }

  return <>{children}</>;
};

const AuthForms: React.FC<{ onAuthenticated: () => void }> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      onAuthenticated();
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] text-center mb-1">Creator OS</h1>
        <p className="text-sm text-[var(--text-secondary)] text-center mb-8">
          {mode === 'login' ? 'Log in to your account' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block mb-2 text-xs font-bold tracking-wide text-[var(--text-secondary)]">NAME</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none transition-colors"
              />
            </div>
          )}
          <div>
            <label className="block mb-2 text-xs font-bold tracking-wide text-[var(--text-secondary)]">EMAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block mb-2 text-xs font-bold tracking-wide text-[var(--text-secondary)]">PASSWORD</label>
            <input
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
              className="w-full px-3.5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none transition-colors"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-bold disabled:opacity-60 transition-opacity"
          >
            {submitting ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
            className="text-[var(--accent)] font-bold hover:opacity-80"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};
