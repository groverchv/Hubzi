import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/game_models.dart';

class ArcadeBoardTable extends StatefulWidget {
  final int currentLevel;
  final String title;
  final List<ArcadeNode> nodes;
  final List<ArcadeCard> hand;
  final Function(ArcadeCard card, ArcadeNode node) onPlaceCard;
  final Function(ArcadeNode node) onSelectNodeForQuestion;
  final VoidCallback onRestartQuestions;
  final VoidCallback onExitGame;
  final String username;

  const ArcadeBoardTable({
    super.key,
    required this.currentLevel,
    required this.title,
    required this.nodes,
    required this.hand,
    required this.onPlaceCard,
    required this.onSelectNodeForQuestion,
    required this.onRestartQuestions,
    required this.onExitGame,
    this.username = "Invitado",
  });

  @override
  State<ArcadeBoardTable> createState() => _ArcadeBoardTableState();
}

class _ArcadeBoardTableState extends State<ArcadeBoardTable> {
  ArcadeCard? _selectedHandCard;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // 1. Barra de Control Superior (Usuario, Reiniciar Preguntas, Terminar Partida)
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
          child: Row(
            children: [
              // Badge de Nivel y Progreso
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF6366F1)),
                ),
                child: Text(
                  "NIVEL ${widget.currentLevel}/5",
                  style: GoogleFonts.outfit(color: const Color(0xFF818CF8), fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF10B981)),
                ),
                child: Text(
                  "PROGRESO: ${widget.nodes.where((n) => n.placedCard != null).length} / ${widget.nodes.length}",
                  style: GoogleFonts.outfit(color: const Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
              const Spacer(),

              // Botón Reiniciar Preguntas
              InkWell(
                onTap: widget.onRestartQuestions,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0D9488),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.refresh, color: Colors.white, size: 14),
                      const SizedBox(width: 4),
                      Text("Reiniciar", style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 6),

              // Botón Terminar Partida
              InkWell(
                onTap: widget.onExitGame,
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF991B1B),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.logout, color: Colors.white, size: 14),
                      const SizedBox(width: 4),
                      Text("Salir", style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),

        // 2. Tablero Blanco Isométrico Central (exacto a la captura de pantalla 5)
        Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.94),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFFCBD5E1), width: 3),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black26,
                  offset: Offset(0, 10),
                  blurRadius: 25,
                ),
              ],
            ),
            child: Stack(
              children: [
                // Líneas guía de red milimétrica sutil
                Positioned.fill(
                  child: CustomPaint(
                    painter: _BlueprintGridPainter(),
                  ),
                ),

                // Cabecera interna del tablero: Título del simulacro + Botones de niveles (Fácil, Semi-normal...)
                Positioned(
                  top: 12,
                  left: 16,
                  right: 16,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Administración General".toUpperCase(),
                              style: GoogleFonts.outfit(color: const Color(0xFFEA580C), fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                            Text(
                              widget.title.toUpperCase(),
                              style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontSize: 12, fontWeight: FontWeight.w900),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      // Pestaña de dificultad
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF97316),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          "N${widget.currentLevel}: FÁCIL",
                          style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),

                // Flechas conectoras vectoriales entre nodos
                Positioned.fill(
                  child: CustomPaint(
                    painter: _NodeConnectorsPainter(nodesCount: widget.nodes.length),
                  ),
                ),

                // Nodos geométricos (Casillas hexagonales con ícono de portafolio)
                Positioned.fill(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final count = widget.nodes.length;
                      return Stack(
                        children: List.generate(count, (idx) {
                          final node = widget.nodes[idx];
                          final isFilled = node.placedCard != null;

                          // Coordenadas horizontales distribuidas
                          final double leftPercent = count == 1
                              ? 0.5
                              : 0.18 + (idx / (count - 1)) * 0.64;
                          final double topPercent = 0.50 + ((idx % 2 == 1) ? -0.10 : 0.04);

                          return Positioned(
                            left: constraints.maxWidth * leftPercent - 36,
                            top: constraints.maxHeight * topPercent - 36,
                            child: GestureDetector(
                              onTap: () {
                                if (_selectedHandCard != null) {
                                  widget.onPlaceCard(_selectedHandCard!, node);
                                  setState(() => _selectedHandCard = null);
                                } else {
                                  widget.onSelectNodeForQuestion(node);
                                }
                              },
                              child: Column(
                                children: [
                                  Container(
                                    width: 72,
                                    height: 72,
                                    decoration: BoxDecoration(
                                      color: isFilled ? const Color(0xFF10B981) : Colors.white,
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: isFilled
                                            ? const Color(0xFF047857)
                                            : (_selectedHandCard != null ? const Color(0xFFF97316) : const Color(0xFF64748B)),
                                        width: isFilled || _selectedHandCard != null ? 3.5 : 2,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: isFilled
                                              ? const Color(0xFF10B981).withValues(alpha: 0.4)
                                              : Colors.black12,
                                          offset: const Offset(0, 4),
                                          blurRadius: 8,
                                        ),
                                      ],
                                    ),
                                    child: Center(
                                      child: Icon(
                                        isFilled ? Icons.check_circle : Icons.work_outline_rounded,
                                        color: isFilled ? Colors.white : const Color(0xFF0284C7),
                                        size: 32,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF1F5F9),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: const Color(0xFFCBD5E1)),
                                    ),
                                    child: Text(
                                      node.label,
                                      style: GoogleFonts.outfit(
                                        color: const Color(0xFF0F172A),
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        }),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ),

        // 3. Mazo de Cartas de Color con Píldoras (Morado, Azul, Naranja, Azul Marino)
        Container(
          height: 125,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: widget.hand.length,
            itemBuilder: (context, idx) {
              final card = widget.hand[idx];
              final isSelected = _selectedHandCard?.id == card.id;

              // Paleta exacta de colores de la barra inferior de la imagen 5
              final cardGradients = [
                [const Color(0xFFA855F7), const Color(0xFF7E22CE)], // Morado
                [const Color(0xFF3B82F6), const Color(0xFF1D4ED8)], // Azul
                [const Color(0xFFF97316), const Color(0xFFC2410C)], // Naranja
                [const Color(0xFF334155), const Color(0xFF0F172A)], // Azul Marino
              ];
              final grad = cardGradients[idx % cardGradients.length];

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedHandCard = isSelected ? null : card;
                  });
                },
                child: Container(
                  width: 90,
                  margin: const EdgeInsets.symmetric(horizontal: 5),
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: grad,
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.3),
                      width: isSelected ? 3 : 1.5,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: isSelected ? Colors.white.withValues(alpha: 0.5) : Colors.black38,
                        offset: const Offset(0, 4),
                        blurRadius: isSelected ? 12 : 6,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.favorite, color: Colors.white, size: 16),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "medicina".toUpperCase(),
                        style: GoogleFonts.outfit(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        card.conceptName.toUpperCase(),
                        textAlign: TextAlign.center,
                        style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// Pintor de líneas conectoras naranjas entre casillas
class _NodeConnectorsPainter extends CustomPainter {
  final int nodesCount;
  _NodeConnectorsPainter({required this.nodesCount});

  @override
  void paint(Canvas canvas, Size size) {
    if (nodesCount < 2) return;
    final paint = Paint()
      ..color = const Color(0xFFEA580C)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final path = Path();
    final p1 = Offset(size.width * 0.25, size.height * 0.54);
    final p2 = Offset(size.width * 0.50, size.height * 0.44);
    final p3 = Offset(size.width * 0.75, size.height * 0.54);

    path.moveTo(p1.dx, p1.dy);
    path.lineTo(p2.dx, p2.dy);
    path.lineTo(p3.dx, p3.dy);
    path.lineTo(p1.dx, p1.dy);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _BlueprintGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += 24) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 24) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
