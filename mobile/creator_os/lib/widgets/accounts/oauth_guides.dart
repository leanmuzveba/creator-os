import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/app_theme.dart';
import '../../utils/oauth_config.dart';

/// A labeled, monospace, copy-to-clipboard value row. Mirrors the web app's
/// `CopyField` used throughout the platform setup guides.
class CopyField extends StatelessWidget {
  final String? label;
  final String value;
  final Color valueColor;

  const CopyField({super.key, this.label, required this.value, this.valueColor = AppColors.pink});

  Future<void> _copy(BuildContext context) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied to clipboard!'), duration: Duration(seconds: 2)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(label!, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
          const SizedBox(height: 3),
        ],
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
          child: Row(
            children: [
              Expanded(
                child: Text(value, style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: valueColor)),
              ),
              InkWell(
                onTap: () => _copy(context),
                borderRadius: BorderRadius.circular(6),
                child: const Padding(
                  padding: EdgeInsets.all(4),
                  child: Icon(Icons.copy, size: 14, color: AppColors.textSecondary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Numbered step heading used within a guide card.
class StepHeading extends StatelessWidget {
  final int n;
  final String text;
  final Color badgeColor;
  const StepHeading({super.key, required this.n, required this.text, this.badgeColor = AppColors.pink});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 16,
          height: 16,
          margin: const EdgeInsets.only(top: 1, right: 6),
          decoration: BoxDecoration(color: badgeColor, shape: BoxShape.circle),
          child: Center(child: Text('$n', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white))),
        ),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary))),
      ],
    );
  }
}

class GuideCard extends StatelessWidget {
  final List<Widget> children;
  final Color? bg;
  final Color? borderColor;
  const GuideCard({super.key, required this.children, this.bg, this.borderColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bg ?? AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor ?? AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
    );
  }
}

class GuideActions extends StatelessWidget {
  final String portalUrl;
  final String portalLabel;
  final VoidCallback onEnable;
  final String enableLabel;
  const GuideActions({super.key, required this.portalUrl, required this.portalLabel, required this.onEnable, required this.enableLabel});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => launchUrl(Uri.parse(portalUrl), mode: LaunchMode.externalApplication),
            icon: const Icon(Icons.open_in_new, size: 16),
            label: Text(portalLabel),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: AppColors.pink),
            onPressed: onEnable,
            icon: const Icon(Icons.auto_awesome, size: 16),
            label: Text(enableLabel),
          ),
        ),
      ],
    );
  }
}

class GuideHeader extends StatelessWidget {
  final String title;
  final Color color;
  final VoidCallback onBack;
  const GuideHeader({super.key, required this.title, required this.color, required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.vpn_key, size: 16, color: color),
        const SizedBox(width: 6),
        Expanded(child: Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color))),
        TextButton(onPressed: onBack, child: const Text('Back', style: TextStyle(fontSize: 12, color: AppColors.textSecondary))),
      ],
    );
  }
}

/// Setup guide for TikTok for Developers. Mirrors `accounts/TikTokGuide.tsx`.
class TikTokGuide extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback onEnable;
  const TikTokGuide({super.key, required this.onBack, required this.onEnable});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GuideHeader(title: 'TikTok for Developers — OAuth Setup', color: AppColors.pink, onBack: onBack),
          const SizedBox(height: 12),
          const Text(
            'Connect your TikTok Developer App by adding these exact redirect URLs and scopes to your TikTok Developer Console:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 12),
          GuideCard(children: const [
            StepHeading(n: 1, text: 'Add Callback Redirect URLs in TikTok App Settings'),
            SizedBox(height: 8),
            CopyField(label: 'Development Redirect URI', value: kTiktokDevCallbackUrl),
            SizedBox(height: 8),
            CopyField(label: 'Shared / Deployed Redirect URI', value: kTiktokSharedCallbackUrl),
          ]),
          GuideCard(children: const [
            StepHeading(n: 2, text: 'Required TikTok OAuth Scopes'),
            SizedBox(height: 8),
            CopyField(value: kTiktokScopes),
          ]),
          GuideCard(children: const [
            StepHeading(n: 3, text: 'Set Keys on the Backend'),
            SizedBox(height: 6),
            Text('Add these to the server\'s environment variables:', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
            SizedBox(height: 6),
            Text('TIKTOK_CLIENT_KEY=your_client_key\nTIKTOK_CLIENT_SECRET=your_client_secret',
                style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.pink)),
          ]),
          GuideCard(
            bg: const Color(0x1AF59E0B),
            borderColor: const Color(0x33F59E0B),
            children: const [
              StepHeading(n: 4, text: 'Why TikTok Sandbox creates a demo account', badgeColor: Color(0xFFF59E0B)),
              SizedBox(height: 6),
              Text(
                'TikTok sandbox apps automatically simulate a virtual demo user unless you add your real TikTok username under Sandbox → Target Users in the TikTok Developer Portal and accept the invite.',
                style: TextStyle(fontSize: 11, color: Color(0xFFFCD34D), height: 1.4),
              ),
            ],
          ),
          const SizedBox(height: 4),
          GuideActions(
            portalUrl: 'https://developers.tiktok.com/',
            portalLabel: 'Open TikTok Developer Portal',
            onEnable: onEnable,
            enableLabel: 'Enable Sandbox Connected Mode',
          ),
        ],
      ),
    );
  }
}

