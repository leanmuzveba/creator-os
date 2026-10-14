import 'package:flutter_test/flutter_test.dart';

import 'package:creator_os/services/update_checker.dart';

void main() {
  test('isNewerVersion compares numerically, part by part', () {
    expect(isNewerVersion('1.0.1', '1.0.0'), isTrue);
    expect(isNewerVersion('1.10.0', '1.9.9'), isTrue); // not a string compare
    expect(isNewerVersion('2.0', '1.9.9'), isTrue); // missing parts count as 0
    expect(isNewerVersion('1.0.0', '1.0.0'), isFalse);
    expect(isNewerVersion('1.0.0', '1.0.1'), isFalse);
  });
}
