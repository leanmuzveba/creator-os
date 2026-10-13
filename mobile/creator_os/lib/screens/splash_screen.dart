import 'package:flutter/material.dart';

import '../theme/brand.dart';

/// Intro splash: logo mark, wordmark, "INITIALIZING PLATFORM" and a progress
/// bar that fills over [totalDuration], then [onFinished] fires.
class SplashScreen extends StatefulWidget {
  const SplashScreen({
    super.key,
    this.onFinished,
    this.totalDuration = const Duration(milliseconds: 2600),
  });

  /// Called once the entrance animation + progress bar finish.
  final VoidCallback? onFinished;

  /// How long the whole splash sequence runs before [onFinished] fires.
  final Duration totalDuration;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller =
      AnimationController(vsync: this, duration: widget.totalDuration);

  late final Animation<double> _fadeIn =
      CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.3, curve: Curves.easeOut));

  late final Animation<double> _progress =
      CurvedAnimation(parent: _controller, curve: const Interval(0.15, 1.0, curve: Curves.easeInOut));

  @override
  void initState() {
    super.initState();
    // Don't start the (wall-clock-based) animation until the first frame has
    // actually been painted. On a slow cold start (fresh debug install, weak
    // device) the engine can take several seconds to render anything at all —
    // starting the timer in initState lets it race ahead and finish before
    // the splash is ever visible, so it jumps straight to the app underneath.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _controller.forward().whenComplete(() => widget.onFinished?.call());
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Brand.theme,
      child: Scaffold(
        body: Stack(
          children: [
            const BrandGlow(),
            Center(
              child: FadeTransition(
                opacity: _fadeIn,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const LogoMark(size: 64),
                    const SizedBox(height: 20),
                    Text.rich(
                      const TextSpan(
                        children: [
                          TextSpan(text: 'Creator'),
                          TextSpan(text: 'OS', style: TextStyle(color: Brand.pink)),
                        ],
                      ),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        fontStyle: FontStyle.italic,
                        color: Brand.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'INITIALIZING PLATFORM',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 2,
                        color: Brand.pink.withValues(alpha: 0.9),
                      ),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: 140,
                      child: AnimatedBuilder(
                        animation: _progress,
                        builder: (context, _) => LinearProgressIndicator(
                          value: _progress.value,
                          minHeight: 4,
                          color: Brand.pink,
                          backgroundColor: Brand.surface,
                          borderRadius: const BorderRadius.all(Radius.circular(4)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const Positioned(left: 0, right: 0, bottom: 32, child: BrandFooter()),
          ],
        ),
      ),
    );
  }
}
