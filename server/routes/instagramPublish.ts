/**
 * Queue a post's video for publishing to Instagram as a Reel. The request body
 * is the raw video file; `?runAt=<epoch ms>` schedules it, otherwise it
 * publishes right away and responds with the outcome.
 */
import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { listPosts, upsertInstagramJob, getInstagramJob } from '../db.ts';
import { runInstagramJob } from '../instagramPublish.ts';

export const instagramPublishRouter = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_BYTES = 300 * 1024 * 1024; // Instagram's Reel size cap

instagramPublishRouter.post('/api/posts/:id/instagram', async (req, res) => {
  const userId = req.userId!;
  const post = listPosts(userId).find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (Number(req.headers['content-length'] || 0) > MAX_BYTES) {
    return res.status(413).json({ error: 'Instagram Reels must be 300MB or smaller' });
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  // Unique per upload, so a bad re-upload can't clobber a scheduled job's
  // video. Ids are server-generated, but strip anything path-like anyway.
  const videoPath = path.join(UPLOAD_DIR, `${userId}-${post.id}-${Date.now()}`.replace(/[^\w.-]/g, '_') + '.mp4');
  try {
    await pipeline(req, fs.createWriteStream(videoPath));
  } catch {
    // Upload aborted mid-stream; Express 4 won't catch an async throw here.
    fs.rmSync(videoPath, { force: true });
    return res.status(400).json({ error: 'Video upload was interrupted' });
  }
  if (fs.statSync(videoPath).size === 0) {
    fs.rmSync(videoPath, { force: true });
    return res.status(400).json({ error: 'No video received' });
  }

  // Rescheduling replaces the post's job; drop the video it was holding.
  const previous = getInstagramJob(userId, post.id);
  if (previous && previous.status !== 'running') fs.rmSync(previous.videoPath, { force: true });
  if (previous?.status === 'running') {
    fs.rmSync(videoPath, { force: true });
    return res.status(409).json({ error: 'This post is being published to Instagram right now' });
  }

  const runAt = Number(req.query.runAt) || Date.now();
  const job = {
    postId: post.id,
    userId,
    runAt,
    videoPath,
    caption: post.caption,
    status: 'pending' as const,
  };
  upsertInstagramJob(job);

  if (runAt > Date.now()) return res.json(job);
  const result = await runInstagramJob(job);
  res.status(result.status === 'published' ? 200 : 502).json(result);
});
