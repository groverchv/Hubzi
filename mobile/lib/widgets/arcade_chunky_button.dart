import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Botón estilo arcade biselado/bloque con textura de rayas diagonales como AWS Card Clash
class ArcadeChunkyButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback onTap;
  final Color primaryColor;
  final Color shadowColor;
  final Color borderColor;
  final Color? cornerAccentColor;
  final bool isLeftChamfer;
  final bool isRightChamfer;
  final double height;

  const ArcadeChunkyButton({
    super.key,
    required this.label,
    required this.onTap,
    required this.primaryColor,
    required this.shadowColor,
    required this.borderColor,
    this.icon,
    this.cornerAccentColor,
    this.isLeftChamfer = false,
    this.isRightChamfer = false,
    this.height = 54,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: height,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.only(
            topLeft: isLeftChamfer ? const Radius.circular(22) : const Radius.circular(14),
            topRight: isRightChamfer ? const Radius.circular(22) : const Radius.circular(14),
            bottomLeft: const Radius.circular(14),
            bottomRight: const Radius.circular(14),
          ),
          boxShadow: [
            BoxShadow(
              color: shadowColor,
              offset: const Offset(0, 5),
              blurRadius: 0, // Sombra dura 3D de videojuego
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.25),
              offset: const Offset(0, 8),
              blurRadius: 10,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.only(
            topLeft: isLeftChamfer ? const Radius.circular(22) : const Radius.circular(14),
            topRight: isRightChamfer ? const Radius.circular(22) : const Radius.circular(14),
            bottomLeft: const Radius.circular(14),
            bottomRight: const Radius.circular(14),
          ),
          child: Stack(
            children: [
              // Fondo base con bisel
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      primaryColor.withValues(alpha: 0.95),
                      primaryColor,
                    ],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  border: Border.all(color: borderColor, width: 2.5),
                ),
              ),

              // Textura rayada sutil de juego arcade
              Positioned.fill(
                child: CustomPaint(
                  painter: _DiagonalStripesPainter(
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
              ),

              // Borde de acento esquinero (como las pestañas naranjas en la referencia)
              if (cornerAccentColor != null)
                Positioned(
                  top: 0,
                  left: isLeftChamfer ? 0 : null,
                  right: isRightChamfer ? 0 : null,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: BoxDecoration(
                      color: cornerAccentColor,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),

              // Contenido: Ícono circular y Texto arcade 3D
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (icon != null) ...[
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.25),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.4),
                              width: 1.5,
                            ),
                          ),
                          child: Icon(icon, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 10),
                      ],
                      Flexible(
                        child: Text(
                          label.toUpperCase(),
                          style: GoogleFonts.blackOpsOne(
                            fontSize: 16.5,
                            letterSpacing: 1.2,
                            color: Colors.white,
                            shadows: [
                              Shadow(
                                color: shadowColor,
                                offset: const Offset(1, 2),
                                blurRadius: 1,
                              ),
                              Shadow(
                                color: Colors.black45,
                                offset: Offset(2, 3),
                                blurRadius: 3,
                              ),

                            ],
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
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

// Pintor de franjas diagonales estilo videojuego
class _DiagonalStripesPainter extends CustomPainter {
  final Color color;
  _DiagonalStripesPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.5
      ..style = PaintingStyle.stroke;

    const step = 14.0;
    for (double x = -size.height; x < size.width + size.height; x += step) {
      canvas.drawLine(
        Offset(x, size.height),
        Offset(x + size.height, 0),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
