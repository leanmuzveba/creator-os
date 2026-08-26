import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../widgets/create_post_sheet.dart';
import '../widgets/post_card.dart';

/// Central content repository with search + status/category/platform filters.
/// Mirrors `src/views/ContentLibraryView.tsx`.
class ContentLibraryScreen extends StatefulWidget {
  const ContentLibraryScreen({super.key});

  @override
  State<ContentLibraryScreen> createState() => _ContentLibraryScreenState();
}

class _ContentLibraryScreenState extends State<ContentLibraryScreen> {
  String _statusFilter = 'all';
  String _query = '';

  static const _statuses = ['all', 'draft', 'scheduled', 'published'];

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();
    var posts = state.posts;
    if (_statusFilter != 'all') posts = posts.where((p) => p.status == _statusFilter).toList();
    if (_query.trim().isNotEmpty) {
      final q = _query.toLowerCase();
      posts = posts.where((p) => p.title.toLowerCase().contains(q) || p.category.toLowerCase().contains(q)).toList();
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      decoration: const InputDecoration(
                        hintText: 'Search content...',
                        prefixIcon: Icon(Icons.search, size: 18, color: AppColors.textSecondary),
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      onChanged: (v) => setState(() => _query = v),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    style: IconButton.styleFrom(backgroundColor: AppColors.pink),
                    onPressed: () => CreatePostSheet.show(context),
                    icon: const Icon(Icons.add, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              SizedBox(
                height: 32,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _statuses.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final s = _statuses[i];
                    final selected = _statusFilter == s;
                    return ChoiceChip(
                      label: Text(s == 'all' ? 'All' : s[0].toUpperCase() + s.substring(1)),
                      selected: selected,
                      onSelected: (_) => setState(() => _statusFilter = s),
                      selectedColor: AppColors.pink.withValues(alpha: 0.25),
                      labelStyle: TextStyle(color: selected ? AppColors.pink : AppColors.textSecondary, fontSize: 12),
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
              ? const Center(child: CircularProgressIndicator(color: AppColors.pink))
              : posts.isEmpty
                  ? const Center(child: Text('No content found', style: TextStyle(color: AppColors.textSecondary)))
                  : RefreshIndicator(
                      onRefresh: () => state.loadInitialData(),
                      child: GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                        itemCount: posts.length,
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 0.62,
                        ),
                        itemBuilder: (context, i) => PostCard(
                          post: posts[i],
                          onTap: () => _showPostActions(context, posts[i]),
                        ),
                      ),
                    ),
        ),
      ],
    );
  }

  void _showPostActions(BuildContext context, PostItem post) {
    final state = context.read<AppState>();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (sheetContext) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(post.title, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
              subtitle: Text('${post.category} • ${post.status}', style: const TextStyle(color: AppColors.textSecondary)),
            ),
            if (post.status != 'published')
              ListTile(
                leading: const Icon(Icons.publish, color: AppColors.emerald),
                title: const Text('Publish now', style: TextStyle(color: AppColors.textPrimary)),
                onTap: () {
                  Navigator.pop(sheetContext);
                  state.publishPostNow(post.id);
                },
              ),
            ListTile(
              leading: const Icon(Icons.delete_outline, color: AppColors.red),
              title: const Text('Delete', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () {
                Navigator.pop(sheetContext);
                state.deletePost(post.id);
              },
            ),
          ],
        ),
      ),
    );
  }
}
