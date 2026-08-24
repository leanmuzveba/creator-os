import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

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
class ApiClient {
  final http.Client _http;
  ApiClient({http.Client? client}) : _http = client ?? http.Client();

  Uri _uri(String path, [Map<String, String>? query]) =>
      Uri.parse('${ApiConfig.baseUrl}$path').replace(queryParameters: query);

  Map<String, String> get _jsonHeaders => {'Content-Type': 'application/json'};

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

  // ---- Posts ----

  Future<List<PostItem>> getPosts({String? status, String? category, String? platform}) async {
    final query = <String, String>{};
    if (status != null && status != 'all') query['status'] = status;
    if (category != null && category != 'all') query['category'] = category;
    if (platform != null && platform != 'all') query['platform'] = platform;
    final res = await _http.get(_uri('/api/posts', query));
    _checkOk(res, 'Failed to load posts');
    return (_decode(res) as List).map((e) => PostItem.fromJson(e)).toList();
  }

  Future<PostItem> createPost(Map<String, dynamic> body) async {
    final res = await _http.post(_uri('/api/posts'), headers: _jsonHeaders, body: jsonEncode(body));
    _checkOk(res, 'Failed to create post');
    return PostItem.fromJson(_decode(res));
  }

  Future<PostItem> updatePost(String id, Map<String, dynamic> updates) async {
    final res = await _http.put(_uri('/api/posts/$id'), headers: _jsonHeaders, body: jsonEncode(updates));
    _checkOk(res, 'Failed to update post');
    return PostItem.fromJson(_decode(res));
  }

  Future<void> deletePost(String id) async {
    final res = await _http.delete(_uri('/api/posts/$id'));
    _checkOk(res, 'Failed to delete post');
  }

  // ---- Accounts ----

  Future<List<SocialAccount>> getAccounts() async {
    final res = await _http.get(_uri('/api/accounts'));
    _checkOk(res, 'Failed to load accounts');
    return (_decode(res) as List).map((e) => SocialAccount.fromJson(e)).toList();
  }

  Future<List<SocialAccount>> syncAccounts(List<SocialAccount> accounts) async {
    final res = await _http.post(
      _uri('/api/accounts/sync'),
      headers: _jsonHeaders,
      body: jsonEncode(accounts.map((a) => a.toJson()).toList()),
    );
    _checkOk(res, 'Failed to sync accounts');
    return (_decode(res) as List).map((e) => SocialAccount.fromJson(e)).toList();
  }

  Future<SocialAccount> updateAccount(String id, Map<String, dynamic> updates) async {
    final res = await _http.put(_uri('/api/accounts/$id'), headers: _jsonHeaders, body: jsonEncode(updates));
    _checkOk(res, 'Failed to update account');
    return SocialAccount.fromJson(_decode(res));
  }

  Future<SocialAccount> toggleAccount(String id) async {
    final res = await _http.post(_uri('/api/accounts/$id/toggle'));
    _checkOk(res, 'Account sync failed');
    return SocialAccount.fromJson(_decode(res));
  }

  // ---- Trends ----

  Future<List<TrendItem>> getTrends({String? platform}) async {
    final query = <String, String>{};
    if (platform != null && platform != 'all') query['platform'] = platform;
    final res = await _http.get(_uri('/api/trends', query));
    _checkOk(res, 'Failed to load trends');
    return (_decode(res) as List).map((e) => TrendItem.fromJson(e)).toList();
  }

  // ---- Analytics ----

  Future<Map<String, dynamic>> getAnalytics({String range = '7d'}) async {
    final res = await _http.get(_uri('/api/analytics', {'range': range}));
    _checkOk(res, 'Failed to load analytics');
    return Map<String, dynamic>.from(_decode(res));
  }

  // ---- AI ----

  Future<Map<String, dynamic>> generateAi(Map<String, dynamic> body) async {
    final res = await _http.post(_uri('/api/ai/generate'), headers: _jsonHeaders, body: jsonEncode(body));
    _checkOk(res, 'AI generation failed');
    return Map<String, dynamic>.from(_decode(res));
  }
}
