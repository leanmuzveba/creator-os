/**
 * Week view for the Calendar: a 7-column planner showing only what has been
 * scheduled for the focused week, plus a week summary card. Rendered by
 * {@link CalendarView}, which owns all calendar state.
 */
import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, Layers, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PlatformIcon } from '../../components/PlatformIcon';
import { PostItem } from '../../types';
import { WeekDay, formatLocalDate } from '../../utils/calendarUtils';

/** Status → compact pill styling for a post card inside a weekday column. */
function weekStatusClass(status: PostItem['status']): string {
  if (status === 'published') return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
  if (status === 'scheduled') return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
  return 'bg-purple-500/15 border-purple-500/30 text-purple-300';
}

/** A single post card within a weekday column. */
const WeekPostCard: React.FC<{ post: PostItem; onClick: () => void }> = ({ post, onClick }) => (
  <div
    onClick={onClick}
    className="p-2 rounded-xl bg-black/40 hover:bg-[var(--overlay-hover)] border border-[var(--border-color)] cursor-pointer transition-all group space-y-1.5"
  >
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1">
        {post.platforms.slice(0, 2).map((p) => (
          <PlatformIcon key={p} platform={p} size={12} />
        ))}
      </div>
      <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border capitalize ${weekStatusClass(post.status)}`}>
        {post.status}
      </span>
    </div>

    <h5 className="text-[11px] font-bold text-[var(--text-primary)] line-clamp-2 leading-tight group-hover:text-[var(--accent)] transition-colors">
      {post.title}
    </h5>

    <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] font-mono">
      <Clock className="w-2.5 h-2.5" />
      <span>{post.scheduledTime || '10:00 AM'}</span>
    </div>
  </div>
);

interface WeekViewProps {
  weekRangeLabel: string;
  currentWeekDays: WeekDay[];
  currentWeekPosts: PostItem[];
  postsByDate: Map<string, PostItem[]>;
  currentDate: Date;
  todayStr: string;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setSelectedDateStr: (s: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekRangeLabel,
  currentWeekDays,
  currentWeekPosts,
  postsByDate,
  currentDate,
  todayStr,
  setCurrentDate,
  setSelectedDateStr,
}) => {
  const { openScheduleModalWithData, setPreviewPost } = useApp();

  const shiftWeek = (deltaDays: number) =>
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + deltaDays);
      return next;
    });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Week Navigator */}
      <div className="flex items-center justify-between bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm sm:text-base font-extrabold text-[var(--text-primary)]">{weekRangeLabel}</span>
          <span className="text-xs text-[var(--accent)] font-mono hidden sm:inline">
            ({currentWeekPosts.length} scheduled this week)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => shiftWeek(-7)}
            aria-label="Previous Week"
            className="p-1.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-hover)] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentDate(new Date());
              setSelectedDateStr(todayStr);
            }}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--overlay-hover)] hover:opacity-80 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
          >
            This Week
          </button>
          <button
            onClick={() => shiftWeek(7)}
            aria-label="Next Week"
            className="p-1.5 rounded-xl bg-black/40 border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--overlay-hover)] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-Day Columns Planner */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {currentWeekDays.map((dayItem) => {
          const dayPosts = postsByDate.get(dayItem.dateStr) || [];
          const { isToday, isSelected } = dayItem;

          return (
            <div
              key={dayItem.dateStr}
              className={`creator-card p-3 flex flex-col justify-between min-h-[220px] transition-all border ${
                isSelected
                  ? 'border-[var(--accent-40)] bg-[var(--accent-15)] ring-1 ring-[var(--accent-40)]'
                  : isToday
                  ? 'border-[var(--accent-40)] bg-[var(--accent-15)]'
                  : 'border-[var(--border-color)] bg-[var(--bg-page)]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                  <div>
                    <span className="text-[11px] font-bold text-[var(--text-secondary)] block uppercase tracking-wider">
                      {dayItem.dayName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-base font-extrabold ${
                          isToday ? 'text-[var(--accent)] font-black' : isSelected ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {dayItem.dayNumber}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">{dayItem.monthShort}</span>
                    </div>
                  </div>

                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--accent-20)] text-[var(--accent)] border border-[var(--accent-30)]">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-2 mt-2.5">
                  {dayPosts.length === 0 ? (
                    <div className="py-6 text-center">
                      <span className="text-[11px] text-[var(--text-secondary)] italic block">No schedule</span>
                    </div>
                  ) : (
                    dayPosts.map((post) => (
                      <WeekPostCard key={post.id} post={post} onClick={() => setPreviewPost(post)} />
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={() => openScheduleModalWithData({ scheduledDate: dayItem.dateStr })}
                className="mt-3 w-full py-1.5 rounded-lg bg-[var(--overlay-hover)] hover:bg-[var(--accent)] hover:text-[var(--accent-text)] text-[var(--text-secondary)] border border-[var(--border-color)] text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Schedule</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Week summary card */}
      <div className="creator-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--accent-20)] border border-[var(--accent-30)] flex items-center justify-center text-[var(--accent)]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[var(--text-primary)]">
              {currentWeekPosts.length} Posts Active for {weekRangeLabel}
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {currentWeekPosts.filter((p) => p.status === 'scheduled').length} scheduled •{' '}
              {currentWeekPosts.filter((p) => p.status === 'published').length} published
            </p>
          </div>
        </div>

        <button
          onClick={() => openScheduleModalWithData({ scheduledDate: formatLocalDate(currentDate) })}
          className="px-4 py-2 rounded-xl purple-glow-btn text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Post for this Week</span>
        </button>
      </div>
    </div>
  );
};
