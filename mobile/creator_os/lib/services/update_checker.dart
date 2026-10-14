import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

/// Version baked in by `scripts/release_mobile.sh` (`--dart-define=APP_VERSION`).
/// Empty in dev builds, which skips the update check entirely.
const kAppVersion = String.fromEnvironment('APP_VERSION');

const _releasesUrl = 'https://api.github.com/repos/leanmuzveba/creator-os/releases?per_page=20';
const _tagPrefix = 'mobile-v';

/// True if [latest] ("1.2.0") is a higher version than [current] ("1.1.9").
bool isNewerVersion(String latest, String current) {
  List<int> parts(String v) => v.split('.').map((p) => int.tryParse(p) ?? 0).toList();
  final a = parts(latest), b = parts(current);
  for (var i = 0; i < 3; i++) {
    final x = i < a.length ? a[i] : 0, y = i < b.length ? b[i] : 0;
    if (x != y) return x > y;
  }
  return false;
}

/// Looks up the newest `mobile-v*` GitHub Release and, if it's newer than
/// this build, offers to download its APK. Failures are silent — an update
/// check must never get in the way of using the app.
Future<void> checkForUpdate(BuildContext context) async {
  if (kAppVersion.isEmpty) return;
  try {
    final res = await http.get(Uri.parse(_releasesUrl), headers: {'Accept': 'application/vnd.github+json'});
    if (res.statusCode != 200) return;
    final releases = (jsonDecode(res.body) as List).cast<Map<String, dynamic>>();
    final release = releases.firstWhere(
      (r) => r['draft'] != true && r['prerelease'] != true && '${r['tag_name']}'.startsWith(_tagPrefix),
      orElse: () => const {},
    );
    if (release.isEmpty) return;
    final latest = '${release['tag_name']}'.substring(_tagPrefix.length);
    if (!isNewerVersion(latest, kAppVersion)) return;
    final apk = (release['assets'] as List).cast<Map<String, dynamic>>().firstWhere(
          (a) => '${a['name']}'.endsWith('.apk'),
          orElse: () => const {},
        );
    if (apk.isEmpty || !context.mounted) return;

    final notes = '${release['body'] ?? ''}'.trim();
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Update available — v$latest'),
        content: SingleChildScrollView(
          child: Text(
            '${notes.isEmpty ? '' : '$notes\n\n'}You have v$kAppVersion. '
            'Tap Download, then open the file to install the update.',
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Later')),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              launchUrl(Uri.parse('${apk['browser_download_url']}'), mode: LaunchMode.externalApplication);
            },
            child: const Text('Download'),
          ),
        ],
      ),
    );
  } catch (_) {
    // Offline, rate-limited, or GitHub changed shape — try again next launch.
  }
}
