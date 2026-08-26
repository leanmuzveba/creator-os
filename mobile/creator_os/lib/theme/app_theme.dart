import 'package:flutter/material.dart';

/// Dark palette matching the CreatorOS web app (`#0b0d17` background, pink/purple accents).
/// The 7 fields below are mutable (not `const`) so [applyTheme] can swap in the
/// light-blue palette at runtime; every screen already rebuilds on [AppState]
/// changes via `context.watch`, so a theme switch repaints everywhere for free.
class AppColors {
  static Color background = const Color(0xFF0B0D17);
  static Color surface = const Color(0xFF131627);
  static Color surfaceAlt = const Color(0xFF0D0F1E);
  static Color border = const Color(0x1AFFFFFF); // white/10
  static Color textPrimary = const Color(0xFFF1F5F9); // slate-100
  static Color textSecondary = const Color(0xFF94A3B8); // slate-400
  static Color pink = const Color(0xFFEC4899);
  static const pinkDark = Color(0xFFF43F5E);
  static const purple = Color(0xFFA855F7);
  static const cyan = Color(0xFF22D3EE);
  static const emerald = Color(0xFF34D399);
  static const red = Color(0xFFEF4444);
  static const blue = Color(0xFF3B82F6);

  static bool isLight = false;

  /// Swaps the mutable palette between the default dark theme and a white
  /// theme with blue text/icons. [pink] doubles as the app's general icon
  /// accent color, so remapping it to blue covers icon tinting everywhere.
  static void applyTheme(bool light) {
    isLight = light;
    if (light) {
      background = const Color(0xFFFFFFFF);
      surface = const Color(0xFFF1F5FB);
      surfaceAlt = const Color(0xFFE8EEF9);
      border = const Color(0x1A2563EB);
      textPrimary = const Color(0xFF1D4ED8);
      textSecondary = const Color(0xFF5B7FBE);
      pink = const Color(0xFF2563EB);
    } else {
      background = const Color(0xFF0B0D17);
      surface = const Color(0xFF131627);
      surfaceAlt = const Color(0xFF0D0F1E);
      border = const Color(0x1AFFFFFF);
      textPrimary = const Color(0xFFF1F5F9);
      textSecondary = const Color(0xFF94A3B8);
      pink = const Color(0xFFEC4899);
    }
  }

  static Color platform(String id) {
    switch (id) {
      case 'tiktok':
        return const Color(0xFF000000);
      case 'instagram':
        return const Color(0xFFDD2A7B);
      case 'youtube':
        return const Color(0xFFFF0000);
      case 'facebook':
        return const Color(0xFF1877F2);
      default:
        return surface;
    }
  }

  static Color status(String status) {
    switch (status) {
      case 'published':
        return emerald;
      case 'scheduled':
        return const Color(0xFFFBBF24); // amber-400
      default:
        return textSecondary;
    }
  }
}

ThemeData buildAppTheme() {
  final base = AppColors.isLight ? ThemeData.light(useMaterial3: true) : ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.pink,
      secondary: AppColors.purple,
      surface: AppColors.surface,
      error: AppColors.red,
      brightness: AppColors.isLight ? Brightness.light : Brightness.dark,
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.background,
      elevation: 0,
      foregroundColor: AppColors.textPrimary,
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.border),
      ),
    ),
    textTheme: base.textTheme.apply(
      bodyColor: AppColors.textPrimary,
      displayColor: AppColors.textPrimary,
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: AppColors.surfaceAlt,
      selectedItemColor: AppColors.pink,
      unselectedItemColor: AppColors.textSecondary,
      type: BottomNavigationBarType.fixed,
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppColors.pink,
      foregroundColor: Colors.white,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.pink),
      ),
    ),
  );
}
