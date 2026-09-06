/**
 * TrendsView: discover relevant trends, filterable by platform and category.
 * Selecting a trend opens the {@link TrendModal} for adaptation guidance.
 */
import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  Sparkles,
  ArrowUpRight,
  Flame,
  Zap,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from '../components/PlatformIcon';
import { PlatformType } from '../types';

export const TrendsView: React.FC = () => {
  const { trends, setSelectedTrend, navigateToAiWith } = useApp();
  const [activePlatformFilter, setActivePlatformFilter] = useState<'for_you' | PlatformType>('for_you');
  const [searchQuery, setSearchQuery] = useState('');

  const filterPills: { id: 'for_you' | PlatformType; label: string }[] = [
    { id: 'for_you', label: 'For You' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'facebook', label: 'Facebook' },
  ];

  const filteredTrends = trends.filter((trend) => {
    if (activePlatformFilter !== 'for_you' && trend.platform !== activePlatformFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTopic = trend.topic.toLowerCase().includes(q);
      const matchTag = trend.hashtag.toLowerCase().includes(q);
      const matchCat = trend.category.toLowerCase().includes(q);
      if (!matchTopic && !matchTag && !matchCat) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16 md:pb-6">
      {/* Header (matching Screen 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--accent-20)] text-[var(--accent)] border border-[var(--accent-30)]">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">Trend Intelligence</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              Real-time algorithm signals, virality breakdown & automated adaptation for Lean.
            </p>
          </div>
        </div>
      </div>

      {/* Search Trends input (matching Screen 5) */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search trends, hashtags, audio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-secondary)] shadow-sm"
        />
      </div>

      {/* Platform Filter Pills (matching Screen 5) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filterPills.map((pill) => {
          const isActive = activePlatformFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setActivePlatformFilter(pill.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-[0_4px_12px_var(--accent-30)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Trending Now List Section (matching Screen 5) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Trending Now</span>
          </h3>
          <span className="text-xs text-[var(--accent)] font-semibold">Updated 5m ago</span>
        </div>

        <div className="space-y-2.5">
          {filteredTrends.map((trend) => (
            <div
              key={trend.id}
              onClick={() => setSelectedTrend(trend)}
              className="creator-card-interactive p-4 sm:p-4.5 flex items-center justify-between gap-4 cursor-pointer group"
            >
              {/* Left Info with Platform Icon */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center text-white flex-shrink-0 group-hover:border-[var(--accent-40)] transition-colors">
                  <PlatformIcon platform={trend.platform} size={18} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">
                      {trend.topic}
                    </h4>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--accent-fans)] mt-0.5">{trend.hashtag}</p>
                </div>
              </div>

              {/* Sparkline & Growth badge (matching Screen 5) */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Visual Sparkline SVG */}
                <div className="hidden sm:block w-20 h-6">
                  <svg viewBox="0 0 80 24" className="w-full h-full stroke-[var(--accent)] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 2 20 Q 20 18, 30 12 T 50 10 T 78 4" />
                  </svg>
                </div>

                <div className="text-right">
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-[var(--positive-15)] text-[var(--accent-positive)] border border-[var(--positive-20)] inline-block">
                    {trend.growth}
                  </span>
                </div>

                <ArrowUpRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors hidden sm:block" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
