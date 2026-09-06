/**
 * Content Library view: the central repository of ideas, drafts, scheduled
 * posts, and published content. Provides search, status/category/platform
 * filtering, grid/list layouts, and a multi-file media upload entry point.
 */
import React, { useState, useRef } from 'react';
import { Search, Filter, Plus, LayoutGrid, List, SlidersHorizontal, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { PostStatus, ContentCategory, PlatformType } from '../types';
import { processMediaFile } from '../utils/videoUtils';
import { logger } from '../utils/logger';

export const ContentLibraryView: React.FC = () => {
  const { posts, openScheduleModalWithData, setActiveTab, addPost, showToast } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  // Persist every file after the first as a draft. Extracted from
  // handleLibraryUpload to keep the upload flow shallow and readable.
  const saveExtraFilesToLibrary = async (files: FileList) => {
    for (let i = 1; i < files.length; i++) {
      const processed = await processMediaFile(files[i]);
      await addPost({
        title: processed.title,
        category: 'Tech Education',
        platforms: ['tiktok', 'instagram', 'youtube', 'facebook'],
        status: 'draft',
        caption: `${processed.title} #tech #creatoros`,
        hashtags: ['#tech', '#developer', '#student', '#coding', '#creatoros'],
        thumbnailUrl: processed.thumbnailUrl,
        videoUrl: processed.videoUrl,
        duration: processed.duration,
      });
    }
  };

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const processedFirst = await processMediaFile(files[0]);

      if (files.length > 1) {
        await saveExtraFilesToLibrary(files);
      }

      openScheduleModalWithData({
        title: processedFirst.title,
        category: 'Tech Education',
        platforms: ['tiktok', 'instagram', 'youtube', 'facebook'],
        status: 'draft',
        caption: `${processedFirst.title} 🚀 Check out these insights! #tech #creatoros #coding`,
        hashtags: ['#tech', '#developer', '#student', '#coding', '#creatoros'],
        thumbnailUrl: processedFirst.thumbnailUrl,
        videoUrl: processedFirst.videoUrl,
        duration: processedFirst.duration,
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '10:00 AM',
      });

      showToast(
        files.length === 1
          ? `"${processedFirst.title}" loaded! Set caption, platforms & schedule.`
          : `${files.length} videos uploaded! Configure your post.`,
        'success'
      );
    } catch (err) {
      logger.error('Upload error in library:', err);
      showToast('Error uploading video', 'error');
    } finally {
      setIsUploading(false);
      if (libraryFileInputRef.current) {
        libraryFileInputRef.current.value = '';
      }
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (statusFilter !== 'all' && post.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
    if (platformFilter !== 'all' && !post.platforms.includes(platformFilter as PlatformType)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchCaption = post.caption.toLowerCase().includes(q);
      const matchCategory = post.category.toLowerCase().includes(q);
      if (!matchTitle && !matchCaption && !matchCategory) return false;
    }
    return true;
  });

  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16 md:pb-6">
      {/* Header (matching Screen 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">Content Library</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Central repository for ideas, drafts, scheduled videos, and live posts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={libraryFileInputRef}
            onChange={handleLibraryUpload}
            accept="video/*,image/*"
            multiple
            className="hidden"
            id="library-video-upload-input"
          />

          <button
            onClick={() => libraryFileInputRef.current?.click()}
            disabled={isUploading}
            className="pink-glow-btn px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-75"
            title="Upload videos from your device"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-text)]" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Video</span>
              </>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className="px-3 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-40)] hover:text-[var(--text-primary)] text-xs font-semibold flex items-center gap-1.5 transition-colors hidden sm:flex"
          >
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <span>AI Ideas</span>
          </button>
        </div>
      </div>

      {/* Search & Status Pill Filters (matching Screen 2) */}
      <div className="space-y-3">
        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, topic, hashtag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)]"
            />
          </div>

          <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Filter Pills (matching Screen 2) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_4px_12px_var(--accent-30)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
          >
            All ({posts.length})
          </button>

          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'draft'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_4px_12px_var(--accent-30)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
          >
            Draft ({draftCount})
          </button>

          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'scheduled'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_4px_12px_var(--accent-30)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
          >
            Scheduled ({scheduledCount})
          </button>

          <button
            onClick={() => setStatusFilter('published')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_4px_12px_var(--accent-30)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}
          >
            Published ({publishedCount})
          </button>
        </div>
      </div>

      {/* Grid or List of Posts */}
      {filteredPosts.length > 0 ? (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4'
              : 'space-y-3'
          }
        >
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} layout={viewMode} />
          ))}
        </div>
      ) : (
        <div className="creator-card p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-20)] text-[var(--accent)] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[var(--text-primary)]">No content found</h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
            Try adjusting your search query or status filter, or create a new post using the AI Assistant.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => libraryFileInputRef.current?.click()}
              className="pink-glow-btn px-4 py-2 rounded-xl text-xs font-bold text-white inline-flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
            <button
              onClick={() => openScheduleModalWithData()}
              className="px-4 py-2 rounded-xl bg-[var(--overlay-hover)] hover:opacity-80 text-xs font-semibold text-[var(--text-primary)] inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
