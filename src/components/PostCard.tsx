import React from 'react';
import { Eye, Clock, Play, MoreVertical, Edit, Trash2, CalendarCheck, Share2 } from 'lucide-react';
import { PostItem } from '../types';
import { PlatformIcon } from './PlatformIcon';
import { useApp } from '../context/AppContext';

interface PostCardProps {
  post: PostItem;
  layout?: 'grid' | 'list';
}

export const PostCard: React.FC<PostCardProps> = ({ post, layout = 'grid' }) => {
  const { setPreviewPost, openScheduleModalWithData, deletePost, publishPostNow } = useApp();

  const getStatusBadge = () => {
    switch (post.status) {
      case 'published':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Published
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Scheduled
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30">
            Draft
          </span>
        );
    }
  };

  const getPrimaryPlatform = () => post.platforms[0] || 'tiktok';

  const formattedDate = post.publishedDate
    ? new Date(post.publishedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : post.scheduledDate
    ? `Scheduled ${new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : 'Draft';

  if (layout === 'list') {
    return (
      <div className="creator-card p-3 sm:p-4 flex items-center justify-between gap-4 hover:border-pink-500/40 transition-all group">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            onClick={() => setPreviewPost(post)}
            className="relative w-14 h-16 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 cursor-pointer group-hover:ring-2 ring-pink-500/50 transition-all"
          >
            <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            {post.duration && (
              <span className="absolute bottom-1 right-1 px-1 py-0.5 text-[9px] font-mono bg-black/70 text-white rounded">
                {post.duration}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {getStatusBadge()}
              <span className="text-[11px] text-slate-400">{post.category}</span>
            </div>
            <h4
              onClick={() => setPreviewPost(post)}
              className="text-sm font-semibold text-slate-100 truncate cursor-pointer hover:text-pink-300 transition-colors"
            >
              {post.title}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
              <span>{formattedDate}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                {post.platforms.map((p) => (
                  <PlatformIcon key={p} platform={p} size={13} className="text-slate-300" />
                ))}
              </div>
              {post.views && (
                <>
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">{post.views.toLocaleString()} views</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {post.status !== 'published' && (
            <button
              onClick={() => publishPostNow(post.id)}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-all hidden sm:block"
            >
              Publish Now
            </button>
          )}
          <button
            onClick={() => openScheduleModalWithData(post)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Edit / Schedule"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => deletePost(post.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-card overflow-hidden flex flex-col group hover:border-pink-500/40 transition-all">
      {/* Thumbnail Area */}
      <div
        onClick={() => setPreviewPost(post)}
        className="relative aspect-square w-full bg-slate-900 cursor-pointer overflow-hidden"
      >
        <img
          src={post.thumbnailUrl}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#131627] via-transparent to-black/30" />

        {/* Top Status & Platform Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div>{getStatusBadge()}</div>
          <div className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center gap-1">
            <PlatformIcon platform={getPrimaryPlatform()} size={14} />
          </div>
        </div>

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-pink-600/90 text-white flex items-center justify-center shadow-lg shadow-pink-600/50 transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Bottom Duration / Platform pills */}
        {post.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-mono font-medium bg-black/70 backdrop-blur-sm text-slate-200 rounded-md border border-white/10">
            {post.duration}
          </span>
        )}
      </div>

      {/* Content Meta */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-pink-400 mb-1">
            {post.category}
          </p>
          <h4
            onClick={() => setPreviewPost(post)}
            className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 cursor-pointer hover:text-pink-300 transition-colors"
          >
            {post.title}
          </h4>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => openScheduleModalWithData(post)}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
              title="Edit Post"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPreviewPost(post)}
              className="p-1 rounded text-slate-400 hover:text-pink-400 transition-colors"
              title="Preview Reel"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