/// Setup guide for Instagram + Facebook via Meta for Developers. Mirrors `accounts/MetaGuide.tsx`.
class MetaGuide extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback onEnable;
  const MetaGuide({super.key, required this.onBack, required this.onEnable});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GuideHeader(title: 'Meta for Developers — Instagram & Facebook Setup', color: AppColors.pink, onBack: onBack),
          const SizedBox(height: 12),
          const Text(
            'Connect your Meta Developer App to link real Instagram Creator/Business accounts and Facebook Pages:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 12),
          GuideCard(children: const [
            StepHeading(n: 1, text: 'Set App Domains & Website in Meta Basic Settings'),
            SizedBox(height: 8),
            CopyField(label: 'App Domains', value: kAppDomain, valueColor: AppColors.emerald),
            SizedBox(height: 8),
            CopyField(label: 'Website Platform URL (Site URL)', value: kSiteUrl, valueColor: AppColors.emerald),
            SizedBox(height: 8),
            CopyField(label: 'Privacy Policy URL (required for Live Mode)', value: kPrivacyPolicyUrl, valueColor: AppColors.cyan),
            SizedBox(height: 8),
            CopyField(label: 'Terms of Service URL (optional)', value: kTermsUrl, valueColor: AppColors.cyan),
          ]),
          GuideCard(children: const [
            StepHeading(n: 2, text: 'Add Valid OAuth Redirect URIs in Facebook Login Settings'),
            SizedBox(height: 8),
            CopyField(label: 'Instagram Callback URI', value: kMetaIgDevCallbackUrl),
            SizedBox(height: 8),
            CopyField(label: 'Facebook Callback URI', value: kMetaFbDevCallbackUrl, valueColor: AppColors.blue),
          ]),
          GuideCard(children: const [
            StepHeading(n: 3, text: 'Set Keys on the Backend'),
            SizedBox(height: 6),
            Text('META_APP_ID=your_app_id\nMETA_APP_SECRET=your_app_secret',
                style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.pink)),
          ]),
          GuideCard(children: const [
            StepHeading(n: 4, text: 'Meta Graph API Scopes'),
            SizedBox(height: 8),
            CopyField(value: kMetaScopes),
          ]),
          const SizedBox(height: 4),
          GuideActions(
            portalUrl: 'https://developers.facebook.com/apps/',
            portalLabel: 'Open Meta Developer Portal',
            onEnable: onEnable,
            enableLabel: 'Toggle Meta Accounts Online',
          ),
        ],
      ),
    );
  }
}

/// Setup guide for YouTube via Google Cloud Console. Mirrors `accounts/YouTubeGuide.tsx`.
class YouTubeGuide extends StatelessWidget {
  final VoidCallback onBack;
  final VoidCallback onEnable;
  const YouTubeGuide({super.key, required this.onBack, required this.onEnable});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GuideHeader(title: 'Google Cloud Console — YouTube API Setup', color: AppColors.red, onBack: onBack),
          const SizedBox(height: 12),
          const Text(
            'Connect a YouTube channel using Google OAuth 2.0 and YouTube Data API v3:',
            style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 12),
          GuideCard(children: const [
            StepHeading(n: 1, text: 'Add OAuth 2.0 Web Client in Google Cloud Console', badgeColor: AppColors.red),
            SizedBox(height: 8),
            CopyField(label: 'Authorized JavaScript Origins', value: kSiteUrl, valueColor: AppColors.red),
            SizedBox(height: 8),
            CopyField(label: 'Authorized Redirect URI (Development)', value: kYtDevCallbackUrl, valueColor: AppColors.red),
            SizedBox(height: 8),
            CopyField(label: 'Authorized Redirect URI (Shared / Preview)', value: kYtSharedCallbackUrl, valueColor: AppColors.red),
          ]),
          GuideCard(children: const [
            StepHeading(n: 2, text: 'Enable YouTube Data API v3', badgeColor: AppColors.red),
            SizedBox(height: 6),
            Text('In Google Cloud Console: APIs & Services → Library → search "YouTube Data API v3" → Enable.',
                style: TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.4)),
          ]),
          GuideCard(children: const [
            StepHeading(n: 3, text: 'Set Keys on the Backend', badgeColor: AppColors.red),
            SizedBox(height: 6),
            Text('GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com\nGOOGLE_CLIENT_SECRET=your_client_secret',
                style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.red)),
          ]),
          GuideCard(children: const [
            StepHeading(n: 4, text: 'OAuth Scopes', badgeColor: AppColors.red),
            SizedBox(height: 8),
            CopyField(value: kYtScopes, valueColor: AppColors.red),
          ]),
          const SizedBox(height: 4),
          GuideActions(
            portalUrl: 'https://console.cloud.google.com/apis/credentials',
            portalLabel: 'Google Cloud Credentials',
            onEnable: onEnable,
            enableLabel: 'Toggle YouTube Online',
          ),
        ],
      ),
    );
  }
}
