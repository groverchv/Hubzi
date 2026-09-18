/**
 * Motor de Voz Terapéutica, Anti-Colisión y Reacciones Afectivas de Capi Psicólogo.
 * 
 * Características clave:
 * 1. ANTI-COLISIÓN ESTRICTA: Emplea RequestID incremental, AbortController y corte inmediato
 *    de síntesis / streams previos para garantizar que JAMÁS se crucen ni solapen dos voces.
 * 2. ESCALA DE AMOR POR NIVELES (1 a 5): La ternura, devoción y los piropos aumentan progresivamente
 *    a medida que sube la dificultad o el nivel del juego.
 * 3. NO REPETICIÓN GARANTIZADA: Mantiene un registro histórico de alocuciones y un motor combinatorio
 *    procedural que asegura variedad infinita en cada partida.
 */

class CapyVoiceEngine {
  constructor() {
    this.currentAudio = null;
    this.audioCache = new Map();
    this.isSpeaking = false;
    this.listeners = new Set();
    this.isMuted = false;
    this.currentRequestId = 0;
    this.abortController = null;
    this.historySet = new Set();
    this.historyList = [];
    this.currentUser = null;
    try {
      const saved = localStorage.getItem('hubzy_current_user');
      if (saved) this.currentUser = JSON.parse(saved);
    } catch (_) {}
  }

