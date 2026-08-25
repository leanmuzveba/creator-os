import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';

import 'models/models.dart';
import 'screens/ai_assistant_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/calendar_screen.dart';
import 'screens/content_library_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/splash_screen.dart';
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
      home: const _RootSwitcher(),
    );
  }
}

/// Shows the animated intro [SplashScreen] first, then swaps to [AppShell]
/// once it finishes — no named routes/Navigator needed for the handoff.
class _RootSwitcher extends StatefulWidget {
  const _RootSwitcher();

  @override
  State<_RootSwitcher> createState() => _RootSwitcherState();
}

class _RootSwitcherState extends State<_RootSwitcher> {
  bool _showSplash = true;

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return SplashScreen(onFinished: () => setState(() => _showSplash = false));
    }
    return const AppShell();
  }
}

/// Top-level shell: header, active tab body, bottom nav, and the global toast.
/// Mirrors `src/App.tsx`.
class AppShell extends StatelessWidget {
  const AppShell({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset('assets/branding/logo.svg', width: 28, height: 28),
            const SizedBox(width: 8),
            const Text.rich(
              TextSpan(
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, letterSpacing: -0.3),
                children: [
                  TextSpan(text: 'Creator', style: TextStyle(color: AppColors.textPrimary)),
                  TextSpan(text: 'OS', style: TextStyle(color: AppColors.pink)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Connected accounts',
            icon: const Icon(Icons.verified_user_outlined),
            onPressed: () => ConnectedAccountsSheet.show(context),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: GestureDetector(
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  const CircleAvatar(
                    radius: 15,
                    backgroundImage: NetworkImage(
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
                    ),
                  ),
                  Positioned(
                    right: -1,
                    bottom: -1,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: AppColors.emerald,
                        shape: BoxShape.circle,
                        border: Border.all(color: AppColors.background, width: 1.5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
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
