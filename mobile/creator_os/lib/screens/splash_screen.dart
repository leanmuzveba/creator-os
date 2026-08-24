// splash_screen.dart
//
// Reverse-engineered from a "CreatorOS" splash screen mockup.
// Faithfully recreates: dark navy background, floating sparkle accents,
// a pink sticker-style camera icon, an italic two-tone wordmark with an
// underline accent, an animated progress bar, an "INITIALIZING" label,
// and a "POWERED BY CREATOR OS" footer.

import 'package:flutter/material.dart';

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

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  // ---- Palette, lifted directly from the mockup ----------------------
  static const _bg = Color(0xFF0B1120); // page background
  static const _pink = Color(0xFFFF9DBB); // primary accent
  static const _slate = Color(0xFF1E293B); // dark camera/track details

  late final AnimationController _controller;

  // Sticker pop-in: scale 0.5 -> 1.0 with an overshoot, plus a fade.
  late final Animation<double> _stickerScale;
  late final Animation<double> _stickerOpacity;

  // Progress bar fill, runs across the whole duration.
  late final Animation<double> _progress;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.totalDuration,
    );

    _stickerScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 0.5, end: 1.06)
            .chain(CurveTween(curve: Curves.easeOutBack)),
        weight: 65,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.06, end: 1.0)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 35,
      ),
    ]).animate(_controller);

    _stickerOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.0, 0.35, curve: Curves.easeOut),
    );

    _progress = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.15, 1.0, curve: Curves.easeInOut),
    );

    // Don't start the (wall-clock-based) animation until the first frame has
    // actually been painted. On a slow cold start (fresh debug install, weak
    // device) the engine can take several seconds to render anything at all —
    // starting the timer in initState lets it race ahead and finish before
    // the splash is ever visible, so it jumps straight to the app underneath.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _controller.forward().whenComplete(() {
        widget.onFinished?.call();
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: _bg,
      body: Stack(
        children: [
          // ---- Floating sparkle accents ------------------------------
          Positioned(
            top: size.height * 0.25,
            left: 40,
            child: const _Sparkle(size: 24, color: _pink, opacity: 0.40),
          ),
          Positioned(
            bottom: size.height * 0.33,
            right: 48,
            child: const _Sparkle(size: 20, color: _pink, opacity: 0.30),
          ),
          Positioned(
            top: size.height * 0.5,
            right: 40,
            child: const _Sparkle(size: 32, color: _pink, opacity: 0.20),
          ),

          // ---- Center: icon + wordmark --------------------------------
          Center(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, child) => Opacity(
                opacity: _stickerOpacity.value,
                child: Transform.scale(
                  scale: _stickerScale.value,
                  child: child,
                ),
              ),
              child: const Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _CameraIcon(),
                  SizedBox(height: 16),
                  _Wordmark(),
                ],
              ),
            ),
          ),

          // ---- Bottom: progress bar + labels ---------------------------
          Positioned(
            left: 0,
            right: 0,
            bottom: 80,
            child: Column(
              children: [
                Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 200),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(999),
                      child: Container(
                        height: 6,
                        color: _slate,
                        alignment: Alignment.centerLeft,
                        child: AnimatedBuilder(
                          animation: _progress,
                          builder: (context, _) => FractionallySizedBox(
                            widthFactor: _progress.value.clamp(0.0, 1.0),
                            child: Container(color: _pink),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'INITIALIZING',
                  style: TextStyle(
                    fontFamily: 'Fredoka',
                    color: _pink,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 3,
                  ),
                ),
              ],
            ),
          ),

          Positioned(
            left: 0,
            right: 0,
            bottom: 32,
            child: Center(
              child: Text(
                'POWERED BY CREATOR OS',
                style: TextStyle(
                  fontFamily: 'Fredoka',
                  color: Colors.white.withValues(alpha: 0.20),
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// The pink "sticker" camera glyph: body, two top bumps, lens, and the
/// small red indicator dot.
class _CameraIcon extends StatelessWidget {
  const _CameraIcon();

  static const _pink = Color(0xFFFF9DBB);
  static const _slate = Color(0xFF1E293B);
  static const _dot = Color(0xFFFF4D6D);

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 176, // extra room for the top bumps, which overflow the body
      height: 128,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          // Camera body
          Positioned(
            top: 16,
            child: Container(
              width: 160,
              height: 112,
              decoration: BoxDecoration(
                color: _pink,
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.25),
                    blurRadius: 24,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
            ),
          ),

          // Viewfinder bump (top-left)
          Positioned(
            top: 4,
            left: 24,
            child: Container(
              width: 40,
              height: 16,
              decoration: const BoxDecoration(
                color: _slate,
                borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
              ),
            ),
          ),

          // Flash bump (top-right)
          Positioned(
            top: 0,
            right: 32,
            child: Container(
              width: 56,
              height: 20,
              decoration: const BoxDecoration(
                color: _slate,
                borderRadius: BorderRadius.vertical(top: Radius.circular(8)),
              ),
            ),
          ),

          // Small decorative square (top-left of body)
          Positioned(
            top: 32,
            left: 40,
            child: Container(
              width: 32,
              height: 24,
              decoration: BoxDecoration(
                color: _slate.withValues(alpha: 0.4),
                borderRadius: BorderRadius.circular(6),
              ),
            ),
          ),

          // Lens: white ring -> dark gradient glass -> highlight
          Positioned(
            top: 40,
            child: Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: _slate, width: 4),
                  gradient: const RadialGradient(
                    center: Alignment(-0.3, -0.3),
                    colors: [Color(0xFF3A3F4B), Colors.black],
                  ),
                ),
                child: Align(
                  alignment: const Alignment(-0.4, -0.4),
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.20),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Indicator dot (bottom-left of body)
          Positioned(
            bottom: 20,
            left: 40,
            child: Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                color: _dot,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// "CreatorOS" wordmark: italic, bold, "Creator" in pink and "OS" in
/// white, with a pink underline accent offset slightly to the right.
class _Wordmark extends StatelessWidget {
  const _Wordmark();

  static const _pink = Color(0xFFFF9DBB);

  @override
  Widget build(BuildContext context) {
    final baseStyle = const TextStyle(
      fontFamily: 'Fredoka',
      fontSize: 44,
      fontWeight: FontWeight.w700,
      fontStyle: FontStyle.italic,
      letterSpacing: -1,
      height: 1,
    );

    return Column(
      children: [
        RichText(
          text: TextSpan(
            style: baseStyle,
            children: [
              TextSpan(text: 'Creator', style: TextStyle(color: _pink)),
              const TextSpan(text: 'OS', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
        Transform.translate(
          offset: const Offset(16, -2),
          child: Container(
            width: 128,
            height: 8,
            decoration: BoxDecoration(
              color: _pink.withValues(alpha: 0.8),
              borderRadius: BorderRadius.circular(999),
            ),
          ),
        ),
      ],
    );
  }
}

/// A 4-point sparkle/star, matching the original SVG path
/// `M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z`.
class _Sparkle extends StatelessWidget {
  const _Sparkle({
    required this.size,
    required this.color,
    required this.opacity,
  });

  final double size;
  final Color color;
  final double opacity;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity,
      child: CustomPaint(
        size: Size(size, size),
        painter: _SparklePainter(color: color),
      ),
    );
  }
}

class _SparklePainter extends CustomPainter {
  _SparklePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    // Path coordinates below are from a 24x24 viewBox; scale to fit.
    final sx = size.width / 24;
    final sy = size.height / 24;

    final path = Path()
      ..moveTo(12 * sx, 0)
      ..lineTo(14.59 * sx, 9.41 * sy)
      ..lineTo(24 * sx, 12 * sy)
      ..lineTo(14.59 * sx, 14.59 * sy)
      ..lineTo(12 * sx, 24 * sy)
      ..lineTo(9.41 * sx, 14.59 * sy)
      ..lineTo(0, 12 * sy)
      ..lineTo(9.41 * sx, 9.41 * sy)
      ..close();

    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _SparklePainter oldDelegate) =>
      oldDelegate.color != color;
}
