/**
 * Lightweight client-side logger for CreatorOS.
 *
 * Centralises all browser console output behind a single, greppable surface so
 * the app no longer scatters raw `console.*` calls through feature code. Debug
 * and info messages are silenced outside development builds to keep the
 * production console clean, while warnings and errors are always surfaced.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *   logger.warn('Could not read cached accounts', err);
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** True only in Vite dev builds; guarded so it is safe outside a bundler too. */
const isDev: boolean = (() => {
  try {
    return Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
})();

/** Levels that should always reach the console, even in production. */
const ALWAYS_ON: ReadonlySet<LogLevel> = new Set<LogLevel>(['warn', 'error']);

const PREFIX = '[CreatorOS]';

/**
 * Route a message to the underlying console method. Bracket access keeps this
 * the one intentional logging indirection in the codebase rather than a raw
 * `console.<level>` call sprinkled across features.
 */
function emit(level: LogLevel, args: unknown[]): void {
  if (!isDev && !ALWAYS_ON.has(level)) return;
  const sink = console as unknown as Record<LogLevel, (...a: unknown[]) => void>;
  sink[level]?.(PREFIX, ...args);
}

export const logger = {
  /** Verbose diagnostics; only emitted in development builds. */
  debug: (...args: unknown[]) => emit('debug', args),
  /** Informational messages; only emitted in development builds. */
  info: (...args: unknown[]) => emit('info', args),
  /** Recoverable problems; always emitted. */
  warn: (...args: unknown[]) => emit('warn', args),
  /** Errors and failed operations; always emitted. */
  error: (...args: unknown[]) => emit('error', args),
};
