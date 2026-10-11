import 'package:flutter/material.dart';


class ArcadeSkyBackground extends StatefulWidget {
  final Widget child;
  const ArcadeSkyBackground({super.key, required this.child});

  @override
  State<ArcadeSkyBackground> createState() => _ArcadeSkyBackgroundState();
}

class _ArcadeSkyBackgroundState extends State<ArcadeSkyBackground>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 25),
    )..repeat();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // 1. Degradado vibrante de cielo azul (AWS Card Clash style)
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Color(0xFF0284C7), // Azul cielo intenso superior
                Color(0xFF38BDF8), // Cyan celeste brillante medio
                Color(0xFF7DD3FC), // Resplandor
                Color(0xFFBAE6FD), // Base suave de nubes
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              stops: [0.0, 0.45, 0.75, 1.0],
            ),
          ),
        ),

        // 2. Nubes animadas dinámicas
        AnimatedBuilder(
          animation: _animController,
          builder: (context, _) {
            return CustomPaint(
              painter: _CartoonCloudsPainter(progress: _animController.value),
              size: Size.infinite,
            );
          },
        ),

        // 3. Contenido hijo
        widget.child,
      ],
    );
  }
}

class _CartoonCloudsPainter extends CustomPainter {
  final double progress;
  _CartoonCloudsPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final cloudPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..style = PaintingStyle.fill;

    final shadowPaint = Paint()
      ..color = const Color(0xFF93C5FD).withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;

    // Dibujar varios cúmulos de nubes esponjosas estilo cartoon 3D
    _drawCloud(canvas, size, xOffset: (progress * size.width * 1.5) % (size.width + 300) - 150, y: size.height * 0.18, scale: 1.1, cloudPaint: cloudPaint, shadowPaint: shadowPaint);
    _drawCloud(canvas, size, xOffset: ((progress + 0.5) * size.width * 1.2) % (size.width + 300) - 150, y: size.height * 0.55, scale: 1.3, cloudPaint: cloudPaint, shadowPaint: shadowPaint);
    _drawCloud(canvas, size, xOffset: ((progress + 0.2) * size.width * 0.9) % (size.width + 300) - 150, y: size.height * 0.78, scale: 1.5, cloudPaint: cloudPaint, shadowPaint: shadowPaint);
  }

  void _drawCloud(
    Canvas canvas,
    Size size, {
    required double xOffset,
    required double y,
    required double scale,
    required Paint cloudPaint,
    required Paint shadowPaint,
  }) {
    canvas.save();
    canvas.translate(xOffset, y);
    canvas.scale(scale);

    // Sombra suave inferior de la nube
    canvas.drawCircle(const Offset(0, 8), 42, shadowPaint);
    canvas.drawCircle(const Offset(35, 10), 32, shadowPaint);
    canvas.drawCircle(const Offset(-35, 10), 30, shadowPaint);

    // Esferas blancas superiores
    canvas.drawCircle(const Offset(0, 0), 40, cloudPaint);
    canvas.drawCircle(const Offset(35, 2), 30, cloudPaint);
    canvas.drawCircle(const Offset(-35, 2), 28, cloudPaint);
    canvas.drawCircle(const Offset(18, -20), 26, cloudPaint);
    canvas.drawCircle(const Offset(-15, -18), 22, cloudPaint);

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant _CartoonCloudsPainter oldDelegate) =>
      oldDelegate.progress != progress;
}
