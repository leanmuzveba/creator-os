import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Small colored badge standing in for each platform's brand icon.
class PlatformIcon extends StatelessWidget {
  final String platform;
  final double size;

  const PlatformIcon({super.key, required this.platform, this.size = 28});

  IconData get _icon {
    switch (platform) {
      case 'tiktok':
        return Icons.music_note;
      case 'instagram':
        return Icons.camera_alt;
      case 'youtube':
        return Icons.play_arrow;
      case 'facebook':
        return Icons.thumb_up;
      default:
        return Icons.public;
    }
  }

  Gradient? get _gradient {
    if (platform == 'instagram') {
      return const LinearGradient(
        colors: [Color(0xFFF58529), Color(0xFFDD2A7B), Color(0xFF8134AF)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: _gradient == null ? AppColors.platform(platform) : null,
        gradient: _gradient,
        borderRadius: BorderRadius.circular(size * 0.3),
        border: Border.all(color: Colors.white.withValues(alpha: 0.15)),
      ),
      child: Icon(_icon, size: size * 0.55, color: Colors.white),
    );
  }
}
