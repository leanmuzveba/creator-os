import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme/app_theme.dart';

/// Gates [child] behind Creator OS login, but only when the backend reports
/// `REQUIRE_AUTH` is on (`/api/config`) — which defaults off, so by default
/// this shows [child] immediately with no login screen at all, same as
/// before multi-tenancy existed. Mirrors `src/components/AuthGate.tsx`.
///
/// Placed after the splash screen in `main.dart`'s `_RootSwitcher`, and
/// responsible for kicking off [AppState.loadInitialData] once the gate
/// resolves open/authenticated, so data fetching never starts against an
/// unauthenticated session.
class AuthGate extends StatefulWidget {
  final Widget child;
  const AuthGate({super.key, required this.child});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _checked = false;

  @override
  void initState() {
    super.initState();
    _runInitialCheck();
  }

  /// Runs once on startup: asks the backend whether login is required at
  /// all, and if so, whether a session is already present (e.g. from a
  /// previous run — the session cookie persists across app restarts). After
  /// this, [AppState.requireAuth]/[AppState.authUser] are the source of
  /// truth (also updated by [AppState.logout]), and `build` just watches them.
  Future<void> _runInitialCheck() async {
    final state = context.read<AppState>();
    bool requireAuth = false;
    Map<String, dynamic>? user;
    try {
      requireAuth = await state.api.getRequireAuth();
      if (requireAuth) {
        user = await state.api.getCurrentUser();
      }
    } catch (_) {
      // If the config check itself fails, fail open to the app's existing
      // no-login behavior rather than stranding the user on a dead screen.
      requireAuth = false;
    }
    if (!mounted) return;
    state.setAuthState(requireAuth: requireAuth, user: user);
    setState(() => _checked = true);
    if (!requireAuth || user != null) {
      state.loadInitialData();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_checked) {
      return Scaffold(backgroundColor: AppColors.background);
    }
    final state = context.watch<AppState>();
    if (state.requireAuth && state.authUser == null) {
      // Reached on first login and again after a Log Out (AppState.logout
      // clears authUser, which rebuilds this via the watch above).
      return AuthFormsScreen(onAuthenticated: () => state.loadInitialData());
    }
    return widget.child;
  }
}

/// Login/signup form shown when `REQUIRE_AUTH` is on and no session is
/// present. Mirrors the web `AuthForms` component in `AuthGate.tsx`.
class AuthFormsScreen extends StatefulWidget {
  final VoidCallback onAuthenticated;
  const AuthFormsScreen({super.key, required this.onAuthenticated});

  @override
  State<AuthFormsScreen> createState() => _AuthFormsScreenState();
}

class _AuthFormsScreenState extends State<AuthFormsScreen> {
  bool _isLogin = true;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  String? _error;
  bool _submitting = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      setState(() => _error = 'Email and password are required');
      return;
    }
    setState(() {
      _error = null;
      _submitting = true;
    });
    final state = context.read<AppState>();
    try {
      final user = _isLogin
          ? await state.api.login(email, password)
          : await state.api.signup(email, password, _nameController.text.trim());
      if (!mounted) return;
      state.setAuthState(requireAuth: true, user: user);
      widget.onAuthenticated();
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Creator OS',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textPrimary, fontSize: 26, fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  _isLogin ? 'Log in to your account' : 'Create your account',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 32),
                if (!_isLogin) ...[
                  _FieldLabel('NAME'),
                  TextField(
                    controller: _nameController,
                    style: TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(hintText: 'Your name'),
                  ),
                  const SizedBox(height: 18),
                ],
                _FieldLabel('EMAIL'),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  style: TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(hintText: 'you@example.com'),
                ),
                const SizedBox(height: 18),
                _FieldLabel('PASSWORD'),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  style: TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: _isLogin ? 'Your password' : 'At least 8 characters',
                  ),
                  onSubmitted: (_) => _submit(),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: TextStyle(color: AppColors.red, fontSize: 13)),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.pink,
                      foregroundColor: AppColors.accentText,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      _submitting ? 'Please wait...' : (_isLogin ? 'Log In' : 'Sign Up'),
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: TextButton(
                    onPressed: _submitting
                        ? null
                        : () => setState(() {
                              _isLogin = !_isLogin;
                              _error = null;
                            }),
                    child: Text.rich(
                      TextSpan(
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                        children: [
                          TextSpan(text: _isLogin ? "Don't have an account? " : 'Already have an account? '),
                          TextSpan(
                            text: _isLogin ? 'Sign up' : 'Log in',
                            style: TextStyle(color: AppColors.pink, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
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
