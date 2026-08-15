import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from '../components/PlatformIcon';
import { PostItem } from '../types';

export const CalendarView: React.FC = () => {
  const { posts, openScheduleModalWithData, setPreviewPost } = useApp();
  const [currentMonth, setCurrentMonth] = useState('May 2025');
  const [selectedDay, setSelectedDay] = useState(15);
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  // Days of May 2025
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar cells for May 2025 (Starts Thursday May 1st -> 4 prev month days: Apr 27, 28, 29, 30)
  const calendarCells = [
    { day: 27, isCurrentMonth: false },
    { day: 28, isCurrentMonth: false },
    { day: 29, isCurrentMonth: false },
    { day: 30, isCurrentMonth: false },
    ...Array.from({ length: 31 }, (_, i) => ({ day: i + 1, isCurrentMonth: true })),
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false },
    { day: 4, isCurrentMonth: false },
    { day: 5, isCurrentMonth: false },
    { day: 6, isCurrentMonth: false },
    { day: 7, isCurrentMonth: false },
  ];

  // Dates with posts
  const postsOnDay = (day: number) => {
    return posts.filter((p) => {
      if (p.publishedDate) {
        const d = parseInt(p.publishedDate.split('-')[2], 10);
        return d === day;
      }
      if (p.scheduledDate) {
        const d = parseInt(p.scheduledDate.split('-')[2], 10);
        return d === day;
      }
      return false;
    });
  };

  const selectedDatePosts = [
    ...posts.filter((p) => {
      const d = p.publishedDate
        ? parseInt(p.publishedDate.split('-')[2], 10)
        : p.scheduledDate
        ? parseInt(p.scheduledDate.split('-')[2], 10)
        : 0;
      return d === selectedDay;
    }),
  ];

  // If no posts specifically on this date, show a default friendly view
  const displayPosts =
    selectedDatePosts.length > 0
      ? selectedDatePosts
      : [
          {
            id: 'sample-1',
            title: 'AI Tools Every Student Should Know',
            category: 'Free Tech Resources',
            platforms: ['tiktok'],
            status: 'published',
            scheduledTime: '10:00 AM',
            thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
            duration: '00:45',
            caption: 'These AI tools changed the way I study! 🚀',
            hashtags: ['#students', '#aitools'],
          },
          {
            id: 'sample-2',
            title: 'How I Got My First Tech Internship',
            category: 'Breaking Into Tech',
            platforms: ['youtube'],
            status: 'scheduled',
            scheduledTime: '2:00 PM',
            thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
            duration: '01:20',
            caption: 'No CS degree? Here is the exact roadmap!',
            hashtags: ['#internship', '#tech'],
          },
          {
            id: 'sample-3',
            title: 'Free Websites Every Developer Needs',
            category: 'Free Tech Resources',
            platforms: ['instagram'],
            status: 'draft',
            scheduledTime: '8:00 PM',
            thumbnailUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80',
            duration: '00:58',
            caption: 'Bookmark these 5 developer links!',
            hashtags: ['#webdev', '#code'],
          },
        ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16 md:pb-6">
      {/* Header (matching Screen 6) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Calendar</h1>
          <div className="flex items-center gap-1 bg-[#131627] border border-white/10 rounded-xl p-0.5">
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewType === 'month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                viewType === 'week' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Month Navigator (matching Screen 6) */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg bg-[#131627] border border-white/10 text-slate-300 hover:text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs sm:text-sm font-bold text-white font-mono">{currentMonth}</span>
          <button className="p-1.5 rounded-lg bg-[#131627] border border-white/10 text-slate-300 hover:text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Calendar Grid (matching Screen 6) */}
      <div className="creator-card p-4 sm:p-5 space-y-2">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 pb-2 border-b border-white/[0.06]">
          {daysOfWeek.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.slice(0, 35).map((cell, idx) => {
            const isSelected = cell.isCurrentMonth && cell.day === selectedDay;
            const hasPosts = cell.isCurrentMonth && [8, 9, 11, 12, 13, 15, 19, 20].includes(cell.day);

            return (
              <button
                key={idx}
                onClick={() => {
                  if (cell.isCurrentMonth) setSelectedDay(cell.day);
                }}
                disabled={!cell.isCurrentMonth}
                className={`h-11 sm:h-14 rounded-2xl flex flex-col items-center justify-center relative transition-all ${
                  !cell.isCurrentMonth
                    ? 'text-slate-600 opacity-40 cursor-default'
                    : isSelected
                    ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/40 ring-2 ring-purple-400'
                    : 'bg-[#0b0d17] hover:bg-white/5 text-slate-200 border border-white/[0.04]'
                }`}
              >
                <span className="text-xs sm:text-sm">{cell.day}</span>

                {/* Scheduled dots (matching Screen 6) */}
                {hasPosts && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Posts Queue (matching Screen 6) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm sm:text-base font-bold text-white">May {selectedDay}, 2025</h3>
          </div>

          <button
            onClick={() =>
              openScheduleModalWithData({
                scheduledDate: `2025-05-${selectedDay < 10 ? '0' + selectedDay : selectedDay}`,
              })
            }
            className="p-2 rounded-xl purple-glow-btn text-white text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Schedule</span>
          </button>
        </div>

        {/* Schedule list items */}
        <div className="space-y-2.5">
          {displayPosts.map((item: any, i: number) => {
            const statusColor =
              item.status === 'published'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : item.status === 'scheduled'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

            return (
              <div
                key={i}
                onClick={() => setPreviewPost(item)}
                className="creator-card-interactive p-3.5 sm:p-4 flex items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white flex-shrink-0">
                    <PlatformIcon platform={item.platforms[0] || 'tiktok'} size={17} />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{item.scheduledTime || '10:00 AM'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColor}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
