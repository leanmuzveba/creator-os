import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Globe,
  RotateCcw,
  Sparkles,
  Layers,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlatformIcon } from '../components/PlatformIcon';
import { PostItem } from '../types';

// Helper: Format Date object to 'YYYY-MM-DD' in local timezone
function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Parse 'YYYY-MM-DD' to Date in local timezone
function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

// Helper: Get post's normalized date string 'YYYY-MM-DD'
function getPostDateString(post: PostItem): string | null {
  if (post.scheduledDate) {
    return post.scheduledDate.split('T')[0];
  }
  if (post.publishedDate) {
    return post.publishedDate.split('T')[0];
  }
  return null;
}

export const CalendarView: React.FC = () => {
  const { posts, openScheduleModalWithData, setPreviewPost, showToast } = useApp();

  // Local Timezone detection
  const [userTimezone, setUserTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'America/Los_Angeles';
    }
  });

  // Today's date string in local timezone
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // Currently focused date (defaults to today)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  
  // Selected day string 'YYYY-MM-DD' (defaults to today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => todayStr);

  // View toggle: 'month' or 'week'
  const [viewType, setViewType] = useState<'month' | 'week'>('month');

  // Month filter mode: 'selected-day' or 'all-month'
  const [monthListMode, setMonthListMode] = useState<'selected-day' | 'all-month'>('selected-day');

  // Quick date jump input state
  const [jumpDateInput, setJumpDateInput] = useState<string>(() => todayStr);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Current month & year derived from currentDate
  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Sync to today & user's current timezone
  const handleSyncToday = () => {
    const now = new Date();
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTz) setUserTimezone(detectedTz);
    } catch {
      // fallback
    }
    setCurrentDate(now);
    const todayFormatted = formatLocalDate(now);
    setSelectedDateStr(todayFormatted);
    setJumpDateInput(todayFormatted);
    showToast(`Synced calendar to today in ${userTimezone}`, 'info');
  };

  // Jump to custom date
  const handleSetCustomDate = (dateVal: string) => {
    if (!dateVal) return;
    const parsed = parseLocalDate(dateVal);
    if (isNaN(parsed.getTime())) return;
    setCurrentDate(parsed);
    setSelectedDateStr(dateVal);
    setJumpDateInput(dateVal);
  };

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Week calculation: 7 days starting from Sunday of currentDate's week
  const currentWeekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dateStr = formatLocalDate(dayDate);
      week.push({
        date: dayDate,
        dateStr,
        dayNumber: dayDate.getDate(),
        dayName: daysOfWeek[i],
        monthShort: dayDate.toLocaleDateString('en-US', { month: 'short' }),
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      });
    }
    return week;
  }, [currentDate, selectedDateStr, todayStr]);

  const weekRangeLabel = useMemo(() => {
    if (currentWeekDays.length === 0) return '';
    const first = currentWeekDays[0];
    const last = currentWeekDays[6];
    return `${first.monthShort} ${first.dayNumber} – ${last.monthShort} ${last.dayNumber}, ${last.date.getFullYear()}`;
  }, [currentWeekDays]);

  // Week navigation
  const handlePrevWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  // Month grid cells calculation
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonthIndex, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0-6
    const daysInCurrentMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonthIndex, 0).getDate();

    const cells: {
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Previous month trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(currentYear, currentMonthIndex - 1, dayNum);
      const dateStr = formatLocalDate(prevDate);
      cells.push({
        day: dayNum,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const curDate = new Date(currentYear, currentMonthIndex, dayNum);
      const dateStr = formatLocalDate(curDate);
      cells.push({
        day: dayNum,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      });
    }

    // Next month leading days to complete grid (multiples of 7, max 35 or 42)
    const remainingSlots = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextDate = new Date(currentYear, currentMonthIndex + 1, i);
      const dateStr = formatLocalDate(nextDate);
      cells.push({
        day: i,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      });
    }

    return cells;
  }, [currentYear, currentMonthIndex, todayStr, selectedDateStr]);

  // Index posts by date string 'YYYY-MM-DD'
  const postsByDate = useMemo(() => {
    const map = new Map<string, PostItem[]>();
    posts.forEach((post) => {
      const dateKey = getPostDateString(post);
      if (dateKey) {
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(post);
      }
    });
    return map;
  }, [posts]);

  // Posts scheduled for the currently selected day
  const selectedDayPosts = useMemo(() => {
    return postsByDate.get(selectedDateStr) || [];
  }, [postsByDate, selectedDateStr]);

  // Posts scheduled within the current month (YYYY-MM)
  const currentMonthPosts = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
    return posts.filter((p) => {
      const dateKey = getPostDateString(p);
      return dateKey && dateKey.startsWith(monthPrefix);
    });
  }, [posts, currentYear, currentMonthIndex]);

  // Posts scheduled within the current week
  const currentWeekPosts = useMemo(() => {
    const weekDateSet = new Set(currentWeekDays.map((d) => d.dateStr));
    return posts.filter((p) => {
      const dateKey = getPostDateString(p);
      return dateKey && weekDateSet.has(dateKey);
    });
  }, [posts, currentWeekDays]);

  // Formatted display date for selected day
  const formattedSelectedDate = useMemo(() => {
    const parsed = parseLocalDate(selectedDateStr);
    return parsed.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [selectedDateStr]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-16 md:pb-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Calendar</h1>
            <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#131627] border border-white/10 text-purple-300">
              <Globe className="w-3 h-3 text-purple-400" />
              <span>{userTimezone}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Schedule and view your content pipeline with timezone synchronization.
          </p>
        </div>

        {/* View Switcher, Date Jump & Timezone Sync */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Timezone Sync / Today Button */}
          <button
            onClick={handleSyncToday}
            title="Sync with current timezone date"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131627] hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
            <span>Today / Sync TZ</span>
          </button>

          {/* Quick Date Picker / Set Date */}
          <div className="flex items-center gap-1.5 bg-[#131627] border border-white/10 rounded-xl px-2.5 py-1">
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={jumpDateInput}
              onChange={(e) => {
                setJumpDateInput(e.target.value);
                handleSetCustomDate(e.target.value);
              }}
              className="bg-transparent text-xs text-white font-mono outline-none cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* Month / Week Toggle */}
          <div className="flex items-center gap-1 bg-[#131627] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewType === 'month'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewType === 'week'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MONTH VIEW                                                               */}
      {/* ========================================================================= */}
      {viewType === 'month' && (
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
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDateStr(todayStr);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
              >
                Current Month
              </button>
              <button
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Calendar Grid */}
          <div className="creator-card p-4 sm:p-5 space-y-2">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 pb-2 border-b border-white/[0.06]">
              {daysOfWeek.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Matrix */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                const dayPosts = postsByDate.get(cell.dateStr) || [];
                const hasPosts = dayPosts.length > 0;
                const isSelected = cell.dateStr === selectedDateStr;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDateStr(cell.dateStr);
                      setJumpDateInput(cell.dateStr);
                      // If user clicks a day in next/prev month, update currentDate
                      if (!cell.isCurrentMonth) {
                        setCurrentDate(parseLocalDate(cell.dateStr));
                      }
                    }}
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
                      {cell.isToday && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      )}
                    </div>

                    {/* Platform badges / indicator dots */}
                    {hasPosts && (
                      <div className="w-full flex items-center justify-center gap-1 mt-1 flex-wrap">
                        {dayPosts.slice(0, 3).map((p, pIdx) => {
                          const primaryPlatform = p.platforms[0] || 'tiktok';
                          return (
                            <span
                              key={pIdx}
                              title={`${p.title} (${p.status})`}
                              className={`w-2 h-2 rounded-full ${
                                isSelected
                                  ? 'bg-white'
                                  : p.status === 'published'
                                  ? 'bg-emerald-400'
                                  : p.status === 'scheduled'
                                  ? 'bg-pink-400'
                                  : 'bg-cyan-400'
                              }`}
                            />
                          );
                        })}
                        {dayPosts.length > 3 && (
                          <span className={`text-[9px] font-mono font-bold leading-none ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                            +{dayPosts.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {!hasPosts && <div className="h-2" />}
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

                {/* Sub-toggle: Selected Day vs All Month */}
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
                onClick={() =>
                  openScheduleModalWithData({
                    scheduledDate: selectedDateStr,
                  })
                }
                className="px-3.5 py-1.5 rounded-xl purple-glow-btn text-white text-xs font-bold flex items-center justify-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule for {formattedSelectedDate.split(',')[0]}</span>
              </button>
            </div>

            {/* List of posts for Month / Day */}
            {((monthListMode === 'selected-day' ? selectedDayPosts : currentMonthPosts).length === 0) ? (
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
                  onClick={() =>
                    openScheduleModalWithData({
                      scheduledDate: selectedDateStr,
                    })
                  }
                  className="px-4 py-2 rounded-xl purple-glow-btn text-white text-xs font-bold inline-flex items-center gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Scheduled Post</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(monthListMode === 'selected-day' ? selectedDayPosts : currentMonthPosts).map((item) => {
                  const statusColor =
                    item.status === 'published'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : item.status === 'scheduled'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/30';

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
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${statusColor}`}>
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
      )}

      {/* ========================================================================= */}
      {/* WEEK VIEW (Shows only what has been scheduled for the week)              */}
      {/* ========================================================================= */}
      {viewType === 'week' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Week Navigator */}
          <div className="flex items-center justify-between bg-[#131627] border border-white/10 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span className="text-sm sm:text-base font-extrabold text-white">{weekRangeLabel}</span>
              <span className="text-xs text-purple-300 font-mono hidden sm:inline">
                ({currentWeekPosts.length} scheduled this week)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevWeek}
                aria-label="Previous Week"
                className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDateStr(todayStr);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
              >
                This Week
              </button>
              <button
                onClick={handleNextWeek}
                aria-label="Next Week"
                className="p-1.5 rounded-xl bg-black/40 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Day Columns Planner */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {currentWeekDays.map((dayItem) => {
              const dayPosts = postsByDate.get(dayItem.dateStr) || [];
              const isToday = dayItem.isToday;
              const isSelected = dayItem.isSelected;

              return (
                <div
                  key={dayItem.dateStr}
                  className={`creator-card p-3 flex flex-col justify-between min-h-[220px] transition-all border ${
                    isSelected
                      ? 'border-purple-500/80 bg-purple-950/20 ring-1 ring-purple-500'
                      : isToday
                      ? 'border-pink-500/40 bg-pink-950/10'
                      : 'border-white/[0.06] bg-[#0c0f1d]'
                  }`}
                >
                  {/* Column Day Header */}
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                          {dayItem.dayName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-base font-extrabold ${
                              isToday ? 'text-pink-400 font-black' : isSelected ? 'text-purple-300' : 'text-white'
                            }`}
                          >
                            {dayItem.dayNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{dayItem.monthShort}</span>
                        </div>
                      </div>

                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Day Posts List */}
                    <div className="space-y-2 mt-2.5">
                      {dayPosts.length === 0 ? (
                        <div className="py-6 text-center">
                          <span className="text-[11px] text-slate-500 italic block">No schedule</span>
                        </div>
                      ) : (
                        dayPosts.map((post) => {
                          const statusBg =
                            post.status === 'published'
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : post.status === 'scheduled'
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-purple-500/15 border-purple-500/30 text-purple-300';

                          return (
                            <div
                              key={post.id}
                              onClick={() => setPreviewPost(post)}
                              className="p-2 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 cursor-pointer transition-all group space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1">
                                  {post.platforms.slice(0, 2).map((p) => (
                                    <PlatformIcon key={p} platform={p} size={12} />
                                  ))}
                                </div>
                                <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded border capitalize ${statusBg}`}>
                                  {post.status}
                                </span>
                              </div>

                              <h5 className="text-[11px] font-bold text-white line-clamp-2 leading-tight group-hover:text-pink-300 transition-colors">
                                {post.title}
                              </h5>

                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{post.scheduledTime || '10:00 AM'}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Inline quick schedule for this weekday */}
                  <button
                    onClick={() =>
                      openScheduleModalWithData({
                        scheduledDate: dayItem.dateStr,
                      })
                    }
                    className="mt-3 w-full py-1.5 rounded-lg bg-white/5 hover:bg-purple-600 hover:text-white text-slate-400 border border-white/5 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
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
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  {currentWeekPosts.length} Posts Active for {weekRangeLabel}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {currentWeekPosts.filter((p) => p.status === 'scheduled').length} scheduled •{' '}
                  {currentWeekPosts.filter((p) => p.status === 'published').length} published
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                openScheduleModalWithData({
                  scheduledDate: formatLocalDate(currentDate),
                })
              }
              className="px-4 py-2 rounded-xl purple-glow-btn text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Post for this Week</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
