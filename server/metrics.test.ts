import { describe, it, expect } from 'vitest';
import { parseMetricServer, formatMetricServer } from './metrics';

describe('parseMetricServer', () => {
  it('parses abbreviated suffixes and plain values', () => {
    expect(parseMetricServer('1.2K')).toBe(1200);
    expect(parseMetricServer('3M')).toBe(3000000);
    expect(parseMetricServer('2B')).toBe(2000000000);
    expect(parseMetricServer('1,500')).toBe(1500);
    expect(parseMetricServer(4500)).toBe(4500);
  });

  it('returns 0 for empty or unparseable input', () => {
    expect(parseMetricServer('')).toBe(0);
    expect(parseMetricServer(undefined)).toBe(0);
    expect(parseMetricServer(null)).toBe(0);
    expect(parseMetricServer('abc')).toBe(0);
  });
});

describe('formatMetricServer', () => {
  it('formats numbers with suffixes and guards non-positive values', () => {
    expect(formatMetricServer(1200)).toBe('1.2K');
    expect(formatMetricServer(1000)).toBe('1K');
    expect(formatMetricServer(1500000)).toBe('1.5M');
    expect(formatMetricServer(1000000000)).toBe('1B');
    expect(formatMetricServer(0)).toBe('0');
    expect(formatMetricServer(-1)).toBe('0');
  });

  it('round-trips with parseMetricServer', () => {
    expect(parseMetricServer(formatMetricServer(1200))).toBe(1200);
    expect(parseMetricServer(formatMetricServer(3000000))).toBe(3000000);
  });
});
