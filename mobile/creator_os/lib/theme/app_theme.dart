import 'package:flutter/material.dart';

/// Dark palette matching the CreatorOS web app (`#0b0d17` background, pink/purple accents).
class AppColors {
  static const background = Color(0xFF0B0D17);
  static const surface = Color(0xFF131627);
  static const surfaceAlt = Color(0xFF0D0F1E);
  static const border = Color(0x1AFFFFFF); // white/10
  static const textPrimary = Color(0xFFF1F5F9); // slate-100
  static const textSecondary = Color(0xFF94A3B8); // slate-400
  static const pink = Color(0xFFEC4899);
  static const pinkDark = Color(0xFFF43F5E);
  static const purple = Color(0xFFA855F7);
  static const cyan = Color(0xFF22D3EE);
  static const emerald = Color(0xFF34D399);
  static const red = Color(0xFFEF4444);
  static const blue = Color(0xFF3B82F6);

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
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.background,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.pink,
      secondary: AppColors.purple,
      surface: AppColors.surface,
      error: AppColors.red,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      elevation: 0,
      foregroundColor: AppColors.textPrimary,
    ),
    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.border),
      ),
    ),
    textTheme: base.textTheme.apply(
      bodyColor: AppColors.textPrimary,
      displayColor: AppColors.textPrimary,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.surfaceAlt,
      selectedItemColor: AppColors.pink,
      unselectedItemColor: AppColors.textSecondary,
      type: BottomNavigationBarType.fixed,
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.pink,
      foregroundColor: Colors.white,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.pink),
      ),
    ),
  );
}
