import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Botón tipo cápsula o widget oscuro con borde naranja (como Save Progress y Play Tutorial)
class ArcadePillBadgeButton extends StatelessWidget {
  final String label;
  final Widget? topAsset;
  final VoidCallback onTap;

  const ArcadePillBadgeButton({
    super.key,
    required this.label,
    required this.onTap,
    this.topAsset,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (topAsset != null) ...[
            topAsset!,
            const SizedBox(height: 4),
          ],
          Stack(
            clipBehavior: Clip.none,
            children: [
              // Pestaña naranja de soporte (lado izquierdo)
              Positioned(
                top: 4,
                left: -4,
                child: Container(
                  width: 14,
                  height: 18,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF97316),
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),

              // Botón azul marino con borde
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF38BDF8).withValues(alpha: 0.6),
                    width: 2,
                  ),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0xFF0284C7),
                      offset: Offset(0, 3),
                      blurRadius: 0,
                    ),
                    BoxShadow(
                      color: Colors.black38,
                      offset: Offset(0, 5),
                      blurRadius: 8,
                    ),
                  ],
                ),
                child: Text(
                  label.toUpperCase(),
                  style: GoogleFonts.blackOpsOne(
                    color: Colors.white,
                    fontSize: 12,
                    letterSpacing: 0.8,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
