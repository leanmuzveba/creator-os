import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/models.dart';

/// Resolves the CreatorOS backend base URL for the current platform.
///
/// Override at build/run time with `--dart-define=API_BASE_URL=http://<host>:3000`
/// (required for a physical Android device, which can't reach the dev
/// machine via `localhost`).
class ApiConfig {
  static String get baseUrl {
    const override = String.fromEnvironment('API_BASE_URL');
    if (override.isNotEmpty) return override;
    if (kIsWeb) return 'http://localhost:3000';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3000'; // Android emulator -> host loopback
    } catch (_) {
      // Platform is unavailable in some environments (e.g. web); ignore.
    }
    return 'http://localhost:3000';
  }
}

/// Thin HTTP client wrapping the CreatorOS Express API
/// (mirrors the `fetch('/api/...')` calls in `src/context/AppContext.tsx`).
///
/// Also carries the `connect.sid` session cookie the backend's `express-session`
/// issues once `REQUIRE_AUTH=true` — a browser attaches this automatically,
/// but `package:http` doesn't, so it's captured from `Set-Cookie` on every
/// response and replayed on every subsequent request, persisted via
/// SharedPreferences so a login survives an app restart (mirrors the 30-day
/// cookie `maxAge` set in `server.ts`).
class ApiClient {
  static const _sessionCookieKey = 'creator_os_session_cookie';
  static const _sessionCookieName = 'connect.sid'; // express-session's default cookie name

  final http.Client _http;
  ApiClient({http.Client? client}) : _http = client ?? http.Client();

  String? _sessionCookie;
  Future<void>? _cookieLoadFuture;

  Future<void> _ensureCookieLoaded() {
    return _cookieLoadFuture ??= () async {
      try {
        final prefs = await SharedPreferences.getInstance();
        _sessionCookie = prefs.getString(_sessionCookieKey);
      } catch (e) {
        debugPrintCookieError(e);
      }
    }();
  }

  void _captureCookie(http.Response res) {
    final setCookie = res.headers['set-cookie'];
    if (setCookie == null) return;
    final match = RegExp('$_sessionCookieName=[^;,]+').firstMatch(setCookie);
    if (match == null) return;
    _sessionCookie = match.group(0);
    _persistCookie(_sessionCookie!);
  }

