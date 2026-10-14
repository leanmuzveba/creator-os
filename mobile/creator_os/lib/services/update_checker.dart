import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:ota_update/ota_update.dart';
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
/// this build, offers to download and install its APK in-app. Failures are silent — an update
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
      barrierDismissible: false,
      builder: (ctx) => _UpdateDialog(
        version: latest,
        notes: notes,
        apkUrl: '${apk['browser_download_url']}',
        // GitHub reports "sha256:<hex>"; lets the installer reject a corrupted download.
        sha256: '${apk['digest'] ?? ''}'.startsWith('sha256:') ? '${apk['digest']}'.substring(7) : null,
      ),
    );
  } catch (_) {
    // Offline, rate-limited, or GitHub changed shape — try again next launch.
  }
}

class _UpdateDialog extends StatefulWidget {
  const _UpdateDialog({required this.version, required this.notes, required this.apkUrl, this.sha256});
  final String version, notes, apkUrl;
  final String? sha256;

  @override
  State<_UpdateDialog> createState() => _UpdateDialogState();
}

class _UpdateDialogState extends State<_UpdateDialog> {
  double? _progress; // null = not started
  String? _error;

  void _install() {
    setState(() {
      _progress = 0;
      _error = null;
    });
    OtaUpdate()
        .execute(widget.apkUrl, destinationFilename: 'CreatorOS-${widget.version}.apk', sha256checksum: widget.sha256)
        .listen(
      (event) {
        if (!mounted) return;
        switch (event.status) {
          case OtaStatus.DOWNLOADING:
            setState(() => _progress = (int.tryParse(event.value ?? '') ?? 0) / 100);
          case OtaStatus.INSTALLING:
          case OtaStatus.INSTALLATION_DONE:
            // Android's own "Install this update?" screen takes over from here.
            Navigator.pop(context);
          default:
            setState(() {
              _progress = null;
              _error = event.status == OtaStatus.PERMISSION_NOT_GRANTED_ERROR
                  ? 'Allow Creator OS to install apps when Android asks, then try again.'
                  : 'The update could not be installed. Try again, or download it in your browser.';
            });
        }
      },
      onError: (_) {
        if (!mounted) return;
        setState(() {
          _progress = null;
          _error = 'The download failed. Check your connection and try again.';
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final downloading = _progress != null;
    return AlertDialog(
      title: Text('New update available — v${widget.version}'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('${widget.notes.isEmpty ? '' : '${widget.notes}\n\n'}You have v$kAppVersion.'),
            if (downloading) ...[
              const SizedBox(height: 16),
              LinearProgressIndicator(value: _progress == 0 ? null : _progress),
              const SizedBox(height: 8),
              Text('Downloading… ${((_progress ?? 0) * 100).round()}%'),
            ],
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
          ],
        ),
      ),
      actions: downloading
          ? null
          : [
              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Later')),
              if (_error != null)
                TextButton(
                  onPressed: () => launchUrl(Uri.parse(widget.apkUrl), mode: LaunchMode.externalApplication),
                  child: const Text('Browser'),
                ),
              FilledButton(onPressed: _install, child: Text(_error == null ? 'Install update' : 'Try again')),
            ],
    );
  }
}
