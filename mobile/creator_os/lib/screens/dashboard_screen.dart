import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/metric_utils.dart';
import '../widgets/platform_icon.dart';
import '../widgets/post_card.dart';

/// Home overview: headline stats across connected accounts, a views trend
/// chart, quick shortcuts, and recent content. Mirrors `src/views/DashboardView.tsx`.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _chartRange = '7d';
  List<Map<String, dynamic>> _chartData = [];
  bool _chartLoading = true;

  @override
  void initState() {
    super.initState();
    _loadChart();
  }

  Future<void> _loadChart() async {
    setState(() => _chartLoading = true);
    try {
      final state = context.read<AppState>();
      final data = await state.api.getAnalytics(range: _chartRange);
      final series = (data['viewSeries'] as List? ?? []).cast<Map<String, dynamic>>();
      if (mounted) setState(() => _chartData = series);
    } catch (_) {
      // Keep whatever we had; chart just stays empty.
    } finally {
      if (mounted) setState(() => _chartLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final totalViews = calculateTotalViews(state.socialAccounts);
    final recentPosts = state.posts.take(4).toList();

    return RefreshIndicator(
      onRefresh: () async {
        await context.read<AppState>().loadInitialData();
        await _loadChart();
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
        children: [
          const Text('Welcome back, Lean! 👋', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
          const SizedBox(height: 4),
          const Text("Here's what's happening across your connected platforms.", style: TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          _platformGrid(state.socialAccounts),
          const SizedBox(height: 20),
          _viewsChartCard(totalViews),
          const SizedBox(height: 20),
          _quickShortcuts(context),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Recent Content', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              TextButton(
                onPressed: () => state.setActiveTab(ViewTab.content),
                child: Text('View All (${state.posts.length})', style: const TextStyle(color: AppColors.pink, fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
          if (recentPosts.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: Text('No content yet — create your first post!', style: TextStyle(color: AppColors.textSecondary))),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: recentPosts.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.62,
              ),
              itemBuilder: (context, i) => PostCard(post: recentPosts[i]),
            ),
        ],
      ),
    );
  }

  Widget _platformGrid(List<SocialAccount> accounts) {
    SocialAccount? find(String id) => accounts.where((a) => a.id == id).cast<SocialAccount?>().firstWhere((_) => true, orElse: () => null);

    final defaults = {
      'tiktok': ('TikTok', '124.8K', '128.4K', '18.6%', 'Views'),
      'instagram': ('Instagram', '89.4K', '89.4K', '12.4%', 'Reach'),
      'youtube': ('YouTube', '56.7K', '56.7K', '9.3%', 'Views'),
      'facebook': ('Facebook', '23.1K', '23.1K', '6.8%', 'Reach'),
    };

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: defaults.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.55,
      ),
      itemBuilder: (context, i) {
        final id = defaults.keys.elementAt(i);
        final (name, defViews, defFollowers, defGrowth, label) = defaults[id]!;
        final acc = find(id);
        final connected = acc?.connected ?? false;

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      PlatformIcon(platform: id, size: 26),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                          if (connected)
                            const Text('Live', style: TextStyle(fontSize: 9, color: AppColors.emerald, fontFamily: 'monospace')),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(color: AppColors.emerald.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(4)),
                    child: Text('↑ ${acc?.viewsGrowth ?? defGrowth}', style: const TextStyle(fontSize: 9, color: AppColors.emerald, fontFamily: 'monospace')),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(acc?.views.isNotEmpty == true ? acc!.views : defViews,
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(label, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                      Text('${acc?.followers.isNotEmpty == true ? acc!.followers : defFollowers} fans',
                          style: const TextStyle(fontSize: 10, color: Color(0xFFF9A8D4), fontFamily: 'monospace')),
                    ],
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _viewsChartCard(double totalViews) {
    final colors = {
      'tiktok': AppColors.purple,
      'instagram': AppColors.pink,
      'youtube': AppColors.red,
      'facebook': AppColors.blue,
    };

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  children: [
                    const Text('Views Overview', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: AppColors.pink.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                      child: Text('${formatMetric(totalViews)} Total Views', style: const TextStyle(fontSize: 10, color: AppColors.pink, fontFamily: 'monospace')),
                    ),
                  ],
                ),
              ),
              DropdownButton<String>(
                value: _chartRange,
                dropdownColor: AppColors.surface,
                underline: const SizedBox(),
                style: const TextStyle(fontSize: 11, color: AppColors.textPrimary),
                items: const [
                  DropdownMenuItem(value: '7d', child: Text('Last 7 days')),
                  DropdownMenuItem(value: '14d', child: Text('Last 14 days')),
                  DropdownMenuItem(value: '30d', child: Text('Last 30 days')),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => _chartRange = v);
                  _loadChart();
                },
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 200,
            child: _chartLoading
                ? const Center(child: CircularProgressIndicator(color: AppColors.pink))
                : _chartData.isEmpty
                    ? const Center(child: Text('No data yet', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)))
                    : LineChart(
                        LineChartData(
                          gridData: FlGridData(show: true, drawVerticalLine: false, horizontalInterval: null, getDrawingHorizontalLine: (v) => const FlLine(color: Color(0xFF232742), strokeWidth: 1)),
                          titlesData: FlTitlesData(
                            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                reservedSize: 22,
                                interval: (_chartData.length / 4).clamp(1, double.infinity).floorToDouble(),
                                getTitlesWidget: (value, meta) {
                                  final i = value.toInt();
                                  if (i < 0 || i >= _chartData.length) return const SizedBox();
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 6),
                                    child: Text(_chartData[i]['date']?.toString() ?? '', style: const TextStyle(fontSize: 9, color: AppColors.textSecondary)),
                                  );
                                },
                              ),
                            ),
                          ),
                          borderData: FlBorderData(show: false),
                          lineTouchData: LineTouchData(
                            touchTooltipData: LineTouchTooltipData(
                              getTooltipColor: (_) => AppColors.background,
                            ),
                          ),
                          lineBarsData: colors.entries.map((entry) {
                            final key = entry.key;
                            return LineChartBarData(
                              isCurved: true,
                              color: entry.value,
                              barWidth: 2.5,
                              dotData: const FlDotData(show: false),
                              spots: [
                                for (int i = 0; i < _chartData.length; i++)
                                  FlSpot(i.toDouble(), (_chartData[i][key] as num?)?.toDouble() ?? 0),
                              ],
                            );
                          }).toList(),
                        ),
                      ),
          ),
          const SizedBox(height: 12),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 14,
            runSpacing: 6,
            children: colors.entries.map((e) {
              return Row(mainAxisSize: MainAxisSize.min, children: [
                Container(width: 8, height: 8, decoration: BoxDecoration(color: e.value, shape: BoxShape.circle)),
                const SizedBox(width: 5),
                Text(e.key[0].toUpperCase() + e.key.substring(1), style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ]);
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _quickShortcuts(BuildContext context) {
    final state = context.read<AppState>();
    return Column(
      children: [
        _shortcutCard(
          onTap: () => state.setActiveTab(ViewTab.ai),
          icon: Icons.auto_awesome,
          iconColor: AppColors.pink,
          title: 'AI Content Assistant',
          subtitle: "Generate high-retention hooks, scripts, shot lists & ideas.",
          gradientStart: AppColors.pink,
        ),
        const SizedBox(height: 10),
        _shortcutCard(
          onTap: () => state.setActiveTab(ViewTab.trends),
          icon: Icons.trending_up,
          iconColor: AppColors.cyan,
          title: 'Trend Intelligence',
          subtitle: 'Explore real-time viral formats and adapt them in 1 click.',
          gradientStart: AppColors.cyan,
        ),
      ],
    );
  }

  Widget _shortcutCard({
    required VoidCallback onTap,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required Color gradientStart,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: gradientStart.withValues(alpha: 0.3)),
          gradient: LinearGradient(colors: [gradientStart.withValues(alpha: 0.18), AppColors.surface]),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: iconColor.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(14), border: Border.all(color: iconColor.withValues(alpha: 0.4))),
              child: Icon(icon, color: iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Icon(Icons.arrow_outward, color: iconColor, size: 18),
          ],
        ),
      ),
    );
  }
}