  Future<void> _persistCookie(String cookie) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_sessionCookieKey, cookie);
    } catch (e) {
      debugPrintCookieError(e);
    }
  }

  Future<void> _clearCookie() async {
    _sessionCookie = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_sessionCookieKey);
    } catch (e) {
      debugPrintCookieError(e);
    }
  }

  Map<String, String> _headers([Map<String, String>? extra]) {
    final headers = <String, String>{...?extra};
    if (_sessionCookie != null) headers['Cookie'] = _sessionCookie!;
    return headers;
  }

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: query);

  Map<String, String> get _jsonHeaders => {'Content-Type': 'application/json'};

  Future<http.Response> _get(Uri uri) async {
    await _ensureCookieLoaded();
    final res = await _http.get(uri, headers: _headers());
    _captureCookie(res);
    return res;
  }

  Future<http.Response> _send(String method, Uri uri, {Map<String, String>? headers, Object? body}) async {
    await _ensureCookieLoaded();
    final http.Response res;
    switch (method) {
      case 'POST':
        res = await _http.post(uri, headers: _headers(headers), body: body);
        break;
      case 'PUT':
        res = await _http.put(uri, headers: _headers(headers), body: body);
        break;
      case 'DELETE':
        res = await _http.delete(uri, headers: _headers(headers));
        break;
      default:
        throw ArgumentError('Unsupported method: $method');
    }
    _captureCookie(res);
    return res;
  }

  dynamic _decode(http.Response res) {
    if (res.body.isEmpty) return null;
    return jsonDecode(res.body);
  }

  void _checkOk(http.Response res, String defaultMessage) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final data = res.body.isNotEmpty ? _tryDecode(res.body) : null;
      final message = (data is Map && data['error'] != null) ? data['error'].toString() : '$defaultMessage (${res.statusCode})';
      throw Exception(message);
    }
  }

  dynamic _tryDecode(String body) {
    try {
      return jsonDecode(body);
    } catch (_) {
      return null;
    }
  }

  // ---- Auth ----

  /// Whether the backend currently requires Creator OS login (`REQUIRE_AUTH`
  /// env var) — defaults off, in which case the app behaves as a single
  /// shared local user, same as before multi-tenancy existed.
  Future<bool> getRequireAuth() async {
    final res = await _get(_uri('/api/config'));
    _checkOk(res, 'Failed to load app config');
    final data = Map<String, dynamic>.from(_decode(res));
    return data['requireAuth'] == true;
  }

  /// The currently logged-in user, or null if not authenticated (also null,
  /// harmlessly, whenever `REQUIRE_AUTH` is off).
  Future<Map<String, dynamic>?> getCurrentUser() async {
    final res = await _get(_uri('/api/auth/me'));
    _checkOk(res, 'Failed to check login status');
    final data = Map<String, dynamic>.from(_decode(res));
    return data['user'] == null ? null : Map<String, dynamic>.from(data['user']);
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _send(
      'POST',
      _uri('/api/auth/login'),
      headers: _jsonHeaders,
      body: jsonEncode({'email': email, 'password': password}),
    );
    _checkOk(res, 'Login failed');
    return Map<String, dynamic>.from(_decode(res));
  }

  Future<Map<String, dynamic>> signup(String email, String password, String name) async {
    final res = await _send(
      'POST',
      _uri('/api/auth/signup'),
      headers: _jsonHeaders,
      body: jsonEncode({'email': email, 'password': password, 'name': name}),
    );
    _checkOk(res, 'Signup failed');
    return Map<String, dynamic>.from(_decode(res));
  }

  Future<void> logout() async {
    try {
      final res = await _send('POST', _uri('/api/auth/logout'));
      _checkOk(res, 'Logout failed');
    } finally {
      await _clearCookie();
    }
  }

  // ---- Posts ----

  Future<List<PostItem>> getPosts({String? status, String? category, String? platform}) async {
    final query = <String, String>{};
    if (status != null && status != 'all') query['status'] = status;
    if (category != null && category != 'all') query['category'] = category;
    if (platform != null && platform != 'all') query['platform'] = platform;
    final res = await _get(_uri('/api/posts', query));
    _checkOk(res, 'Failed to load posts');
    return (_decode(res) as List).map((e) => PostItem.fromJson(e)).toList();
  }

  Future<PostItem> createPost(Map<String, dynamic> body) async {
    final res = await _send('POST', _uri('/api/posts'), headers: _jsonHeaders, body: jsonEncode(body));
    _checkOk(res, 'Failed to create post');
    return PostItem.fromJson(_decode(res));
  }

  Future<PostItem> updatePost(String id, Map<String, dynamic> updates) async {
    final res = await _send('PUT', _uri('/api/posts/$id'), headers: _jsonHeaders, body: jsonEncode(updates));
    _checkOk(res, 'Failed to update post');
    return PostItem.fromJson(_decode(res));
  }

  Future<void> deletePost(String id) async {
    final res = await _send('DELETE', _uri('/api/posts/$id'));
    _checkOk(res, 'Failed to delete post');
  }

  // ---- Accounts ----

  Future<List<SocialAccount>> getAccounts() async {
    final res = await _get(_uri('/api/accounts'));
    _checkOk(res, 'Failed to load accounts');
    return (_decode(res) as List).map((e) => SocialAccount.fromJson(e)).toList();
  }

  Future<List<SocialAccount>> syncAccounts(List<SocialAccount> accounts) async {
    final res = await _send(
      'POST',
      _uri('/api/accounts/sync'),
      headers: _jsonHeaders,
      body: jsonEncode(accounts.map((a) => a.toJson()).toList()),
    );
    _checkOk(res, 'Failed to sync accounts');
    return (_decode(res) as List).map((e) => SocialAccount.fromJson(e)).toList();
  }

  Future<SocialAccount> updateAccount(String id, Map<String, dynamic> updates) async {
    final res = await _send('PUT', _uri('/api/accounts/$id'), headers: _jsonHeaders, body: jsonEncode(updates));
    _checkOk(res, 'Failed to update account');
    return SocialAccount.fromJson(_decode(res));
  }

  Future<SocialAccount> toggleAccount(String id) async {
    final res = await _send('POST', _uri('/api/accounts/$id/toggle'));
    _checkOk(res, 'Account sync failed');
    return SocialAccount.fromJson(_decode(res));
  }

  /// Fetch the OAuth authorization URL for [platform] (tiktok | instagram | facebook | youtube).
  /// Returns `{configured: bool, url?: string, ...}` — mirrors the `/api/auth/<platform>/url`
  /// endpoints used by the web app's `ConnectedAccountsModal`.
  Future<Map<String, dynamic>> getOAuthUrl(String platform) async {
    final res = await _get(_uri('/api/auth/$platform/url'));
    _checkOk(res, 'Failed to start $platform connection');
    return Map<String, dynamic>.from(_decode(res));
  }

  // ---- Trends ----

  Future<List<TrendItem>> getTrends({String? platform}) async {
    final query = <String, String>{};
    if (platform != null && platform != 'all') query['platform'] = platform;
    final res = await _get(_uri('/api/trends', query));
    _checkOk(res, 'Failed to load trends');
    return (_decode(res) as List).map((e) => TrendItem.fromJson(e)).toList();
  }

  // ---- Analytics ----

  Future<Map<String, dynamic>> getAnalytics({String range = '7d'}) async {
    final res = await _get(_uri('/api/analytics', {'range': range}));
    _checkOk(res, 'Failed to load analytics');
    return Map<String, dynamic>.from(_decode(res));
  }

  // ---- AI ----

  Future<Map<String, dynamic>> generateAi(Map<String, dynamic> body) async {
    final res = await _send('POST', _uri('/api/ai/generate'), headers: _jsonHeaders, body: jsonEncode(body));
    _checkOk(res, 'AI generation failed');
    return Map<String, dynamic>.from(_decode(res));
  }
}

void debugPrintCookieError(Object e) {
  // ignore: avoid_print
  print('ApiClient session cookie persistence error: $e');
}
