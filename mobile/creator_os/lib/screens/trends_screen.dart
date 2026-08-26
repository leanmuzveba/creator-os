import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/platform_icon.dart';

/// Trend intelligence feed. Mirrors `src/views/TrendsView.tsx`.
class TrendsScreen extends StatefulWidget {
  const TrendsScreen({super.key});

  @override
  State<TrendsScreen> createState() => _TrendsScreenState();
}

class _TrendsScreenState extends State<TrendsScreen> {
  String _platform = 'all';
  static const _platforms = ['all', 'tiktok', 'instagram', 'youtube', 'facebook'];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final trends = _platform == 'all' ? state.trends : state.trends.where((t) => t.platform == _platform).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Trend Intelligence', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 2),
              Text('Real-time viral formats to adapt for your pillars', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              const SizedBox(height: 10),
              SizedBox(
                height: 32,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _platforms.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final p = _platforms[i];
                    final selected = _platform == p;
                    return ChoiceChip(
                      label: Text(p == 'all' ? 'All' : p[0].toUpperCase() + p.substring(1)),
                      selected: selected,
                      onSelected: (_) => setState(() => _platform = p),
                      selectedColor: AppColors.cyan.withValues(alpha: 0.25),
                      labelStyle: TextStyle(color: selected ? AppColors.cyan : AppColors.textSecondary, fontSize: 12),
                      backgroundColor: AppColors.surface,
                    );
                  },
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: state.isLoading
              ? Center(child: CircularProgressIndicator(color: AppColors.pink))
              : trends.isEmpty
                  ? Center(child: Text('No trends found', style: TextStyle(color: AppColors.textSecondary)))
                  : RefreshIndicator(
                      onRefresh: () => state.loadInitialData(),
                      child: ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                        itemCount: trends.length,
                        separatorBuilder: (_, _) => const SizedBox(height: 12),
                        itemBuilder: (context, i) => _trendCard(context, trends[i]),
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _trendCard(BuildContext context, TrendItem t) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              PlatformIcon(platform: t.platform, size: 30),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.topic, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Text(t.hashtag, style: const TextStyle(fontSize: 11, color: AppColors.cyan, fontFamily: 'monospace')),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                decoration: BoxDecoration(color: AppColors.emerald.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                child: Text(t.growth, style: const TextStyle(fontSize: 10, color: AppColors.emerald, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(t.summary, style: TextStyle(fontSize: 12, color: AppColors.textSecondary), maxLines: 3, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => _showTrendDetail(context, t),
                  child: const Text('View details'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.pink),
                  onPressed: () {
                    context.read<AppState>().setActiveTab(ViewTab.ai);
                  },
                  child: const Text('Adapt with AI'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showTrendDetail(BuildContext context, TrendItem t) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(t.topic, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const SizedBox(height: 12),
                _detailRow('Why it works', t.whyItWorks),
                _detailRow('Hook formula', t.hookFormula),
                _detailRow("Lean's adaptation", t.leanAdaptation),
                _detailRow('Volume', t.volume),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    if (value.isEmpty) return const SizedBox();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.cyan, letterSpacing: 0.5)),
          const SizedBox(height: 4),
          Text(value, style: TextStyle(fontSize: 13, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
