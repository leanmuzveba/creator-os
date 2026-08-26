import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/notification_service.dart';
import '../theme/app_theme.dart';

class ToastMessage {
  final String message;
  final String type; // success | info | error
  ToastMessage(this.message, this.type);
}

/// App-wide state for CreatorOS mobile: posts, connected accounts, trends,
/// active tab, and the async actions that talk to the backend.
/// Mirrors `src/context/AppContext.tsx`.
class AppState extends ChangeNotifier {
  static const _accountsStorageKey = 'creator_os_social_accounts';
  static const _avatarPathKey = 'creator_os_avatar_path';
  static const _profileNameKey = 'creator_os_profile_name';
  static const _profileAgeKey = 'creator_os_profile_age';
  static const _profileBirthdayKey = 'creator_os_profile_birthday';
  static const _lightThemeKey = 'creator_os_light_theme';
  static const _notificationsKey = 'creator_os_notifications_enabled';

  final ApiClient api;
  AppState({ApiClient? api}) : api = api ?? ApiClient();

  ViewTab activeTab = ViewTab.dashboard;
  List<PostItem> posts = [];
  List<SocialAccount> socialAccounts = [];
  List<TrendItem> trends = [];
  bool isLoading = true;

  String displayName = 'Lean';
  String avatarPath = '';
  int? age;
  DateTime? birthday;
  bool notificationsEnabled = false;

  ToastMessage? toast;

  void setActiveTab(ViewTab tab) {
    activeTab = tab;
    notifyListeners();
  }

  void showToast(String message, [String type = 'success']) {
    toast = ToastMessage(message, type);
    notifyListeners();
    Future.delayed(const Duration(seconds: 4), () {
      if (toast?.message == message) {
        toast = null;
        notifyListeners();
      }
    });
  }

