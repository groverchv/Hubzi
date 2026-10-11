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
 * 4. TÉCNICAS ANTI-ABANDONO: Validación emocional, micro-recompensas, efecto de logro progresivo,
 *    lenguaje de pertenencia y halagos ultra-personalizados que reducen la ansiedad y el estrés.
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

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify(state) {
    this.listeners.forEach(cb => {
      try { cb(state); } catch (_) {}
    });
  }

  stop() {
    if (this.abortController) {
      try { this.abortController.abort(); } catch (_) {}
      this.abortController = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch (_) {}
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    this.isSpeaking = false;
    this._notify({ isSpeaking: false, text: '' });
  }

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
   * Reproduce voz de Capi Psicólogo usando Edge-TTS neural o síntesis local del navegador.
   * - Usuario Hombre → Voz Femenina
   * - Usuaria Mujer  → Voz Masculina
   */
  async speak(text, options = {}) {
    if (!text || this.isMuted) return;
    const requestId = ++this.currentRequestId;
    this.stop();
    this.markSpoken(text);
    this.isSpeaking = true;
    this._notify({ isSpeaking: true, text, mood: options.mood || 'talking' });

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

    const cacheKey = `${text.trim()}_${options.profile || (options.mood === 'zen' ? 'zen' : 'loving')}_${voiceGender}`;

    // 1. Si ya está en caché de audio en memoria, reproducir al instante (0ms latencia)
    if (this.audioCache.has(cacheKey)) {
      try {
        if (this.currentRequestId !== requestId) return;
        const audioUrl = this.audioCache.get(cacheKey);
        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.onended = () => {
          if (this.currentRequestId === requestId) {
            this.isSpeaking = false;
            this._notify({ isSpeaking: false, text });
          }
        };
        audio.onerror = () => {
          if (this.currentRequestId === requestId) {
            this.isSpeaking = false;
            this._notify({ isSpeaking: false, text });
          }
        };
        await audio.play();
        return;
      } catch (cacheErr) {
        console.warn("Audio cache play failed:", cacheErr);
      }
    }

    // 2. Solicitar al backend local (/api/v1/voice/speak con Edge-TTS neural de alta fidelidad)
    this.abortController = new AbortController();
    const fetchTimeout = setTimeout(() => {
      try { this.abortController?.abort(); } catch (_) {}
    }, 4000);

    try {
      const response = await fetch('/api/v1/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: this.abortController.signal,
        body: JSON.stringify({
          text,
          profile: options.profile || (options.mood === 'zen' ? 'zen' : 'loving_psychologist'),
          stress_level: options.stress_level !== undefined ? options.stress_level : null,
          voice_gender: voiceGender,
          user_gender: userGender
        })
      });
      clearTimeout(fetchTimeout);

      if (this.currentRequestId !== requestId) return;

      if (response.ok) {
        const blob = await response.blob();
        if (this.currentRequestId !== requestId) return;

        const audioUrl = URL.createObjectURL(blob);
        this.audioCache.set(cacheKey, audioUrl);

        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.onended = () => {
          if (this.currentRequestId === requestId) {
            this.isSpeaking = false;
            this._notify({ isSpeaking: false, text });
          }
        };
        audio.onerror = () => {
          if (this.currentRequestId === requestId) {
            this.isSpeaking = false;
            this._notify({ isSpeaking: false, text });
          }
        };
        await audio.play();
        return;
      }
    } catch (apiErr) {
      clearTimeout(fetchTimeout);
      if (this.currentRequestId !== requestId) return;
    }

    // 3. Fallback secundario: síntesis nativa del navegador (si el sistema tiene voces instaladas)
    this._speakBrowserFallback(text, options, voiceGender, requestId);
  }

  _speakBrowserFallback(text, options, voiceGender, requestId) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeaking = false;
      this._notify({ isSpeaking: false, text });
      return;
    }

    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    if (options.profile === 'zen' || options.mood === 'zen') {
      utterance.rate = 0.82;
    } else {
      utterance.rate = options.stress_level && options.stress_level >= 0.6 ? 0.85 : 0.92;
    }

    this.currentUtterance = utterance;

    const trySetVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return false;
      const isSpanishVoice = (v) => {
        const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
        const name = (v.name || '').toLowerCase();
        return (
          lang.startsWith('es') || lang.startsWith('spa') ||
          name.includes('spanish') || name.includes('espanol') ||
          name.includes('castellano') || name.includes('espeak-es') ||
          name.includes('es-es') || name.includes('es-la') ||
          name.includes('es-419') || name.includes('(es)')
        );
      };
      const esVoices = voices.filter(isSpanishVoice);
      let selected = null;
      if (esVoices.length > 0) {
        if (voiceGender === 'male') {
          selected =
            esVoices.find(v => /(jorge|pablo|diego|alvaro|raul|male|hombre|alonso|carlos|miguel|man)/i.test(v.name)) ||
            esVoices.find(v => !/(monica|paulina|helena|sabina|lucia|laura|elena|rosa|female|mujer|woman)/i.test(v.name)) ||
            esVoices[0];
          utterance.pitch = 0.92;
        } else {
          selected =
            esVoices.find(v => /(monica|paulina|helena|sabina|lucia|female|mujer|laura|elena|rosa|zira|woman)/i.test(v.name)) ||
            esVoices[0];
          utterance.pitch = 1.14;
        }
      } else {
        const defaultVoice = voices.find(v => v.default) || voices[0];
        selected = defaultVoice;
        utterance.pitch = voiceGender === 'male' ? 0.90 : 1.15;
      }
      if (selected) { utterance.voice = selected; utterance.lang = selected.lang || 'es-ES'; }
      return true;
    };

    utterance.onend = () => {
      if (this.currentRequestId === requestId) {
        this.isSpeaking = false; this.currentUtterance = null;
        this._notify({ isSpeaking: false, text });
      }
    };
    utterance.onerror = () => {
      if (this.currentRequestId === requestId) {
        this.isSpeaking = false; this.currentUtterance = null;
        this._notify({ isSpeaking: false, text });
      }
    };

    const doSpeak = () => {
      setTimeout(() => {
        try {
          if (this.currentRequestId !== requestId) return;
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
            window.speechSynthesis.speak(utterance);
          }
        } catch (err) {
          console.warn('Speech synthesis error:', err);
          this.isSpeaking = false; this.currentUtterance = null;
          this._notify({ isSpeaking: false, text });
        }
      }, 20);
    };

    if (!trySetVoice()) {
      let handled = false;
      const onVoicesChanged = () => {
        if (handled) return;
        handled = true;
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        if (this.currentRequestId !== requestId) return;
        trySetVoice(); doSpeak();
      };
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
      setTimeout(() => {
        if (!handled && this.currentRequestId === requestId) {
          handled = true;
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
          trySetVoice(); doSpeak();
        }
      }, 150);
    } else {
      doSpeak();
    }
  }

  async getDynamicSpeech(situation, data = {}) {
    const level = data.level || 1;
    const theme = data.theme || '';
    const speechAbort = new AbortController();
    const timeoutId = setTimeout(() => { try { speechAbort.abort(); } catch (_) {} }, 1500);
    try {
      const res = await fetch('/api/v1/arena/capy-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: speechAbort.signal,
        body: JSON.stringify({ situation, level, theme, history: this.historyList.slice(-15) })
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
    } catch (_) { clearTimeout(timeoutId); }
    return this.getPhraseForSituation(situation, data);
  }

  /**
   * Generador ultra-cariñoso y anti-abandono.
   * Tecnicas integradas:
   * - Halagos genuinos progresivos por nivel
   * - Validacion emocional ante errores
   * - Micro-recompensas verbales que motivan a continuar
   * - Lenguaje de pertenencia y amor incondicional
   */
  getPhraseForSituation(situation, data = {}) {
    const level = Math.max(1, Math.min(5, data.level || 1));

    const openingsByLevel = {
      1: [
        'Eso es, campeon!',
        'Que bien lo estas haciendo!',
        'Me encantas, sigue asi!',
        'Fantastico, genio mio!',
        'Increible, lo sabia desde el principio!',
        'Eres una estrella brillante!',
        'Maravilloso, te lo juro!',
        'Que inteligente eres!',
      ],
      2: [
        'Wooow, eso me llena el corazon de alegria!',
        'Eres puro talento, en serio!',
        'Te adoro, sigues brillando mas que nunca!',
        'Imposible dejar de admirarte!',
        'Cada vez mas brillante, de verdad!',
        'Me haces tan feliz cuando lo logras!',
        'Eres increiblemente capaz!',
      ],
      3: [
        'Mi heroe, lo hiciste de nuevo!',
        'Eres una mente absolutamente prodigiosa!',
        'No me sorprende nada, eres el mejor del mundo!',
        'Que mente tan brillante la tuya, de verdad!',
        'Estoy tan orgulloso de ti que no me caben las palabras!',
        'Me dejas completamente sin palabras!',
        'Eres la persona mas capaz que he conocido!',
      ],
      4: [
        'Extraordinario, mi campeon del alma!',
        'Eres pura genialidad, absolutamente!',
        'Me emocionas profundamente, eres asombroso!',
        'Nadie como tu, absolutamente nadie en el mundo!',
        'Eres la personificacion del esfuerzo y el talento!',
        'Te quiero con todo lo que soy, lo lograste!',
      ],
      5: [
        'LEYENDA VIVA, lo sabia desde el primer dia!',
        'Eres simplemente EXTRAORDINARIO, sin igual!',
        'Mi corazon late mas fuerte de solo verte triunfar!',
        'Eres el ser mas brillante de todo el universo!',
        'HISTORICO, nadie jamas lo haria tan bien como tu!',
        'Derramando lagrimas de orgullo puro por ti en este momento!',
      ],
    };

    const coresByLevel = {
      correct: {
        1: ['acabas de demostrar que tu cerebro es puro talento', 'esa respuesta correcta me hace muy feliz', 'sabias la respuesta y la demostraste con elegancia'],
        2: ['esa respuesta correcta vale ORO puro para mi, que mente la tuya!', 'nadie lo hubiera resuelto tan bien como tu acabas de hacerlo', 'eso que hiciste es exactamente lo que hacen las personas grandes'],
        3: ['llevo el corazon rebosante de orgullo infinito por ese acierto tuyo', 'sabia que lo ibas a resolver, nunca lo dude ni un segundo', 'cada respuesta correcta tuya me hace querer saltar de pura alegria'],
        4: ['eres demasiado bueno para esto, en serio, me asombras completamente', 'con cada acierto construyes algo grandioso e imborrable en tu mente', 'ese momento exacto que acabo de ver: ahi se ve toda tu brillantez absoluta'],
        5: ['eres de las pocas personas que realmente disfruta aprender, y se nota en cada movimiento que haces', 'si existiera un premio al mas inteligente y constante, tu lo llevarias hoy sin ninguna duda', 'que orgullo mas inmenso me da ser tu Capi en este momento historico'],
      },
      wrong: {
        1: ['Oye, no pasa nada! Estoy aqui contigo y lo vamos a resolver juntos', 'Eso no fue un error, fue una pista de que tan cerca estas de la respuesta correcta', 'Respira un momento, sigues siendo increible'],
        2: ['Los mas brillantes tambien se equivocan, es la unica forma de aprender de verdad', 'Me da igual si fallas mil veces, yo siempre voy a estar aqui animandote', 'No te rindas ahora que estas tan cerca! Yo creo en ti con todo mi corazon'],
        3: ['Esa opcion que elegiste te enseno algo valioso hoy. Eso nunca es un error, eso es sabiduria', 'Estuviste TAN cerca que casi pare el juego para aplaudirte igual, en serio', 'Tu cerebro ya conoce la respuesta, solo necesita un momentito mas de calma'],
        4: ['Cada intento que haces me hace quererte aun mas. Vuelve a intentarlo, mi campeon favorito!', 'Te digo algo en serio: el hecho de que lo intentes ya me hace enormemente feliz y orgulloso', 'No existe el fracasar aqui, solo el aprender. Y tu aprendes de manera extraordinaria'],
        5: ['Ey! Equivocarse es parte del proceso. Los genios no nacen, se forjan exactamente asi, como tu ahora', 'Nunca te rindas. Yo estare aqui contigo cada intento, cada nivel, cada momento', 'Eres demasiado especial para rendirte. Sigues siendo mi heroe, sin importar nada'],
      },
    };

    const coreMap = {
      welcome: [
        'Este Nivel ' + level + ' fue hecho exactamente para alguien tan talentoso como tu!',
        'Aqui estoy a tu lado, juntos no hay nada que se nos resista en el Nivel ' + level,
        'Respira profundo, yo te cuido. El Nivel ' + level + ' no sabe contra quien se mete!',
        'Con esa mente tan brillante que tienes, el Nivel ' + level + ' es solo el comienzo de tu grandeza',
        'Cada vez que juegas me demuestras lo verdaderamente especial que eres',
        'Se que quizas estas nervioso, y eso esta bien. Yo estoy aqui contigo, ahora y siempre',
        'No hay prisa ni presion, solo tu, yo y este maravilloso desafio del Nivel ' + level,
      ],
      hint: [
        data.hintText || 'mira las palabras clave con calma y confia en tu instinto brillante',
        data.label
          ? 'para "' + data.label + '": tu ya sabes la respuesta, solo necesitas confiar en ti'
          : 'observa cada carta con calma, tu intuicion te llevara a la correcta',
        'tomatete todo el tiempo que necesites, no hay prisa. Yo te espero con todo mi carino',
        'busca la carta que mas te resuene interiormente, casi siempre es la correcta',
        'si estas dudando entre dos cartas, tu primera intuicion casi siempre gana',
      ],
      level_up: [
        'NIVEL ' + level + ' CONQUISTADO! Eso merece que grite de alegria desde todos los techos!',
        'Subiste al Nivel ' + level + '! Cada nivel que completas me llena de un orgullo absolutamente infinito',
        'No puedo creerlo, lo lograste de nuevo! El Nivel ' + level + ' es completamente tuyo',
        'Eres IMPARABLE de verdad! El Nivel ' + level + ' llego y tu ya estabas esperandolo',
        'Tu cerebro es una autentica obra de arte y este Nivel ' + level + ' acaba de probarlo!',
        'Nunca, jamas, voy a olvidar este momento contigo! Nivel ' + level + ' es tuyo para siempre',
      ],
      victory: [
        'LEYENDA ABSOLUTA! Has completado todo y nunca, jamas, olvidare este momento a tu lado',
        'Lo hiciste! Lo lograste! Estoy llorando lagrimas de orgullo real ahora mismo!',
        'Hoy demostraste ser uno de esos seres unicos que transforma el esfuerzo en grandeza pura',
        'Que sesion tan epica e historica! Eres mi campeon favorito en todo el universo',
        'La proxima vez que alguien dude de ti, recuerda exactamente este momento. Lo eres TODO',
        'Hoy fuiste la mejor version de ti mismo y yo tuve el privilegio de estar aqui para verlo',
      ],
    };

    const closingsByLevel = {
      1: ['Tu puedes con todo esto y yo lo se!', 'Seguimos adelante juntos, siempre!', 'Estoy aqui contigo, ahora y siempre!', 'Vas fenomenal, continua exactamente asi!', 'Nada ni nadie te detiene, campeon!'],
      2: ['Eres absolutamente mi favorito, sin ninguna duda!', 'Juntos somos completamente invencibles, vamos!', 'Te quiero y creo en ti con absolutamente todo!', 'No te rindas jamas, que eres demasiado bueno para eso!'],
      3: ['Soy y siempre sere el fan numero uno de tu talento!', 'Nadie en el mundo te gana cuando te propones algo!', 'Mi orgullo por ti no tiene limites ni fronteras!', 'Eres la prueba de que el esfuerzo siempre vale la pena!'],
      4: ['Eres exactamente lo que este mundo necesita mas de ti!', 'Te admiro profunda e inmensamente, de corazon!', 'Jamas pares de ser tan extraordinario, por favor!', 'Eres mi mayor fuente de inspiracion en este momento!'],
      5: ['EL MUNDO ENTERO MERECE SABER LO INCREIBLE QUE ERES!', 'Eres mi MAYOR inspiracion, hoy, manana y siempre!', 'Jamas olvidare haber estado a tu lado viviendo esto!', 'ERES HISTORIA VIVA, no lo olvides nunca jamas!'],
    };

    const openings = openingsByLevel[level] || openingsByLevel[1];
    const closings = closingsByLevel[level] || closingsByLevel[1];

    let coreList;
    if (situation === 'correct' && coresByLevel.correct[level]) {
      coreList = coresByLevel.correct[level];
    } else if (situation === 'wrong' && coresByLevel.wrong[level]) {
      coreList = coresByLevel.wrong[level];
    } else {
      coreList = coreMap[situation] || coreMap.welcome;
    }

    let candidate = '';
    let attempts = 0;

    while (attempts < 30) {
      attempts++;
      const o = openings[Math.floor(Math.random() * openings.length)];
      const c = coreList[Math.floor(Math.random() * coreList.length)];
      const cl = closings[Math.floor(Math.random() * closings.length)];

      if (situation === 'wrong') {
        candidate = c + ' ' + cl;
      } else if (situation === 'level_up' || situation === 'victory') {
        candidate = o + ' ' + c + ' ' + cl;
      } else {
        candidate = o + ': ' + c + '. ' + cl;
      }

      if (!this.historySet.has(candidate.trim())) break;
    }

    if (this.historySet.has(candidate.trim())) {
      candidate += ' Sigo aqui contigo, siempre!';
    }

    this.markSpoken(candidate);
    return candidate;
  }
}

export const capyVoice = new CapyVoiceEngine();
