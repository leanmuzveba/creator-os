/**
 * Month view for the Calendar: a 7-column day grid plus a queue of posts for
 * either the selected day or the whole month. Rendered by {@link CalendarView},
 * which owns all calendar state and passes the derived data in as props.
 */
import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, CalendarDays } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlatformIcon } from '../../components/PlatformIcon';
import { PostItem } from '../../types';
import { CalendarCell, DAYS_OF_WEEK, getPostDateString, parseLocalDate } from '../../utils/calendarUtils';

/** Status → dot color for the small per-day indicators inside a grid cell. */
function dotColorClass(post: PostItem, isSelected: boolean): string {
  if (isSelected) return 'bg-white';
  if (post.status === 'published') return 'bg-emerald-400';
  if (post.status === 'scheduled') return 'bg-pink-400';
  return 'bg-cyan-400';
}

/** Up-to-three status dots (plus a "+N" overflow) shown inside a day cell. */
const DayIndicatorDots: React.FC<{ posts: PostItem[]; isSelected: boolean }> = ({ posts, isSelected }) => (
  <div className="w-full flex items-center justify-center gap-1 mt-1 flex-wrap">
    {posts.slice(0, 3).map((p, pIdx) => (
      <span key={pIdx} title={`${p.title} (${p.status})`} className={`w-2 h-2 rounded-full ${dotColorClass(p, isSelected)}`} />
    ))}
    {posts.length > 3 && (
      <span className={`text-[9px] font-mono font-bold leading-none ${isSelected ? 'text-white' : 'text-slate-400'}`}>
        +{posts.length - 3}
      </span>
    )}
  </div>
);

/** Status → pill styling for a post row in the month queue. */
function statusPillClass(status: PostItem['status']): string {
  if (status === 'published') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  if (status === 'scheduled') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
  return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
}

interface MonthViewProps {
  monthName: string;
  currentMonthPosts: PostItem[];
  calendarCells: CalendarCell[];
  postsByDate: Map<string, PostItem[]>;
  selectedDateStr: string;
  todayStr: string;
  monthListMode: 'selected-day' | 'all-month';
  setMonthListMode: (mode: 'selected-day' | 'all-month') => void;
  selectedDayPosts: PostItem[];
  formattedSelectedDate: string;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDateStr: (s: string) => void;
  setJumpDateInput: (s: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  monthName,
  currentMonthPosts,
  calendarCells,
  postsByDate,
  selectedDateStr,
  todayStr,
  monthListMode,
  setMonthListMode,
  selectedDayPosts,
  formattedSelectedDate,
  setCurrentDate,
  setSelectedDateStr,
  setJumpDateInput,
}) => {
  const { openScheduleModalWithData, setPreviewPost } = useApp();

  const handleSelectCell = (cell: CalendarCell) => {
    setSelectedDateStr(cell.dateStr);
    setJumpDateInput(cell.dateStr);
    // If user clicks a day in next/prev month, move the focused month too.
    if (!cell.isCurrentMonth) {
      setCurrentDate(parseLocalDate(cell.dateStr));
    }
  };

  const listedPosts = monthListMode === 'selected-day' ? selectedDayPosts : currentMonthPosts;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Month Navigator Header */}
      <div className="flex items-center justify-between bg-[#131627] border border-white/10 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-purple-400" />
          <span className="text-sm sm:text-base font-extrabold text-white">{monthName}</span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            ({currentMonthPosts.length} scheduled / published)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            aria-label="Previous Month"
            className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDateStr(todayStr);
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
          >
            Current Month
          </button>
          <button
            onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            aria-label="Next Month"
            className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="creator-card p-4 sm:p-5 space-y-2">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 pb-2 border-b border-white/[0.06]">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell, idx) => {
            const dayPosts = postsByDate.get(cell.dateStr) || [];
            const isSelected = cell.dateStr === selectedDateStr;

            return (
              <button
                key={idx}
                onClick={() => handleSelectCell(cell)}
                className={`min-h-[52px] sm:min-h-[64px] p-1.5 rounded-2xl flex flex-col items-center justify-between relative transition-all group ${
                  !cell.isCurrentMonth
                    ? 'text-slate-600 bg-black/20 opacity-40 hover:opacity-80'
                    : isSelected
                    ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/40 ring-2 ring-purple-400 z-10'
                    : cell.isToday
                    ? 'bg-purple-950/30 text-purple-200 border-2 border-purple-500/50 hover:bg-purple-900/30'
                    : 'bg-[#0b0d17] hover:bg-white/5 text-slate-200 border border-white/[0.04]'
                }`}
              >
                <div className="w-full flex items-center justify-between px-1">
                  <span className={`text-xs sm:text-sm ${cell.isToday && !isSelected ? 'text-pink-400 font-black' : ''}`}>
                    {cell.day}
                  </span>
                  {cell.isToday && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />}
                </div>

                {dayPosts.length > 0 ? <DayIndicatorDots posts={dayPosts} isSelected={isSelected} /> : <div className="h-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Scheduled Posts Queue */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                {monthListMode === 'selected-day' ? formattedSelectedDate : `${monthName} Posts`}
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-[#131627] border border-white/10 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setMonthListMode('selected-day')}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  monthListMode === 'selected-day' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Day ({selectedDayPosts.length})
              </button>
              <button
                onClick={() => setMonthListMode('all-month')}
                className={`px-2 py-0.5 rounded font-semibold transition-all ${
                  monthListMode === 'all-month' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Month ({currentMonthPosts.length})
              </button>
            </div>
          </div>

          <button
            onClick={() => openScheduleModalWithData({ scheduledDate: selectedDateStr })}
            className="px-3.5 py-1.5 rounded-xl purple-glow-btn text-white text-xs font-bold flex items-center justify-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule for {formattedSelectedDate.split(',')[0]}</span>
          </button>
        </div>

        {listedPosts.length === 0 ? (
          <div className="creator-card p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-sm font-bold text-white">No content scheduled for this date</h4>
              <p className="text-xs text-slate-400 mt-1">
                {monthListMode === 'selected-day'
                  ? `You haven't scheduled any posts for ${formattedSelectedDate} yet.`
                  : `No posts scheduled or published in ${monthName}.`}
              </p>
            </div>
            <button
              onClick={() => openScheduleModalWithData({ scheduledDate: selectedDateStr })}
              className="px-4 py-2 rounded-xl purple-glow-btn text-white text-xs font-bold inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Scheduled Post</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {listedPosts.map((item) => {
              const postDate = getPostDateString(item);
              return (
                <div
                  key={item.id}
                  onClick={() => setPreviewPost(item)}
                  className="creator-card-interactive p-3.5 sm:p-4 flex items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white flex-shrink-0">
                        <PlatformIcon platform={item.platforms[0] || 'tiktok'} size={20} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-pink-300 transition-colors truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.scheduledTime || '10:00 AM'}</span>
                        </span>
                        {monthListMode === 'all-month' && postDate && (
                          <span className="font-mono text-purple-300 font-semibold">{postDate}</span>
                        )}
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300">{item.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 hidden sm:flex">
                      {item.platforms.map((p) => (
                        <PlatformIcon key={p} platform={p} size={15} />
                      ))}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusPillClass(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
