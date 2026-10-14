import 'package:flutter/material.dart';

import 'app_theme.dart';

/// Palette for the pre-login screens (splash + auth). Follows the user's App
/// Theme (Default black & white unless they picked another), except the logo
/// mark, which always keeps its brand colors.
class Brand {
  Brand._();

  static const logoPink = Color(0xFFEC4899);
  static const logoInk = Color(0xFF0B0D17);

  static Color get background => AppColors.background;
  static Color get surface => AppColors.surface;
  static Color get border => AppColors.border;
  static Color get pink => AppColors.pink; // the theme's accent
  static Color get pinkDeep => Color.lerp(AppColors.pink, Colors.black, 0.35)!; // 3D button underside
  static Color get onPink => AppColors.accentText;
  static Color get red => AppColors.red;
  static Color get textPrimary => AppColors.textPrimary;
  static Color get textSecondary => AppColors.textSecondary;
  static Color get textMuted => AppColors.textSecondary;
  static Color get label => AppColors.textPrimary;

  /// Same font as the web app (index.html loads Plus Jakarta Sans).
  static const font = 'PlusJakartaSans';

  static ThemeData get theme => buildAppTheme().copyWith(
        textTheme: buildAppTheme().textTheme.apply(fontFamily: font),
        textSelectionTheme: TextSelectionThemeData(
          cursorColor: pink,
          selectionColor: pink.withValues(alpha: 0.33),
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
      decoration: BoxDecoration(color: Brand.logoPink, borderRadius: BorderRadius.circular(size * 0.2)),
      child: Container(
        width: size * 0.32,
        height: size * 0.32,
        decoration: BoxDecoration(
          color: Brand.logoInk,
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
            children: [
              TextSpan(text: 'Creator'),
              TextSpan(text: 'OS', style: TextStyle(color: Brand.pink)),
            ],
          ),
        ),
      ],
    );
  }
}

class BrandFooter extends StatelessWidget {
  const BrandFooter({super.key});

  @override
  Widget build(BuildContext context) {
    return Text(
      'POWERED BY CREATOR OS',
      textAlign: TextAlign.center,
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 2, color: Brand.textMuted),
    );
  }
}
