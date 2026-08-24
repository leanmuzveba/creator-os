import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// AI content generator: ideas, hooks, scripts, and shot lists.
/// Mirrors `src/views/AiAssistantView.tsx`.
class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _promptCtrl = TextEditingController();
  String _type = 'ideas';
  String _category = kContentCategories.first;
  bool _loading = false;
  dynamic _result;
  bool _isMock = false;
  String? _error;

  static const _types = [
    ('ideas', 'Ideas', Icons.lightbulb_outline),
    ('hooks', 'Hooks', Icons.bolt_outlined),
    ('scripts', 'Scripts', Icons.description_outlined),
    ('shotlist', 'Shot List', Icons.movie_creation_outlined),
  ];

  @override
  void dispose() {
    _promptCtrl.dispose();
    super.dispose();
  }

  Future<void> _generate() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final state = context.read<AppState>();
    try {
      final res = await state.api.generateAi({
        'type': _type,
        'prompt': _promptCtrl.text.trim(),
        'category': _category,
      });
      setState(() {
        _result = res['result'];
        _isMock = res['isMock'] == true;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
      children: [
        Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: AppColors.pink.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.auto_awesome, color: AppColors.pink),
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Text('AI Content Assistant', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _types.map((t) {
            final (id, label, icon) = t;
            final selected = _type == id;
            return ChoiceChip(
              avatar: Icon(icon, size: 16, color: selected ? AppColors.pink : AppColors.textSecondary),
              label: Text(label),
              selected: selected,
              onSelected: (_) => setState(() => _type = id),
              selectedColor: AppColors.pink.withValues(alpha: 0.25),
              labelStyle: TextStyle(color: selected ? AppColors.pink : AppColors.textSecondary, fontSize: 12),
              backgroundColor: AppColors.surface,
            );
          }).toList(),
        ),
        const SizedBox(height: 14),
        DropdownButtonFormField<String>(
          initialValue: _category,
          dropdownColor: AppColors.surface,
          decoration: const InputDecoration(labelText: 'Content pillar'),
          items: kContentCategories.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis))).toList(),
          onChanged: (v) => setState(() => _category = v ?? _category),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _promptCtrl,
          maxLines: 3,
          decoration: const InputDecoration(labelText: 'Topic / prompt', hintText: 'e.g. "Free APIs every dev should know"'),
        ),
        const SizedBox(height: 14),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            style: FilledButton.styleFrom(backgroundColor: AppColors.pink, padding: const EdgeInsets.symmetric(vertical: 14)),
            onPressed: _loading ? null : _generate,
            child: _loading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Generate'),
          ),
        ),
        const SizedBox(height: 20),
        if (_error != null)
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.red.withValues(alpha: 0.3))),
            child: Text(_error!, style: const TextStyle(color: AppColors.red, fontSize: 12)),
          ),
        if (_result != null) ...[
          if (_isMock)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text('Showing curated fallback content (no AI key configured on the server)', style: TextStyle(fontSize: 11, color: AppColors.textSecondary.withValues(alpha: 0.8))),
            ),
          _ResultView(result: _result),
        ],
      ],
    );
  }
}

/// Renders the AI result generically: a list of cards for arrays,
/// key/value rows for objects — since the schema differs by generation type.
class _ResultView extends StatelessWidget {
  final dynamic result;
  const _ResultView({required this.result});

  @override
  Widget build(BuildContext context) {
    if (result is List) {
      return Column(
        children: (result as List)
            .map((item) => Padding(padding: const EdgeInsets.only(bottom: 10), child: _card(item)))
            .toList(),
      );
    }
    if (result is Map) {
      return _card(result);
    }
    return _card({'result': result.toString()});
  }

  Widget _card(dynamic item) {
    if (item is Map) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: item.entries.map<Widget>((e) {
            final key = e.key.toString();
            final value = e.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_titleCase(key), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.pink, letterSpacing: 0.4)),
                  const SizedBox(height: 2),
                  Text(_stringify(value), style: const TextStyle(fontSize: 12.5, color: AppColors.textPrimary)),
                ],
              ),
            );
          }).toList(),
        ),
      );
    }
    return Text(item.toString(), style: const TextStyle(color: AppColors.textPrimary));
  }

  String _stringify(dynamic value) {
    if (value is List) {
      return value.map((e) => e is Map ? e.values.join(' — ') : e.toString()).join('\n');
    }
    return value?.toString() ?? '';
  }

  String _titleCase(String key) {
    final spaced = key.replaceAllMapped(RegExp(r'([A-Z])'), (m) => ' ${m[1]}');
    return spaced[0].toUpperCase() + spaced.substring(1);
  }
}
