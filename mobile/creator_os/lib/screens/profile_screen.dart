import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/metric_utils.dart';
import '../widgets/accounts/connected_accounts_sheet.dart';
import '../widgets/thumb_image.dart';
import 'edit_profile_screen.dart';

/// Profile Settings: avatar, name, follower/platform stats, and a grouped
/// settings list. Pushed from the profile avatar in the AppBar (the shield
/// icon next to it keeps opening [ConnectedAccountsSheet] directly).
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  static const _avatarUrl =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  Future<void> _pickAvatar(BuildContext context) async {
    final state = context.read<AppState>();
    try {
      final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1024, imageQuality: 85);
      if (file == null) return;
      await state.setAvatarPath(file.path);
    } catch (e) {
      state.showToast('Could not open your gallery', 'error');
    }
  }

  void _showThemePicker(BuildContext context, AppState state) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) {
        Widget option(String label, IconData icon, bool light) {
          final selected = AppColors.isLight == light;
          return ListTile(
            onTap: () {
              state.setLightTheme(light);
              Navigator.of(sheetContext).pop();
            },
            leading: Icon(icon, color: AppColors.pink),
            title: Text(label, style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
            trailing: selected ? Icon(Icons.check_circle, color: AppColors.pink) : null,
          );
        }

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Text(
                    'APP THEME',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1),
                  ),
                ),
                option('Default', Icons.dark_mode_outlined, false),
                option('Light Blue', Icons.light_mode_outlined, true),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    final connected = state.socialAccounts.where((a) => a.connected).toList();
    final totalFollowers = connected.fold<double>(0, (sum, a) => sum + parseMetric(a.followers));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _TopBar(state: state),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    _ProfileHeader(
                      avatarUrl: state.avatarPath.isNotEmpty ? state.avatarPath : _avatarUrl,
                      name: state.displayName,
                      subtitle: 'Content Creator · Microsoft Student Ambassador',
                      onEditAvatar: () => _pickAvatar(context),
                    ),
                    const SizedBox(height: 18),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: _StatsRow(
                        followers: formatMetric(totalFollowers),
                        platforms: '${connected.length} Platform${connected.length == 1 ? '' : 's'}',
                      ),
                    ),
                    const SizedBox(height: 28),
                    const _SectionLabel('ACCOUNT'),
                    _SettingsTile(
                      icon: Icons.person_outline,
                      label: 'Edit Profile',
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                      ),
                    ),
                    _ToggleTile(
                      icon: Icons.notifications_none_rounded,
                      label: 'Notifications',
                      value: state.notificationsEnabled,
                      onChanged: (value) => state.setNotificationsEnabled(value),
                    ),
                    _SettingsTile(
                      icon: Icons.lock_outline_rounded,
                      label: 'Privacy & Security',
                      onTap: () => ConnectedAccountsSheet.show(context),
                    ),
                    const SizedBox(height: 20),
                    const _SectionLabel('PREFERENCES'),
                    _SettingsTile(
                      icon: Icons.bar_chart_rounded,
                      label: 'Creator Analytics',
                      onTap: () {
                        state.setActiveTab(ViewTab.analytics);
                        Navigator.of(context).pop();
                      },
                    ),
                    _SettingsTile(
                      icon: Icons.palette_outlined,
                      label: 'App Theme',
                      onTap: () => _showThemePicker(context, state),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.state});

  final AppState state;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          _CircleIconButton(
            icon: Icons.chevron_left,
            onTap: () => Navigator.of(context).maybePop(),
          ),
          Expanded(
            child: Text(
              'Profile Settings',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700),
            ),
          ),
          _CircleIconButton(
            icon: Icons.settings_outlined,
            onTap: () => state.showToast('More settings are coming soon', 'info'),
          ),
        ],
      ),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      shape: const CircleBorder(),
      child: InkWell(
        customBorder: const CircleBorder(),
        onTap: onTap,
        child: SizedBox(
          width: 36,
          height: 36,
          child: Icon(icon, color: AppColors.textPrimary, size: 20),
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({
    required this.avatarUrl,
    required this.name,
    required this.subtitle,
    required this.onEditAvatar,
  });

  final String avatarUrl;
  final String name;
  final String subtitle;
  final VoidCallback onEditAvatar;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            GestureDetector(
              onTap: onEditAvatar,
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.pink, width: 2),
                ),
                padding: const EdgeInsets.all(2),
                child: ClipOval(
                  child: ThumbImage(url: avatarUrl, fit: BoxFit.cover),
                ),
              ),
            ),
            Positioned(
              right: -2,
              bottom: -2,
              child: GestureDetector(
                onTap: onEditAvatar,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.pink,
                    border: Border.all(color: AppColors.background, width: 3),
                  ),
                  child: const Icon(Icons.edit, size: 13, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Text(name, style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 12.5),
        ),
      ],
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.followers, required this.platforms});

  final String followers;
  final String platforms;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _Pill(icon: Icons.groups_rounded, label: '$followers Followers'),
        const SizedBox(width: 10),
        _Pill(icon: Icons.bolt_rounded, label: platforms, accented: true),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.icon, required this.label, this.accented = false});

  final IconData icon;
  final String label;
  final bool accented;

  @override
  Widget build(BuildContext context) {
    final color = accented ? AppColors.pink : AppColors.textSecondary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: accented ? AppColors.pink : AppColors.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 8),
      child: Text(
        text,
        style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.1),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({required this.icon, required this.label, this.onTap});

  final IconData icon;
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: AppColors.pink.withValues(alpha: 0.15), shape: BoxShape.circle),
                  child: Icon(icon, size: 18, color: AppColors.pink),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(color: AppColors.textPrimary, fontSize: 14.5, fontWeight: FontWeight.w600),
                  ),
                ),
                Icon(Icons.chevron_right_rounded, color: AppColors.textSecondary, size: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ToggleTile extends StatelessWidget {
  const _ToggleTile({required this.icon, required this.label, required this.value, required this.onChanged});

  final IconData icon;
  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(color: AppColors.pink.withValues(alpha: 0.15), shape: BoxShape.circle),
                child: Icon(icon, size: 18, color: AppColors.pink),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 14.5, fontWeight: FontWeight.w600),
                ),
              ),
              Switch(value: value, activeThumbColor: AppColors.pink, onChanged: onChanged),
            ],
          ),
        ),
      ),
    );
  }
}
