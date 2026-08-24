import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// Bottom sheet form to create a new post/draft. A lighter-weight stand-in
/// for the web app's `ScheduleModal` (video upload/processing is out of scope
/// here — this creates text/metadata posts you can later attach media to
/// from the backend or web app).
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
  final _titleCtrl = TextEditingController();
  final _captionCtrl = TextEditingController();
  final _hashtagsCtrl = TextEditingController(text: '#tech #creatoros');
  String _category = kContentCategories.first;
  final Set<String> _platforms = {'tiktok', 'instagram'};
  bool _saving = false;

  static const _allPlatforms = ['tiktok', 'instagram', 'youtube', 'facebook'];

  @override
  void dispose() {
    _titleCtrl.dispose();
    _captionCtrl.dispose();
    _hashtagsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save(String status) async {
    if (_titleCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Give your post a title first')));
      return;
    }
    if (_platforms.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pick at least one platform')));
      return;
    }
    setState(() => _saving = true);
    final state = context.read<AppState>();
    final hashtags = _hashtagsCtrl.text.split(RegExp(r'\s+')).where((h) => h.isNotEmpty).toList();
    final result = await state.addPost({
      'title': _titleCtrl.text.trim(),
      'category': _category,
      'platforms': _platforms.toList(),
      'status': status,
      'caption': _captionCtrl.text.trim(),
      'hashtags': hashtags,
      'thumbnailUrl': '',
      if (status == 'scheduled') 'scheduledDate': DateTime.now().toIso8601String().split('T')[0],
      if (status == 'scheduled') 'scheduledTime': '10:00 AM',
    });
    if (mounted) {
      setState(() => _saving = false);
      if (result != null) Navigator.of(context).pop();
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
            const Text('Create Post', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 16),
            TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _category,
              dropdownColor: AppColors.surface,
              decoration: const InputDecoration(labelText: 'Content pillar'),
              items: kContentCategories.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis))).toList(),
              onChanged: (v) => setState(() => _category = v ?? _category),
            ),
            const SizedBox(height: 12),
            const Text('Platforms', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
            const SizedBox(height: 6),
            Wrap(
              spacing: 8,
              children: _allPlatforms.map((p) {
                final selected = _platforms.contains(p);
                return FilterChip(
                  label: Text(p),
                  selected: selected,
                  onSelected: (v) => setState(() => v ? _platforms.add(p) : _platforms.remove(p)),
                  selectedColor: AppColors.pink.withValues(alpha: 0.25),
                  checkmarkColor: AppColors.pink,
                  backgroundColor: AppColors.background,
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            TextField(controller: _captionCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Caption')),
            const SizedBox(height: 12),
            TextField(controller: _hashtagsCtrl, decoration: const InputDecoration(labelText: 'Hashtags (space separated)')),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _saving ? null : () => _save('draft'),
                    child: const Text('Save as draft'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(backgroundColor: AppColors.pink),
                    onPressed: _saving ? null : () => _save('scheduled'),
                    child: _saving
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Schedule'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
