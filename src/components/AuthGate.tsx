/**
 * Gates the app behind Creator OS login, but only when the backend reports
 * `REQUIRE_AUTH` is on (`/api/config`) — which defaults off, so by default
 * this renders `children` immediately with no login screen at all. Wraps
 * `AppProvider` in App.tsx so the app's own data fetching never starts
 * until the gate has resolved.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

type GateStatus = 'checking' | 'open' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  /** Whether the backend has REQUIRE_AUTH on — controls whether a "Log Out" control should be shown at all. */
  requireAuth: boolean;
  user: AuthUser | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  requireAuth: false,
  user: null,
  logout: async () => {},
});

/** Access the signed-in user and logout action from anywhere under AuthGate. */
export const useAuth = () => useContext(AuthContext);

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [user, setUser] = useState<AuthUser | null>(null);

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
        setUser(me.user ?? null);
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

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  };

  if (status === 'checking') {
    return <div className="min-h-screen bg-[var(--bg-page)]" />;
  }

  if (status === 'anonymous') {
    return (
      <AuthForms
        onAuthenticated={(authedUser) => {
          setUser(authedUser);
          setStatus('authenticated');
        }}
      />
    );
  }

  return (
    <AuthContext.Provider value={{ requireAuth: status === 'authenticated', user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const inputClass =
  'w-full px-3.5 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--accent)] outline-none transition-colors';
const labelClass = 'block mb-2 text-xs font-bold tracking-wide text-[var(--text-secondary)]';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';

const SUBTITLES: Record<AuthMode, string> = {
  login: 'Log in to your account',
  signup: 'Create your account',
  forgot: "Enter your email and we'll send you a reset code",
  reset: 'Enter the code from your email and choose a new password',
};

const BUTTON_LABELS: Record<AuthMode, string> = {
  login: 'Log In',
  signup: 'Sign Up',
  forgot: 'Send Code',
  reset: 'Reset Password & Log In',
};

const AuthForms: React.FC<{ onAuthenticated: (user: AuthUser) => void }> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setPassword('');
    setError('');
    setInfo('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const requests: Record<AuthMode, [string, object]> = {
      login: ['/api/auth/login', { email, password }],
      signup: ['/api/auth/signup', { email, password, name }],
      forgot: ['/api/auth/forgot-password', { email }],
      reset: ['/api/auth/reset-password', { email, code, password }],
    };
    try {
      const [url, body] = requests[mode];
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      if (mode === 'forgot') {
        switchMode('reset');
        setCode('');
        setInfo(data.message);
        return;
      }
      onAuthenticated(data);
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
        <p className="text-sm text-[var(--text-secondary)] text-center mb-8">{SUBTITLES[mode]}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className={labelClass}>NAME</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
          )}
          <div>
            <label className={labelClass}>EMAIL</label>
            <input
              type="email"
              required
              readOnly={mode === 'reset'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          {mode === 'reset' && (
            <div>
              <label className={labelClass}>RESET CODE</label>
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className={`${inputClass} tracking-widest`}
              />
            </div>
          )}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold tracking-wide text-[var(--text-secondary)]">
                  {mode === 'reset' ? 'NEW PASSWORD' : 'PASSWORD'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-bold text-[var(--accent)] hover:opacity-80"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={mode === 'login' ? undefined : 8}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? 'Your password' : 'At least 8 characters'}
                className={inputClass}
              />
            </div>
          )}

          {info && <p className="text-sm text-[var(--text-secondary)]">{info}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-[var(--accent)] text-white font-bold disabled:opacity-60 transition-opacity"
          >
            {submitting ? 'Please wait...' : BUTTON_LABELS[mode]}
          </button>
        </form>

        {mode === 'reset' && (
          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            No code?{' '}
            <button type="button" onClick={() => switchMode('forgot')} className="text-[var(--accent)] font-bold hover:opacity-80">
              Send another
            </button>
          </p>
        )}
        <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
          {mode === 'login' ? "Don't have an account? " : mode === 'signup' ? 'Already have an account? ' : ''}
          <button
            type="button"
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            className="text-[var(--accent)] font-bold hover:opacity-80"
          >
            {mode === 'login' ? 'Sign up' : mode === 'signup' ? 'Log in' : 'Back to log in'}
          </button>
        </p>
      </div>
    </div>
  );
};
