/**
 * PostPreviewModal: full-screen preview of the currently selected post, styled
 * like a native social feed, with actions to edit, schedule, or publish.
 */
import React, { useState } from 'react';
import { X, Heart, MessageSquare, Bookmark, Share2, Music, Check, ArrowLeft, Send, Sparkles, MoreVertical, Edit, Calendar, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from './PlatformIcon';

export const PostPreviewModal: React.FC = () => {
  const { previewPost, setPreviewPost, publishPostNow, openScheduleModalWithData, showToast } = useApp();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(previewPost?.likes || 12400);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([
    { user: 'alex_dev', text: 'ChatPDF literally saved my dissertation last term!! 🙌', time: '2h ago' },
    { user: 'priya_codes', text: 'Where can we find the links? Is there a Notion list?', time: '4h ago' },
    { user: 'marcus_tech', text: 'Subscribed to your YouTube channel as well! Great breakdown', time: '6h ago' },
  ]);

  if (!previewPost) return null;

  const handleLikeToggle = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handleSaveToggle = () => {
    setIsSaved(!isSaved);
    showToast(isSaved ? 'Removed from saved' : 'Bookmarked to your library', 'info');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommentsList([{ user: 'lean.muzveba', text: commentText, time: 'Just now' }, ...commentsList]);
    setCommentText('');
    showToast('Comment posted', 'success');
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Reel link copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0b0d17] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top App Bar */}
        <div className="px-4 py-3 bg-[#131627] border-b border-white/[0.08] flex items-center justify-between z-10">
          <button
            onClick={() => setPreviewPost(null)}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-100">Post Preview</span>
            <div className="flex items-center gap-1">
              {previewPost.platforms.map((p) => (
                <PlatformIcon key={p} platform={p} size={12} className="text-slate-400" />
              ))}
              <span className="text-[10px] text-slate-400 capitalize">
                • {previewPost.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const p = previewPost;
                setPreviewPost(null);
                openScheduleModalWithData(p);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Edit Post"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewPost(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 9:16 Video Canvas Area */}
        <div className="relative flex-1 min-h-[440px] bg-slate-950 overflow-hidden flex items-center justify-center select-none">
          {previewPost.videoUrl ? (
            <video
              src={previewPost.videoUrl}
              poster={previewPost.thumbnailUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={previewPost.thumbnailUrl}
              alt={previewPost.title}
              className="w-full h-full object-cover scale-105 filter brightness-95"
            />
          )}

          {/* Gradients Overlay (only when not direct video playing controls) */}
          {!previewPost.videoUrl && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 pointer-events-none" />
          )}

          {/* Top category banner */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-lg">
              {previewPost.category}
            </span>
          </div>

          {/* Bold Center Video Hook Visual (matching screen 8) */}
          <div className="absolute top-1/3 left-6 right-16 z-10 pointer-events-none text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] uppercase tracking-tight bg-gradient-to-r from-white via-pink-100 to-pink-300 bg-clip-text text-transparent">
              {previewPost.title}
            </h2>
          </div>

          {/* Right Side Social Actions Column */}
          <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-4">
            {/* Creator Avatar with follow badge */}
            <div className="relative cursor-pointer group">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Lean"
                className="w-10 h-10 rounded-full border-2 border-white object-cover"
              />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-black">
                +
              </div>
            </div>

            {/* Like */}
            <button
              onClick={handleLikeToggle}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className={`p-2.5 rounded-full transition-transform active:scale-125 ${
                isLiked ? 'bg-pink-500/30 text-pink-500' : 'bg-black/40 backdrop-blur-md text-white hover:bg-black/60'
              }`}>
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-pink-500 stroke-pink-500' : 'stroke-white'}`} />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow">
                {(likeCount / 1000).toFixed(1)}K
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-transform active:scale-125">
                <MessageSquare className="w-6 h-6 stroke-white" />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow">
                {previewPost.comments || 384}
              </span>
            </button>

            {/* Bookmark */}
            <button
              onClick={handleSaveToggle}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className={`p-2.5 rounded-full transition-transform active:scale-125 ${
                isSaved ? 'bg-amber-500/30 text-amber-400' : 'bg-black/40 backdrop-blur-md text-white hover:bg-black/60'
              }`}>
                <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-amber-400 stroke-amber-400' : 'stroke-white'}`} />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow">
                {previewPost.bookmarks ? (previewPost.bookmarks / 1000).toFixed(1) + 'K' : '1.2K'}
              </span>
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-0.5 group"
            >
              <div className="p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-transform active:scale-125">
                <Share2 className="w-6 h-6 stroke-white" />
              </div>
              <span className="text-[11px] font-bold text-white drop-shadow">
                {previewPost.shares || 305}
              </span>
            </button>
          </div>

          {/* Bottom Left Meta & Caption Overlay */}
          <div className="absolute left-4 right-16 bottom-4 z-20 text-left">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold text-white drop-shadow">@lean.muzveba</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-pink-600 text-white">
                Creator
              </span>
            </div>
            
            <p className="text-xs text-slate-100 font-medium line-clamp-3 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {previewPost.caption || 'The best AI tools for students in 2025 #students #aitools #tech'}
            </p>

            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-300">
              <Music className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              <span className="truncate">Original sound — Lean in Tech</span>
            </div>
          </div>

          {/* Interactive Slide-up Comments Drawer */}
          {showComments && (
            <div className="absolute inset-x-0 bottom-0 top-1/3 bg-[#131627]/98 backdrop-blur-xl border-t border-white/15 p-4 z-30 flex flex-col animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <span className="text-xs font-bold text-white">Comments ({commentsList.length})</span>
                <button onClick={() => setShowComments(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 py-3">
                {commentsList.map((c, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pink-300">@{c.user}</span>
                      <span className="text-[10px] text-slate-500">{c.time}</span>
                    </div>
                    <p className="text-slate-200">{c.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a comment as @lean..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-[#0b0d17] border border-white/10 rounded-xl text-white focus:outline-none focus:border-pink-500"
                />
                <button type="submit" className="p-2 rounded-xl bg-pink-600 text-white hover:bg-pink-500">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Publish / Actions Bar */}
        <div className="p-3 bg-[#131627] border-t border-white/[0.08] flex items-center gap-2">
          {previewPost.status !== 'published' ? (
            <button
              onClick={() => publishPostNow(previewPost.id)}
              className="flex-1 pink-glow-btn py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-pink-300" />
              <span>Publish Now to All Connected</span>
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Check className="w-4 h-4" />
              <span>Live on {previewPost.platforms.map((p) => p.toUpperCase()).join(', ')}</span>
            </div>
          )}

          <button
            onClick={() => {
              const p = previewPost;
              setPreviewPost(null);
              openScheduleModalWithData(p);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-semibold text-slate-200 transition-colors"
          >
            Edit Post
          </button>
        </div>
      </div>
    </div>
  );
};
