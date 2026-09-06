/**
 * ScheduleModal: compose/schedule flow for a post — set title, caption,
 * hashtags, category, target platforms, thumbnail/media, and a scheduled or
 * publish date/time. Pre-populates from any data passed when opened.
 */
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar as CalendarIcon, Clock, Sparkles, Image as ImageIcon, Check, ArrowRight, Wand2, Hash, Layers, Upload, Film } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformType, ContentCategory, PostItem } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { processMediaFile } from '../utils/videoUtils';
import { logger } from '../utils/logger';

export const ScheduleModal: React.FC = () => {
  const { isScheduleModalOpen, setIsScheduleModalOpen, scheduleModalInitialData, addPost, updatePost, showToast, socialAccounts, theme } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ContentCategory>('Free Tech Resources');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['tiktok', 'instagram', 'youtube', 'facebook']);
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [caption, setCaption] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80');
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [duration, setDuration] = useState('00:45');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [isReplacingMedia, setIsReplacingMedia] = useState(false);

  const modalFileInputRef = useRef<HTMLInputElement>(null);

  const categories: ContentCategory[] = [
    'Tech Education',
    'Breaking Into Tech',
    'Free Tech Resources',
    'Student & Academic Life',
    'Microsoft Journey',
  ];

  const suggestedHashtags = [
    '#students', '#aitools', '#tech', '#studytok', '#learntocode', '#webdev', '#microsoft', '#internships'
  ];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (scheduleModalInitialData) {
      setTitle(scheduleModalInitialData.title || '');
      setCategory(scheduleModalInitialData.category || 'Tech Education');
      setSelectedPlatforms(scheduleModalInitialData.platforms || ['tiktok', 'instagram', 'youtube', 'facebook']);
      setScheduledDate(scheduleModalInitialData.scheduledDate || today);
      setScheduledTime(scheduleModalInitialData.scheduledTime || '10:00 AM');
      setCaption(scheduleModalInitialData.caption || '');
      if (scheduleModalInitialData.thumbnailUrl) {
        setThumbnailUrl(scheduleModalInitialData.thumbnailUrl);
      }
      if (scheduleModalInitialData.videoUrl) {
        setVideoUrl(scheduleModalInitialData.videoUrl);
      } else {
        setVideoUrl(undefined);
      }
      if (scheduleModalInitialData.duration) {
        setDuration(scheduleModalInitialData.duration);
      }
    } else {
      setTitle('New Creator Post');
      setCategory('Free Tech Resources');
      setSelectedPlatforms(['tiktok', 'instagram', 'youtube', 'facebook']);
      setScheduledDate(today);
      setScheduledTime('10:00 AM');
      setCaption('These AI tools changed the way I study! 🚀 Save this for later!\n\n#students #aitools #tech');
      setVideoUrl(undefined);
    }
  }, [scheduleModalInitialData, isScheduleModalOpen]);

  if (!isScheduleModalOpen) return null;

  const handleModalMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReplacingMedia(true);
    try {
      const processed = await processMediaFile(file);
      setTitle(processed.title);
      setThumbnailUrl(processed.thumbnailUrl);
      setDuration(processed.duration);
      if (processed.videoUrl) {
        setVideoUrl(processed.videoUrl);
      }
      showToast('Media loaded into post creator!', 'info');
    } catch (err) {
      logger.error(err);
      showToast('Could not load media file', 'error');
    } finally {
      setIsReplacingMedia(false);
      if (modalFileInputRef.current) {
        modalFileInputRef.current.value = '';
      }
    }
  };

  const togglePlatform = (p: PlatformType) => {
    if (selectedPlatforms.includes(p)) {
      if (selectedPlatforms.length === 1) {
        showToast('At least one platform must be selected', 'info');
        return;
      }
      setSelectedPlatforms(selectedPlatforms.filter((item) => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const handleAddHashtag = (tag: string) => {
    if (!caption.includes(tag)) {
      setCaption((prev) => (prev ? `${prev} ${tag}` : tag));
    }
  };

  const handleAiEnhanceCaption = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scripts',
          prompt: title || caption || category,
          category,
          platform: selectedPlatforms[0] || 'tiktok',
        }),
      });
      if (!res.ok) {
        throw new Error(`AI generation error (${res.status})`);
      }
      const data = await res.json();
      if (data.result?.caption) {
        setCaption(data.result.caption);
        showToast('AI enhanced caption generated! ✨', 'success');
      }
    } catch (err) {
      logger.error(err);
      showToast('AI enhancement failed', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Please provide a title for the post', 'error');
      return;
    }

    const postPayload = {
      title,
      category,
      platforms: selectedPlatforms,
      status: publishImmediately ? ('published' as const) : ('scheduled' as const),
      scheduledDate: publishImmediately ? undefined : scheduledDate,
      scheduledTime: publishImmediately ? undefined : scheduledTime,
      publishedDate: publishImmediately ? new Date().toISOString() : undefined,
      caption,
      hashtags: caption.match(/#[a-zA-Z0-9_]+/g) || ['#creatoros', '#tech'],
      thumbnailUrl,
      videoUrl,
      duration,
    };

    if (scheduleModalInitialData?.id) {
      await updatePost(scheduleModalInitialData.id, postPayload);
      showToast(publishImmediately ? 'Post published successfully! 🚀' : 'Post scheduled successfully! 📅', 'success');
    } else {
      await addPost(postPayload);
      showToast(publishImmediately ? 'Post published to all platforms! 🚀' : 'Post scheduled successfully! 📅', 'success');
    }

    setIsScheduleModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[var(--bg-page)] border border-[var(--border-color-strong)] rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {scheduleModalInitialData?.id ? 'Edit & Reschedule Post' : 'Multi-Platform Publishing'}
            </h3>
          </div>
          <button
            onClick={() => setIsScheduleModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-[var(--overlay-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Content Card preview (matching Screen 7) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Content Media</label>
            <div className="p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-14 rounded-xl overflow-hidden ring-1 ring-[var(--accent-40)] flex-shrink-0 bg-black">
                  <img
                    src={thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                  {videoUrl && (
                    <span className="absolute bottom-0.5 right-0.5 p-0.5 bg-[var(--accent)] rounded text-white text-[8px] font-bold">
                      <Film className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title..."
                    className="w-full text-xs font-bold text-[var(--text-primary)] bg-transparent border-b border-transparent hover:border-[var(--accent-40)] focus:border-[var(--accent)] focus:outline-none truncate"
                  />
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {duration} • {category}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="file"
                  ref={modalFileInputRef}
                  onChange={handleModalMediaUpload}
                  accept="video/*,image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => modalFileInputRef.current?.click()}
                  disabled={isReplacingMedia}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--accent-20)] hover:bg-[var(--accent-30)] text-[var(--accent)] border border-[var(--accent-30)] text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Upload from device or gallery"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isReplacingMedia ? 'Loading...' : 'Upload'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sampleImages = [
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=600&auto=format&fit=crop&q=80'
                    ];
                    const nextImg = sampleImages[(sampleImages.indexOf(thumbnailUrl) + 1) % sampleImages.length];
                    setThumbnailUrl(nextImg);
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[var(--overlay-hover)] hover:opacity-80 text-xs font-semibold text-[var(--text-secondary)] transition-colors"
                  title="Cycle sample thumbnails"
                >
                  Cover
                </button>
              </div>
            </div>
          </div>

          {/* Pillar Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Content Pillar (Lean's 5 Pillars)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ContentCategory)}
              className="w-full px-3 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Platforms Selector (matching Screen 7) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Target Platforms (Multi-Publish)</label>
            <div className="grid grid-cols-4 gap-2">
              {(['tiktok', 'instagram', 'youtube', 'facebook'] as PlatformType[]).map((plat) => {
                const isSelected = selectedPlatforms.includes(plat);
                return (
                  <button
                    key={plat}
                    type="button"
                    onClick={() => togglePlatform(plat)}
                    className={`py-2.5 px-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[var(--accent-20)] border-[var(--accent)] text-[var(--text-primary)] shadow-lg shadow-[var(--accent-10)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--border-color-strong)]'
                    }`}
                  >
                    <PlatformIcon platform={plat} size={20} className={isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'} />
                    <span className="text-[10px] font-semibold capitalize">{plat}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time (matching Screen 7) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                style={{ colorScheme: theme }}
                className="w-full px-3 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Time</label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Caption & Hashtags Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Caption & Metadata</label>
              <button
                type="button"
                onClick={handleAiEnhanceCaption}
                disabled={isAiGenerating}
                className="flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:opacity-80 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5 text-[var(--accent)]" />
                {isAiGenerating ? 'AI Generating...' : 'AI Enhance'}
              </button>
            </div>

            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your high-converting caption with hashtags..."
              maxLength={2200}
              className="w-full p-3 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
            />

            <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)]">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[var(--text-secondary)]">Quick Tags:</span>
                {suggestedHashtags.slice(0, 5).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddHashtag(t)}
                    className="px-1.5 py-0.5 rounded bg-[var(--overlay-hover)] hover:bg-[var(--accent-20)] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="font-mono">{caption.length}/2200</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[var(--border-color)] flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPublishImmediately(true);
                setTimeout(() => {
                  const form = document.querySelector('form');
                  if (form) form.requestSubmit();
                }, 50);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-bold transition-colors"
            >
              Publish Now
            </button>

            <button
              type="submit"
              onClick={() => setPublishImmediately(false)}
              className="flex-1 pink-glow-btn py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <span>Schedule Post for {selectedPlatforms.length} Platforms</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
