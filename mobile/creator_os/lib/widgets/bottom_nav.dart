import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// Bottom navigation bar with a floating "create post" action.
/// Mirrors `src/components/BottomNav.tsx`.
class AppBottomNav extends StatelessWidget {
  final VoidCallback onCreatePost;
  const AppBottomNav({super.key, required this.onCreatePost});

  static const _tabs = [
    (ViewTab.dashboard, Icons.dashboard_outlined, Icons.dashboard, 'Dashboard'),
    (ViewTab.analytics, Icons.bar_chart_outlined, Icons.bar_chart, 'Analytics'),
    (ViewTab.content, Icons.video_library_outlined, Icons.video_library, 'Content'),
    (ViewTab.calendar, Icons.calendar_today_outlined, Icons.calendar_today, 'Calendar'),
    (ViewTab.trends, Icons.trending_up_outlined, Icons.trending_up, 'Trends'),
  ];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surfaceAlt,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            for (int i = 0; i < 2; i++) _navItem(context, state, _tabs[i]),
            _createButton(),
            for (int i = 2; i < _tabs.length; i++) _navItem(context, state, _tabs[i]),
          ],
        ),
      ),
    );
  }

  Widget _navItem(BuildContext context, AppState state, (ViewTab, IconData, IconData, String) tab) {
    final (id, outlineIcon, filledIcon, label) = tab;
    final active = state.activeTab == id;
    return Expanded(
      child: InkWell(
        onTap: () => state.setActiveTab(id),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(active ? filledIcon : outlineIcon, size: 22, color: active ? AppColors.pink : AppColors.textSecondary),
              const SizedBox(height: 2),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  color: active ? AppColors.pink : AppColors.textSecondary,
                  fontWeight: active ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _createButton() {
    return Transform.translate(
      offset: const Offset(0, -14),
      child: GestureDetector(
        onTap: onCreatePost,
        child: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.pink,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.background, width: 4),
            boxShadow: [BoxShadow(color: AppColors.pink.withValues(alpha: 0.4), blurRadius: 16, spreadRadius: 1)],
          ),
          child: const Icon(Icons.add, color: Colors.white),
        ),
      ),
    );
  }
}
