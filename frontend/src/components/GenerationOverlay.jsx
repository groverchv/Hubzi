import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'lucide-react';

/**
 * Overlay de generación de tablero.
 * - Con `stage` real (del job async del backend) muestra la etapa actual.
 * - Sin `stage`, rota fases cosméticas para que la espera no se sienta rota.
 * - `onCancel` permite abortar la espera (AbortController en el llamador).
 */
const GENERATION_STEPS = [
  'Leyendo tu documento…',
  'Detectando el área de estudio…',
  'Diseñando el circuito de niveles…',
  'Generando preguntas y distractores…',
  'Calibrando la dificultad a tu perfil…',
];

// Etapas reales reportadas por el job del backend → texto de UI
const STAGE_LABELS = {
  queued: 'En cola…',
  reading: 'Leyendo tus documentos…',
  cache: 'Buscando análisis previo…',
  generating: 'Generando preguntas con IA…',
  saving: 'Guardando tu tablero…',
  done: '¡Listo!',
  error: 'Algo salió mal…',
};

const STEP_MS = 2600;

export default function GenerationOverlay({ stage = null, onCancel = null }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (stage) return; // con etapa real no rotamos fases cosméticas
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, GENERATION_STEPS.length - 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, [stage]);

  const label = stage ? STAGE_LABELS[stage] || 'Procesando…' : GENERATION_STEPS[step];
  const progressPct = stage
    ? { queued: 8, reading: 25, cache: 35, generating: 65, saving: 90, done: 100, error: 100 }[stage] ?? 50
    : ((step + 1) / GENERATION_STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="flex flex-col items-center max-w-md w-full mx-4 p-8 bg-slate-900/90 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)]">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-5" />

        <AnimatePresence mode="wait">
          <motion.h3
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-lg font-black tracking-wide text-cyan-300 mb-4 uppercase text-center"
          >
            {label}
          </motion.h3>
        </AnimatePresence>

        {/* Barra de progreso por fases */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
          <motion.div
            className="h-full bg-cyan-400 rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <p className="text-[11px] text-slate-400 mt-1 text-center leading-relaxed">
          Esto puede tardar unos segundos. Las matemáticas y la física se
          generan al instante; los demás dominios usan IA.
        </p>

        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-5 flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
          >
            <XCircle className="w-4 h-4" />
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
