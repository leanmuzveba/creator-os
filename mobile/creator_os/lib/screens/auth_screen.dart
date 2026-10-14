import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme/app_theme.dart';
import '../theme/brand.dart';

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

/// Login/signup (+ forgot/reset password) shown when `REQUIRE_AUTH` is on
/// and no session is present. Mirrors the web `AuthForms` in `AuthGate.tsx`.
class AuthFormsScreen extends StatelessWidget {
  final VoidCallback onAuthenticated;
  const AuthFormsScreen({super.key, required this.onAuthenticated});

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Brand.theme,
      child: Scaffold(
        body: Stack(
          children: [
            SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 520),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        const SizedBox(height: 40),
                        const _Hero(),
                        const SizedBox(height: 32),
                        _AuthCard(onAuthenticated: onAuthenticated),
                        const SizedBox(height: 40),
                        const BrandFooter(),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(
          TextSpan(
            style: TextStyle(
              fontSize: 38,
              fontWeight: FontWeight.w800,
              height: 1.1,
              letterSpacing: -1,
              color: Brand.textPrimary,
            ),
            children: [
              TextSpan(text: 'Every creator\nneeds an\n'),
              TextSpan(
                text: 'Operating System.',
                style: TextStyle(color: Brand.pink, fontStyle: FontStyle.italic),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

enum _Mode { signIn, signUp, forgot, reset }

class _AuthCard extends StatefulWidget {
  const _AuthCard({required this.onAuthenticated});

  final VoidCallback onAuthenticated;

  @override
  State<_AuthCard> createState() => _AuthCardState();
}

class _AuthCardState extends State<_AuthCard> {
  _Mode _mode = _Mode.signIn;
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _code = TextEditingController();
  String? _error;
  String? _info;
  bool _submitting = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    _code.dispose();
    super.dispose();
  }

  void _switchTo(_Mode mode) => setState(() {
        _mode = mode;
        _password.clear();
        _error = null;
        _info = null;
      });

  Future<void> _submit() async {
    final email = _email.text.trim();
    final password = _password.text;
    final missing = switch (_mode) {
      _Mode.forgot => email.isEmpty,
      _Mode.reset => email.isEmpty || _code.text.trim().isEmpty || password.isEmpty,
      _ => email.isEmpty || password.isEmpty,
    };
    if (missing) {
      setState(() => _error = 'Please fill in every field');
      return;
    }
    setState(() {
      _error = null;
      _submitting = true;
    });
    final state = context.read<AppState>();
    try {
      if (_mode == _Mode.forgot) {
        final message = await state.api.forgotPassword(email);
        if (!mounted) return;
        _code.clear();
        _switchTo(_Mode.reset);
        setState(() => _info = message);
        return;
      }
      final user = switch (_mode) {
        _Mode.signIn => await state.api.login(email, password),
        _Mode.signUp => await state.api.signup(email, password, _name.text.trim()),
        _ => await state.api.resetPassword(email, _code.text.trim(), password),
      };
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
    final (title, subtitle, button) = switch (_mode) {
      _Mode.signIn => ('Welcome back!', 'Sign in to your CreatorOS dashboard.', 'Sign Into OS'),
      _Mode.signUp => ('Join the OS', 'Create your free CreatorOS account.', 'Create My Account'),
      _Mode.forgot => ('Forgot password?', "Enter your email and we'll send you a reset code.", 'Send Code'),
      _Mode.reset => ('Reset password', 'Enter the code from your email and choose a new password.', 'Reset & Sign In'),
    };
    final passwordLabel = switch (_mode) {
      _Mode.signUp => 'Create Password',
      _Mode.reset => 'New Password',
      _ => 'Password',
    };
    final narrow = MediaQuery.sizeOf(context).width < 480;

    return Container(
      padding: EdgeInsets.all(narrow ? 24 : 40),
      decoration: BoxDecoration(
        color: Brand.surface,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Brand.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 40, offset: const Offset(0, 20)),
        ],
      ),
      child: AnimatedSize(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        alignment: Alignment.topCenter,
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: Column(
            key: ValueKey(_mode),
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Brand.textPrimary)),
              const SizedBox(height: 8),
              Text(subtitle, style: TextStyle(fontSize: 15, color: Brand.textSecondary)),
              const SizedBox(height: 28),
              if (_mode == _Mode.signUp) ...[
                const _FieldLabel('Name'),
                _AuthField(controller: _name, hint: 'Your name', icon: Icons.person_outline_rounded),
                const SizedBox(height: 20),
              ],
              const _FieldLabel('Email Address'),
              _AuthField(
                controller: _email,
                hint: 'name@creator.com',
                icon: Icons.mail_outline_rounded,
                keyboardType: TextInputType.emailAddress,
                readOnly: _mode == _Mode.reset,
              ),
              if (_mode == _Mode.reset) ...[
                const SizedBox(height: 20),
                const _FieldLabel('Reset Code'),
                _AuthField(
                  controller: _code,
                  hint: '6-digit code',
                  icon: Icons.pin_outlined,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                ),
              ],
              if (_mode != _Mode.forgot) ...[
                const SizedBox(height: 20),
                _FieldLabel(
                  passwordLabel,
                  trailing: _mode == _Mode.signIn
                      ? GestureDetector(
                          onTap: _submitting ? null : () => _switchTo(_Mode.forgot),
                          child: Text(
                            'Forgot?',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Brand.pink),
                          ),
                        )
                      : null,
                ),
                _AuthField(
                  controller: _password,
                  hint: _mode == _Mode.signIn ? '••••••••' : 'At least 8 characters',
                  icon: Icons.lock_outline_rounded,
                  isPassword: true,
                  onSubmitted: (_) => _submit(),
                ),
              ],
              if (_info != null) ...[
                const SizedBox(height: 12),
                Text(_info!, style: TextStyle(color: Brand.textSecondary, fontSize: 13)),
              ],
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: TextStyle(color: Brand.red, fontSize: 13)),
              ],
              const SizedBox(height: 24),
              _PrimaryButton(label: _submitting ? 'Please wait...' : button, onPressed: _submitting ? null : _submit),
              const SizedBox(height: 28),
              if (_mode == _Mode.reset) ...[
                _SwitchPrompt(prompt: 'No code?', action: 'Send another', onTap: () => _switchTo(_Mode.forgot)),
                const SizedBox(height: 12),
              ],
              switch (_mode) {
                _Mode.signIn => _SwitchPrompt(
                    prompt: "Don't have an account?",
                    action: 'Create Account',
                    onTap: () => _switchTo(_Mode.signUp),
                  ),
                _Mode.signUp => _SwitchPrompt(
                    prompt: 'Already using CreatorOS?',
                    action: 'Sign In',
                    onTap: () => _switchTo(_Mode.signIn),
                  ),
                _ => _SwitchPrompt(prompt: '', action: 'Back to sign in', onTap: () => _switchTo(_Mode.signIn)),
              },
            ],
          ),
        ),
      ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel(this.text, {this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, right: 4, bottom: 8),
      child: Row(
        children: [
          Text(text, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Brand.label)),
          const Spacer(),
          ?trailing,
        ],
      ),
    );
  }
}

