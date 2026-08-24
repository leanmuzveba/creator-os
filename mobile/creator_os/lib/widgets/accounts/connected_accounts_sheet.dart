import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/models.dart';
import '../../state/app_state.dart';
import '../../theme/app_theme.dart';
import '../platform_icon.dart';
import 'oauth_guides.dart';

enum _GuideView { list, tiktok, meta, youtube }

/// Connected Accounts sheet: connect/disconnect social platforms via OAuth
/// (opening the system browser for the real authorization flow), fall back to
/// a platform setup guide when OAuth isn't configured on the backend yet, and
/// edit each account's handle/metrics inline. Mirrors `ConnectedAccountsModal.tsx`.
class ConnectedAccountsSheet extends StatefulWidget {
  const ConnectedAccountsSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surfaceAlt,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => const ConnectedAccountsSheet(),
    );
  }

  @override
  State<ConnectedAccountsSheet> createState() => _ConnectedAccountsSheetState();
}

class _ConnectedAccountsSheetState extends State<ConnectedAccountsSheet> {
  _GuideView _view = _GuideView.list;
  String? _editingId;
  String? _connectingId;

  final _handleCtrl = TextEditingController();
  final _followersCtrl = TextEditingController();
  final _viewsCtrl = TextEditingController();
  final _growthCtrl = TextEditingController();

  static const _oauthPlatforms = {'tiktok', 'instagram', 'facebook', 'youtube'};

  @override
  void dispose() {
    _handleCtrl.dispose();
    _followersCtrl.dispose();
    _viewsCtrl.dispose();
    _growthCtrl.dispose();
    super.dispose();
  }

  void _startEditing(SocialAccount a) {
    setState(() {
      _editingId = a.id;
      _handleCtrl.text = a.handle;
      _followersCtrl.text = a.followers;
      _viewsCtrl.text = a.views;
      _growthCtrl.text = a.viewsGrowth;
    });
  }

  Future<void> _saveStats(String id) async {
    final needsAt = !_handleCtrl.text.startsWith('@') && id != 'youtube' && id != 'facebook';
    final handle = needsAt ? '@${_handleCtrl.text}' : _handleCtrl.text;
    await context.read<AppState>().updateAccount(id, {
      'handle': handle,
      'followers': _followersCtrl.text,
      'views': _viewsCtrl.text,
      'viewsGrowth': _growthCtrl.text,
    });
    if (mounted) setState(() => _editingId = null);
  }

  Future<void> _connect(String id) async {
    final state = context.read<AppState>();
    if (!_oauthPlatforms.contains(id)) {
      state.toggleAccountConnection(id);
      return;
    }
    setState(() => _connectingId = id);
    try {
      final data = await state.api.getOAuthUrl(id);
      final configured = data['configured'] == true;
      final url = data['url'] as String?;
      if (configured && url != null && url.isNotEmpty) {
        final launched = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
        if (mounted) {
          state.showToast(
            launched
                ? 'Complete sign-in in your browser, then pull to refresh here.'
                : 'Could not open the browser for $id sign-in',
            launched ? 'info' : 'error',
          );
        }
      } else {
        _showGuideFor(id);
      }
    } catch (_) {
      _showGuideFor(id);
    } finally {
      if (mounted) setState(() => _connectingId = null);
    }
  }

  void _showGuideFor(String id) {
    setState(() {
      if (id == 'tiktok') {
        _view = _GuideView.tiktok;
      } else if (id == 'instagram' || id == 'facebook') {
        _view = _GuideView.meta;
      } else if (id == 'youtube') {
        _view = _GuideView.youtube;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return DraggableScrollableSheet(
      initialChildSize: 0.85,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) {
        return Column(
          children: [
            _header(context),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: _view == _GuideView.list
                    ? _accountsList(context, state, scrollController)
                    : SingleChildScrollView(controller: scrollController, child: _guideBody()),
              ),
            ),
            if (_view == _GuideView.list) _footer(context, state),
          ],
        );
      },
    );
  }

  Widget _guideBody() {
    switch (_view) {
      case _GuideView.tiktok:
        return TikTokGuide(
          onBack: () => setState(() => _view = _GuideView.list),
          onEnable: () {
            context.read<AppState>().toggleAccountConnection('tiktok');
            setState(() => _view = _GuideView.list);
          },
        );
      case _GuideView.meta:
        return MetaGuide(
          onBack: () => setState(() => _view = _GuideView.list),
          onEnable: () {
            context.read<AppState>().toggleAccountConnection('instagram');
            context.read<AppState>().toggleAccountConnection('facebook');
            setState(() => _view = _GuideView.list);
          },
        );
      case _GuideView.youtube:
        return YouTubeGuide(
          onBack: () => setState(() => _view = _GuideView.list),
          onEnable: () {
            context.read<AppState>().toggleAccountConnection('youtube');
            setState(() => _view = _GuideView.list);
          },
        );
      case _GuideView.list:
        return const SizedBox.shrink();
    }
  }

