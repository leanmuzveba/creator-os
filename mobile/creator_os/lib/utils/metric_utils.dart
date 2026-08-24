import '../models/models.dart';

/// Parse an abbreviated metric string (e.g. "1.2K", "3M") into a number.
/// Mirrors `src/utils/metricUtils.ts`.
double parseMetric(String? val) {
  if (val == null || val.isEmpty) return 0;
  final str = val.trim().toUpperCase().replaceAll(',', '');
  if (str.endsWith('B')) return (double.tryParse(str.substring(0, str.length - 1)) ?? 0) * 1000000000;
  if (str.endsWith('M')) return (double.tryParse(str.substring(0, str.length - 1)) ?? 0) * 1000000;
  if (str.endsWith('K')) return (double.tryParse(str.substring(0, str.length - 1)) ?? 0) * 1000;
  return double.tryParse(str) ?? 0;
}

/// Format a number as an abbreviated metric string (e.g. 1200 -> "1.2K").
String formatMetric(num value) {
  if (value.isNaN || value <= 0) return '0';
  String trimZero(double v) {
    final s = v.toStringAsFixed(1);
    return s.endsWith('.0') ? s.substring(0, s.length - 2) : s;
  }

  if (value >= 1000000000) return '${trimZero(value / 1000000000)}B';
  if (value >= 1000000) return '${trimZero(value / 1000000)}M';
  if (value >= 1000) return '${trimZero(value / 1000)}K';
  return value.round().toString();
}

double calculateTotalViews(List<SocialAccount> accounts) =>
    accounts.where((a) => a.connected).fold(0.0, (acc, a) => acc + parseMetric(a.views));
