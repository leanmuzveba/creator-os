/**
 * Server-side logger for the CreatorOS backend.
 *
 * Provides a single, greppable logging surface so backend code no longer calls
 * `console.*` directly. Debug output is suppressed in production; info,
 * warnings, and errors are always emitted.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isProd = process.env.NODE_ENV === 'production';
const PREFIX = '[server]';

/** Route a message to the underlying console method (the one intended sink). */
function emit(level: LogLevel, args: unknown[]): void {
  if (level === 'debug' && isProd) return;
  const sink = console as unknown as Record<LogLevel, (...a: unknown[]) => void>;
  sink[level]?.(PREFIX, ...args);
}

export const logger = {
  /** Verbose diagnostics (e.g. raw OAuth API responses); suppressed in production. */
  debug: (...args: unknown[]) => emit('debug', args),
  /** Operational milestones (startup, storage load); always emitted. */
  info: (...args: unknown[]) => emit('info', args),
  /** Recoverable problems; always emitted. */
  warn: (...args: unknown[]) => emit('warn', args),
  /** Errors and failed operations; always emitted. */
  error: (...args: unknown[]) => emit('error', args),
};
