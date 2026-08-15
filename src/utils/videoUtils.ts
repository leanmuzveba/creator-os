export async function processMediaFile(file: File): Promise<{
  title: string;
  thumbnailUrl: string;
  duration: string;
  videoUrl?: string;
}> {
  const rawName = file.name.replace(/\.[^/.]+$/, '');
  const title = rawName
    .split(/[-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ') || 'Uploaded Content';

  const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|avi|mkv)$/i.test(file.name);
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);

  const fileUrl = URL.createObjectURL(file);

  if (isVideo) {
    try {
      const { duration, thumbnail } = await extractVideoMetadataAndThumbnail(fileUrl);
      return {
        title,
        thumbnailUrl: thumbnail,
        duration,
        videoUrl: fileUrl,
      };
    } catch (err) {
      console.warn('Could not extract video thumbnail via canvas, using default cover:', err);
      return {
        title,
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
        duration: '00:45',
        videoUrl: fileUrl,
      };
    }
  }

  if (isImage) {
    try {
      const compressedThumb = await compressImageToDataUrl(fileUrl);
      return {
        title,
        thumbnailUrl: compressedThumb,
        duration: '00:15',
        videoUrl: fileUrl,
      };
    } catch {
      return {
        title,
        thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        duration: '00:15',
        videoUrl: fileUrl,
      };
    }
  }

  return {
    title,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    duration: '00:30',
    videoUrl: fileUrl,
  };
}

function compressImageToDataUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const MAX_W = 640;
      const MAX_H = 640;
      let w = img.width || 640;
      let h = img.height || 360;

      if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
        return;
      }
      resolve('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80');
    };
    img.onerror = () => {
      resolve('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80');
    };
    img.src = imageUrl;
  });
}

function extractVideoMetadataAndThumbnail(videoUrl: string): Promise<{ duration: string; thumbnail: string }> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    const defaultFallback = {
      duration: '00:45',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    };

    const timeout = setTimeout(() => {
      resolve(defaultFallback);
    }, 4000);

    video.onloadedmetadata = () => {
      const totalSec = Math.floor(video.duration) || 30;
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const formattedDuration = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

      // Seek to 1s or middle to capture thumbnail
      video.currentTime = Math.min(1.0, video.duration / 2);

      video.onseeked = () => {
        try {
          const MAX_W = 640;
          const MAX_H = 480;
          let w = video.videoWidth || 640;
          let h = video.videoHeight || 360;

          if (w > MAX_W || h > MAX_H) {
            const ratio = Math.min(MAX_W / w, MAX_H / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            clearTimeout(timeout);
            resolve({ duration: formattedDuration, thumbnail: dataUrl });
            return;
          }
        } catch (e) {
          // Cross-origin or canvas security issue
        }
        clearTimeout(timeout);
        resolve({
          duration: formattedDuration,
          thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        });
      };
    };

    video.onerror = () => {
      clearTimeout(timeout);
      resolve(defaultFallback);
    };
  });
}
