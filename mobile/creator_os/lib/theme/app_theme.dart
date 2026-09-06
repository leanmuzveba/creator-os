import 'package:flutter/material.dart';

/// Named App Theme choices, mirroring the web app's theme picker.
enum AppThemeName { defaultTheme, pink, lightBlue, moon }

/// Mutable color palette matching the CreatorOS web app. The fields below are
/// mutable (not `const`) so [applyTheme] can swap in a different named
/// palette at runtime; every screen already rebuilds on [AppState] changes
/// via `context.watch`, so a theme switch repaints everywhere for free.
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

  /// Readable text/icon color for anything drawn on top of a solid [pink]
  /// (accent) fill — e.g. button labels. White works for the Default/Pink/
  /// Light Blue accents, but Moon's light-grey accent needs a dark label.
  static Color accentText = const Color(0xFFFFFFFF);

  /// Dashboard "fans" label accent. The dark-mode pale pink has too little
  /// contrast on the light theme's near-white card background.
  static Color fansAccent = const Color(0xFFF9A8D4);

  /// Dashboard growth-badge accent. The dark-mode mint emerald has too little
  /// contrast on the light theme's near-white card background.
  static Color positiveAccent = const Color(0xFF34D399);

  static AppThemeName current = AppThemeName.defaultTheme;

  /// True for themes with a light (white-ish) background — used to pick the
  /// base Material theme (ThemeData.light vs ThemeData.dark) and Brightness.
  static bool get isLight => current == AppThemeName.defaultTheme || current == AppThemeName.lightBlue;

  /// Swaps the mutable palette to the given named theme. [pink] doubles as
  /// the app's general icon/button accent color, so remapping it covers
  /// accent tinting everywhere.
  static void applyTheme(AppThemeName theme) {
    current = theme;
    switch (theme) {
      case AppThemeName.defaultTheme:
        // Black & white: white background, black text, black buttons.
        background = const Color(0xFFFFFFFF);
        surface = const Color(0xFFF4F4F5);
        surfaceAlt = const Color(0xFFE4E4E7);
        border = const Color(0x1F000000);
        textPrimary = const Color(0xFF000000);
        textSecondary = const Color(0xFF52525B);
        pink = const Color(0xFF000000);
        accentText = const Color(0xFFFFFFFF);
        fansAccent = const Color(0xFF18181B);
        positiveAccent = const Color(0xFF000000);
        break;
      case AppThemeName.pink:
        background = const Color(0xFF0B0D17);
        surface = const Color(0xFF131627);
        surfaceAlt = const Color(0xFF0D0F1E);
        border = const Color(0x1AFFFFFF);
        textPrimary = const Color(0xFFF1F5F9);
        textSecondary = const Color(0xFF94A3B8);
        pink = const Color(0xFFEC4899);
        accentText = const Color(0xFFFFFFFF);
        fansAccent = const Color(0xFFF9A8D4);
        positiveAccent = const Color(0xFF34D399);
        break;
      case AppThemeName.lightBlue:
        background = const Color(0xFFFFFFFF);
        surface = const Color(0xFFF1F5FB);
        surfaceAlt = const Color(0xFFE8EEF9);
        border = const Color(0x1A2563EB);
        textPrimary = const Color(0xFF1D4ED8);
        textSecondary = const Color(0xFF5B7FBE);
        pink = const Color(0xFF2563EB);
        accentText = const Color(0xFFFFFFFF);
        fansAccent = const Color(0xFFDC2626);
        positiveAccent = const Color(0xFF15803D);
        break;
      case AppThemeName.moon:
        // Dark grey background, white text, light grey buttons.
        background = const Color(0xFF1C1C1E);
        surface = const Color(0xFF2C2C2E);
        surfaceAlt = const Color(0xFF242426);
        border = const Color(0x24FFFFFF);
        textPrimary = const Color(0xFFFFFFFF);
        textSecondary = const Color(0xFFA1A1AA);
        pink = const Color(0xFFD4D4D8);
        accentText = const Color(0xFF18181B);
        fansAccent = const Color(0xFFE4E4E7);
        positiveAccent = const Color(0xFFE4E4E7);
        break;
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
      foregroundColor: AppColors.accentText,
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
