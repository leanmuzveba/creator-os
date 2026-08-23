import { describe, it, expect } from 'vitest';
import {
  parseMetric,
  formatMetric,
  calculateTotalViews,
  calculateTotalFollowers,
  calculateTotalReach,
  calculateTotalEngagement,
  calculateAggregatedOverview,
} from './metricUtils';
import { SocialAccount, PostItem } from '../types';

/** Build a SocialAccount with sensible defaults for tests. */
function account(overrides: Partial<SocialAccount> = {}): SocialAccount {
  return {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@test',
    connected: true,
    avatar: '',
    followers: '0',
    views: '0',
    viewsGrowth: '+0%',
    color: '#000',
    accentColor: '#000',
    status: 'active',
    ...overrides,
  };
}

describe('parseMetric', () => {
  it('parses K/M/B suffixes', () => {
    expect(parseMetric('1.2K')).toBe(1200);
    expect(parseMetric('3M')).toBe(3000000);
    expect(parseMetric('2B')).toBe(2000000000);
  });

  it('strips commas and parses plain numbers', () => {
    expect(parseMetric('1,500')).toBe(1500);
    expect(parseMetric('42')).toBe(42);
    expect(parseMetric(4500)).toBe(4500);
  });

  it('returns 0 for empty, nullish, or unparseable input', () => {
    expect(parseMetric('')).toBe(0);
    expect(parseMetric(undefined)).toBe(0);
    expect(parseMetric(null)).toBe(0);
    expect(parseMetric('abc')).toBe(0);
    expect(parseMetric(NaN)).toBe(0);
  });
});

describe('formatMetric', () => {
  it('formats large numbers with suffixes and trims trailing .0', () => {
    expect(formatMetric(1200)).toBe('1.2K');
    expect(formatMetric(1000)).toBe('1K');
    expect(formatMetric(1500000)).toBe('1.5M');
    expect(formatMetric(2000000000)).toBe('2B');
  });

  it('formats small numbers and guards non-positive values', () => {
    expect(formatMetric(999)).toBe('999');
    expect(formatMetric(0)).toBe('0');
    expect(formatMetric(-5)).toBe('0');
    expect(formatMetric(NaN)).toBe('0');
  });

  it('round-trips with parseMetric for representative values', () => {
    expect(parseMetric(formatMetric(1200))).toBe(1200);
    expect(parseMetric(formatMetric(1500000))).toBe(1500000);
  });
});

describe('account aggregation', () => {
  const accounts: SocialAccount[] = [
    account({ id: 'tiktok', connected: true, views: '100K', followers: '10K' }),
    account({ id: 'instagram', connected: true, views: '50K', followers: '5K' }),
    account({ id: 'youtube', connected: false, views: '999M', followers: '999M' }),
  ];

  it('sums views only from connected accounts', () => {
    expect(calculateTotalViews(accounts)).toBe(150000);
    expect(calculateTotalViews([])).toBe(0);
  });

  it('sums followers only from connected accounts', () => {
    expect(calculateTotalFollowers(accounts)).toBe(15000);
  });

  it('derives reach as 74% of total views (rounded)', () => {
    expect(calculateTotalReach(accounts)).toBe(Math.round(150000 * 0.74));
    expect(calculateTotalReach([])).toBe(0);
  });
});

describe('calculateTotalEngagement', () => {
  it('returns 0 when no accounts are connected', () => {
    expect(calculateTotalEngagement([account({ connected: false })])).toBe(0);
  });

  it('uses the larger of post engagement and the view-based baseline', () => {
    const accounts = [account({ id: 'tiktok', connected: true, views: '100K' })];
    const posts: PostItem[] = [
      {
        id: 'p1',
        title: 't',
        category: 'Tech Education',
        platforms: ['tiktok'],
        status: 'published',
        caption: '',
        hashtags: [],
        thumbnailUrl: '',
        likes: 100000,
        comments: 0,
        shares: 0,
        bookmarks: 0,
      },
    ];
    const baseline = Math.round(100000 * 0.098); // 9800
    expect(calculateTotalEngagement(accounts, posts)).toBe(Math.max(baseline, 100000));
  });
});

describe('calculateAggregatedOverview', () => {
  it('produces formatted overview cards for connected accounts', () => {
    const accounts = [account({ id: 'tiktok', connected: true, views: '100K', followers: '10K' })];
    const overview = calculateAggregatedOverview(accounts, [], '7d');
    expect(overview.views.numericValue).toBe(100000);
    expect(overview.views.value).toBe('100K');
    expect(overview.followers.value).toBe('10K');
    expect(overview.views.growth).toBe('+16.8%');
  });

  it('reports 0% growth when nothing is connected', () => {
    const overview = calculateAggregatedOverview([account({ connected: false })], [], '7d');
    expect(overview.views.growth).toBe('0%');
    expect(overview.views.numericValue).toBe(0);
  });
});
