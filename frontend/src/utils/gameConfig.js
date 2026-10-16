// 20 NIVELES DE PROGRESIÓN PEDAGÓGICA (Nivel K = K preguntas)
// Nivel 20 = Batalla Final contra Capi Boss
export const GAME_LEVELS = Array.from({ length: 20 }, (_, i) => {
  const lvl = i + 1;
  const isBoss = lvl === 20;
  const hasTraps = lvl >= 3;
  const trapCount = lvl < 8 ? 1 : lvl < 15 ? 2 : 3;

  let difficulty = "facil";
  let diffLabel = "Iniciación";
  if (lvl >= 16) {
    difficulty = "dificil";
    diffLabel = isBoss ? "👑 JEFE FINAL" : "Maestro";
  } else if (lvl >= 11) {
    difficulty = "semidificil";
    diffLabel = "Avanzado";
  } else if (lvl >= 6) {
    difficulty = "normal";
    diffLabel = "Intermedio";
  } else if (lvl >= 3) {
    difficulty = "seminormal";
    diffLabel = "En Progreso";
  }

  return {
    level: lvl,
    name: isBoss ? "Duelo Legendario: Capi Boss" : `Fase ${lvl}: ${diffLabel}`,
    questions: lvl, // Exactamente K preguntas en el nivel K
    difficulty,
    hasTraps,
    trapCount: hasTraps ? trapCount : 0,
    isBoss,
    desc: isBoss
      ? "¡Enfrenta al Gran Capi en el examen definitivo de 20 reactivos! Derrótalo acertando el circuito."
      : hasTraps
        ? `Resuelve los ${lvl} nodos con atención: ¡Hay ${trapCount} carta(s) trampa en tu mazo!`
        : `Circuito inicial de ${lvl} pregunta(s) directa(s).`,
  };
});

export const getLevelInfo = (level) =>
  GAME_LEVELS.find((l) => l.level === level) || GAME_LEVELS[0];
