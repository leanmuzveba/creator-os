import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// Lets the user set their display name, age, and birthday, persisted via
/// [AppState.updateProfile] (backed by SharedPreferences).
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _ageController;
  DateTime? _birthday;

  @override
  void initState() {
    super.initState();
    final state = context.read<AppState>();
    _nameController = TextEditingController(text: state.displayName);
    _ageController = TextEditingController(text: state.age?.toString() ?? '');
    _birthday = state.birthday;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    super.dispose();
  }

  Future<void> _pickBirthday() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _birthday ?? DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(1900),
      lastDate: now,
    );
    if (picked != null) {
      setState(() => _birthday = picked);
    }
  }

  void _save() {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      context.read<AppState>().showToast('Name cannot be empty', 'error');
      return;
    }
    final age = int.tryParse(_ageController.text.trim());
    context.read<AppState>().updateProfile(name: name, age: age, birthday: _birthday);
    Navigator.of(context).maybePop();
  }

  String get _birthdayLabel {
    final b = _birthday;
    if (b == null) return 'Select birthday';
    return '${b.year}-${b.month.toString().padLeft(2, '0')}-${b.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
              child: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.chevron_left, color: AppColors.textPrimary),
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                  Expanded(
                    child: Text(
                      'Edit Profile',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textPrimary, fontSize: 17, fontWeight: FontWeight.w700),
                    ),
                  ),
                  TextButton(
                    onPressed: _save,
                    child: Text('Save', style: TextStyle(color: AppColors.pink, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _FieldLabel('Name'),
                    TextField(
                      controller: _nameController,
                      style: TextStyle(color: AppColors.textPrimary),
                      decoration: const InputDecoration(hintText: 'Your name'),
                    ),
                    const SizedBox(height: 20),
                    _FieldLabel('Age'),
                    TextField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      style: TextStyle(color: AppColors.textPrimary),
                      decoration: const InputDecoration(hintText: 'Your age'),
                    ),
                    const SizedBox(height: 20),
                    _FieldLabel('Birthday'),
                    InkWell(
                      onTap: _pickBirthday,
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.cake_outlined, size: 18, color: AppColors.textSecondary),
                            const SizedBox(width: 10),
                            Text(
                              _birthdayLabel,
                              style: TextStyle(color: _birthday == null ? AppColors.textSecondary : AppColors.textPrimary),
                            ),
                          ],
                        ),
                      ),
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

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.0),
      ),
    );
  }
}
