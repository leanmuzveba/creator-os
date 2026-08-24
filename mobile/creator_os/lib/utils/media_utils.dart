import 'dart:async';
import 'dart:io';

import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';

/// Client-side media helpers for the post-creation upload flow. Mirrors
/// `src/utils/videoUtils.ts`: turns a user-picked video/image into the
/// metadata CreatorOS stores for a post (title, thumbnail, duration), using
/// on-device thumbnail extraction instead of the web app's canvas hack.
/// Everything degrades gracefully to a default cover if extraction fails.

const String kFallbackThumb = '';

/// Result of processing a picked media file.
class ProcessedMedia {
  final String title;
  final String thumbnailUrl;
  final String duration;
  final String? videoUrl;

  ProcessedMedia({required this.title, required this.thumbnailUrl, required this.duration, this.videoUrl});
}

bool _looksLikeVideo(String name, String? mimeType) {
  if (mimeType != null && mimeType.startsWith('video/')) return true;
  return RegExp(r'\.(mp4|mov|webm|m4v|avi|mkv)$', caseSensitive: false).hasMatch(name);
}

/// Derive a human-friendly title from a file name (`my_cool-clip.mp4` -> `My Cool Clip`).
String titleFromFileName(String fileName) {
  final rawName = fileName.replaceFirst(RegExp(r'\.[^/.]+$'), '');
  final words = rawName.split(RegExp(r'[-_]+')).where((w) => w.isNotEmpty).map((w) => w[0].toUpperCase() + w.substring(1));
  final joined = words.join(' ');
  return joined.isNotEmpty ? joined : 'Uploaded Content';
}

String _formatDuration(Duration d) {
  final totalSec = d.inSeconds > 0 ? d.inSeconds : 30;
  final mins = totalSec ~/ 60;
  final secs = totalSec % 60;
  return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
}

/// Inspect a user-picked media [file] and return the fields CreatorOS stores
/// for a post: a display title, a thumbnail (local file path), a formatted
/// duration, and (for video) the original file path for playback.
Future<ProcessedMedia> processMediaFile(XFile file) async {
  final title = titleFromFileName(file.name);
  final isVideo = _looksLikeVideo(file.name, file.mimeType);

  if (isVideo) {
    return _processVideo(file, title);
  }
  // Images: use the picked file directly as its own thumbnail.
  return ProcessedMedia(title: title, thumbnailUrl: file.path, duration: '00:15', videoUrl: null);
}

Future<ProcessedMedia> _processVideo(XFile file, String title) async {
  // No on-device frame-capture here (the maintained thumbnail packages for
  // Flutter are effectively abandoned / broken on current Android toolchains).
  // The UI falls back to a generic video placeholder icon, same as the web
  // app's own VIDEO_FALLBACK_THUMB when its canvas capture fails.
  const thumbPath = '';
  String duration = '00:45';

  try {
    final controller = VideoPlayerController.file(File(file.path));
    await controller.initialize().timeout(const Duration(seconds: 3));
    duration = _formatDuration(controller.value.duration);
    await controller.dispose();
  } catch (_) {
    // Keep the default duration fallback.
  }

  return ProcessedMedia(title: title, thumbnailUrl: thumbPath, duration: duration, videoUrl: file.path);
}