  Future<List<SocialAccount>?> _readCachedAccounts() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_accountsStorageKey);
      if (raw == null) return null;
      final parsed = jsonDecode(raw) as List;
      if (parsed.isEmpty) return null;
      return parsed.map((e) => SocialAccount.fromJson(e)).toList();
    } catch (e) {
      debugPrint('Could not read cached accounts: $e');
      return null;
    }
  }

  Future<void> _cacheAccounts(List<SocialAccount> accounts) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_accountsStorageKey, jsonEncode(accounts.map((a) => a.toJson()).toList()));
    } catch (e) {
      debugPrint('Failed to cache accounts: $e');
    }
  }

  List<SocialAccount> _mergeServerAndCached(List<SocialAccount> server, List<SocialAccount> cached) {
    return server.map((sAcc) {
      final cAcc = cached.where((c) => c.id == sAcc.id).cast<SocialAccount?>().firstWhere((_) => true, orElse: () => null);
      if (cAcc == null) return sAcc;
      return SocialAccount(
        id: sAcc.id,
        name: sAcc.name,
        handle: sAcc.handle.isNotEmpty ? sAcc.handle : cAcc.handle,
        connected: sAcc.connected,
        avatar: sAcc.avatar,
        followers: sAcc.followers.isNotEmpty ? sAcc.followers : cAcc.followers,
        views: sAcc.views.isNotEmpty ? sAcc.views : cAcc.views,
        viewsGrowth: sAcc.viewsGrowth,
        color: sAcc.color,
        accentColor: sAcc.accentColor,
        status: sAcc.status,
      );
    }).toList();
  }

  Future<void> _loadPreferences() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      displayName = prefs.getString(_profileNameKey) ?? displayName;
      avatarPath = prefs.getString(_avatarPathKey) ?? '';
      age = prefs.getInt(_profileAgeKey);
      final birthdayRaw = prefs.getString(_profileBirthdayKey);
      birthday = birthdayRaw != null ? DateTime.tryParse(birthdayRaw) : null;
      notificationsEnabled = prefs.getBool(_notificationsKey) ?? false;
      AppColors.applyTheme(prefs.getBool(_lightThemeKey) ?? false);
    } catch (e) {
      debugPrint('Failed to load preferences: $e');
    }
  }

  Future<void> setAvatarPath(String path) async {
    avatarPath = path;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_avatarPathKey, path);
    } catch (e) {
      debugPrint('Failed to save avatar: $e');
    }
  }

  Future<void> updateProfile({required String name, int? age, DateTime? birthday}) async {
    displayName = name;
    this.age = age;
    this.birthday = birthday;
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_profileNameKey, name);
      if (age != null) {
        await prefs.setInt(_profileAgeKey, age);
      } else {
        await prefs.remove(_profileAgeKey);
      }
      if (birthday != null) {
        await prefs.setString(_profileBirthdayKey, birthday.toIso8601String());
      } else {
        await prefs.remove(_profileBirthdayKey);
      }
    } catch (e) {
      debugPrint('Failed to save profile: $e');
    }
    showToast('Profile updated');
  }

  Future<void> setLightTheme(bool light) async {
    AppColors.applyTheme(light);
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_lightThemeKey, light);
    } catch (e) {
      debugPrint('Failed to save theme: $e');
    }
  }

  Future<void> setNotificationsEnabled(bool enabled) async {
    if (enabled) {
      final granted = await NotificationService.instance.requestPermission();
      if (!granted) {
        showToast('Enable notifications for Creator OS in your device settings', 'error');
        return;
      }
      notificationsEnabled = true;
      notifyListeners();
      await NotificationService.instance.showConfirmation();
    } else {
      notificationsEnabled = false;
      notifyListeners();
      await NotificationService.instance.cancelAll();
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_notificationsKey, notificationsEnabled);
    } catch (e) {
      debugPrint('Failed to save notification setting: $e');
    }
  }

  Future<void> loadInitialData() async {
    isLoading = true;
    notifyListeners();
    try {
      await _loadPreferences();
      final results = await Future.wait([
        api.getPosts(),
        api.getAccounts(),
        api.getTrends(),
      ]);
      posts = results[0] as List<PostItem>;
      final serverAccounts = results[1] as List<SocialAccount>;
      final cached = await _readCachedAccounts();
      final merged = cached != null ? _mergeServerAndCached(serverAccounts, cached) : serverAccounts;
      socialAccounts = merged;
      await _cacheAccounts(merged);
      if (cached != null) {
        // Sync merged state back to the server in the background.
        api.syncAccounts(merged).catchError((_) => <SocialAccount>[]);
      }
      trends = results[2] as List<TrendItem>;
    } catch (e) {
      debugPrint('Failed to load initial data: $e');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshAccounts() async {
    try {
      final accounts = await api.getAccounts();
      socialAccounts = accounts;
      await _cacheAccounts(accounts);
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to refresh accounts: $e');
    }
  }

  Future<PostItem?> addPost(Map<String, dynamic> postData) async {
    try {
      final newPost = await api.createPost(postData);
      posts = [newPost, ...posts];
      notifyListeners();
      showToast('Post "${newPost.title}" created successfully!');
      return newPost;
    } catch (e) {
      showToast(_errorMessage(e), 'error');
      return null;
    }
  }

  Future<PostItem?> updatePost(String id, Map<String, dynamic> updates) async {
    try {
      final updated = await api.updatePost(id, updates);
      posts = posts.map((p) => p.id == id ? updated : p).toList();
      notifyListeners();
      showToast('Post updated successfully');
      return updated;
    } catch (e) {
      showToast(_errorMessage(e), 'error');
      return null;
    }
  }

  Future<void> deletePost(String id) async {
    try {
      await api.deletePost(id);
      posts = posts.where((p) => p.id != id).toList();
      notifyListeners();
      showToast('Post deleted', 'info');
    } catch (e) {
      showToast(_errorMessage(e), 'error');
    }
  }

  Future<void> publishPostNow(String id) async {
    final target = posts.where((p) => p.id == id).cast<PostItem?>().firstWhere((_) => true, orElse: () => null);
    if (target == null) return;
    final rand = DateTime.now().millisecondsSinceEpoch;
    final updated = await updatePost(id, {
      'status': 'published',
      'publishedDate': DateTime.now().toIso8601String().split('T')[0],
      'views': 1000 + rand % 20000,
      'likes': 100 + rand % 2000,
      'comments': 10 + rand % 100,
      'shares': 5 + rand % 80,
      'bookmarks': 20 + rand % 250,
    });
    if (updated != null) {
      showToast('Published to ${target.platforms.map((p) => p.toUpperCase()).join(', ')}! \u{1F680}');
    }
  }

  Future<void> toggleAccountConnection(String id) async {
    try {
      final updated = await api.toggleAccount(id);
      socialAccounts = socialAccounts.map((a) => a.id == id ? updated : a).toList();
      await _cacheAccounts(socialAccounts);
      notifyListeners();
      showToast('${updated.name} ${updated.connected ? 'connected' : 'disconnected'} successfully', updated.connected ? 'success' : 'info');
    } catch (e) {
      showToast(_errorMessage(e), 'error');
    }
  }

  Future<void> updateAccount(String id, Map<String, dynamic> updates) async {
    try {
      final updated = await api.updateAccount(id, updates);
      socialAccounts = socialAccounts.map((a) => a.id == id ? updated : a).toList();
      await _cacheAccounts(socialAccounts);
      notifyListeners();
      showToast('${updated.name} profile and metrics updated!');
    } catch (e) {
      showToast(_errorMessage(e), 'error');
    }
  }

  String _errorMessage(Object e) => e.toString().replaceFirst('Exception: ', '');
}
