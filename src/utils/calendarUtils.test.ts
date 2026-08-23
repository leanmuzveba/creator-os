import { describe, it, expect } from 'vitest';
import { formatLocalDate, parseLocalDate, getPostDateString } from './calendarUtils';
import { PostItem } from '../types';

/** Minimal post factory for date-resolution tests. */
function post(overrides: Partial<PostItem> = {}): PostItem {
  return {
    id: 'p',
    title: 't',
    category: 'Tech Education',
    platforms: ['tiktok'],
    status: 'draft',
    caption: '',
    hashtags: [],
    thumbnailUrl: '',
    ...overrides,
  };
}

describe('formatLocalDate', () => {
  it('formats a date as zero-padded YYYY-MM-DD in local time', () => {
    expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('parseLocalDate', () => {
  it('round-trips with formatLocalDate', () => {
    expect(formatLocalDate(parseLocalDate('2026-08-23'))).toBe('2026-08-23');
  });

  it('ignores a time component', () => {
    expect(formatLocalDate(parseLocalDate('2026-08-23T14:30:00'))).toBe('2026-08-23');
  });

  it('falls back to today for empty or non-date-shaped input (fewer than 3 parts)', () => {
    expect(isNaN(parseLocalDate('').getTime())).toBe(false);
    expect(isNaN(parseLocalDate('garbage').getTime())).toBe(false);
  });
});

describe('getPostDateString', () => {
  it('prefers the scheduled date over the published date', () => {
    expect(getPostDateString(post({ scheduledDate: '2026-08-01', publishedDate: '2026-07-01' }))).toBe('2026-08-01');
  });

  it('falls back to the published date', () => {
    expect(getPostDateString(post({ publishedDate: '2026-07-01' }))).toBe('2026-07-01');
  });

  it('strips a time component from the stored date', () => {
    expect(getPostDateString(post({ scheduledDate: '2026-08-01T10:00:00' }))).toBe('2026-08-01');
  });

  it('returns null when there is no date', () => {
    expect(getPostDateString(post())).toBeNull();
  });
});
