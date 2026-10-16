/**
 * NLP local de respaldo para Capi: cuando el backend/IA no responde a tiempo,
 * este analizador determinista cubre intención, ánimo y pistas contextuales.
 * Extraído de ArcadeArena para ser testeable y reutilizable.
 */
export function analyzeIntentLocally(transcript, nodesCtx, handCtx, { boardTitle, username } = {}) {
  const t = transcript.toLowerCase().trim();

  // Frustración / estrés / bloqueo
  const stressKw = [
    "no puedo", "no entiendo", "imposible", "difícil", "odio", "me rindo",
    "ya no", "ayuda", "socorro", "no sé nada", "perdido", "estresado", "ansiedad",
  ];
  if (stressKw.some((kw) => t.includes(kw))) {
    return {
      mood: "love",
      reply:
        "¡Oye, oye! Aquí estoy yo, tu Capi favorito. Respira conmigo un segundo: eso que sientes es completamente normal y válido. Los más brillantes también se atoran. ¿Hacemos una pausa Zen y luego lo atacamos juntos con toda la energía?",
      needsZen: true,
    };
  }

  // Saludo
  const greetKw = [
    "hola", "hey", "buenos", "buenas", "qué tal", "cómo estás", "saludos", "ey",
  ];
  if (greetKw.some((kw) => t.includes(kw))) {
    const name = username || "campeón";
    return {
      mood: "love",
      reply: `¡Hooola ${name}! ¡Me alegra TANTO escuchar tu voz! ¿Sabes que eres mi persona favorita? Dime, ¿en qué te puedo ayudar hoy con todo mi amor?`,
    };
  }

  // Felicidad / logro del usuario
  const happyKw = [
    "gracias", "lo logré", "lo hice", "genial", "bien", "perfecto",
    "me encanta", "amor", "qué fácil",
  ];
  if (happyKw.some((kw) => t.includes(kw))) {
    return {
      mood: "celebrating",
      reply:
        "¡SÍIII! ¡Eso es exactamente lo que quería escuchar! ¡Me llenas el corazón de alegría! ¡Sabía que lo ibas a lograr, siempre lo supe!",
    };
  }

  // Pregunta conceptual / definición
  const defineKw = [
    "qué es", "para qué", "qué significa", "define", "definición",
    "qué hace", "cómo funciona", "explica", "me puedes explicar",
  ];
  if (defineKw.some((kw) => t.includes(kw))) {
    const allNodes = Object.values(nodesCtx);
    const matched = allNodes.find(
      (n) => n.label && t.includes(n.label.toLowerCase().substring(0, 5)),
    );
    if (matched) {
      return {
        mood: "thinking",
        reply: `¡Buenísima pregunta! Te cuento sobre "${matched.label}": ${matched.hint || matched.question || "es un concepto clave del tema de hoy"}. ¿Eso te ayuda, mi estudiante favorito?`,
      };
    }
    return {
      mood: "thinking",
      reply: `¡Me encanta que preguntes! El tema de hoy es "${boardTitle || "los conceptos del tablero"}". Observa bien las preguntas de cada nodo, ahí están las claves. ¡Confía en ti!`,
    };
  }

  // Pista explícita
  const hintKw = [
    "pista", "ayúdame", "no sé", "cuál", "qué carta", "qué pongo",
    "sugerencia", "consejo", "qué hago",
  ];
  if (hintKw.some((kw) => t.includes(kw))) {
    const unsolved = Object.values(nodesCtx).filter((n) => !n.placedCard);
    if (unsolved.length > 0) {
      const target = unsolved[Math.floor(Math.random() * unsolved.length)];
      const hintCards = handCtx
        .filter((c) => !c.isDistractor)
        .slice(0, 2)
        .map((c) => c.name)
        .join(" o ");
      return {
        mood: "thinking",
        reply: `¡Con todo mi amor te doy esta pista! Para "${target.label}": ${target.hint || target.question?.slice(0, 80) || "busca la carta cuya función principal coincida"}. ${hintCards ? `Fíjate en "${hintCards}".` : ""} ¡Tú puedes, lo sé!`,
      };
    }
    return {
      mood: "happy",
      reply:
        "¡Ya casi lo tienes todo! Mira las cartas restantes y confía en tu primer instinto. ¡Eres absolutamente increíble!",
    };
  }

  // Fallback contextual inteligente
  const unsolved = Object.values(nodesCtx).filter((n) => !n.placedCard);
  if (unsolved.length > 0) {
    return {
      mood: "love",
      reply: `¡Escuché que dijiste "${transcript.slice(0, 35)}"! Qué bonito que me hables. Te sugiero que te enfoques en "${unsolved[0].label}". ¡Yo creo en ti con todo lo que tengo!`,
    };
  }
  return {
    mood: "celebrating",
    reply: `¡Dijiste "${transcript.slice(0, 35)}" y ya solo pienso en lo increíble que eres! ¡Eres mi héroe favorito de todo el universo, sin ninguna duda!`,
  };
}
