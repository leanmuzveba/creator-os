import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'models/models.dart';
import 'screens/ai_assistant_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/calendar_screen.dart';
import 'screens/content_library_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/trends_screen.dart';
import 'state/app_state.dart';
import 'theme/app_theme.dart';
import 'widgets/accounts/connected_accounts_sheet.dart';
import 'widgets/bottom_nav.dart';
import 'widgets/create_post_sheet.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState()..loadInitialData(),
      child: const CreatorOsApp(),
    ),
  );
}

class CreatorOsApp extends StatelessWidget {
  const CreatorOsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Creator OS',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      home: const AppShell(),
    );
  }
}

/// Top-level shell: header, active tab body, bottom nav, and the global toast.
/// Mirrors `src/App.tsx`.
class AppShell extends StatelessWidget {
  const AppShell({super.key});

  static const _titles = {
    ViewTab.dashboard: 'Creator OS',
    ViewTab.content: 'Content Library',
    ViewTab.ai: 'AI Assistant',
    ViewTab.analytics: 'Analytics',
    ViewTab.trends: 'Trends',
    ViewTab.calendar: 'Calendar',
  };

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[state.activeTab] ?? 'Creator OS'),
        actions: [
          IconButton(
            tooltip: 'Connected accounts',
            icon: const Icon(Icons.verified_user_outlined),
            onPressed: () => ConnectedAccountsSheet.show(context),
          ),
        ],
      ),
      body: Stack(
        children: [
          IndexedStack(
            index: ViewTab.values.indexOf(state.activeTab),
            children: const [
              DashboardScreen(),
              ContentLibraryScreen(),
              AiAssistantScreen(),
              AnalyticsScreen(),
              TrendsScreen(),
              CalendarScreen(),
            ],
          ),
          if (state.toast != null)
            Positioned(
              top: 12,
              left: 16,
              right: 16,
              child: _ToastBanner(toast: state.toast!),
            ),
        ],
      ),
      bottomNavigationBar: AppBottomNav(onCreatePost: () => CreatePostSheet.show(context)),
    );
  }
}

class _ToastBanner extends StatelessWidget {
  final ToastMessage toast;
  const _ToastBanner({required this.toast});

  Color get _color {
    switch (toast.type) {
      case 'error':
        return AppColors.red;
      case 'info':
        return AppColors.blue;
      default:
        return AppColors.emerald;
    }
  }

  IconData get _icon {
    switch (toast.type) {
      case 'error':
        return Icons.error_outline;
      case 'info':
        return Icons.info_outline;
      default:
        return Icons.check_circle_outline;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Material(
        color: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _color.withValues(alpha: 0.4)),
            boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 16, offset: Offset(0, 6))],
          ),
          child: Row(
            children: [
              Icon(_icon, color: _color, size: 18),
              const SizedBox(width: 10),
              Expanded(child: Text(toast.message, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13))),
            ],
          ),
        ),
      ),
    );
  }
}
