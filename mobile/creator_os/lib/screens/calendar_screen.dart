import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/platform_icon.dart';

/// Scheduled/published content grouped by date. Mirrors `src/views/CalendarView.tsx`
/// as a list-based agenda (simpler than the web month-grid, better fit for a phone).
class CalendarScreen extends StatelessWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final dated = state.posts.where((p) => (p.scheduledDate ?? p.publishedDate) != null).toList()
      ..sort((a, b) => (b.scheduledDate ?? b.publishedDate ?? '').compareTo(a.scheduledDate ?? a.publishedDate ?? ''));

    final grouped = <String, List<PostItem>>{};
    for (final p in dated) {
      final key = p.scheduledDate ?? p.publishedDate ?? 'Undated';
      grouped.putIfAbsent(key, () => []).add(p);
    }

    return Column(
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text('Content Calendar', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
          ),
        ),
        Expanded(
          child: grouped.isEmpty
              ? const Center(child: Text('Nothing scheduled yet', style: TextStyle(color: AppColors.textSecondary)))
              : RefreshIndicator(
                  onRefresh: () => state.loadInitialData(),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                    children: grouped.entries.map((entry) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(entry.key, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.pink)),
                            const SizedBox(height: 8),
                            ...entry.value.map((p) => _agendaItem(context, p)),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
        ),
      ],
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
                Text(p.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                Text(p.scheduledTime ?? p.status, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
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
