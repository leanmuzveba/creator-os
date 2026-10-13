import 'package:flutter/material.dart';

/// Fixed Creator OS brand palette for the pre-login screens (splash + auth).
/// These ignore the user's chosen App Theme on purpose: they're shown before
/// the user is in the app, so they always use the brand pink — the same
/// `--accent` and page background as the web app's dark theme (src/index.css).
class Brand {
  Brand._();

  static const background = Color(0xFF0B0D17);
  static const surface = Color(0xFF131627);
  static const border = Color(0x1AFFFFFF);
  static const pink = Color(0xFFEC4899);
  static const pinkDeep = Color(0xFFBE185D); // 3D button underside
  static const red = Color(0xFFEF4444);
  static const textPrimary = Color(0xFFF1F5F9);
  static const textSecondary = Color(0xFF94A3B8);
  static const textMuted = Color(0xFF64748B);
  static const label = Color(0xFFCBD5E1);

  /// Same font as the web app (index.html loads Plus Jakarta Sans).
  static const font = 'PlusJakartaSans';

  static final theme = ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    fontFamily: font,
    scaffoldBackgroundColor: background,
    colorScheme: const ColorScheme.dark(primary: pink, surface: surface, error: red),
    textSelectionTheme: const TextSelectionThemeData(
      cursorColor: pink,
      selectionColor: Color(0x55EC4899),
      selectionHandleColor: pink,
    ),
  );
}

/// Pink rounded "screen" with a lens dot — the Creator OS mark.
class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 40});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size * 0.7,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: Brand.pink, borderRadius: BorderRadius.circular(size * 0.2)),
      child: Container(
        width: size * 0.32,
        height: size * 0.32,
        decoration: BoxDecoration(
          color: Brand.background,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: size * 0.04),
        ),
      ),
    );
  }
}

/// LogoMark + italic "Creator**OS**" wordmark.
class Wordmark extends StatelessWidget {
  const Wordmark({super.key, this.fontSize = 22});

  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        LogoMark(size: fontSize * 1.7),
        const SizedBox(width: 12),
        Text.rich(
          TextSpan(
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w800,
              fontStyle: FontStyle.italic,
              color: Brand.textPrimary,
            ),
            children: const [
              TextSpan(text: 'Creator'),
              TextSpan(text: 'OS', style: TextStyle(color: Brand.pink)),
            ],
          ),
        ),
      ],
    );
  }
}

/// Faint pink radial glow behind the brand screens.
class BrandGlow extends StatelessWidget {
  const BrandGlow({super.key});

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: const Alignment(0.6, -0.4),
            radius: 1.2,
            colors: [Brand.pink.withValues(alpha: 0.05), Brand.background],
          ),
        ),
      ),
    );
  }
}

class BrandFooter extends StatelessWidget {
  const BrandFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return const Text(
      'POWERED BY CREATOR OS',
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 2, color: Brand.textMuted),
    );
  }
}
