import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Play, Volume2, VolumeX, Sparkles, ChevronRight } from 'lucide-react';
import capybara3dImg from '../assets/capybara_3d.jpg';
import { capyVoice } from '../utils/capyVoice';

/**
 * Técnica de Respiración Terapéutica 4-7-8 (Respaldada psicológicamente para reducir cortisol y ansiedad):
 * Inhala: 4 segundos (Estimula el sistema nervioso de forma controlada)
 * Retén: 7 segundos (Oxigena la sangre y reduce el ritmo cardíaco de forma profunda)
 * Exhala: 8 segundos (Activa el sistema nervioso parasimpático y calma la mente)
 *
 * Exactamente 2 ciclos para preparar al estudiante sin fatigarlo.
 */
const BREATH_PHASES = [
  {
    key: 'inhale',
    title: 'Inhala profundamente',
    instruction: 'Cierra los ojos... toma aire por la nariz, lentamente, sin prisa...',
    duration: 4,
    scale: 1.25,
    glow: 'rgba(186, 230, 253, 0.45)',
    borderColor: '#38bdf8',
    textColor: '#0369a1',
    speakText: 'Inhala... despacio... siente cómo el aire llena tu cuerpo.'
  },
  {
    key: 'hold',
    title: 'Sostén el aire',
    instruction: 'Mantén el aire... en silencio... tu mente se asienta como el agua quieta...',
    duration: 7,
    scale: 1.25,
    glow: 'rgba(167, 243, 208, 0.45)',
    borderColor: '#34d399',
    textColor: '#047857',
    speakText: 'Retén el aire... con calma... siente la paz que hay dentro de ti.'
  },
  {
    key: 'exhale',
    title: 'Suelta todo',
    instruction: 'Exhala lentamente... suelta cualquier tensión... suelta cualquier preocupación...',
    duration: 8,
    scale: 0.92,
    glow: 'rgba(253, 230, 138, 0.45)',
    borderColor: '#fbbf24',
    textColor: '#b45309',
    speakText: 'Exhala... muy despacio... deja ir todo lo que no necesitas.'
  }
];

// Frases terapéuticas con pausas naturales (comas y puntos suspensivos guían el ritmo de la voz)
const ZEN_PHRASES = {
  intro:  "Cierra los ojos... respira conmigo... Vamos a soltar todo lo que no necesitas... juntos.",
  inhale: "Inhala... despacio... siente cómo el aire llena tu pecho... poco a poco.",
  hold:   "Sostén el aire... con calma... tu mente se aquieta... todo está bien.",
  exhale: "Exhala... muy despacio... suelta cualquier tensión... suelta cualquier pensamiento.",
  cycle2: "Segundo ciclo... inhala de nuevo... profundo... y sereno.",
  finish: "Maravilloso... tu mente está en paz... y tu cuerpo está listo. Confía en ti."
};

