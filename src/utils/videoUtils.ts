/**
 * Client-side media helpers for the upload flow.
 *
 * Turns a user-selected video/image `File` into the metadata CreatorOS needs
 * (display title, duration, and a thumbnail) without any server round-trip,
 * using an offscreen `<canvas>` to capture a frame. Everything degrades to a
 * default cover image if the browser blocks canvas capture (e.g. cross-origin)
 * or metadata extraction stalls.
 */
import { logger } from './logger';

/** Default cover image used whenever a real thumbnail cannot be produced. */
const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';

/** Default cover used specifically for videos whose frame capture fails. */
const VIDEO_FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80';

/** Scale `(w, h)` down to fit within `(maxW, maxH)`, preserving aspect ratio. */
function computeFitDimensions(
  w: number,
  h: number,
  maxW: number,
  maxH: number
): { w: number; h: number } {
  if (w <= maxW && h <= maxH) return { w, h };
  const ratio = Math.min(maxW / w, maxH / h);
  return { w: Math.round(w * ratio), h: Math.round(h * ratio) };
}

/**
 * Draw an image or video frame onto an offscreen canvas and return a JPEG data
 * URL. Returns `null` if a 2D context is unavailable or the draw is blocked by
 * canvas security (cross-origin), letting callers fall back to a default cover.
 */
function drawToJpegDataUrl(
  source: CanvasImageSource,
  w: number,
  h: number,
  quality: number
): string | null {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(source, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch {
    // Cross-origin or canvas security issue — caller supplies a fallback.
    return null;
  }
}

/** Derive a human-friendly title from a file name (`my_cool-clip.mp4` → `My Cool Clip`). */
function titleFromFileName(fileName: string): string {
  const rawName = fileName.replace(/\.[^/.]+$/, '');
  return (
    rawName
      .split(/[-_]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Uploaded Content'
  );
}

/**
 * Inspect a user-uploaded media file and return the fields CreatorOS stores for
 * a post: a display `title`, a `thumbnailUrl`, a formatted `duration`, and an
 * object URL (`videoUrl`) pointing at the original file for preview/playback.
 */
export async function processMediaFile(file: File): Promise<{
  title: string;
  thumbnailUrl: string;
  duration: string;
  videoUrl?: string;
}> {
  const title = titleFromFileName(file.name);

  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);

  const fileUrl = URL.createObjectURL(file);

  if (isVideo) {
    try {
      const { duration, thumbnail } = await extractVideoMetadataAndThumbnail(fileUrl);
      return { title, thumbnailUrl: thumbnail, duration, videoUrl: fileUrl };
    } catch (err) {
      logger.warn('Could not extract video thumbnail via canvas, using default cover:', err);
      return { title, thumbnailUrl: VIDEO_FALLBACK_THUMB, duration: '00:45', videoUrl: fileUrl };
    }
  }

  if (isImage) {
    try {
      const compressedThumb = await compressImageToDataUrl(fileUrl);
      return { title, thumbnailUrl: compressedThumb, duration: '00:15', videoUrl: fileUrl };
    } catch {
      return { title, thumbnailUrl: FALLBACK_THUMB, duration: '00:15', videoUrl: fileUrl };
    }
  }

  return { title, thumbnailUrl: FALLBACK_THUMB, duration: '00:30', videoUrl: fileUrl };
}

/** Load an image, downscale it to a reasonable thumbnail size, and return a JPEG data URL. */
function compressImageToDataUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const { w, h } = computeFitDimensions(img.width || 640, img.height || 360, 640, 640);
      resolve(drawToJpegDataUrl(img, w, h, 0.75) ?? FALLBACK_THUMB);
    };
    img.onerror = () => resolve(FALLBACK_THUMB);
    img.src = imageUrl;
  });
}

/**
 * Read a video's duration and capture a thumbnail frame near its start.
 *
 * Resolves (never rejects) with a formatted duration and a thumbnail data URL,
 * guarded by a 1.2s timeout so the UI never hangs on a slow or unreadable file.
 */
function extractVideoMetadataAndThumbnail(
  videoUrl: string
): Promise<{ duration: string; thumbnail: string }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const defaultFallback = { duration: '00:45', thumbnail: FALLBACK_THUMB };

    let settled = false;
    const safeResolve = (res: { duration: string; thumbnail: string }) => {
      if (settled) return;
      settled = true;
      resolve(res);
    };

    // Ultra-fast 1.2s timeout fallback so the UI never lags or hangs.
    const timeout = setTimeout(() => safeResolve(defaultFallback), 1200);

    // Format seconds as MM:SS, defaulting to 30s when metadata is missing.
    const formatDuration = (): string => {
      const totalSec = Math.floor(video.duration) || 30;
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Capture the current frame once the video has seeked to it.
    const captureCurrentFrame = (duration: string) => {
      const { w, h } = computeFitDimensions(video.videoWidth || 640, video.videoHeight || 360, 640, 480);
      const dataUrl = drawToJpegDataUrl(video, w, h, 0.8);
      clearTimeout(timeout);
      safeResolve({ duration, thumbnail: dataUrl ?? FALLBACK_THUMB });
    };

    video.onloadedmetadata = () => {
      const formattedDuration = formatDuration();
      // Seek to 0.5s (or the midpoint of very short clips) to capture a frame.
      video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      video.onseeked = () => captureCurrentFrame(formattedDuration);
    };

    video.onerror = () => {
      clearTimeout(timeout);
      safeResolve(defaultFallback);
    };
  });
}