class _AuthField extends StatefulWidget {
  const _AuthField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.isPassword = false,
    this.readOnly = false,
    this.keyboardType,
    this.maxLength,
    this.onSubmitted,
  });

  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool isPassword;
  final bool readOnly;
  final TextInputType? keyboardType;
  final int? maxLength;
  final ValueChanged<String>? onSubmitted;

  @override
  State<_AuthField> createState() => _AuthFieldState();
}

class _AuthFieldState extends State<_AuthField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    OutlineInputBorder border(Color color, [double width = 1]) => OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: color, width: width),
        );
    return TextField(
      controller: widget.controller,
      obscureText: widget.isPassword && _obscure,
      readOnly: widget.readOnly,
      keyboardType: widget.keyboardType,
      maxLength: widget.maxLength,
      autocorrect: false,
      onSubmitted: widget.onSubmitted,
      style: TextStyle(color: Brand.textPrimary, fontSize: 16),
      decoration: InputDecoration(
        hintText: widget.hint,
        hintStyle: TextStyle(color: Brand.textMuted),
        counterText: '',
        filled: true,
        fillColor: Brand.background.withValues(alpha: 0.5),
        prefixIcon: Icon(widget.icon, size: 20, color: Brand.textMuted),
        suffixIcon: widget.isPassword
            ? IconButton(
                tooltip: _obscure ? 'Show password' : 'Hide password',
                icon: Icon(
                  _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  size: 20,
                  color: Brand.textMuted,
                ),
                onPressed: () => setState(() => _obscure = !_obscure),
              )
            : null,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        enabledBorder: border(Brand.border),
        focusedBorder: border(Brand.pink, 1.5),
      ),
    );
  }
}

/// Raised pink button that sinks onto its darker base when pressed.
class _PrimaryButton extends StatefulWidget {
  const _PrimaryButton({required this.label, required this.onPressed});

  final String label;
  final VoidCallback? onPressed;

  @override
  State<_PrimaryButton> createState() => _PrimaryButtonState();
}

class _PrimaryButtonState extends State<_PrimaryButton> {
  static const double _depth = 6;
  static const double _height = 56;
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    final down = _pressed || !enabled;
    return Semantics(
      button: true,
      enabled: enabled,
      child: GestureDetector(
        onTapDown: enabled ? (_) => setState(() => _pressed = true) : null,
        onTapCancel: () => setState(() => _pressed = false),
        onTapUp: enabled
            ? (_) {
                setState(() => _pressed = false);
                widget.onPressed!();
              }
            : null,
        child: SizedBox(
          height: _height + _depth,
          child: Stack(
            children: [
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: _height,
                child: DecoratedBox(
                  decoration: BoxDecoration(color: Brand.pinkDeep, borderRadius: BorderRadius.circular(16)),
                ),
              ),
              AnimatedPositioned(
                duration: const Duration(milliseconds: 80),
                left: 0,
                right: 0,
                top: down ? _depth : 0,
                height: _height,
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: enabled ? Brand.pink : Brand.pink.withValues(alpha: 0.7),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    widget.label,
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Brand.onPink),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SwitchPrompt extends StatelessWidget {
  const _SwitchPrompt({required this.prompt, required this.action, required this.onTap});

  final String prompt;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        if (prompt.isNotEmpty) Text('$prompt ', style: TextStyle(fontSize: 14, color: Brand.textSecondary)),
        GestureDetector(
          onTap: onTap,
          child: Text(action, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Brand.pink)),
        ),
      ],
    );
  }
}
