/**
 * Date helpers and shared types for the Calendar view.
 *
 * All calendar math is done in the user's local timezone using plain
 * `YYYY-MM-DD` strings as keys, so a post always lands on the same visual day
 * it was scheduled for regardless of UTC offset.
 */
import { PostItem } from '../types';

/** Format a `Date` as `YYYY-MM-DD` in the local timezone. */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parse a `YYYY-MM-DD` string into a local-timezone `Date` (falls back to now). */
export function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length < 3) return new Date();
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/** Get a post's normalized calendar date (`YYYY-MM-DD`), preferring scheduled over published. */
export function getPostDateString(post: PostItem): string | null {
  if (post.scheduledDate) return post.scheduledDate.split('T')[0];
  if (post.publishedDate) return post.publishedDate.split('T')[0];
  return null;
}

/** A single cell in the month grid (may belong to the previous/next month). */
export interface CalendarCell {
  day: number;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

/** A single day column in the week planner. */
export interface WeekDay {
  date: Date;
  dateStr: string;
  dayNumber: number;
  dayName: string;
  monthShort: string;
  isToday: boolean;
  isSelected: boolean;
}

/** Day-of-week column headers, Sunday-first. */
export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
