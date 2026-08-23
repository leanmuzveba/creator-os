import { describe, it, expect, vi, afterEach } from 'vitest';
import { logger } from './logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('logger', () => {
  it('always forwards warnings to console.warn with the app prefix', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('something', 42);
    expect(spy).toHaveBeenCalledWith('[CreatorOS]', 'something', 42);
  });

  it('always forwards errors to console.error with the app prefix', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('boom');
    logger.error('failed', err);
    expect(spy).toHaveBeenCalledWith('[CreatorOS]', 'failed', err);
  });

  it('exposes debug and info methods that do not throw', () => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    expect(() => logger.debug('d')).not.toThrow();
    expect(() => logger.info('i')).not.toThrow();
  });
});
