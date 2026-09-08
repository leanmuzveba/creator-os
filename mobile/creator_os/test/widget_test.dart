// Basic smoke test: the app shell builds and shows the bottom nav tabs, and
// AuthGate's login/signup gate when REQUIRE_AUTH is on.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:creator_os/main.dart';
import 'package:creator_os/models/models.dart';
import 'package:creator_os/services/api_client.dart';
import 'package:creator_os/state/app_state.dart';

/// Advance past the animated splash screen (2.6s) plus AuthGate's async
/// config check and its rebuild into AppShell. Many small pumps, not one
/// big one: the splash's AnimationController only starts ticking on a frame
/// after the one it's built on (via `addPostFrameCallback`), so a single
/// large-duration pump can elapse before the controller is even running.
/// Not `pumpAndSettle()` either: some widget further down the tree
/// (unrelated to auth) schedules frames indefinitely and never lets it settle.
Future<void> _pumpPastSplashAndAuthCheck(WidgetTester tester) async {
  for (var i = 0; i < 12; i++) {
    await tester.pump(const Duration(milliseconds: 300));
  }
}

/// Stands in for the real backend: no network I/O, so the app has something
/// it can actually resolve instead of hanging on a real socket call the
/// test harness can't complete. `requireAuth`/`_loggedIn` mimic the
/// server's `REQUIRE_AUTH` flag and session state.
class _FakeApiClient extends ApiClient {
  _FakeApiClient({this.requireAuth = false});

  final bool requireAuth;
  bool _loggedIn = false;

  @override
  Future<bool> getRequireAuth() async => requireAuth;

  @override
  Future<Map<String, dynamic>?> getCurrentUser() async =>
      _loggedIn ? {'id': 'u1', 'email': 'creator@example.com', 'name': 'Creator'} : null;

  @override
  Future<Map<String, dynamic>> login(String email, String password) async {
    _loggedIn = true;
    return {'id': 'u1', 'email': email, 'name': 'Creator'};
  }

  @override
  Future<Map<String, dynamic>> signup(String email, String password, String name) async {
    _loggedIn = true;
    return {'id': 'u1', 'email': email, 'name': name};
  }

  @override
  Future<void> logout() async {
    _loggedIn = false;
  }

  @override
  Future<List<PostItem>> getPosts({String? status, String? category, String? platform}) async => [];

  @override
  Future<List<SocialAccount>> getAccounts() async => [];

  @override
  Future<List<TrendItem>> getTrends({String? platform}) async => [];
}

void main() {
  testWidgets('App shell renders with bottom nav when REQUIRE_AUTH is off', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(api: _FakeApiClient(requireAuth: false)),
        child: const CreatorOsApp(),
      ),
    );
    await _pumpPastSplashAndAuthCheck(tester);

    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('Content'), findsOneWidget);
  });

  testWidgets('Shows the login form when REQUIRE_AUTH is on, then the app shell after logging in',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(api: _FakeApiClient(requireAuth: true)),
        child: const CreatorOsApp(),
      ),
    );
    await _pumpPastSplashAndAuthCheck(tester);

    // Gated: the app shell must not be reachable pre-login.
    expect(find.text('Dashboard'), findsNothing);
    expect(find.text('Log In'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'creator@example.com');
    await tester.enterText(find.byType(TextField).at(1), 'hunter22');
    await tester.tap(find.text('Log In'));
    await tester.pump();
    await tester.pump();
    await tester.pump();

    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('Log In'), findsNothing);
  });
}
