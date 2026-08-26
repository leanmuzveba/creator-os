import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../utils/media_utils.dart';
import 'thumb_image.dart';

const List<String> _kSuggestedHashtags = ['#students', '#aitools', '#tech', '#studytok', '#learntocode'];
const List<String> _kAllPlatforms = ['tiktok', 'instagram', 'youtube', 'facebook'];

/// Bottom sheet form to create a post: title, media (picked from the device
/// gallery, with an on-device thumbnail + duration extracted), content pillar,
/// target platforms, schedule date/time, and caption with AI-enhance + quick
/// hashtags. Mirrors the web app's `ScheduleModal.tsx`.
class CreatePostSheet extends StatefulWidget {
  const CreatePostSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => const CreatePostSheet(),
    );
  }

  @override
  State<CreatePostSheet> createState() => _CreatePostSheetState();
}

class _CreatePostSheetState extends State<CreatePostSheet> {
  final _titleCtrl = TextEditingController(text: 'New Creator Post');
  final _captionCtrl =
      TextEditingController(text: 'These AI tools changed the way I study! \u{1F680} Save this for later!\n\n#students #aitools #tech');
  final _dateCtrl = TextEditingController(text: DateTime.now().toIso8601String().split('T')[0]);
  final _timeCtrl = TextEditingController(text: '10:00 AM');

  String _category = kContentCategories[2]; // 'Free Tech Resources', matching ScheduleModal's default
  final Set<String> _platforms = {'tiktok', 'instagram', 'youtube', 'facebook'};

  String _thumbnailUrl = '';
  String? _videoUrl;
  String _duration = '00:45';