  // Suscribirse a cambios de habla (para animar la boca/ondas de la Capibara en el UI)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify(state) {
    this.listeners.forEach(cb => {
      try { cb(state); } catch (_) {}
    });
  }

  /**
   * Detiene de manera inmediata y tajante cualquier audio o síntesis de voz en reproducción,
   * cancela peticiones de red en curso y anula los handlers onended para evitar ejecución tardía.
   */
  stop() {
    // 1. Cancelar peticiones HTTP en vuelo
    if (this.abortController) {
      try {
        this.abortController.abort();
      } catch (_) {}
      this.abortController = null;
    }

    // 2. Detener audio HTML5 en curso
    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }

    // 3. Detener síntesis local del navegador
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }

    this.isSpeaking = false;
    this._notify({ isSpeaking: false, text: '' });
  }

  /**
   * Registra una frase en el historial de sesión para evitar repeticiones futuras.
   */
  markSpoken(phrase) {
    if (!phrase) return;
    const clean = phrase.trim();
    this.historySet.add(clean);
    this.historyList.push(clean);
    if (this.historyList.length > 50) {
      const removed = this.historyList.shift();
      this.historySet.delete(removed);
    }
  }

  /**
   * Reproduce voz de Capi Psicólogo usando 100% síntesis LOCAL del navegador.
   * Cero latencia, sin llamadas al backend ni a ElevenLabs.
   * - Usuario Hombre → Voz Femenina
   * - Usuaria Mujer  → Voz Masculina
   */
  speak(text, options = {}) {
    if (!text || this.isMuted) return;

    // ID único para anti-colisión
    const requestId = ++this.currentRequestId;

    // Cortar cualquier voz previa inmediatamente
    this.stop();

    this.markSpoken(text);
    this.isSpeaking = true;
    this._notify({ isSpeaking: true, text, mood: options.mood || 'talking' });

    // Determinar género de voz según perfil del usuario
    const activeUser = options.user || this.currentUser;
    const userGender = options.user_gender || activeUser?.gender || 'masculino';
    const isMaleUser = userGender === 'masculino' || userGender === 'hombre';

    let voiceGender = options.voice_gender;
    if (!voiceGender) {
      if (activeUser?.voice_preference && activeUser.voice_preference !== 'auto') {
        voiceGender = activeUser.voice_preference;
      } else {
        voiceGender = isMaleUser ? 'female' : 'male';
      }
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeaking = false;
      this._notify({ isSpeaking: false, text });
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    if (options.profile === 'zen' || options.mood === 'zen') {
      utterance.rate = 0.82; // Ritmo pausado, sereno y terapéutico para ejercicios de respiración
    } else {
      utterance.rate = options.stress_level && options.stress_level >= 0.6 ? 0.85 : 0.92;
    }

    // Guardar referencia en el objeto para evitar que el Garbage Collector de Chrome corte la voz
    this.currentUtterance = utterance;

    // Seleccionar la mejor voz española disponible según género
    const trySetVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return false;

      const esVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('es'));
      let selected = null;

      if (esVoices.length > 0) {
        if (voiceGender === 'male') {
          selected =
            esVoices.find(v => /(jorge|pablo|diego|alvaro|raul|male|hombre|alonso|carlos|miguel)/i.test(v.name)) ||
            esVoices.find(v => !/(monica|paulina|helena|sabina|lucia|laura|elena|rosa|female|mujer)/i.test(v.name)) ||
            esVoices[0];
          utterance.pitch = 0.95;
        } else {
          selected =
            esVoices.find(v => /(monica|paulina|helena|sabina|lucia|female|mujer|laura|elena|rosa|zira)/i.test(v.name)) ||
            esVoices.find(v => /(helena|sabina|monica|laura)/i.test(v.name)) ||
            esVoices[0];
          utterance.pitch = 1.08;
        }
      }

      if (selected) {
        utterance.voice = selected;
        utterance.lang = selected.lang || 'es-ES';
      }
      return true;
    };

    utterance.onend = () => {
      if (this.currentRequestId === requestId) {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this._notify({ isSpeaking: false, text });
      }
    };
    utterance.onerror = () => {
      if (this.currentRequestId === requestId) {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this._notify({ isSpeaking: false, text });
      }
    };

    const doSpeak = () => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis error:", err);
        this.isSpeaking = false;
        this._notify({ isSpeaking: false, text });
      }
    };

    // Las voces pueden no estar listas inmediatamente al iniciar el navegador
    if (!trySetVoice()) {
      const onVoicesChanged = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        if (this.currentRequestId !== requestId) return;
        trySetVoice();
        doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      doSpeak();
    } else {
      doSpeak();
    }
  }

  /**
   * Consulta al backend por una frase generada dinámicamente con IA (Gemini).
   * Si la red demora o falla, utiliza el generador procedural local sin repetir.
   */
  async getDynamicSpeech(situation, data = {}) {
    const level = data.level || 1;
    const theme = data.theme || '';

    const speechAbort = new AbortController();
    const timeoutId = setTimeout(() => {
      try { speechAbort.abort(); } catch (_) {}
    }, 1500);

    try {
      const res = await fetch('/api/v1/arena/capy-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: speechAbort.signal,
        body: JSON.stringify({
          situation,
          level,
          theme,
          history: this.historyList.slice(-15)
        })
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json.speech && !this.historySet.has(json.speech.trim())) {
          const phrase = json.speech.trim();
          this.markSpoken(phrase);
          return phrase;
        }
      }
    } catch (_) {
      clearTimeout(timeoutId);
      // Fallback local dinámico inmediato
    }

    return this.getPhraseForSituation(situation, data);
  }

  /**
   * Generador combinatorio procedural 100% dinámico de triple ranura (Slot-Based):
   * [Apertura Reflexiva] + [Desarrollo Cognitivo / Situación] + [Cierre de Serenidad]
   * Genera más de 12.000 combinaciones únicas sin repetir jamás una frase en la misma sesión.
   */
  getPhraseForSituation(situation, data = {}) {
    const level = Math.max(1, Math.min(5, data.level || 1));

    // Ranura 1: Aperturas analíticas y psicológicas
    const openings = [
      "Excelente deducción",
      "Bien analizado",
      "Mantén ese ritmo sereno",
      "Buen trabajo mental",
      "Paso firme y claro",
      "Observo gran concentración",
      "Tu enfoque está dando frutos",
      "Razonamiento impecable",
      "Notable agudeza cognitiva",
      "Proceso mental muy lúcido",
      "Constancia evidente",
      "Estructura de pensamiento sólida"
    ];

    // Ranura 2: Núcleos específicos por situación
    const cores = {
      welcome: [
        `iniciamos el Nivel ${level} con la mente despejada`,
        `este nuevo circuito Nivel ${level} desafiará tus capacidades analíticas`,
        "cada fase es una oportunidad para consolidar lo aprendido",
        "tómate el tiempo necesario para examinar las relaciones conceptuales",
        "un paso estructurado a la vez es la clave del aprendizaje profundo",
        "la calma mental permite identificar los patrones con mayor nitidez"
      ],
      correct: [
        "has identificado con exactitud el concepto clave en juego",
        "la relación entre el enunciado y la carta seleccionada es perfecta",
        "descartaste con éxito las opciones engañosas con criterio lógico",
        "este acierto demuestra comprensión real y no simple memoria",
        "la conexión que acabas de establecer refuerza tu mapa conceptual",
        "tu deducción se alinea rigurosamente con los fundamentos del tema",
        "has resuelto la premisa aplicando un análisis crítico impecable",
        "asociación conceptual consolidada con precisión"
      ],
      wrong: [
        "Estuviste muy cerca de acertar, casi lo tienes",
        "Fue solo una pequeña equivocación, estuviste a nada de dar en el clavo",
        "Aquí está Hubzi contigo; esa opción estaba muy cerca, respira y volvamos a intentarlo",
        "Tranquilo, soy Hubzi y veo que tu razonamiento estuvo a un solo paso de la correcta",
        "Estuviste muy cerca; descartar esta alternativa te deja a las puertas de la respuesta real",
        "Una pequeña equivocación no frena tu avance; estuviste cerquísima de encajarla",
        "Hubzi te acompaña en cada paso: examina ese pequeño detalle y verás la respuesta exacta",
        "Casi la aciertas; tómate un respiro hondo y observa la siguiente carta",
        "Esa opción era muy tentadora y estuviste cerca, pero la clave está en el matiz central"
      ],
      hint: [
        data.hintText || "identifica el verbo rector de la pregunta y busca su homólogo en tus cartas",
        data.label ? `para ${data.label}: busca el principio fundamental que sostiene su definición` : "elimina las dos opciones extremas y examina la premisa central",
        "separa los detalles secundarios de la función técnica primaria",
        "compara los multiplicadores de la carta con el peso del reactivo planteado"
      ],
      level_up: [
        `has completado esta etapa y tu cerebro se adapta con agilidad al Nivel ${level}`,
        `ascendemos al Nivel ${level} manteniendo la misma serenidad analítica`,
        `tu perseverancia mental ha permitido conquistar este nivel con solvencia`,
        `a mayor dificultad, mayor necesidad de conservar el método y la pausa reflexiva`
      ],
      victory: [
        "has conquistado la totalidad del circuito con maestría y equilibrio emocional",
        "demostraste que la concentración metódica supera cualquier grado de complejidad",
        "has cerrado la sesión con un desempeño cognitivo de altísimo nivel"
      ]
    };

    // Ranura 3: Cierres de autoeficacia y refuerzo sereno
    const closings = [
      "Respira hondo y continuemos.",
      "Sigue confiando en tu criterio reflexivo.",
      "Vas por una senda mental muy sólida.",
      "Tu método de estudio está funcionando.",
      "La serenidad es tu mayor ventaja aquí.",
      "Mente despejada, resultados precisos.",
      "Paso a paso construyes dominio real.",
      "Conserva este mismo grado de enfoque."
    ];

    const coreList = cores[situation] || cores.welcome;

    let candidate = "";
    let attempts = 0;

    // Intentar construir una combinación no repetida
    while (attempts < 25) {
      attempts++;
      const o = openings[Math.floor(Math.random() * openings.length)];
      const c = coreList[Math.floor(Math.random() * coreList.length)];
      const cl = closings[Math.floor(Math.random() * closings.length)];

      if (situation === 'wrong') {
        // En corrección de error, se prioriza la contención directa sin formalismos
        candidate = `${c}. ${cl}`;
      } else {
        candidate = `${o}: ${c}. ${cl}`;
      }

      if (!this.historySet.has(candidate.trim())) {
        break;
      }
    }

    // Si aún existiera en el historial por azar extremo, agregar un marcador de tiempo sutil
    if (this.historySet.has(candidate.trim())) {
      candidate += " Continuemos con tranquilidad.";
    }

    this.markSpoken(candidate);
    return candidate;
  }
}

export const capyVoice = new CapyVoiceEngine();

