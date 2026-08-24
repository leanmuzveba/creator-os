import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// Aggregated performance overview across connected platforms.
/// Mirrors `src/views/AnalyticsView.tsx`.
class AnalyticsScreen extends StatefulWidget {
  const AnalyticsScreen({super.key});

  @override
  State<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  String _range = '7d';
  Map<String, dynamic>? _data;
  bool _loading = true;

  static const _ranges = ['7d', '14d', '30d', '90d', 'all'];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final state = context.read<AppState>();
      final data = await state.api.getAnalytics(range: _range);
      if (mounted) setState(() => _data = data);
    } catch (_) {
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final overview = (_data?['overview'] as Map?) ?? {};
    final platforms = (_data?['platformPerformance'] as List? ?? []).cast<Map>();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Analytics', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              DropdownButton<String>(
                value: _range,
                dropdownColor: AppColors.surface,
                underline: const SizedBox(),
                style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
                items: _ranges.map((r) => DropdownMenuItem(value: r, child: Text(r == 'all' ? 'All time' : 'Last $r'))).toList(),
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => _range = v);
                  _load();
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_loading)
            const Padding(padding: EdgeInsets.symmetric(vertical: 40), child: Center(child: CircularProgressIndicator(color: AppColors.pink)))
          else ...[
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.7,
              children: [
                _statTile('Views', overview['views']),
                _statTile('Reach', overview['reach']),
                _statTile('Followers', overview['followers']),
                _statTile('Engagement', overview['engagement']),
              ],
            ),
            const SizedBox(height: 20),
            const Text('Platform performance', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 10),
            ...platforms.map((p) => _platformRow(p)),
          ],
        ],
      ),
    );
  }

  Widget _statTile(String label, dynamic stat) {
    final value = (stat is Map) ? (stat['value']?.toString() ?? '0') : '0';
    final growth = (stat is Map) ? (stat['growth']?.toString() ?? '') : '';
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
              const SizedBox(width: 6),
              if (growth.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 3),
                  child: Text(growth, style: const TextStyle(fontSize: 10, color: AppColors.emerald)),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _platformRow(Map p) {
    final connected = p['connected'] == true;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(width: 8, height: 8, decoration: BoxDecoration(color: connected ? AppColors.emerald : AppColors.textSecondary, shape: BoxShape.circle)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(p['platform']?.toString() ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                Text('${p['views']} views · ${p['engagement']} engagement', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
          Text(p['growth']?.toString() ?? '', style: const TextStyle(fontSize: 11, color: AppColors.emerald, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
