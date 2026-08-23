/**
 * Analytics route: aggregates metrics across the connected social accounts and
 * synthesizes a dynamic time series, platform breakdown, and category split for
 * the requested date range.
 */
import { Router } from 'express';
import { store } from '../store.ts';
import { parseMetricServer, formatMetricServer } from '../metrics.ts';

export const analyticsRouter = Router();

analyticsRouter.get('/api/analytics', (req, res) => {
  const range = (req.query.range as string) || '7d';

  const tiktokAcc = store.socialAccounts.find((a) => a.id === 'tiktok');
  const igAcc = store.socialAccounts.find((a) => a.id === 'instagram');
  const ytAcc = store.socialAccounts.find((a) => a.id === 'youtube');
  const fbAcc = store.socialAccounts.find((a) => a.id === 'facebook');

  const tiktokViews = tiktokAcc?.connected ? parseMetricServer(tiktokAcc?.views) : 0;
  const igViews = igAcc?.connected ? parseMetricServer(igAcc?.views) : 0;
  const ytViews = ytAcc?.connected ? parseMetricServer(ytAcc?.views) : 0;
  const fbViews = fbAcc?.connected ? parseMetricServer(fbAcc?.views) : 0;

  const tiktokFollowers = tiktokAcc?.connected ? parseMetricServer(tiktokAcc?.followers) : 0;
  const igFollowers = igAcc?.connected ? parseMetricServer(igAcc?.followers) : 0;
  const ytFollowers = ytAcc?.connected ? parseMetricServer(ytAcc?.followers) : 0;
  const fbFollowers = fbAcc?.connected ? parseMetricServer(fbAcc?.followers) : 0;

  const totalViews = tiktokViews + igViews + ytViews + fbViews;
  const totalFollowers = tiktokFollowers + igFollowers + ytFollowers + fbFollowers;
  const totalReach = totalViews > 0 ? Math.round(totalViews * 0.74) : 0;
  const totalEngagement = totalViews > 0 ? Math.round(totalViews * 0.098) : 0;
  const newFollowers =
    totalFollowers > 0
      ? Math.round(totalFollowers * (range === '30d' ? 0.078 : range === '90d' ? 0.18 : 0.026))
      : 0;

  const hasConnected = store.socialAccounts.some((a) => a.connected);

  // Generate dynamic time-series points ending at the current latest view counts.
  let numDays = 7;
  if (range === '14d') numDays = 14;
  else if (range === '30d') numDays = 30;
  else if (range === '90d') numDays = 12; // weekly intervals
  else if (range === 'all') numDays = 12; // monthly/quarterly intervals

  const now = new Date();
  const viewSeries = [];

  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * (range === '90d' ? 7 : range === 'all' ? 30 : 1));
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Progression ratio from ~60% up to 100% on the final day.
    const progress = 1 - (i / (numDays - 1 || 1)) * 0.4;
    // Add small realistic daily fluctuation.
    const noise = i === 0 ? 1 : 0.96 + ((i * 17) % 9) * 0.01;
    const factor = progress * noise;

    const curTt = Math.round(tiktokViews * factor);
    const curIg = Math.round(igViews * factor);
    const curYt = Math.round(ytViews * factor);
    const curFb = Math.round(fbViews * factor);

    viewSeries.push({
      date: dateLabel,
      tiktok: curTt,
      instagram: curIg,
      youtube: curYt,
      facebook: curFb,
      total: curTt + curIg + curYt + curFb,
    });
  }

  const overview = {
    views: { value: formatMetricServer(totalViews), numericValue: totalViews, growth: hasConnected ? '+16.8%' : '0%', trend: 'up' },
    reach: { value: formatMetricServer(totalReach), numericValue: totalReach, growth: hasConnected ? '+12.3%' : '0%', trend: 'up' },
    followers: { value: formatMetricServer(totalFollowers), numericValue: totalFollowers, growth: hasConnected ? '+8.4%' : '0%', trend: 'up' },
    engagement: { value: formatMetricServer(totalEngagement), numericValue: totalEngagement, growth: hasConnected ? '+9.6%' : '0%', trend: 'up' },
    newFollowers: { value: formatMetricServer(newFollowers), numericValue: newFollowers, growth: hasConnected ? '+10.1%' : '0%', trend: 'up' },
  };

  const platformPerformance = [
    {
      platform: 'TikTok',
      views: tiktokAcc?.views || formatMetricServer(tiktokViews),
      reach: formatMetricServer(tiktokViews * 0.74),
      engagement: formatMetricServer(tiktokViews * 0.099),
      growth: tiktokAcc?.viewsGrowth || '+18.6%',
      color: '#25f4ee',
      postsCount: 14,
      connected: tiktokAcc?.connected || false,
    },
    {
      platform: 'Instagram',
      views: igAcc?.views || formatMetricServer(igViews),
      reach: formatMetricServer(igViews * 0.76),
      engagement: formatMetricServer(igViews * 0.099),
      growth: igAcc?.viewsGrowth || '+12.4%',
      color: '#e1306c',
      postsCount: 11,
      connected: igAcc?.connected || false,
    },
    {
      platform: 'YouTube',
      views: ytAcc?.views || formatMetricServer(ytViews),
      reach: formatMetricServer(ytViews * 0.78),
      engagement: formatMetricServer(ytViews * 0.113),
      growth: ytAcc?.viewsGrowth || '+9.3%',
      color: '#ff0000',
      postsCount: 8,
      connected: ytAcc?.connected || false,
    },
    {
      platform: 'Facebook',
      views: fbAcc?.views || formatMetricServer(fbViews),
      reach: formatMetricServer(fbViews * 0.78),
      engagement: formatMetricServer(fbViews * 0.099),
      growth: fbAcc?.viewsGrowth || '+6.8%',
      color: '#1877f2',
      postsCount: 5,
      connected: fbAcc?.connected || false,
    },
  ];

  const categoryBreakdown = [
    { category: 'Free Tech Resources', percentage: 38, views: formatMetricServer(totalViews * 0.38), color: '#8b5cf6' },
    { category: 'Breaking Into Tech', percentage: 26, views: formatMetricServer(totalViews * 0.26), color: '#06b6d4' },
    { category: 'Tech Education', percentage: 18, views: formatMetricServer(totalViews * 0.18), color: '#ec4899' },
    { category: 'Student & Academic Life', percentage: 12, views: formatMetricServer(totalViews * 0.12), color: '#10b981' },
    { category: 'Microsoft Journey', percentage: 6, views: formatMetricServer(totalViews * 0.06), color: '#f59e0b' },
  ];

  res.json({
    range,
    overview,
    viewSeries,
    platformPerformance,
    categoryBreakdown,
    topPost: store.posts[0],
  });
});
