// Basic smoke test: the app shell builds and shows the bottom nav tabs.
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:creator_os/main.dart';
import 'package:creator_os/state/app_state.dart';

void main() {
  testWidgets('App shell renders with bottom nav', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(),
        child: const CreatorOsApp(),
      ),
    );
    await tester.pump();

    expect(find.text('Dashboard'), findsOneWidget);
    expect(find.text('Content'), findsOneWidget);
  });
}
