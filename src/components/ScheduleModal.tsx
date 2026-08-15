import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Sparkles, Image as ImageIcon, Check, ArrowRight, Wand2, Hash, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformType, ContentCategory, PostItem } from '../types';
import { PlatformIcon } from './PlatformIcon';

export const ScheduleModal: React.FC = () => {
  const { isScheduleModalOpen, setIsScheduleModalOpen, scheduleModalInitialData, addPost, updatePost, showToast, socialAccounts } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ContentCategory>('Free Tech Resources');
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformType[]>(['tiktok', 'instagram']);
  const [scheduledDate, setScheduledDate] = useState('2025-05-20');
  const [scheduledTime, setScheduledTime] = useState('10:00 AM');
  const [caption, setCaption] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80');
  const [duration, setDuration] = useState('00:45');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);

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
    if (scheduleModalInitialData) {
      setTitle(scheduleModalInitialData.title || '');
      setCategory(scheduleModalInitialData.category || 'Free Tech Resources');
      setSelectedPlatforms(scheduleModalInitialData.platforms || ['tiktok', 'instagram']);
      setScheduledDate(scheduleModalInitialData.scheduledDate || '2025-05-20');
      setScheduledTime(scheduleModalInitialData.scheduledTime || '10:00 AM');
      setCaption(scheduleModalInitialData.caption || '');
      if (scheduleModalInitialData.thumbnailUrl) {
        setThumbnailUrl(scheduleModalInitialData.thumbnailUrl);
      }
      if (scheduleModalInitialData.duration) {
        setDuration(scheduleModalInitialData.duration);
      }
    } else {
      setTitle('New Creator Post');
      setCategory('Free Tech Resources');
      setSelectedPlatforms(['tiktok', 'instagram']);
      setScheduledDate('2025-05-20');
      setScheduledTime('10:00 AM');
      setCaption('These AI tools changed the way I study! 🚀 Save this for later!\n\n#students #aitools #tech');
    }
  }, [scheduleModalInitialData, isScheduleModalOpen]);

  if (!isScheduleModalOpen) return null;

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
      console.error(err);
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
      caption,
      hashtags: caption.match(/#[a-zA-Z0-9_]+/g) || ['#creatoros', '#tech'],
      thumbnailUrl,
      duration,
    };

    if (scheduleModalInitialData?.id) {
      await updatePost(scheduleModalInitialData.id, postPayload);
    } else {
      await addPost(postPayload);
    }

    setIsScheduleModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b0d17] border border-white/15 rounded-3xl overflow-hidden shadow-2xl my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-[#131627] border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-pink-400" />
            <h3 className="text-sm font-bold text-white">
              {scheduleModalInitialData?.id ? 'Edit & Reschedule Post' : 'Multi-Platform Scheduling'}
            </h3>
          </div>
          <button
            onClick={() => setIsScheduleModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Content Card preview (matching Screen 7) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Content Media</label>
            <div className="p-3 rounded-2xl bg-[#131627] border border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail"
                  className="w-12 h-14 rounded-xl object-cover ring-1 ring-pink-500/40 flex-shrink-0"
                />
                <div className="min-w-0">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter video title..."
                    className="w-full text-xs font-bold text-white bg-transparent border-b border-transparent hover:border-pink-500/40 focus:border-pink-500 focus:outline-none truncate"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {duration} • {category}
                  </p>
                </div>
              </div>

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
                className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 transition-colors flex-shrink-0"
              >
                Change
              </button>
            </div>
          </div>

          {/* Pillar Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Content Pillar (Lean's 5 Pillars)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ContentCategory)}
              className="w-full px-3 py-2 text-xs bg-[#131627] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
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
            <label className="text-xs font-bold text-slate-300">Target Platforms (Multi-Publish)</label>
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
                        ? 'bg-pink-600/20 border-pink-500 text-white shadow-lg shadow-pink-600/10'
                        : 'bg-[#131627] border-white/[0.08] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <PlatformIcon platform={plat} size={20} className={isSelected ? 'text-pink-400' : 'text-slate-400'} />
                    <span className="text-[10px] font-semibold capitalize">{plat}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time (matching Screen 7) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#131627] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Time</label>
              <input
                type="text"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="10:00 AM"
                className="w-full px-3 py-2 text-xs bg-[#131627] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* Caption & Hashtags Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Caption & Metadata</label>
              <button
                type="button"
                onClick={handleAiEnhanceCaption}
                disabled={isAiGenerating}
                className="flex items-center gap-1 text-[11px] font-semibold text-pink-400 hover:text-pink-300 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5 text-pink-400" />
                {isAiGenerating ? 'AI Generating...' : 'AI Enhance'}
              </button>
            </div>

            <textarea
              rows={4}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your high-converting caption with hashtags..."
              maxLength={2200}
              className="w-full p-3 text-xs bg-[#131627] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500 leading-relaxed"
            />

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-slate-500">Quick Tags:</span>
                {suggestedHashtags.slice(0, 5).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleAddHashtag(t)}
                    className="px-1.5 py-0.5 rounded bg-white/[0.04] hover:bg-pink-500/20 text-slate-300 hover:text-pink-300 transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <span className="font-mono">{caption.length}/2200</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-white/[0.08] flex items-center gap-3">
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
