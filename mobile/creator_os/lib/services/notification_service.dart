import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Thin wrapper around `flutter_local_notifications` so the Notifications
/// toggle in Profile Settings drives real OS notifications (status bar +
/// lock screen), not just a stored preference. Only Android/iOS have a
/// platform implementation for this plugin, so every call is guarded —
/// desktop/web builds (used for local UI iteration) just no-op instead of
/// crashing on a MissingPluginException.
class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;
    try {
      const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosInit = DarwinInitializationSettings();
      await _plugin.initialize(const InitializationSettings(android: androidInit, iOS: iosInit));
      _initialized = true;
    } catch (e) {
      debugPrint('Notifications unsupported on this platform: $e');
    }
  }

  /// Requests the OS-level notification permission (Android 13+ / iOS).
  /// Returns whether the user granted it.
  Future<bool> requestPermission() async {
    if (!_initialized) return false;
    try {
      final androidImpl = _plugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (androidImpl != null) {
        return await androidImpl.requestNotificationsPermission() ?? false;
      }
      final iosImpl = _plugin.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
      if (iosImpl != null) {
        return await iosImpl.requestPermissions(alert: true, badge: true, sound: true) ?? false;
      }
      return true;
    } catch (e) {
      debugPrint('Could not request notification permission: $e');
      return false;
    }
  }

  Future<void> showConfirmation() async {
    if (!_initialized) return;
    try {
      const details = NotificationDetails(
        android: AndroidNotificationDetails(
          'creator_os_general',
          'Creator OS',
          channelDescription: 'General Creator OS notifications',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      );
      await _plugin.show(
        0,
        'Notifications enabled',
        "You'll now see Creator OS alerts here and on your lock screen.",
        details,
      );
    } catch (e) {
      debugPrint('Could not show notification: $e');
    }
  }

  Future<void> cancelAll() async {
    if (!_initialized) return;
    try {
      await _plugin.cancelAll();
    } catch (e) {
      debugPrint('Could not cancel notifications: $e');
    }
  }
}
