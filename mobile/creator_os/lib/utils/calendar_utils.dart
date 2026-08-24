import '../models/models.dart';

/// Date helpers for the Calendar screen, mirroring `src/utils/calendarUtils.ts`.
/// All calendar math is done in local time using plain `YYYY-MM-DD` strings as
/// keys, so a post lands on the same visual day it was scheduled for.

/// Format a [DateTime] as `YYYY-MM-DD` in local time.
String formatLocalDate(DateTime d) {
  final y = d.year.toString().padLeft(4, '0');
  final m = d.month.toString().padLeft(2, '0');
  final day = d.day.toString().padLeft(2, '0');
  return '$y-$m-$day';
}

/// Parse a `YYYY-MM-DD` string into a local [DateTime] (falls back to now).
DateTime parseLocalDate(String dateStr) {
  if (dateStr.isEmpty) return DateTime.now();
  final parts = dateStr.split('T').first.split('-');
  if (parts.length < 3) return DateTime.now();
  final year = int.tryParse(parts[0]);
  final month = int.tryParse(parts[1]);
  final day = int.tryParse(parts[2]);
  if (year == null || month == null || day == null) return DateTime.now();
  return DateTime(year, month, day);
}

/// A post's normalized calendar date (`YYYY-MM-DD`), preferring scheduled over published.
String? getPostDateString(PostItem post) {
  if (post.scheduledDate != null && post.scheduledDate!.isNotEmpty) {
    return post.scheduledDate!.split('T').first;
  }
  if (post.publishedDate != null && post.publishedDate!.isNotEmpty) {
    return post.publishedDate!.split('T').first;
  }
  return null;
}

/// A single cell in the month grid (may belong to the previous/next month).
class CalendarCell {
  final int day;
  final String dateStr;
  final bool isCurrentMonth;
  final bool isToday;
  final bool isSelected;

  CalendarCell({
    required this.day,
    required this.dateStr,
    required this.isCurrentMonth,
    required this.isToday,
    required this.isSelected,
  });
}

/// Day-of-week column headers, Sunday-first.
const List<String> kDaysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const List<String> kMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/// Month grid cells for [year]/[monthIndex] (0-based), including
/// leading/trailing days from adjacent months to fill full weeks.
List<CalendarCell> buildMonthCells(int year, int monthIndex, {required String todayStr, required String selectedDateStr}) {
  final firstOfMonth = DateTime(year, monthIndex + 1, 1);
  final startingDayOfWeek = firstOfMonth.weekday % 7; // DateTime.weekday: Mon=1..Sun=7 -> Sun=0..Sat=6
  final daysInCurrentMonth = DateTime(year, monthIndex + 2, 0).day;
  final daysInPrevMonth = DateTime(year, monthIndex + 1, 0).day;

  CalendarCell makeCell(int day, int monthOffset, bool isCurrentMonth) {
    final d = DateTime(year, monthIndex + 1 + monthOffset, day);
    final dateStr = formatLocalDate(d);
    return CalendarCell(
      day: day,
      dateStr: dateStr,
      isCurrentMonth: isCurrentMonth,
      isToday: dateStr == todayStr,
      isSelected: dateStr == selectedDateStr,
    );
  }

  final cells = <CalendarCell>[];
  for (var i = startingDayOfWeek - 1; i >= 0; i--) {
    cells.add(makeCell(daysInPrevMonth - i, -1, false));
  }
  for (var day = 1; day <= daysInCurrentMonth; day++) {
    cells.add(makeCell(day, 0, true));
  }
  final remaining = (7 - (cells.length % 7)) % 7;
  for (var i = 1; i <= remaining; i++) {
    cells.add(makeCell(i, 1, false));
  }
  return cells;
}
