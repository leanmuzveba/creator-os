/**
 * Content Calendar container.
 *
 * Owns all calendar state (focused date, selected day, month/week toggle,
 * timezone) and the derived data (grid cells, week days, posts indexed by
 * date), then delegates rendering to {@link MonthView} and {@link WeekView}.
 * Keeping the heavy JSX in dedicated view components keeps this file focused
 * on state and date math.
 */
import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Globe, RotateCcw, Layers, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PostItem } from '../types';
import {
  CalendarCell,
  WeekDay,
  DAYS_OF_WEEK,
  formatLocalDate,
  parseLocalDate,
  getPostDateString,
} from '../utils/calendarUtils';
import { MonthView } from './calendar/MonthView';
import { WeekView } from './calendar/WeekView';

export const CalendarView: React.FC = () => {
  const { posts, showToast } = useApp();

  // Local timezone detection (best-effort; falls back gracefully).
  const [userTimezone, setUserTimezone] = useState<string>(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'America/Los_Angeles';
    }
  });

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => todayStr);
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [monthListMode, setMonthListMode] = useState<'selected-day' | 'all-month'>('selected-day');
  const [jumpDateInput, setJumpDateInput] = useState<string>(() => todayStr);

  const currentYear = currentDate.getFullYear();
  const currentMonthIndex = currentDate.getMonth();

  const monthName = useMemo(
    () => currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [currentDate]
  );

  // Sync focus to today and re-detect the user's current timezone.
  const handleSyncToday = () => {
    const now = new Date();
    try {
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTz) setUserTimezone(detectedTz);
    } catch {
      // Fall back to the existing timezone.
    }
    setCurrentDate(now);
    const todayFormatted = formatLocalDate(now);
    setSelectedDateStr(todayFormatted);
    setJumpDateInput(todayFormatted);
    showToast(`Synced calendar to today in ${userTimezone}`, 'info');
  };

  // Jump the calendar to a user-picked date.
  const handleSetCustomDate = (dateVal: string) => {
    if (!dateVal) return;
    const parsed = parseLocalDate(dateVal);
    if (isNaN(parsed.getTime())) return;
    setCurrentDate(parsed);
    setSelectedDateStr(dateVal);
    setJumpDateInput(dateVal);
  };

  // Seven days starting from Sunday of the focused week.
  const currentWeekDays = useMemo<WeekDay[]>(() => {
    const d = new Date(currentDate);
    const startOfWeek = new Date(d);
    startOfWeek.setDate(d.getDate() - d.getDay());

    const week: WeekDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dateStr = formatLocalDate(dayDate);
      week.push({
        date: dayDate,
        dateStr,
        dayNumber: dayDate.getDate(),
        dayName: DAYS_OF_WEEK[i],
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

  // Month grid cells, including leading/trailing days from adjacent months.
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const startingDayOfWeek = new Date(currentYear, currentMonthIndex, 1).getDay();
    const daysInCurrentMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonthIndex, 0).getDate();

    const makeCell = (day: number, monthOffset: number, isCurrentMonth: boolean): CalendarCell => {
      const dateStr = formatLocalDate(new Date(currentYear, currentMonthIndex + monthOffset, day));
      return { day, dateStr, isCurrentMonth, isToday: dateStr === todayStr, isSelected: dateStr === selectedDateStr };
    };

    const cells: CalendarCell[] = [];
    // Previous month trailing days.
    for (let i = startingDayOfWeek - 1; i >= 0; i--) cells.push(makeCell(daysInPrevMonth - i, -1, false));
    // Current month days.
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) cells.push(makeCell(dayNum, 0, true));
    // Next month leading days to complete the final week row.
    const remainingSlots = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remainingSlots; i++) cells.push(makeCell(i, 1, false));

    return cells;
  }, [currentYear, currentMonthIndex, todayStr, selectedDateStr]);

  // Index posts by their calendar date string.
  const postsByDate = useMemo(() => {
    const map = new Map<string, PostItem[]>();
    posts.forEach((post) => {
      const dateKey = getPostDateString(post);
      if (!dateKey) return;
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(post);
    });
    return map;
  }, [posts]);

  const selectedDayPosts = useMemo(() => postsByDate.get(selectedDateStr) || [], [postsByDate, selectedDateStr]);

  const currentMonthPosts = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonthIndex + 1).padStart(2, '0')}`;
    return posts.filter((p) => {
      const dateKey = getPostDateString(p);
      return dateKey && dateKey.startsWith(monthPrefix);
    });
  }, [posts, currentYear, currentMonthIndex]);

  const currentWeekPosts = useMemo(() => {
    const weekDateSet = new Set(currentWeekDays.map((d) => d.dateStr));
    return posts.filter((p) => {
      const dateKey = getPostDateString(p);
      return dateKey ? weekDateSet.has(dateKey) : false;
    });
  }, [posts, currentWeekDays]);

  const formattedSelectedDate = useMemo(
    () =>
      parseLocalDate(selectedDateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    [selectedDateStr]
  );

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

        {/* View switcher, date jump & timezone sync */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleSyncToday}
            title="Sync with current timezone date"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131627] hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
            <span>Today / Sync TZ</span>
          </button>

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

          <div className="flex items-center gap-1 bg-[#131627] border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewType === 'month' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Month</span>
            </button>
            <button
              onClick={() => setViewType('week')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                viewType === 'week' ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
          </div>
        </div>
      </div>

      {viewType === 'month' && (
        <MonthView
          monthName={monthName}
          currentMonthPosts={currentMonthPosts}
          calendarCells={calendarCells}
          postsByDate={postsByDate}
          selectedDateStr={selectedDateStr}
          todayStr={todayStr}
          monthListMode={monthListMode}
          setMonthListMode={setMonthListMode}
          selectedDayPosts={selectedDayPosts}
          formattedSelectedDate={formattedSelectedDate}
          setCurrentDate={setCurrentDate}
          setSelectedDateStr={setSelectedDateStr}
          setJumpDateInput={setJumpDateInput}
        />
      )}

      {viewType === 'week' && (
        <WeekView
          weekRangeLabel={weekRangeLabel}
          currentWeekDays={currentWeekDays}
          currentWeekPosts={currentWeekPosts}
          postsByDate={postsByDate}
          currentDate={currentDate}
          todayStr={todayStr}
          setCurrentDate={setCurrentDate}
          setSelectedDateStr={setSelectedDateStr}
        />
      )}
    </div>
  );
};
