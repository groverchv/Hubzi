import 'package:flutter/material.dart';

class GameTheme {
  // Fondos y cielo
  static const Color skyTop = Color(0xFF0284C7); // Azul cielo intenso
  static const Color skyMid = Color(0xFF38BDF8); // Cyan brillante
  static const Color skyBottom = Color(0xFFBAE6FD); // Azul claro nublado

  // Botón Verde (Multiplayer / Victoria / Positivo)
  static const Color greenBase = Color(0xFF16A34A);
  static const Color greenLight = Color(0xFF22C55E);
  static const Color greenBorder = Color(0xFF15803D);
  static const Color greenShadow = Color(0xFF14532D);

  // Botón Naranja (Singleplayer / Primario)
  static const Color orangeBase = Color(0xFFEA580C);
  static const Color orangeLight = Color(0xFFF97316);
  static const Color orangeBorder = Color(0xFFC2410C);
  static const Color orangeShadow = Color(0xFF7C2D12);

  // Botón Azul Oscuro / Navy con borde naranja (Save Progress / Tutorial)
  static const Color navyBase = Color(0xFF0F172A);
  static const Color navyLight = Color(0xFF1E293B);
  static const Color navyAccent = Color(0xFFF97316); // Borde/tag naranja característico

  // Amarillo Oro (Títulos / Medallas)
  static const Color goldYellow = Color(0xFFFBBF24);
  static const Color goldOrange = Color(0xFFF59E0B);
  static const Color titleStroke = Color(0xFF1E3A8A); // Borde azul marino para letras 3D

  // Decoraciones
  static const Color white = Colors.white;
}
