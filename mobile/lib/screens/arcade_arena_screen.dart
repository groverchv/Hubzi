import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/game_models.dart';
import '../services/api_service.dart';

class ArcadeArenaScreen extends StatefulWidget {
  final StudyFolder? folder;
  const ArcadeArenaScreen({super.key, this.folder});

  @override
  State<ArcadeArenaScreen> createState() => _ArcadeArenaScreenState();
}

class _ArcadeArenaScreenState extends State<ArcadeArenaScreen> {
  int _currentLevel = 1;
  int _score = 0;
  int _lives = 3;
  String _capySpeech = "Toca el micrófono para hablar con Hubzi o toca una casilla para ver la pregunta.";
  bool _isLoading = true;

  String _boardTitle = "SIMULACRO: ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - NIVEL FÁCIL";
  List<ArcadeNode> _nodes = [];
  List<ArcadeCard> _hand = [];
  ArcadeCard? _selectedCard;
  ArcadeNode? _selectedNodeForQuestion;

  String? _bannerMessage;
  bool _isSuccessBanner = false;

  @override
  void initState() {
    super.initState();
    _loadLevel(_currentLevel);
  }

  Future<void> _loadLevel(int targetLevel) async {
    setState(() {
      _isLoading = true;
      _selectedCard = null;
      _selectedNodeForQuestion = null;
    });

    final lvlInfo = kGameLevels.firstWhere(
      (l) => l.level == targetLevel,
      orElse: () => kGameLevels[0],
    );

    final folderId = widget.folder?.id ?? "folder_administracion_default";
    final data = await ApiService.generateBoardForFolder(
      folderId: folderId,
      level: targetLevel,
      questionCount: lvlInfo.questions,
      difficulty: lvlInfo.difficulty,
    );

    final rawNodes = (data['nodes'] as List<dynamic>? ?? []);
    final rawCards = (data['cards'] as List<dynamic>? ?? []);

    setState(() {
      _currentLevel = targetLevel;
      _boardTitle = data['title'] ?? 'SIMULACRO: ORIGEN Y DESARROLLO DE LA ADMINISTRACIÓN - NIVEL FÁCIL';
      _nodes = rawNodes.map((n) => ArcadeNode.fromJson(n)).toList();
      _hand = rawCards.map((c) => ArcadeCard.fromJson(c)).toList();
      _isLoading = false;
    });
  }

  void _handlePlaceCard(ArcadeCard card, ArcadeNode targetNode) async {
    if (targetNode.placedCard != null) {
      _showBanner("Esta casilla ya tiene su respuesta colocada.", isSuccess: false);
      return;
    }

    final isDistractor = card.isDistractor || card.id.contains('distractor');
    final isCorrect = !isDistractor && (
      card.id == targetNode.correctCardId ||
      card.matchesNodeId == targetNode.id ||
      card.conceptName.trim().toLowerCase() == targetNode.label.trim().toLowerCase()
    );

    if (isCorrect) {
      setState(() {
        targetNode.placedCard = card;
        _hand.removeWhere((c) => c.id == card.id);
        _selectedCard = null;
        _score += 150;
      });

      _showBanner("¡CONEXIÓN CORRECTA! (+150 PTS)", isSuccess: true);

      final capyMsg = await ApiService.askCapybara(
        message: "Respuesta correcta en ${targetNode.label}",
        nodes: _nodes,
        hand: _hand,
        theme: _boardTitle,
      );
      if (mounted) setState(() => _capySpeech = capyMsg);

      final allCompleted = _nodes.every((n) => n.placedCard != null);
      if (allCompleted) {
        await Future.delayed(const Duration(milliseconds: 1200));
        if (!mounted) return;
        if (_currentLevel < 5) {
          _loadLevel(_currentLevel + 1);
        }
      }
    } else {
      setState(() {
        _lives = (_lives - 1).clamp(0, 3);
        _selectedCard = null;
      });

      _showBanner("La carta '${card.conceptName}' no encaja aquí. ¡Hubzi te anima!", isSuccess: false);

      final capyMsg = await ApiService.askCapybara(
        message: "Error al colocar carta en ${targetNode.label}",
        nodes: _nodes,
        hand: _hand,
        theme: _boardTitle,
      );
      if (mounted) setState(() => _capySpeech = capyMsg);
    }
  }

