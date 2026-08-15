import React, { useState, useRef } from 'react';
import { Search, Filter, Plus, LayoutGrid, List, SlidersHorizontal, Sparkles, Upload, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostCard } from '../components/PostCard';
import { PostStatus, ContentCategory, PlatformType } from '../types';
import { processMediaFile } from '../utils/videoUtils';

export const ContentLibraryView: React.FC = () => {
  const { posts, openScheduleModalWithData, setActiveTab, addPost, showToast } = useApp();
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const libraryFileInputRef = useRef<HTMLInputElement>(null);

  const handleLibraryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    showToast(`Uploading ${files.length} video${files.length > 1 ? 's' : ''} to library...`, 'info');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const processed = await processMediaFile(file);

        await addPost({
          title: processed.title,
          category: 'Tech Education',
          platforms: ['tiktok', 'instagram', 'youtube', 'facebook'],
          status: 'draft',
          caption: `${processed.title} — Draft video ready for scheduling and optimization. #tech #creatoros`,
          hashtags: ['#tech', '#developer', '#student', '#coding', '#creatoros'],
          thumbnailUrl: processed.thumbnailUrl,
          videoUrl: processed.videoUrl,
          duration: processed.duration,
        });
      }

      showToast(
        files.length === 1
          ? `"${files[0].name}" added to Content Library!`
          : `${files.length} videos added to Content Library!`,
        'success'
      );
    } catch (err) {
      console.error('Upload error in library:', err);
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
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Content Library</h1>
          <p className="text-xs text-slate-400 mt-0.5">
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
                <Loader2 className="w-4 h-4 animate-spin text-pink-200" />
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
            className="px-3 py-2 rounded-xl bg-[#131627] text-slate-300 border border-white/10 hover:border-pink-500/40 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors hidden sm:flex"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            <span>AI Ideas</span>
          </button>
        </div>
      </div>

      {/* Search & Status Pill Filters (matching Screen 2) */}
      <div className="space-y-3">
        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title, topic, hashtag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#131627] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center bg-[#131627] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
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
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
            }`}
          >
            All ({posts.length})
          </button>

          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'draft'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
            }`}
          >
            Draft ({draftCount})
          </button>

          <button
            onClick={() => setStatusFilter('scheduled')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'scheduled'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
            }`}
          >
            Scheduled ({scheduledCount})
          </button>

          <button
            onClick={() => setStatusFilter('published')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'bg-[#131627] text-slate-400 hover:text-slate-200 border border-white/[0.08]'
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
          <div className="w-12 h-12 rounded-full bg-pink-600/20 text-pink-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No content found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors"
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
