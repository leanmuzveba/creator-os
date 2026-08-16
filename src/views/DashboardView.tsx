import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Plus,
  ArrowUpRight,
  ChevronDown,
  Eye,
  Users,
  MessageCircle,
  Share2,
  Clock,
  CheckCircle,
  Radio,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from '../components/PlatformIcon';
import { PostCard } from '../components/PostCard';
import { formatMetric, calculateTotalViews, parseMetric } from '../utils/metricUtils';

export const DashboardView: React.FC = () => {
  const { posts, socialAccounts, openScheduleModalWithData, setActiveTab, setPreviewPost } = useApp();
  const [dateRange, setDateRange] = useState('May 12 – May 18, 2025');
  const [chartRange, setChartRange] = useState('7d');
  const [chartData, setChartData] = useState<any[]>([]);

  const totalViews = calculateTotalViews(socialAccounts);

  useEffect(() => {
    fetch(`/api/analytics?range=${chartRange}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.viewSeries) {
          setChartData(data.viewSeries);
        }
      })
      .catch((err) => console.error(err));
  }, [chartRange, socialAccounts]);

  const recentPosts = posts.slice(0, 4);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 md:pb-6">
      {/* Welcome & Date Range Header (matching Screen 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, Lean!</span>
            <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Here's what's happening across your connected platforms.
          </p>
        </div>

        {/* Date Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none px-3.5 py-2 pr-8 rounded-xl bg-[#131627] border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer shadow-sm"
            >
              <option value="May 12 – May 18, 2025">May 12 – May 18, 2025</option>
              <option value="May 01 – May 15, 2025">May 01 – May 15, 2025</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Quarter">This Quarter</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={() => openScheduleModalWithData()}
            className="pink-glow-btn p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Post</span>
          </button>
        </div>
      </div>

      {/* 4 Platform Stat Cards (2x2 grid matching Screen 1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* TikTok Card */}
        {(() => {
          const tiktok = socialAccounts.find((a) => a.id === 'tiktok');
          return (
            <div className="creator-card-interactive p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-black border border-white/15 flex items-center justify-center text-white relative">
                    <PlatformIcon platform="tiktok" size={16} />
                    {tiktok?.connected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0d17]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">TikTok</span>
                    {tiktok?.connected && (
                      <span className="text-[9px] text-emerald-400 font-mono">Live</span>
                    )}
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                  ↑ {tiktok?.viewsGrowth || '18.6%'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{tiktok?.views || '124.8K'}</h3>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-slate-400 font-medium">Views</p>
                  <p className="text-[10px] text-pink-300 font-mono">{tiktok?.followers || '128.4K'} fans</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Instagram Card */}
        {(() => {
          const ig = socialAccounts.find((a) => a.id === 'instagram');
          return (
            <div className="creator-card-interactive p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af] flex items-center justify-center text-white relative">
                    <PlatformIcon platform="instagram" size={16} />
                    {ig?.connected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0d17]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Instagram</span>
                    {ig?.connected && (
                      <span className="text-[9px] text-emerald-400 font-mono">Live</span>
                    )}
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                  ↑ {ig?.viewsGrowth || '12.4%'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{ig?.views || '89.4K'}</h3>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-slate-400 font-medium">Reach</p>
                  <p className="text-[10px] text-pink-300 font-mono">{ig?.followers || '89.4K'} fans</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* YouTube Card */}
        {(() => {
          const yt = socialAccounts.find((a) => a.id === 'youtube');
          return (
            <div className="creator-card-interactive p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#ff0000] flex items-center justify-center text-white relative">
                    <PlatformIcon platform="youtube" size={16} />
                    {yt?.connected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0d17]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">YouTube</span>
                    {yt?.connected && (
                      <span className="text-[9px] text-emerald-400 font-mono">Live</span>
                    )}
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                  ↑ {yt?.viewsGrowth || '9.3%'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{yt?.views || '56.7K'}</h3>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-slate-400 font-medium">Views</p>
                  <p className="text-[10px] text-pink-300 font-mono">{yt?.followers || '56.7K'} subs</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Facebook Card */}
        {(() => {
          const fb = socialAccounts.find((a) => a.id === 'facebook');
          return (
            <div className="creator-card-interactive p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#1877f2] flex items-center justify-center text-white relative">
                    <PlatformIcon platform="facebook" size={16} />
                    {fb?.connected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0d17]" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Facebook</span>
                    {fb?.connected && (
                      <span className="text-[9px] text-emerald-400 font-mono">Live</span>
                    )}
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
                  ↑ {fb?.viewsGrowth || '6.8%'}
                </span>
              </div>

              <div className="mt-4">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">{fb?.views || '23.1K'}</h3>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-slate-400 font-medium">Reach</p>
                  <p className="text-[10px] text-pink-300 font-mono">{fb?.followers || '23.1K'} fans</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Views Overview Chart (matching Screen 1) */}
      <div className="creator-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-2 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm sm:text-base font-bold text-white">Views Overview</h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {formatMetric(totalViews)} Total Views
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ↑ 16.8%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Aggregated multi-platform performance trend synced in real time</p>
          </div>

          <div className="relative self-start sm:self-auto">
            <select
              value={chartRange}
              onChange={(e) => setChartRange(e.target.value)}
              className="appearance-none px-3 py-1.5 pr-7 rounded-xl bg-[#0b0d17] border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer"
            >
              <option value="7d">Last 7 days</option>
              <option value="14d">Last 14 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Multi-line Chart */}
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232742" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#232742' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatMetric(Number(val))}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#131627',
                  borderColor: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#f8fafc' }}
                formatter={(val: any) => [formatMetric(Number(val)), 'Views']}
              />
              <Line
                type="monotone"
                dataKey="tiktok"
                name="TikTok"
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ r: 3, fill: '#a855f7' }}
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="instagram"
                name="Instagram"
                stroke="#ec4899"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ec4899' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="youtube"
                name="YouTube"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#ef4444' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="facebook"
                name="Facebook"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#3b82f6' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Custom Legend Matching Screen 1 */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mt-3 pt-3 border-t border-white/[0.06] flex-wrap text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
            <span>TikTok</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899]" />
            <span>Instagram</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            <span>YouTube</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
            <span>Facebook</span>
          </div>
        </div>
      </div>

      {/* Quick AI & Trends Shortcuts Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* AI Assistant Quick Card */}
        <div
          onClick={() => setActiveTab('ai')}
          className="creator-card-interactive p-4 sm:p-5 cursor-pointer bg-gradient-to-r from-pink-950/40 to-[#131627] border-pink-500/30 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-pink-600/30 border border-pink-500/40 flex items-center justify-center text-pink-400 flex-shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white">AI Content Assistant</h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-bold">5 Pillars</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Generate high-retention hooks, scripts, shot lists & ideas tailored to Lean's brand.
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-pink-400 flex-shrink-0" />
        </div>

        {/* Trend Intelligence Quick Card */}
        <div
          onClick={() => setActiveTab('trends')}
          className="creator-card-interactive p-4 sm:p-5 cursor-pointer bg-gradient-to-r from-cyan-950/40 to-[#131627] border-cyan-500/30 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-white">Trend Intelligence</h4>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">+120% Spike</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Explore real-time viral algorithms and adapt rising tech formats in 1 click.
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-cyan-400 flex-shrink-0" />
        </div>
      </div>

      {/* Recent Posts Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-white">Recent Content</h3>
          <button
            onClick={() => setActiveTab('content')}
            className="text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors"
          >
            View All ({posts.length})
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {recentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
};
