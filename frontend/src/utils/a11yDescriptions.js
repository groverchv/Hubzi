/**
 * a11yDescriptions.js — Sistema centralizado de metadatos y descripciones
 * accesibles para lectores de pantalla (Screen Readers / TalkBack / NVDA / VoiceOver).
 *
 * Facilita que estudiantes con discapacidad visual, baja visión o neurodivergencia
 * comprendan exactamente qué hay en pantalla (personajes, biomas, cartas y estados).
 */

export const BIOME_DESCRIPTIONS = {
  beach: {
    name: 'Playa de los Apuntes (Niveles 1 al 5)',
    description: 'Costa de arena cálida con palmeras y orilla de mar turquesa suave. Nivel inicial de bienvenida y conceptos base.',
    soundAtmosphere: 'Olas suaves y brisa marina relajante.'
  },
  bamboo: {
    name: 'Bosque de Bambú (Niveles 6 al 10)',
    description: 'Sendero de piedras rodeado de cañas de bambú verdes y naturaleza tranquila. Nivel intermedio de concentración.',
    soundAtmosphere: 'Cañas de bambú meciéndose con el viento y aves lejanas.'
  },
  springs: {
    name: 'Aguas Termales Zen (Niveles 11 al 15)',
    description: 'Pozas de agua tibia con vapor suave ascendente y piedras pulidas de meditación. Nivel avanzado de respiración y enfoque.',
    soundAtmosphere: 'Murmullo de agua tibia y vapor zen.'
  },
  temple: {
    name: 'Cumbre del Templo Boss (Niveles 16 al 20)',
    description: 'Cima elevada de la montaña con un templo tradicional iluminado con faroles dorados. Reto final de maestría con Hubzi.',
    soundAtmosphere: 'Campanadas tibetanas suaves y viento de altura.'
  }
};

/**
 * Genera una descripción accesible para cualquier avatar o traje de Hubzi
 */
export function getMascotA11yDescription(mascot) {
  if (!mascot) {
    return 'Hubzi, la tierna capibara estudiante con mochila, lápiz y cuaderno de apuntes, sonriendo con calidez.';
  }

  const roleText = mascot.role ? `en su profesión de ${mascot.role}` : '';
  const greetingText = mascot.greeting ? ` Dice: "${mascot.greeting}"` : '';

  return `Hubzi la capibara ${roleText}. Ilustración amigable de estilo Studio Ghibli con bordes suaves.${greetingText}`;
}

/**
 * Genera el aria-label y texto para un nodo de nivel en la Isla de Campaña
 */
export function getLevelNodeA11y({ number, status, stars = 0, questionCount, isBoss = false }) {
  const bossText = isBoss ? 'Nivel Boss cumbre del templo, ' : '';
  if (status === 'completed') {
    return `Nivel ${number}, ${bossText}completado con ${stars} de 3 estrellas. Contiene ${questionCount} preguntas.`;
  }
  if (status === 'current') {
    return `Nivel ${number}, ${bossText}nivel actual activo donde se encuentra Hubzi. Presiona para jugar ${questionCount} preguntas.`;
  }
  return `Nivel ${number}, ${bossText}bloqueado. Requiere completar el nivel anterior.`;
}

/**
 * Genera la descripción de una carta en la Arena de Juego
 */
export function getCardA11yDescription(card) {
  if (!card) return 'Carta de juego vacía.';

  if (card.isTrap) {
    return `Carta Trampa de distracción: "${card.label || card.text}". Ten cuidado, esta opción no corresponde a la respuesta correcta.`;
  }

  return `Carta de estudio: "${card.label || card.text}". Categoría: ${card.category || 'concepto general'}.`;
}

/**
 * Anunciador dinámico para lectores de pantalla mediante aria-live
 */
let liveRegionEl = null;

export function announceToScreenReader(message, priority = 'polite') {
  if (typeof document === 'undefined') return;

  if (!liveRegionEl) {
    liveRegionEl = document.createElement('div');
    liveRegionEl.id = 'hubzi-a11y-live-region';
    liveRegionEl.setAttribute('aria-live', priority);
    liveRegionEl.setAttribute('aria-atomic', 'true');
    liveRegionEl.className = 'sr-only';
    // Utilidades Tailwind para ocultar visualmente pero mantener disponible para screen readers:
    Object.assign(liveRegionEl.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: '0'
    });
    document.body.appendChild(liveRegionEl);
  }

  liveRegionEl.setAttribute('aria-live', priority);
  // Limpiar y actualizar texto para forzar el evento en TalkBack/NVDA
  liveRegionEl.textContent = '';
  setTimeout(() => {
    if (liveRegionEl) liveRegionEl.textContent = message;
  }, 50);
}