  Widget _header(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 12, 16),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.pink.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.verified_user, color: AppColors.pink, size: 20),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Social Account Connections', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                Text('OAuth credentials, API sync & publishing', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
          IconButton(onPressed: () => Navigator.of(context).pop(), icon: const Icon(Icons.close, color: AppColors.textSecondary)),
        ],
      ),
    );
  }

  Widget _accountsList(BuildContext context, AppState state, ScrollController scrollController) {
    if (state.isLoading && state.socialAccounts.isEmpty) {
      return ListView(
        controller: scrollController,
        children: const [
          Padding(
            padding: EdgeInsets.symmetric(vertical: 48),
            child: Center(child: CircularProgressIndicator(color: AppColors.pink)),
          ),
        ],
      );
    }

    if (state.socialAccounts.isEmpty) {
      return ListView(
        controller: scrollController,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 8),
            child: Column(
              children: [
                const Icon(Icons.cloud_off, size: 32, color: AppColors.textSecondary),
                const SizedBox(height: 10),
                const Text(
                  "Couldn't load your connected accounts.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Check that the backend is reachable, then try again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 14),
                FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.pink),
                  onPressed: () => state.loadInitialData(),
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView(
      controller: scrollController,
      children: [
        ...state.socialAccounts.map((a) => _accountRow(context, a)),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.pink.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.pink.withValues(alpha: 0.2)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: const [
                Icon(Icons.shield_outlined, size: 14, color: AppColors.pink),
                SizedBox(width: 6),
                Text('Official API Integration Status', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.pink)),
              ]),
              const SizedBox(height: 4),
              const Text(
                'Official Content Posting APIs and OAuth scopes active for TikTok Content API, Meta Graph API (Instagram & Facebook), and YouTube Data API v3.',
                style: TextStyle(fontSize: 10, color: AppColors.textSecondary, height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _accountRow(BuildContext context, SocialAccount a) {
    final isEditing = _editingId == a.id;
    final isConnecting = _connectingId == a.id;
    final isMeta = a.id == 'instagram' || a.id == 'facebook';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Stack(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
                    child: PlatformIcon(platform: a.id, size: 20),
                  ),
                  if (a.connected)
                    Positioned(
                      right: -1,
                      bottom: -1,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(color: AppColors.emerald, shape: BoxShape.circle, border: Border.all(color: AppColors.surface, width: 2)),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(a.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: a.connected ? AppColors.emerald.withValues(alpha: 0.15) : Colors.white10,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(a.connected ? 'Connected' : 'Offline',
                              style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: a.connected ? AppColors.emerald : AppColors.textSecondary)),
                        ),
                      ],
                    ),
                    if (!isEditing) ...[
                      const SizedBox(height: 2),
                      Text(a.handle, style: const TextStyle(fontSize: 11, color: AppColors.pink, fontFamily: 'monospace')),
                      if (a.connected)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text('${a.followers} fans  •  ${a.viewsGrowth}',
                              style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                        ),
                    ],
                  ],
                ),
              ),
              if (!isEditing) ...[
                if (a.connected)
                  IconButton(
                    onPressed: () => _startEditing(a),
                    icon: const Icon(Icons.edit, size: 16, color: AppColors.textSecondary),
                    tooltip: 'Edit handle & metrics',
                    visualDensity: VisualDensity.compact,
                  ),
                if (a.id == 'tiktok' || isMeta || a.id == 'youtube')
                  IconButton(
                    onPressed: () => _showGuideFor(a.id),
                    icon: const Icon(Icons.vpn_key, size: 16, color: AppColors.textSecondary),
                    tooltip: 'Developer setup guide',
                    visualDensity: VisualDensity.compact,
                  ),
                SizedBox(
                  height: 30,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: a.connected ? Colors.white10 : AppColors.pink,
                      foregroundColor: a.connected ? AppColors.textSecondary : Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      textStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                    onPressed: isConnecting ? null : () => _connect(a.id),
                    child: isConnecting
                        ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text(a.connected ? 'Disconnect' : 'Connect'),
                  ),
                ),
              ],
            ],
          ),
          if (isEditing) _editForm(a.id),
        ],
      ),
    );
  }

  Widget _editForm(String id) {
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Update Real Handle & Live Stats', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.pink)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: _miniField('Handle', _handleCtrl, '@yourhandle')),
              const SizedBox(width: 8),
              Expanded(child: _miniField('Followers', _followersCtrl, 'e.g. 15.2K')),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: _miniField('Recent Views', _viewsCtrl, 'e.g. 45.8K')),
              const SizedBox(width: 8),
              Expanded(child: _miniField('Views Growth', _growthCtrl, 'e.g. +24.5%')),
            ]),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(onPressed: () => setState(() => _editingId = null), child: const Text('Cancel', style: TextStyle(fontSize: 11))),
                const SizedBox(width: 4),
                FilledButton(
                  style: FilledButton.styleFrom(backgroundColor: AppColors.pink, padding: const EdgeInsets.symmetric(horizontal: 12)),
                  onPressed: () => _saveStats(id),
                  child: const Text('Save Stats', style: TextStyle(fontSize: 11)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniField(String label, TextEditingController ctrl, String hint) {
    return TextField(
      controller: ctrl,
      style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontSize: 9),
        hintText: hint,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      ),
    );
  }

  Widget _footer(BuildContext context, AppState state) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.border))),
      child: Row(
        children: [
          TextButton.icon(
            onPressed: () {
              state.refreshAccounts();
              state.showToast('Tokens refreshed and synced with platform servers!');
            },
            icon: const Icon(Icons.sync, size: 16, color: AppColors.pink),
            label: const Text('Sync Live Metrics', style: TextStyle(color: AppColors.pink, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          const Spacer(),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.pink),
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }
}