export default function ZenRelaxModal({ isOpen, onComplete, onSkip }) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(4);
  const [cycleCount, setCycleCount] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);

  const totalCycles = 2; // Exactamente 2 repeticiones terapéuticas recomendadas
  const currentPhase = BREATH_PHASES[phaseIndex];
  const timerRef = useRef(null);
  const currentAudioRef = useRef(null);
  const audioCacheRef = useRef(new Map());
  const activeRequestIdRef = useRef(0);

  // Silenciar de inmediato cualquier audio en reproducción o voz residual
  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    // Cancelar y silenciar permanentemente el sintetizador nativo del navegador
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  };

  // Reproducción EXCLUSIVA de la voz hiper-realista de ElevenLabs
  // Nunca se activa el sintetizador robótico del navegador para evitar doble voz
  const speakVoice = async (text) => {
    if (isMuted || !text) return;

    // Incrementar ID para invalidar solicitudes que tarden y evitar que suenen desfasadas
    const requestId = ++activeRequestIdRef.current;

    // Detener cualquier audio que estuviese sonando
    stopAllAudio();

    // 1. Si ya está en caché en memoria, reproducir al instante (0ms latencia)
    if (audioCacheRef.current.has(text)) {
      try {
        const audioUrl = audioCacheRef.current.get(text);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        await audio.play();
      } catch (playErr) {
        console.warn("Audio play error:", playErr);
      }
      return;
    }

    // 2. Solicitar al backend la voz sintetizada
    try {
      setIsVoiceLoading(true);
      const res = await fetch('/api/v1/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, profile: 'zen' })
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        audioCacheRef.current.set(text, audioUrl);

        // Si la fase ya cambió mientras se descargaba el audio, descartarlo
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        await audio.play();
        return;
      }
    } catch (err) {
      // Ignorar errores de red y activar fallback sin alarmas
    } finally {
      if (requestId === activeRequestIdRef.current) {
        setIsVoiceLoading(false);
      }
    }

    // 3. Fallback inmediato con síntesis suave si el backend no responde
    if (requestId === activeRequestIdRef.current) {
      capyVoice.speak(text, { profile: 'zen', stress_level: 0.7 });
    }
  };

  // Precarga suave y secuencial de frases en segundo plano
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    const phrasesToPreload = Object.values(ZEN_PHRASES);

    const preloadNext = async (index) => {
      if (!isSubscribed || index >= phrasesToPreload.length) return;
      const phrase = phrasesToPreload[index];
      if (!audioCacheRef.current.has(phrase)) {
        try {
          const res = await fetch('/api/v1/voice/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: phrase, profile: 'zen' })
          });
          if (res.ok && isSubscribed) {
            const blob = await res.blob();
            const audioUrl = URL.createObjectURL(blob);
            audioCacheRef.current.set(phrase, audioUrl);
          }
        } catch (e) {}
      }
      // Pequeño intervalo de 800ms entre precargas para no saturar la red
      if (isSubscribed) {
        setTimeout(() => preloadNext(index + 1), 800);
      }
    };

    const timer = setTimeout(() => preloadNext(0), 1200);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Inicio automático de la sesión
  useEffect(() => {
    if (isOpen) {
      setPhaseIndex(0);
      setTimeLeft(BREATH_PHASES[0].duration);
      setCycleCount(1);
      setHasStarted(true);
      // Limpiar caché para que se regeneren con los nuevos parámetros de voz terapéutica
      audioCacheRef.current.clear();

      const introTimer = setTimeout(() => {
        speakVoice(ZEN_PHRASES.intro);
      }, 600); // Pequeña pausa inicial para que el usuario vea el modal antes de escuchar la voz

      return () => {
        clearTimeout(introTimer);
        stopAllAudio();
      };
    } else {
      stopAllAudio();
    }
  }, [isOpen]);

  // Contador regresivo y transición entre fases
  useEffect(() => {
    if (!isOpen || !hasStarted) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextPhase();
          return 1;
        }
        const nextVal = prev - 1;
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [isOpen, hasStarted, phaseIndex, cycleCount]);

  const handleNextPhase = () => {
    if (phaseIndex === 0) {
      // Inhala -> Retén (7 segundos)
      setPhaseIndex(1);
      setTimeLeft(7);
      speakVoice(ZEN_PHRASES.hold);
    } else if (phaseIndex === 1) {
      // Retén -> Exhala (8 segundos)
      setPhaseIndex(2);
      setTimeLeft(8);
      speakVoice(ZEN_PHRASES.exhale);
    } else {
      // Fin de ciclo
      if (cycleCount < totalCycles) {
        setCycleCount(c => c + 1);
        setPhaseIndex(0);
        setTimeLeft(4);
        speakVoice(ZEN_PHRASES.cycle2);
      } else {
        speakVoice(ZEN_PHRASES.finish);
        // Registrar sesión completada en MongoDB
        try {
          fetch('/api/v1/zen/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              log_type: 'breathing_4_7_8',
              duration_seconds: 40,
              notes: 'Pausa activa terapéutica completada con Capi Zen antes de la partida'
            })
          }).catch(() => {});
        } catch (e) {}

        setTimeout(() => {
          onComplete();
        }, 2200);
      }
    }
  };

  const handleSkipNow = () => {
    stopAllAudio();
    onSkip ? onSkip() : onComplete();
  };

  if (!isOpen) return null;


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none"
      >
        {/* Fondo con aura zen respiratoria suave */}
        <motion.div
          animate={{
            scale: currentPhase.scale * 1.15,
            opacity: [0.2, 0.45, 0.2]
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
          style={{ background: currentPhase.glow }}
          className="absolute w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full blur-3xl pointer-events-none"
        />

        {/* Tarjeta Central Clara y Relajante */}
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0f172a] border border-slate-700/80 p-6 sm:p-9 text-center shadow-2xl flex flex-col items-center backdrop-blur-md"
        >
          {/* Header con Capibara Guía */}
          <div className="flex items-center justify-between w-full mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl overflow-hidden border border-emerald-400 shadow-sm bg-slate-900">
                <img src={capybara3dImg} alt="Capi Zen" className="w-full h-full object-cover" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Capi Zen Guía
                </h4>
                <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  <span>Terapia 4-7-8</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-semibold">Calma y Foco</span>
                </p>
              </div>
            </div>

            {/* Controles de Sonido y Omitir */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  stopAllAudio();
                  setIsMuted(!isMuted);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                title={isMuted ? "Activar voz de la IA" : "Silenciar voz"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              </button>

              <button
                onClick={handleSkipNow}
                className="text-[11px] font-medium text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1 border border-slate-700"
              >
                <span>Saltar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Indicador de Ciclo */}
          <div className="px-3.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-slate-300 tracking-wider mb-6">
            CICLO DE RESPIRACIÓN {cycleCount} DE {totalCycles}
          </div>

          {/* Círculo Principal de Respiración Animado */}
          <div className="relative flex items-center justify-center my-4 w-52 h-52 sm:w-60 sm:h-60">
            {/* Anillo exterior */}
            <motion.div
              animate={{
                scale: [currentPhase.scale * 0.9, currentPhase.scale * 1.15, currentPhase.scale * 0.9],
                borderColor: currentPhase.borderColor
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-2 border-dashed opacity-40"
            />

            {/* Círculo que se infla y desinfla */}
            <motion.div
              animate={{
                scale: currentPhase.scale,
                boxShadow: `0 8px 30px ${currentPhase.glow}`
              }}
              transition={{ duration: currentPhase.duration, ease: 'easeInOut' }}
              style={{ borderColor: currentPhase.borderColor }}
              className="w-40 h-40 sm:w-44 sm:h-44 rounded-full border-4 bg-slate-950 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden backdrop-blur-md"
            >
              {/* Icono temático */}
              <motion.div
                animate={{ rotate: currentPhase.key === 'inhale' ? 360 : 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                className="mb-1"
              >
                <Wind className="w-7 h-7" style={{ color: currentPhase.borderColor }} />
              </motion.div>

              {/* Segundero Grande */}
              <motion.span 
                key={timeLeft}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl sm:text-5xl font-black font-mono tracking-tight"
                style={{ color: currentPhase.borderColor }}
              >
                {timeLeft}s
              </motion.span>

              {/* Etiqueta de la fase */}
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mt-1">
                {currentPhase.key === 'inhale' ? 'INHALAR' : currentPhase.key === 'hold' ? 'RETENER' : 'EXHALAR'}
              </span>
            </motion.div>
          </div>

          {/* Título e instrucción de la Fase Actual */}
          <div className="mt-4 text-center">
            <h3 
              className="text-lg sm:text-xl font-bold tracking-wide uppercase transition-colors"
              style={{ color: currentPhase.borderColor }}
            >
              {currentPhase.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1 max-w-xs mx-auto">
              {currentPhase.instruction}
            </p>
          </div>

          {/* Barra de progreso de la fase */}
          <div className="w-full bg-slate-950 rounded-full h-2 mt-6 overflow-hidden border border-slate-800">
            <motion.div
              key={`${phaseIndex}-${cycleCount}`}
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: currentPhase.duration, ease: 'linear' }}
              className="h-full rounded-full"
              style={{ backgroundColor: currentPhase.borderColor }}
            />
          </div>

          {/* Botón Comenzar Ahora */}
          <button
            onClick={handleSkipNow}
            className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Estoy Listo para Comenzar</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
