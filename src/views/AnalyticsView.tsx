import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Eye,
  Users,
  Heart,
  UserPlus,
  Calendar,
  ChevronDown,
  TrendingUp,
  Award,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from '../components/PlatformIcon';
import { PlatformType } from '../types';
import { formatMetric, calculateAggregatedOverview } from '../utils/metricUtils';

export const AnalyticsView: React.FC = () => {
  const { setPreviewPost, posts, socialAccounts } = useApp();
  const [dateRange, setDateRange] = useState('7d');
  const [activePlatforms, setActivePlatforms] = useState<PlatformType[]>(['tiktok', 'instagram', 'youtube', 'facebook']);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const fallbackOverview = calculateAggregatedOverview(socialAccounts, posts);

  useEffect(() => {
    fetch(`/api/analytics?range=${dateRange}`)
      .then((res) => res.json())
      .then((data) => setAnalyticsData(data))
      .catch((err) => console.error(err));
  }, [dateRange, socialAccounts]);

  const togglePlatform = (p: PlatformType) => {
    if (activePlatforms.includes(p)) {
      if (activePlatforms.length === 1) return;
      setActivePlatforms(activePlatforms.filter((item) => item !== p));
    } else {
      setActivePlatforms([...activePlatforms, p]);
    }
  };

  const topPost = posts[0] || null;
  const overview = analyticsData?.overview || fallbackOverview;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 md:pb-6">
      {/* Header (matching Screen 4) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Analytics</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-platform engagement, reach, subscriber growth, and pillar metrics.
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none px-4 py-2 pr-8 rounded-xl bg-[#131627] border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-pink-500 cursor-pointer shadow-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All Time</option>
          </select>
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Overview 2x2 Metric Cards (Compact matching Dashboard) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Views */}
          <div className="creator-card-interactive p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <span className="text-[8.5px] sm:text-[9px] font-semibold font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ↑ {overview.views?.growth || '16.8%'}
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <span className="text-[10px] text-slate-400 font-medium block">Views</span>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight mt-0.5">
                {overview.views?.value || '0'}
              </h3>
            </div>
          </div>

          {/* Reach */}
          <div className="creator-card-interactive p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Users className="w-3.5 h-3.5" />
              </div>
              <span className="text-[8.5px] sm:text-[9px] font-semibold font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ↑ {overview.reach?.growth || '12.3%'}
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <span className="text-[10px] text-slate-400 font-medium block">Reach</span>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight mt-0.5">
                {overview.reach?.value || '0'}
              </h3>
            </div>
          </div>

          {/* Engagement */}
          <div className="creator-card-interactive p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Heart className="w-3.5 h-3.5" />
              </div>
              <span className="text-[8.5px] sm:text-[9px] font-semibold font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ↑ {overview.engagement?.growth || '9.6%'}
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <span className="text-[10px] text-slate-400 font-medium block">Engagement</span>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight mt-0.5">
                {overview.engagement?.value || '0'}
              </h3>
            </div>
          </div>

          {/* New Followers */}
          <div className="creator-card-interactive p-3 sm:p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
              <span className="text-[8.5px] sm:text-[9px] font-semibold font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ↑ {overview.newFollowers?.growth || '10.1%'}
              </span>
            </div>
            <div className="mt-2.5 sm:mt-3">
              <span className="text-[10px] text-slate-400 font-medium block">New Followers</span>
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight mt-0.5">
                {overview.newFollowers?.value || '0'}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Section & Chart (matching Screen 4) */}
      <div className="creator-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">Performance</h3>
            <p className="text-[11px] text-slate-400">Filter platforms to inspect trends</p>
          </div>

          {/* Platform Toggle Pills (matching Screen 4) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['tiktok', 'instagram', 'youtube', 'facebook'] as PlatformType[]).map((p) => {
              const active = activePlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-pink-600/20 border-pink-500 text-white shadow-md'
                      : 'bg-[#0b0d17] border-white/10 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <PlatformIcon platform={p} size={15} />
                  <span className="capitalize hidden sm:inline">{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData?.viewSeries || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232742" vertical={false} />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#232742' }} />
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
              {activePlatforms.includes('tiktok') && (
                <Line type="monotone" dataKey="tiktok" name="TikTok" stroke="#a855f7" strokeWidth={3} dot={{ r: 3 }} />
              )}
              {activePlatforms.includes('instagram') && (
                <Line type="monotone" dataKey="instagram" name="Instagram" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 3 }} />
              )}
              {activePlatforms.includes('youtube') && (
                <Line type="monotone" dataKey="youtube" name="YouTube" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
              )}
              {activePlatforms.includes('facebook') && (
                <Line type="monotone" dataKey="facebook" name="Facebook" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Content Spotlight Card (matching Screen 4) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Performing Content</h3>
        {topPost && (
          <div
            onClick={() => setPreviewPost(topPost)}
            className="creator-card-interactive p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <img
                src={topPost.thumbnailUrl}
                alt={topPost.title}
                className="w-14 h-16 sm:w-16 sm:h-20 rounded-xl object-cover ring-2 ring-pink-500/40 flex-shrink-0 group-hover:scale-105 transition-transform"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                    <Award className="w-3 h-3 text-pink-400" />
                    <span>#1 Viral Video</span>
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">{topPost.category}</span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-white truncate mt-1 group-hover:text-pink-300 transition-colors">
                  {topPost.title}
                </h4>

                <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                  <span>May 15, 2025</span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <PlatformIcon platform="tiktok" size={12} />
                    <span>TikTok</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-base sm:text-lg font-black text-white block">
                {topPost.views ? formatMetric(topPost.views) : '128.4K'}
              </span>
              <span className="text-[11px] font-semibold text-emerald-400">↑ 24%</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Pillars Distribution */}
      <div className="creator-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-white">Performance by Content Pillar</h3>
        <div className="space-y-3">
          {analyticsData?.categoryBreakdown?.map((cat: any, i: number) => (
            <div key={i} className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">{cat.category}</span>
                <span className="font-mono text-pink-300 font-bold">{cat.views} ({cat.percentage}%)</span>
              </div>
              <div className="w-full h-2 bg-[#0b0d17] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color === '#8b5cf6' ? '#ec4899' : (cat.color || '#ec4899'),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

