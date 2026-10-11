import 'dart:math';
import 'package:flame/components.dart';
import 'package:flame/game.dart';
import 'package:flutter/material.dart';

// Componente interactivo de partícula de concentración
class SynapseParticle extends CircleComponent {
  Vector2 velocity;
  final double maxLifetime;
  double currentLifetime = 0;

  SynapseParticle({
    required Vector2 position,
    required double radius,
    required Paint paint,
    required this.velocity,
    required this.maxLifetime,
  }) : super(position: position, radius: radius, paint: paint);

  @override
  void update(double dt) {
    super.update(dt);
    position += velocity * dt;
    currentLifetime += dt;

    // Reducir opacidad suavemente
    double alphaProgress = 1.0 - (currentLifetime / maxLifetime).clamp(0.0, 1.0);
    paint.color = paint.color.withValues(alpha: alphaProgress.clamp(0.0, 1.0));

    if (currentLifetime >= maxLifetime) {
      removeFromParent();
    }
  }
}

// Orbe de Energía Neuronal pulsante
class CoreEnergyOrb extends CircleComponent {
  double pulseTimer = 0;
  final double baseRadius;

  CoreEnergyOrb({required Vector2 position, required this.baseRadius})
      : super(
          position: position,
          radius: baseRadius,
          anchor: Anchor.center,
          paint: Paint()
            ..color = const Color(0xFF6366F1).withValues(alpha: 0.8)
            ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 12),
        );

  @override
  void update(double dt) {
    super.update(dt);
    pulseTimer += dt * 3.0;
    radius = baseRadius + sin(pulseTimer) * 4.0;
  }
}

// Videojuego Flame Engine: Arcade Arena
class ArcadeFlameGame extends FlameGame {
  final VoidCallback onScoreIncrement;
  final VoidCallback onStreakBonus;
  late CoreEnergyOrb energyOrb;
  final Random _rnd = Random();
  double _spawnTimer = 0;

  ArcadeFlameGame({
    required this.onScoreIncrement,
    required this.onStreakBonus,
  });

  @override
  Color backgroundColor() => const Color(0x00000000); // Fondo transparente para overlay UI

  @override
  Future<void> onLoad() async {
    super.onLoad();

    // Orbe central
    energyOrb = CoreEnergyOrb(
      position: Vector2(size.x / 2, size.y * 0.28),
      baseRadius: 36,
    );
    add(energyOrb);
  }

  @override
  void update(double dt) {
    super.update(dt);
    _spawnTimer += dt;

    // Spawn periódico de partículas relajantes
    if (_spawnTimer > 0.12) {
      _spawnTimer = 0;
      _spawnAmbientParticle();
    }
  }

  void triggerSuccessBurst() {
    // Ráfaga sináptica al acertar respuesta
    final center = energyOrb.position;
    for (int i = 0; i < 24; i++) {
      final angle = _rnd.nextDouble() * 2 * pi;
      final speed = 80 + _rnd.nextDouble() * 180;
      final velocity = Vector2(cos(angle) * speed, sin(angle) * speed);

      final colors = [
        const Color(0xFF38BDF8), // Cyan neón
        const Color(0xFF818CF8), // Indigo
        const Color(0xFF34D399), // Esmeralda
      ];

      add(
        SynapseParticle(
          position: center.clone(),
          radius: 3.5 + _rnd.nextDouble() * 3,
          velocity: velocity,
          maxLifetime: 0.6 + _rnd.nextDouble() * 0.4,
          paint: Paint()..color = colors[_rnd.nextInt(colors.length)],
        ),
      );
    }
  }

  void _spawnAmbientParticle() {
    final startX = _rnd.nextDouble() * size.x;
    final startY = size.y * 0.15 + _rnd.nextDouble() * (size.y * 0.25);
    final velocity = Vector2((_rnd.nextDouble() - 0.5) * 30, -20 - _rnd.nextDouble() * 40);

    add(
      SynapseParticle(
        position: Vector2(startX, startY),
        radius: 2 + _rnd.nextDouble() * 2.5,
        velocity: velocity,
        maxLifetime: 1.5 + _rnd.nextDouble(),
        paint: Paint()..color = const Color(0xFF818CF8).withValues(alpha: 0.4),
      ),
    );
  }
}
