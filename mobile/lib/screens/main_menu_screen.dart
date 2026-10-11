import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/game_theme.dart';
import '../services/auth_service.dart';
import '../widgets/arcade_chunky_button.dart';
import '../widgets/arcade_pill_badge_button.dart';
import '../widgets/arcade_sky_background.dart';
import '../widgets/card_clash_logo.dart';
import 'arcade_arena_screen.dart';
import 'auth_screen.dart';
import 'study_folders_screen.dart';

class MainMenuScreen extends StatelessWidget {
  const MainMenuScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ArcadeSkyBackground(
        child: SafeArea(
          child: Column(
            children: [
              // 1. Barra superior: "MAIN MENU" y Botón de Usuario / Cuenta
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Botón de Perfil / Login
                    IconButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AuthScreen()),
                        );
                      },
                      icon: const Icon(
                        Icons.account_circle,
                        color: Color(0xFF0F172A),
                        size: 34,
                      ),
                    ),

                    // Pastilla Azul Marino "MAIN MENU"
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.9),
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
                        ],
                      ),
                      child: Text(
                        "MAIN MENU",
                        style: GoogleFonts.blackOpsOne(
                          color: Colors.white,
                          fontSize: 14,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),

                    // Engrane de Ajustes
                    IconButton(
                      onPressed: () {},
                      icon: const Icon(
                        Icons.settings,
                        color: Color(0xFF0F172A),
                        size: 32,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // 2. Botones de accesos superiores:
              // - Save Progress (Abre Mis Carpetas de Estudio)
              // - Play Tutorial (Entra al Simulacro de Administración)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Save Progress -> Mis Carpetas de Estudio
                    ArcadePillBadgeButton(
                      label: "MIS CARPETAS",
                      onTap: () {
                        final user = AuthService.currentUser ?? AuthService.createGuestUser();
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => StudyFoldersScreen(user: user),
                          ),
                        );
                      },
                      topAsset: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black26,
                              blurRadius: 10,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.folder_shared_rounded,
                          color: Color(0xFF0284C7),
                          size: 34,
                        ),
                      ),
                    ),

                    // Play Tutorial -> Jugar Simulacro administracion.pdf
                    ArcadePillBadgeButton(
                      label: "PLAY TUTORIAL",
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const ArcadeArenaScreen(),
                          ),
                        );
                      },
                      topAsset: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black26,
                              blurRadius: 10,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.menu_book_rounded,
                          color: Color(0xFFEA580C),
                          size: 34,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Spacer(),

              // 3. Logo Gigante Central en 3D
              const CardClashLogo(
                topText: "HUBZY",
                titleWord1: "CARD",
                titleWord2: "CLASH",
                subtitle: "an Architecture & Learning Game",
              ),

              const Spacer(flex: 2),

              // 4. Barra Inferior con Botones Gigantes Bloque (Multiplayer & Singleplayer)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    // MULTIPLAYER (Botón Verde Rayado) -> Carpetas de Estudio
                    Expanded(
                      child: ArcadeChunkyButton(
                        label: "MULTIPLAYER",
                        icon: Icons.groups_rounded,
                        primaryColor: GameTheme.greenLight,
                        borderColor: GameTheme.greenBorder,
                        shadowColor: GameTheme.greenShadow,
                        cornerAccentColor: const Color(0xFFF97316),
                        isLeftChamfer: true,
                        height: 58,
                        onTap: () {
                          final user = AuthService.currentUser ?? AuthService.createGuestUser();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => StudyFoldersScreen(user: user),
                            ),
                          );
                        },
                      ),
                    ),

                    const SizedBox(width: 12),

                    // SINGLEPLAYER (Botón Naranja Rayado) -> Tablero de Juego Directo
                    Expanded(
                      child: ArcadeChunkyButton(
                        label: "SINGLEPLAYER",
                        icon: Icons.person_rounded,
                        primaryColor: GameTheme.orangeLight,
                        borderColor: GameTheme.orangeBorder,
                        shadowColor: GameTheme.orangeShadow,
                        cornerAccentColor: const Color(0xFFF97316),
                        isRightChamfer: true,
                        height: 58,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const ArcadeArenaScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }
}
