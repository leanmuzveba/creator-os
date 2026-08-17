import React, { useState, useRef } from 'react';
import { Bell, Sparkles, Upload, Smartphone, Monitor, CheckCircle2, ChevronDown, Radio, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from './PlatformIcon';
import { processMediaFile } from '../utils/videoUtils';

export const Header: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    socialAccounts,
    setIsAccountsModalOpen,
    openScheduleModalWithData,
    addPost,
    showToast,
    isMobileDeviceView,
    setIsMobileDeviceView,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      // Process first file for immediate scheduling modal popup
      const firstFile = files[0];
      const processedFirst = await processMediaFile(firstFile);

      // If multiple files selected, save any subsequent ones to library
      if (files.length > 1) {
        for (let i = 1; i < files.length; i++) {
          const file = files[i];
          const processed = await processMediaFile(file);
          await addPost({
            title: processed.title,
            category: 'Tech Education',
            platforms: ['tiktok', 'instagram', 'youtube', 'facebook'],
            status: 'draft',
            caption: `${processed.title} #tech #coding #creatoros`,
            hashtags: ['#tech', '#developer', '#student', '#coding', '#creatoros'],
            thumbnailUrl: processed.thumbnailUrl,
            videoUrl: processed.videoUrl,
            duration: processed.duration,
          });
        }
      }

      // Open the multi-platform publish / schedule modal with the uploaded file
      openScheduleModalWithData({
        title: processedFirst.title,
        category: 'Tech Education',
        platforms: ['tiktok', 'instagram', 'youtube', 'facebook'],
        status: 'draft',
        caption: `${processedFirst.title} 🚀 Check out these key insights! #tech #creatoros #coding`,
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
      console.error('File upload error:', err);
      showToast('Error processing media file. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const notifications = [
    {
      id: 1,
      title: 'Post Performance Spike! 🚀',
      desc: '"AI Tools Every Student Should Know" hit 124.8K views on TikTok (+24% engagement).',
      time: '12m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Scheduled Post Ready',
      desc: 'GitHub Portfolio Guide is set for tomorrow at 10:00 AM on Instagram & YouTube.',
      time: '1h ago',
      unread: true,
    },
    {
      id: 3,
      title: 'New Rising Trend Detected ⚡',
      desc: '#AITools is accelerating +120% velocity among student creators.',
      time: '3h ago',
      unread: false,
    },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#0b0d17]/90 backdrop-blur-md border-b border-white/[0.08] px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500/20 via-purple-600/20 to-cyan-500/20 border border-pink-500/30 shadow-lg shadow-pink-500/10 group">
            <img src="/logo.svg" alt="CreatorOS Logo" className="w-8 h-8 object-contain transform group-hover:scale-110 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full" />
          </div>
          
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-pink-300 bg-clip-text text-transparent">
                Creator<span className="text-pink-400">OS</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Content Intelligence & Multi-Publishing
            </p>
          </div>
        </div>

        {/* Center Desktop Navigation Tabs (Hidden in pure mobile frame mode) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#131627] p-1 rounded-xl border border-white/[0.08]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'dashboard'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'content'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Content Library
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeTab === 'ai'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'analytics'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'trends'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'calendar'
                ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            Calendar
          </button>
        </nav>

        {/* Right Controls & Profile */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Viewport Frame Toggle (Mobile App View vs Desktop Mode) */}
          <button
            onClick={() => setIsMobileDeviceView(!isMobileDeviceView)}
            title={isMobileDeviceView ? "Switch to Wide Desktop View" : "Switch to Mobile Device Phone Preview"}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#131627] border border-white/[0.08] text-slate-300 hover:text-white hover:border-pink-500/40 transition-colors"
          >
            {isMobileDeviceView ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-pink-400" />
                <span>Wide Mode</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                <span>Phone View</span>
              </>
            )}
          </button>

          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="video/*,image/*"
            multiple
            className="hidden"
            id="navbar-video-upload-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            id="navbar-upload-btn"
            className="pink-glow-btn flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold text-white transition-all transform active:scale-95 disabled:opacity-75"
            title="Upload videos from your phone or device"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-pink-200" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl bg-[#131627] border border-white/[0.08] hover:border-pink-500/40 text-slate-300 hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full ring-2 ring-[#0b0d17]" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-[#131627] border border-white/[0.12] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 font-bold px-1.5 py-0.2 rounded-full">
                      2 new
                    </span>
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-pink-400 hover:text-pink-300"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl text-xs transition-colors ${
                        n.unread ? 'bg-pink-950/30 border border-pink-500/20' : 'bg-white/[0.02] border border-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Connected Platforms badge */}
          <button
            onClick={() => setIsAccountsModalOpen(true)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl bg-[#131627] border border-white/[0.08] hover:border-pink-500/40 transition-all group"
            title="Connected Accounts & Profile"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Lean"
                className="w-7 h-7 rounded-full object-cover ring-2 ring-pink-500/40"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-[#0b0d17]" />
            </div>
            <div className="text-left hidden xl:block">
              <p className="text-xs font-semibold text-white group-hover:text-pink-300 transition-colors">Lean</p>
              <p className="text-[10px] text-slate-400">4 Platforms</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
};