  bool _saving = false;
  bool _loadingMedia = false;
  bool _aiGenerating = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _captionCtrl.dispose();
    _dateCtrl.dispose();
    _timeCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickMedia() async {
    final picker = ImagePicker();
    final file = await showModalBottomSheet<XFile?>(
      context: context,
      backgroundColor: AppColors.surfaceAlt,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.video_library, color: AppColors.pink),
              title: const Text('Choose video'),
              onTap: () async {
                final nav = Navigator.of(ctx);
                final picked = await picker.pickVideo(source: ImageSource.gallery);
                nav.pop(picked);
              },
            ),
            ListTile(
              leading: Icon(Icons.image, color: AppColors.pink),
              title: const Text('Choose photo'),
              onTap: () async {
                final nav = Navigator.of(ctx);
                final picked = await picker.pickImage(source: ImageSource.gallery);
                nav.pop(picked);
              },
            ),
          ],
        ),
      ),
    );
    if (file == null) return;

    setState(() => _loadingMedia = true);
    try {
      final processed = await processMediaFile(file);
      setState(() {
        _titleCtrl.text = processed.title;
        _thumbnailUrl = processed.thumbnailUrl;
        _duration = processed.duration;
        _videoUrl = processed.videoUrl;
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Media loaded into post creator!')));
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not load media file')));
    } finally {
      if (mounted) setState(() => _loadingMedia = false);
    }
  }

  void _addHashtag(String tag) {
    if (_captionCtrl.text.contains(tag)) return;
    _captionCtrl.text = _captionCtrl.text.isEmpty ? tag : '${_captionCtrl.text} $tag';
  }

  Future<void> _aiEnhanceCaption() async {
    setState(() => _aiGenerating = true);
    try {
      final state = context.read<AppState>();
      final data = await state.api.generateAi({
        'type': 'scripts',
        'prompt': _titleCtrl.text.isNotEmpty ? _titleCtrl.text : (_captionCtrl.text.isNotEmpty ? _captionCtrl.text : _category),
        'category': _category,
        'platform': _platforms.isNotEmpty ? _platforms.first : 'tiktok',
      });
      final result = data['result'];
      final caption = result is Map ? result['caption'] as String? : null;
      if (caption != null && caption.isNotEmpty) {
        setState(() => _captionCtrl.text = caption);
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AI enhanced caption generated! \u{2728}')));
      }
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AI enhancement failed')));
    } finally {
      if (mounted) setState(() => _aiGenerating = false);
    }
  }

  Future<void> _submit({required bool publishNow}) async {
    if (_titleCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please provide a title for the post')));
      return;
    }
    if (_platforms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pick at least one platform')));
      return;
    }
    setState(() => _saving = true);
    final state = context.read<AppState>();
    final hashtags = RegExp(r'#[a-zA-Z0-9_]+').allMatches(_captionCtrl.text).map((m) => m.group(0)!).toList();

    final result = await state.addPost({
      'title': _titleCtrl.text.trim(),
      'category': _category,
      'platforms': _platforms.toList(),
      'status': publishNow ? 'published' : 'scheduled',
      if (!publishNow) 'scheduledDate': _dateCtrl.text,
      if (!publishNow) 'scheduledTime': _timeCtrl.text,
      if (publishNow) 'publishedDate': DateTime.now().toIso8601String(),
      'caption': _captionCtrl.text,
      'hashtags': hashtags.isNotEmpty ? hashtags : ['#creatoros', '#tech'],
      'thumbnailUrl': _thumbnailUrl,
      if (_videoUrl != null) 'videoUrl': _videoUrl,
      'duration': _duration,
    });

    if (mounted) {
      setState(() => _saving = false);
      if (result != null) Navigator.of(context).pop();
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final initial = DateTime.tryParse(_dateCtrl.text) ?? now;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (picked != null) {
      setState(() => _dateCtrl.text = picked.toIso8601String().split('T')[0]);
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(context: context, initialTime: TimeOfDay.now());
    if (picked != null) {
      setState(() => _timeCtrl.text = picked.format(context));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.calendar_month, color: AppColors.pink, size: 18),
                const SizedBox(width: 8),
                Text('Multi-Platform Publishing', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                const Spacer(),
                IconButton(onPressed: () => Navigator.of(context).pop(), icon: const Icon(Icons.close, size: 18)),
              ],
            ),
            const SizedBox(height: 12),

            // Media card
            Text('Content Media', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(
                      width: 48,
                      height: 56,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Container(
                            color: Colors.black,
                            child: ThumbImage(url: _thumbnailUrl, placeholderBuilder: (_) => const Icon(Icons.image, size: 18, color: Colors.white38)),
                          ),
                          if (_videoUrl != null)
                            Positioned(bottom: 2, right: 2, child: Icon(Icons.videocam, size: 12, color: AppColors.pink)),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TextField(
                          controller: _titleCtrl,
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                          decoration: const InputDecoration(isDense: true, border: InputBorder.none, hintText: 'Enter video title...'),
                        ),
                        Text('$_duration • $_category', style: TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  OutlinedButton.icon(
                    onPressed: _loadingMedia ? null : _pickMedia,
                    icon: _loadingMedia
                        ? const SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.upload, size: 14),
                    label: Text(_loadingMedia ? 'Loading...' : 'Upload', style: const TextStyle(fontSize: 11)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      foregroundColor: AppColors.pink,
                      side: BorderSide(color: AppColors.pink),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            Text("Content Pillar", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            DropdownButtonFormField<String>(
              initialValue: _category,
              dropdownColor: AppColors.surface,
              decoration: const InputDecoration(isDense: true),
              items: kContentCategories.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis))).toList(),
              onChanged: (v) => setState(() => _category = v ?? _category),
            ),
            const SizedBox(height: 14),

            Text('Target Platforms', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            GridView.count(
              crossAxisCount: 4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 8,
              crossAxisSpacing: 8,
              childAspectRatio: 1.1,
              children: _kAllPlatforms.map((p) {
                final selected = _platforms.contains(p);
                return InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => setState(() {
                    if (selected) {
                      if (_platforms.length > 1) _platforms.remove(p);
                    } else {
                      _platforms.add(p);
                    }
                  }),
                  child: Container(
                    decoration: BoxDecoration(
                      color: selected ? AppColors.pink.withValues(alpha: 0.15) : AppColors.background,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: selected ? AppColors.pink : AppColors.border),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(_platformIcon(p), size: 18, color: selected ? AppColors.pink : AppColors.textSecondary),
                        const SizedBox(height: 4),
                        Text(p, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: selected ? AppColors.textPrimary : AppColors.textSecondary)),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 14),

            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Date', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _dateCtrl,
                        readOnly: true,
                        onTap: _pickDate,
                        style: const TextStyle(fontSize: 12),
                        decoration: const InputDecoration(isDense: true, suffixIcon: Icon(Icons.calendar_today, size: 14)),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Time', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _timeCtrl,
                        readOnly: true,
                        onTap: _pickTime,
                        style: const TextStyle(fontSize: 12),
                        decoration: const InputDecoration(isDense: true, suffixIcon: Icon(Icons.access_time, size: 14)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            Row(
              children: [
                Expanded(child: Text('Caption & Metadata', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.textSecondary))),
                TextButton.icon(
                  onPressed: _aiGenerating ? null : _aiEnhanceCaption,
                  icon: _aiGenerating
                      ? SizedBox(width: 12, height: 12, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.pink))
                      : Icon(Icons.auto_fix_high, size: 14, color: AppColors.pink),
                  label: Text(_aiGenerating ? 'AI Generating...' : 'AI Enhance', style: TextStyle(fontSize: 11, color: AppColors.pink)),
                ),
              ],
            ),
            TextField(
              controller: _captionCtrl,
              maxLines: 4,
              maxLength: 2200,
              style: const TextStyle(fontSize: 12),
              decoration: const InputDecoration(hintText: 'Write your caption with hashtags...'),
            ),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: _kSuggestedHashtags
                  .map((t) => ActionChip(
                        label: Text(t, style: const TextStyle(fontSize: 10)),
                        onPressed: () => _addHashtag(t),
                        backgroundColor: AppColors.background,
                        side: BorderSide(color: AppColors.border),
                      ))
                  .toList(),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _saving ? null : () => _submit(publishNow: true),
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.emerald, side: const BorderSide(color: AppColors.emerald)),
                    child: const Text('Publish Now'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: AppColors.pink),
                    onPressed: _saving ? null : () => _submit(publishNow: false),
                    child: _saving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Text('Schedule for ${_platforms.length} Platform${_platforms.length == 1 ? '' : 's'}'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  IconData _platformIcon(String p) {
    switch (p) {
      case 'tiktok':
        return Icons.music_note;
      case 'instagram':
        return Icons.camera_alt;
      case 'youtube':
        return Icons.play_arrow;
      case 'facebook':
        return Icons.thumb_up;
      default:
        return Icons.public;
    }
  }
}