  void _showBanner(String msg, {required bool isSuccess}) {
    setState(() {
      _bannerMessage = msg;
      _isSuccessBanner = isSuccess;
    });
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) setState(() => _bannerMessage = null);
    });
  }

  @override
  Widget build(BuildContext context) {
    final solvedCount = _nodes.where((n) => n.placedCard != null).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Fondo cuadriculado claro
      body: Stack(
        children: [
          // Fondo con cuadrícula sutil arquitectónica milimétrica
          Positioned.fill(
            child: CustomPaint(painter: _ArchitectGridPainter()),
          ),

          SafeArea(
            child: Column(
              children: [
                // 1. Barra Superior con Botones Idénticos a la Imagen
                _buildTopHeader(solvedCount),

                // 2. Tablero Central Isométrico Blanco + Capibara a la izquierda
                Expanded(
                  child: Stack(
                    children: [
                      // El tablero blanco central
                      Positioned.fill(
                        child: _isLoading
                            ? const Center(child: CircularProgressIndicator(color: Color(0xFF0284C7)))
                            : _buildIsometricBoard(),
                      ),

                      // Avatar Capibara Flotante a la izquierda con aura verde
                      Positioned(
                        left: 20,
                        bottom: 40,
                        child: _buildCapyFloatingAvatar(),
                      ),
                    ],
                  ),
                ),

                // 3. Mazo de Cartas Inferior en Píldora
                _buildHandDock(),
                const SizedBox(height: 6),
              ],
            ),
          ),

          // Modal de Pregunta al tocar un nodo
          if (_selectedNodeForQuestion != null)
            _buildQuestionModal(_selectedNodeForQuestion!),

          // Banner de notificación flotante
          if (_bannerMessage != null)
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 14),
                decoration: BoxDecoration(
                  color: _isSuccessBanner ? const Color(0xFF10B981) : const Color(0xFFE11D48),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(color: Colors.black38, offset: Offset(0, 6), blurRadius: 16),
                  ],
                ),
                child: Text(
                  _bannerMessage!,
                  style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // BARRA SUPERIOR
  Widget _buildTopHeader(int solvedCount) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(

        children: [
          // Badge Nivel (Púrpura)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF3B0764),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.military_tech, color: Color(0xFFC084FC), size: 16),
                const SizedBox(width: 6),
                Text(
                  "NIVEL $_currentLevel/5: Fácil (${_nodes.length} preg.)",
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Badge Progreso (Verde Esmeralda)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF064E3B),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              "PROGRESO: $solvedCount / ${_nodes.length}",
              style: GoogleFonts.outfit(color: const Color(0xFF34D399), fontSize: 11.5, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 8),

          // Badge Puntos (Ámbar)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF78350F),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.stars, color: Color(0xFFFBBF24), size: 16),
                const SizedBox(width: 6),
                Text(
                  "PUNTOS: $_score",
                  style: GoogleFonts.outfit(color: const Color(0xFFFDE68A), fontSize: 11.5, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),

          // Usuario Activo (Azul Marino con borde cyan)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF38BDF8), width: 1.5),
            ),
            child: Row(
              children: [
                const Icon(Icons.person, color: Color(0xFF38BDF8), size: 16),
                const SizedBox(width: 6),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Invitado", style: GoogleFonts.outfit(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    Text("invitado@hubzy.app", style: GoogleFonts.outfit(color: Colors.white54, fontSize: 9)),
                  ],
                ),
                const SizedBox(width: 6),
                const Icon(Icons.open_in_new, color: Colors.white54, size: 14),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // Botón Reiniciar Preguntas (Verde Agua)
          ElevatedButton.icon(
            onPressed: () => _loadLevel(_currentLevel),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0D9488),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            icon: const Icon(Icons.refresh, size: 16),
            label: Text("Reiniciar Preguntas", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11.5)),
          ),
          const SizedBox(width: 8),

          // Botón Terminar Partida (Bordó)
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF881337),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
            icon: const Icon(Icons.logout, size: 16),
            label: Text("Terminar Partida", style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 11.5)),
          ),
        ],
      ),
    );
  }

  // TABLERO ISOMÉTRICO BLANCO
  Widget _buildIsometricBoard() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 6, 16, 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFCBD5E1), width: 3),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            offset: Offset(0, 8),
            blurRadius: 30,
          ),
        ],
      ),
      child: Stack(
        children: [
          // Borde superior biselado de control (con pestañas naranja y botones de niveles)
          Positioned(
            top: 14,
            left: 20,
            right: 20,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Pestaña naranja "Administración General"
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFED7AA),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFFB923C)),
                    ),
                    child: Text(
                      "Administración General",
                      style: GoogleFonts.outfit(color: const Color(0xFFC2410C), fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Título en mayúsculas
                  ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 320),
                    child: Text(
                      _boardTitle.toUpperCase(),
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF0F172A),
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 2,
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Barra de Niveles (N1: Fácil en naranja, N2, N3, N4, N5 en gris)
                  Row(
                    children: [
                      _buildLevelTab(1, "N1:\nFácil", isActive: _currentLevel == 1),
                      _buildLevelTab(2, "N2:\nSemi-normal", isActive: _currentLevel == 2),
                      _buildLevelTab(3, "N3:\nNormal", isActive: _currentLevel == 3),
                      _buildLevelTab(4, "N4:\nSemi-difícil", isActive: _currentLevel == 4),
                      _buildLevelTab(5, "N5:\nDifícil", isActive: _currentLevel == 5),
                    ],
                  ),
                ],
              ),
            ),
          ),


          // Flechas conectoras naranjas y negras en triángulo/red
          Positioned.fill(
            child: CustomPaint(
              painter: _ArchitecturalArrowsPainter(nodesCount: _nodes.length),
            ),
          ),

          // Casillas hexagonales / Nodos
          Positioned.fill(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final count = _nodes.length;
                return Stack(
                  children: List.generate(count, (idx) {
                    final node = _nodes[idx];
                    final isFilled = node.placedCard != null;

                    // Posicionamiento horizontal y vertical distribuido
                    double posX;
                    double posY;
                    if (count == 3) {
                      // Triángulo exacto como la imagen
                      if (idx == 0) {
                        posX = 0.28;
                        posY = 0.52;
                      } else if (idx == 1) {
                        posX = 0.50;
                        posY = 0.38;
                      } else {
                        posX = 0.72;
                        posY = 0.52;
                      }
                    } else {
                      posX = 0.18 + (idx / (count - 1)) * 0.64;
                      posY = (idx % 2 == 1) ? 0.40 : 0.54;
                    }

                    return Positioned(
                      left: constraints.maxWidth * posX - 36,
                      top: constraints.maxHeight * posY - 36,
                      child: DragTarget<ArcadeCard>(
                        onWillAcceptWithDetails: (details) => !isFilled,
                        onAcceptWithDetails: (details) {
                          _handlePlaceCard(details.data, node);
                        },
                        builder: (context, candidateData, rejectedData) {
                          final isHovering = candidateData.isNotEmpty;
                          return GestureDetector(
                            onTap: () {
                              if (_selectedCard != null) {
                                _handlePlaceCard(_selectedCard!, node);
                              } else {
                                setState(() => _selectedNodeForQuestion = node);
                              }
                            },
                            child: Column(
                              children: [
                                // Nodo hexagonal con borde verde si está resuelto o naranja si está arrastrando encima
                                AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  width: isHovering ? 80 : 72,
                                  height: isHovering ? 80 : 72,
                                  decoration: BoxDecoration(
                                    color: isFilled
                                        ? const Color(0xFFDCFCE7)
                                        : (isHovering ? const Color(0xFFFFF7ED) : Colors.white),
                                    borderRadius: BorderRadius.circular(18),
                                    border: Border.all(
                                      color: isFilled
                                          ? const Color(0xFF22C55E)
                                          : (isHovering
                                              ? const Color(0xFFEA580C)
                                              : (_selectedCard != null
                                                  ? const Color(0xFFF97316)
                                                  : const Color(0xFFCBD5E1))),
                                      width: isFilled || isHovering || _selectedCard != null ? 3.5 : 2,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: isFilled
                                            ? const Color(0xFF22C55E).withValues(alpha: 0.4)
                                            : (isHovering
                                                ? const Color(0xFFEA580C).withValues(alpha: 0.5)
                                                : Colors.black12),
                                        offset: const Offset(0, 4),
                                        blurRadius: isHovering ? 14 : 8,
                                      ),
                                    ],
                                  ),
                                  child: Center(
                                    child: Icon(
                                      isFilled ? Icons.check_circle_outline : (isHovering ? Icons.add_circle : Icons.business_center_outlined),
                                      color: isFilled
                                          ? const Color(0xFF16A34A)
                                          : (isHovering ? const Color(0xFFEA580C) : const Color(0xFF64748B)),
                                      size: isHovering ? 36 : 32,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                // Píldora de concepto abajo
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFE2E8F0)),
                                  ),
                                  child: Text(
                                    node.label,
                                    style: GoogleFonts.outfit(
                                      color: const Color(0xFF334155),
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    );
                  }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLevelTab(int lvl, String label, {required bool isActive}) {
    return GestureDetector(
      onTap: () => _loadLevel(lvl),
      child: Container(
        margin: const EdgeInsets.only(left: 4),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFFF97316) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isActive ? const Color(0xFFEA580C) : const Color(0xFFCBD5E1)),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: GoogleFonts.outfit(
            color: isActive ? Colors.white : const Color(0xFF64748B),
            fontSize: 9,
            fontWeight: FontWeight.bold,
            height: 1.1,
          ),
        ),
      ),
    );
  }

  // AVATAR CAPIBARA FLOTANTE A LA IZQUIERDA
  Widget _buildCapyFloatingAvatar() {
    return Column(
      children: [
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: const Color(0xFF0F172A),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF10B981).withValues(alpha: 0.6),
                blurRadius: 22,
                spreadRadius: 4,
              ),
            ],
            border: Border.all(color: const Color(0xFF34D399), width: 3),
          ),
          child: ClipOval(
            child: Image.asset(
              'assets/images/capybara_3d.jpg',
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => const Center(
                child: Icon(Icons.psychology, color: Color(0xFF34D399), size: 44),
              ),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          constraints: const BoxConstraints(maxWidth: 160),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF0F172A),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF0D9488)),
            boxShadow: const [
              BoxShadow(color: Colors.black26, offset: Offset(0, 2), blurRadius: 4),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    "CAPI PSICÓLOGO",
                    style: GoogleFonts.outfit(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.mic, color: Color(0xFF2DD4BF), size: 14),
                  const SizedBox(width: 2),
                  const Icon(Icons.volume_up, color: Colors.white70, size: 14),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                _capySpeech,
                style: GoogleFonts.outfit(color: const Color(0xFF99F6E4), fontSize: 9, fontStyle: FontStyle.italic),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // MAZO DE CARTAS EN PÍLDORA (INFERIOR CON DRAGGABLE)
  Widget _buildHandDock() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.95),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFCBD5E1), width: 2),
        boxShadow: const [
          BoxShadow(color: Colors.black12, offset: Offset(0, 4), blurRadius: 16),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Contador de cartas a la izquierda
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const Icon(Icons.layers, color: Color(0xFFFBBF24), size: 16),
                  const SizedBox(width: 6),
                  Text(
                    "0${_hand.length} CARTAS",
                    style: GoogleFonts.outfit(color: const Color(0xFFFBBF24), fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 14),

            // Píldoras de colores exactas con DRAGGABLE (Morada, Azul, Naranja, Azul Marino)
            ...List.generate(_hand.length, (idx) {
              final card = _hand[idx];
              final isSelected = _selectedCard?.id == card.id;

              final cardGradients = [
                [const Color(0xFFA855F7), const Color(0xFF7E22CE)], // Morado
                [const Color(0xFF3B82F6), const Color(0xFF1D4ED8)], // Azul
                [const Color(0xFFF97316), const Color(0xFFC2410C)], // Naranja
                [const Color(0xFF334155), const Color(0xFF0F172A)], // Azul Marino
              ];
              final grad = cardGradients[idx % cardGradients.length];

              Widget buildCardWidget({required bool isDragging, double scale = 1.0}) {
                return Material(
                  color: Colors.transparent,
                  child: Container(
                    width: 90 * scale,
                    height: 100 * scale,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
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
                        width: isSelected ? 3.5 : 1.5,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: isDragging ? const Color(0xFFEA580C).withValues(alpha: 0.6) : (isSelected ? Colors.black45 : Colors.black26),
                          offset: const Offset(0, 4),
                          blurRadius: isDragging ? 18 : (isSelected ? 12 : 6),
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
                          "CONCEPTO",
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
              }

              return Draggable<ArcadeCard>(
                data: card,
                feedback: buildCardWidget(isDragging: true, scale: 1.1),
                childWhenDragging: Opacity(
                  opacity: 0.35,
                  child: buildCardWidget(isDragging: false),
                ),
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedCard = isSelected ? null : card;
                    });
                  },
                  child: buildCardWidget(isDragging: false),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }


  // MODAL DE DETALLE DE PREGUNTA
  Widget _buildQuestionModal(ArcadeNode node) {
    return Container(
      color: Colors.black54,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 480),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF38BDF8), width: 3),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  node.label.toUpperCase(),
                  style: GoogleFonts.outfit(color: const Color(0xFFFBBF24), fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  onPressed: () => setState(() => _selectedNodeForQuestion = null),
                  icon: const Icon(Icons.close, color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              node.question,
              style: GoogleFonts.outfit(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 14),
            if (node.hint.isNotEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  "Pista: ${node.hint}",
                  style: GoogleFonts.outfit(color: const Color(0xFF38BDF8), fontSize: 13.5),
                ),
              ),
            const SizedBox(height: 20),
            Center(
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFF97316),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                onPressed: () => setState(() => _selectedNodeForQuestion = null),
                child: Text("ENTENDIDO", style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Pintor de flechas vectoriales naranjas idénticas a la captura
class _ArchitecturalArrowsPainter extends CustomPainter {
  final int nodesCount;
  _ArchitecturalArrowsPainter({required this.nodesCount});

  @override
  void paint(Canvas canvas, Size size) {
    if (nodesCount < 3) return;

    final paintOrange = Paint()
      ..color = const Color(0xFFEA580C)
      ..strokeWidth = 3
      ..style = PaintingStyle.stroke;

    final paintBlack = Paint()
      ..color = const Color(0xFF334155)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    // Coordenadas del triángulo
    final pLeft = Offset(size.width * 0.28, size.height * 0.52);
    final pTop = Offset(size.width * 0.50, size.height * 0.38);
    final pRight = Offset(size.width * 0.72, size.height * 0.52);

    // Flecha base naranja pLeft -> pRight
    canvas.drawLine(pLeft, pRight, paintOrange);

    // Flecha izquierda pLeft -> pTop
    canvas.drawLine(pLeft, pTop, paintOrange);

    // Flecha descendente pTop -> pRight (Gris oscura/Negra)
    canvas.drawLine(pTop, pRight, paintBlack);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// Cuadrícula arquitectónica milimétrica
class _ArchitectGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..strokeWidth = 1;

    for (double x = 0; x < size.width; x += 26) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 26) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
