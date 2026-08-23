/**
 * Trends feed route: returns curated trending topics, optionally filtered by
 * platform.
 */
import { Router } from 'express';
import { trendsFeed } from '../store.ts';

export const trendsRouter = Router();

trendsRouter.get('/api/trends', (req, res) => {
  const { platform } = req.query;
  if (platform && platform !== 'all' && platform !== 'for_you') {
    res.json(trendsFeed.filter((t) => t.platform === platform));
  } else {
    res.json(trendsFeed);
  }
});
