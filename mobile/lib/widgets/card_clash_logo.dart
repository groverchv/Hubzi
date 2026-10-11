import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Logo con doble contorno 3D, degradado amarillo/naranja y letras celestes
class CardClashLogo extends StatelessWidget {
  final String topText;
  final String titleWord1;
  final String titleWord2;
  final String subtitle;

  const CardClashLogo({
    super.key,
    this.topText = "HUBZY",
    this.titleWord1 = "CARD",
    this.titleWord2 = "CLASH",
    this.subtitle = "an Architecture & Learning Game",
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Top text "HUBZY" o "AWS"
        _buildStrokedText(
          text: topText,
          fontSize: 28,
          letterColor: Colors.white,
          strokeColor: const Color(0xFF1E3A8A),
          strokeWidth: 6,
        ),
        const SizedBox(height: 2),

        // Palabra 1 "CARD" (Amarillo / Naranja degradado)
        _buildGradientStrokedText(
          text: titleWord1,
          fontSize: 52,
          gradient: const LinearGradient(
            colors: [Color(0xFFFEF08A), Color(0xFFFBBF24), Color(0xFFEA580C)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
          strokeColor: const Color(0xFF172554),
          strokeWidth: 9,
        ),

        // Palabra 2 "CLASH" (Celeste / Azul degradado)
        Transform.translate(
          offset: const Offset(0, -10),
          child: _buildGradientStrokedText(
            text: titleWord2,
            fontSize: 56,
            gradient: const LinearGradient(
              colors: [Color(0xFFE0F2FE), Color(0xFF38BDF8), Color(0xFF0284C7)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            strokeColor: const Color(0xFF0C4A6E),
            strokeWidth: 10,
          ),
        ),

        // Subtítulo en pastilla azul marino
        Transform.translate(
          offset: const Offset(0, -6),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A).withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 1.5),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black38,
                  offset: Offset(0, 4),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Text(
              subtitle,
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStrokedText({
    required String text,
    required double fontSize,
    required Color letterColor,
    required Color strokeColor,
    required double strokeWidth,
  }) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Sombra de fondo
        Transform.translate(
          offset: const Offset(0, 4),
          child: Text(
            text,
            style: GoogleFonts.blackOpsOne(
              fontSize: fontSize,
              foreground: Paint()
                ..style = PaintingStyle.stroke
                ..strokeWidth = strokeWidth + 2
                ..color = const Color(0xFF020617),
            ),
          ),
        ),
        // Borde principal
        Text(
          text,
          style: GoogleFonts.blackOpsOne(
            fontSize: fontSize,
            foreground: Paint()
              ..style = PaintingStyle.stroke
              ..strokeWidth = strokeWidth
              ..color = strokeColor,
          ),
        ),
        // Relleno
        Text(
          text,
          style: GoogleFonts.blackOpsOne(
            fontSize: fontSize,
            color: letterColor,
          ),
        ),
      ],
    );
  }

  Widget _buildGradientStrokedText({
    required String text,
    required double fontSize,
    required Gradient gradient,
    required Color strokeColor,
    required double strokeWidth,
  }) {
    return Stack(
      alignment: Alignment.center,
      children: [
        // Sombra 3D
        Transform.translate(
          offset: const Offset(0, 6),
          child: Text(
            text,
            style: GoogleFonts.blackOpsOne(
              fontSize: fontSize,
              foreground: Paint()
                ..style = PaintingStyle.stroke
                ..strokeWidth = strokeWidth + 3
                ..color = const Color(0xFF020617),
            ),
          ),
        ),
        // Contorno
        Text(
          text,
          style: GoogleFonts.blackOpsOne(
            fontSize: fontSize,
            foreground: Paint()
              ..style = PaintingStyle.stroke
              ..strokeWidth = strokeWidth
              ..color = strokeColor,
          ),
        ),
        // Relleno degradado
        ShaderMask(
          shaderCallback: (bounds) => gradient.createShader(bounds),
          blendMode: BlendMode.srcIn,
          child: Text(
            text,
            style: GoogleFonts.blackOpsOne(
              fontSize: fontSize,
              color: Colors.white,
            ),
          ),
        ),
      ],
    );
  }
}
