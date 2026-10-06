/**
 * Publishes Reels to Instagram via the Content Publishing API and runs a
 * once-a-minute scheduler for posts queued with a future time.
 *
 * Flow (resumable upload, so the video never needs a public URL):
 *   1. POST /media (media_type=REELS, upload_type=resumable) -> container id + upload uri
 *   2. POST the video bytes to the upload uri (rupload.facebook.com)
 *   3. Poll the container's status_code until FINISHED
 *   4. POST /media_publish with the container id
 *
 * Works with either Instagram token: the Instagram Login one (graph.instagram.com,
 * node "me") or the Page token from the Facebook login (graph.facebook.com,
 * node = the linked IG account id).
 */
import fs from 'fs';
import { Readable } from 'stream';
import { getDb, getOAuthToken, listDueInstagramJobs, upsertInstagramJob, updatePostFields } from './db.ts';
import type { InstagramJob } from './db.ts';
import { logger } from './logger.ts';

const API_VERSION = 'v21.0';
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

async function graphCall(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error?.error_user_msg || data.error?.message || `Instagram API error (${res.status})`);
  }
  return data;
}

/** Upload and publish one Reel. Returns the published media id. */
export async function publishReel(userId: string, videoPath: string, caption: string): Promise<string> {
  const token = getOAuthToken(userId, 'instagram');
  if (!token?.accessToken) throw new Error('Instagram is not connected');
  if (token.expiresAt && token.expiresAt < Date.now()) {
    // ponytail: no auto-refresh of the 60-day token; reconnecting renews it.
    throw new Error('Instagram login expired - reconnect Meta in Connected Accounts');
  }
  const viaFacebook = token.extra?.via === 'facebook';
  const base = `https://graph.${viaFacebook ? 'facebook' : 'instagram'}.com/${API_VERSION}`;
  const node = viaFacebook ? String(token.extra!.userId) : 'me';
  const accessToken = token.accessToken;

  const container = await graphCall(`${base}/${node}/media`, {
    method: 'POST',
    body: new URLSearchParams({ media_type: 'REELS', upload_type: 'resumable', caption, access_token: accessToken }),
  });

  const size = fs.statSync(videoPath).size;
  await graphCall(container.uri || `https://rupload.facebook.com/ig-api-upload/${API_VERSION}/${container.id}`, {
    method: 'POST',
    headers: { Authorization: `OAuth ${accessToken}`, offset: '0', file_size: String(size) },
    body: Readable.toWeb(fs.createReadStream(videoPath)) as any,
    duplex: 'half',
  } as RequestInit);

  // Instagram transcodes the video before it can be published.
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    const s = await graphCall(`${base}/${container.id}?fields=status_code,status&access_token=${accessToken}`);
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') {
      throw new Error(`Instagram could not process the video: ${s.status || s.status_code}`);
    }
    if (Date.now() > deadline) throw new Error('Instagram took too long to process the video');
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  const published = await graphCall(`${base}/${node}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: container.id, access_token: accessToken }),
  });
  return published.id;
}

/** Run one job to completion, recording the outcome on the job and the post. */
export async function runInstagramJob(job: InstagramJob): Promise<InstagramJob> {
  upsertInstagramJob({ ...job, status: 'running' });
  try {
    const mediaId = await publishReel(job.userId, job.videoPath, job.caption);
    const done: InstagramJob = { ...job, status: 'published', mediaId, error: undefined };
    upsertInstagramJob(done);
    updatePostFields(job.userId, job.postId, {
      status: 'published',
      publishedDate: new Date().toISOString().split('T')[0],
    });
    fs.rmSync(job.videoPath, { force: true });
    logger.info(`Published Reel for post ${job.postId} (media ${mediaId})`);
    return done;
  } catch (err: any) {
    const failed: InstagramJob = { ...job, status: 'failed', error: err.message || String(err) };
    upsertInstagramJob(failed);
    logger.warn(`Instagram publish failed for post ${job.postId}:`, failed.error);
    return failed;
  }
}

let ticking = false;

/**
 * Check for due jobs every minute.
 * ponytail: in-process timer + local disk. On Render's free tier the server
 * sleeps after ~15 idle minutes and the disk is wiped on redeploy, so a
 * scheduled Reel only goes out if the server is awake at that time. Real fix:
 * paid instance (always-on + disk), or video in object storage + a cron ping.
 */
export function startInstagramScheduler(): void {
  // A job left "running" means the server died mid-publish; we can't know if
  // Instagram got it, so flag it rather than risk posting twice.
  getDb()
    .prepare(`UPDATE instagram_jobs SET status = 'failed', error = 'Server restarted while publishing' WHERE status = 'running'`)
    .run();

  setInterval(async () => {
    if (ticking) return;
    ticking = true;
    try {
      for (const job of listDueInstagramJobs(Date.now())) await runInstagramJob(job);
    } finally {
      ticking = false;
    }
  }, 60 * 1000);
}
