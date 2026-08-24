import 'dart:io';

import 'package:flutter/material.dart';

/// Renders a post/media thumbnail from either a remote URL or a local device
/// file path (the latter comes from on-device media picked via
/// `media_utils.processMediaFile`, mirroring the web app's client-side blob URLs).
class ThumbImage extends StatelessWidget {
  final String url;
  final BoxFit fit;
  final Widget Function(BuildContext)? placeholderBuilder;

  const ThumbImage({super.key, required this.url, this.fit = BoxFit.cover, this.placeholderBuilder});

  bool get _isLocalFile => !url.startsWith('http://') && !url.startsWith('https://');

  @override
  Widget build(BuildContext context) {
    if (url.isEmpty) {
      return placeholderBuilder?.call(context) ?? const Icon(Icons.image, color: Colors.white38);
    }
    Widget errorBuilder(BuildContext ctx, Object err, StackTrace? st) =>
        placeholderBuilder?.call(ctx) ?? const Icon(Icons.image_not_supported, color: Colors.white38);

    if (_isLocalFile) {
      return Image.file(File(url), fit: fit, errorBuilder: errorBuilder);
    }
    return Image.network(url, fit: fit, errorBuilder: errorBuilder);
  }
}
