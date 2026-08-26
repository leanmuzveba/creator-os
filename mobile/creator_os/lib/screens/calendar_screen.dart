import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/calendar_utils.dart';
import '../widgets/platform_icon.dart';

/// Scheduled/published content in a month grid, mirroring `src/views/CalendarView.tsx`
/// (`MonthView`). Tap a day to see its posts below the grid.
class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  late DateTime _currentDate;
  late String _selectedDateStr;
  late final String _todayStr;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _currentDate = now;
    _todayStr = formatLocalDate(now);
    _selectedDateStr = _todayStr;
  }

  void _changeMonth(int delta) {
    setState(() {
      _currentDate = DateTime(_currentDate.year, _currentDate.month + delta, 1);
    });
  }

  void _goToToday() {
    setState(() {
      _currentDate = DateTime.now();
      _selectedDateStr = _todayStr;
    });
  }

  void _selectDay(String dateStr) {
    setState(() => _selectedDateStr = dateStr);
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    final postsByDate = <String, List<PostItem>>{};
    for (final p in state.posts) {
      final key = getPostDateString(p);
      if (key == null) continue;
      postsByDate.putIfAbsent(key, () => []).add(p);
    }

    final cells = buildMonthCells(
      _currentDate.year,
      _currentDate.month - 1,
      todayStr: _todayStr,
      selectedDateStr: _selectedDateStr,
    );
    final monthLabel = '${kMonthNames[_currentDate.month - 1]} ${_currentDate.year}';
    final selectedDayPosts = postsByDate[_selectedDateStr] ?? const <PostItem>[];
    final selectedDate = parseLocalDate(_selectedDateStr);
    const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final formattedSelectedDate =
        '${weekdayNames[selectedDate.weekday - 1]}, ${kMonthNames[selectedDate.month - 1].substring(0, 3)} ${selectedDate.day}, ${selectedDate.year}';

    return RefreshIndicator(
      onRefresh: () => state.loadInitialData(),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          Text('Calendar', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          const SizedBox(height: 4),
          Text(
            'Schedule and view your content pipeline.',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),

          // Month header + nav
          Row(
            children: [
              IconButton(
                onPressed: () => _changeMonth(-1),
                icon: Icon(Icons.chevron_left, color: AppColors.textPrimary),
              ),
              Expanded(
                child: Text(
                  monthLabel,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
              ),
              IconButton(
                onPressed: () => _changeMonth(1),
                icon: Icon(Icons.chevron_right, color: AppColors.textPrimary),
              ),
            ],
          ),
          Center(
            child: TextButton.icon(
              onPressed: _goToToday,
              icon: Icon(Icons.replay, size: 14, color: AppColors.pink),
              label: Text('Today', style: TextStyle(color: AppColors.pink, fontWeight: FontWeight.w600, fontSize: 12)),
            ),
          ),
          const SizedBox(height: 8),

          // Day-of-week header
          Row(
            children: kDaysOfWeek
                .map((d) => Expanded(
                      child: Center(
                        child: Text(d, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 4),

          // Month grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: cells.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 0.85),
            itemBuilder: (context, i) {
              final cell = cells[i];
              final dayPosts = postsByDate[cell.dateStr] ?? const <PostItem>[];
              return _DayCell(
                cell: cell,
                postCount: dayPosts.length,
                onTap: () => _selectDay(cell.dateStr),
              );
            },
          ),

          const SizedBox(height: 20),

          // Selected day detail
          Row(
            children: [
              Expanded(
                child: Text(
                  formattedSelectedDate,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
              ),
              Text('${selectedDayPosts.length} post${selectedDayPosts.length == 1 ? '' : 's'}',
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            ],
          ),
          const SizedBox(height: 8),

          if (selectedDayPosts.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
              child: Center(child: Text('Nothing scheduled this day', style: TextStyle(color: AppColors.textSecondary, fontSize: 12))),
            )
          else
            ...selectedDayPosts.map((p) => _agendaItem(context, p)),
        ],
      ),
    );
  }

  Widget _agendaItem(BuildContext context, PostItem p) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
      child: Row(
        children: [
          Row(children: p.platforms.take(3).map((pl) => Padding(padding: const EdgeInsets.only(right: 4), child: PlatformIcon(platform: pl, size: 22))).toList()),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                Text(p.scheduledTime ?? p.status, style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
            decoration: BoxDecoration(color: AppColors.status(p.status).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
            child: Text(p.status, style: TextStyle(fontSize: 9, color: AppColors.status(p.status), fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

class _DayCell extends StatelessWidget {
  final CalendarCell cell;
  final int postCount;
  final VoidCallback onTap;

  const _DayCell({required this.cell, required this.postCount, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final Color bg;
    final Color fg;
    final Border? border;
    if (cell.isSelected) {
      bg = AppColors.pink;
      fg = Colors.white;
      border = null;
    } else if (cell.isToday) {
      bg = AppColors.pink.withValues(alpha: 0.12);
      fg = AppColors.pink;
      border = Border.all(color: AppColors.pink.withValues(alpha: 0.5));
    } else {
      bg = Colors.transparent;
      fg = cell.isCurrentMonth ? AppColors.textPrimary : AppColors.textSecondary.withValues(alpha: 0.4);
      border = null;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        margin: const EdgeInsets.all(2),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10), border: border),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('${cell.day}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fg)),
            const SizedBox(height: 2),
            if (postCount > 0)
              Container(
                width: 5,
                height: 5,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: cell.isSelected ? Colors.white : AppColors.purple,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
