import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Overlay de generación de tablero con progreso por fases.
 * La generación real puede tardar varios segundos (extracción + IA);
 * mostrar fases honestas evita que la pantalla quieta se sienta rota.
 */
const GENERATION_STEPS = [
  'Leyendo tu documento…',
  'Detectando el área de estudio…',
  'Diseñando el circuito de niveles…',
  'Generando preguntas y distractores…',
  'Calibrando la dificultad a tu perfil…',
];

const STEP_MS = 2600;

export default function GenerationOverlay() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // Las fases avanzan hasta la penúltima; la última espera a la respuesta real
      setStep((s) => Math.min(s + 1, GENERATION_STEPS.length - 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md">
      <div className="flex flex-col items-center max-w-md w-full mx-4 p-8 bg-slate-900/90 border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)]">
        <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-5" />

        <AnimatePresence mode="wait">
          <motion.h3
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="text-lg font-black tracking-wide text-cyan-300 mb-4 uppercase text-center"
          >
            {GENERATION_STEPS[step]}
          </motion.h3>
        </AnimatePresence>

        {/* Barra de progreso por fases */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-4">
          <motion.div
            className="h-full bg-cyan-400 rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: `${((step + 1) / GENERATION_STEPS.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="flex gap-1.5">
          {GENERATION_STEPS.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= step ? 'bg-cyan-400' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mt-4 text-center leading-relaxed">
          Esto puede tardar unos segundos. Las matemáticas y la física se
          generan al instante; los demás dominios usan IA.
        </p>
      </div>
    </div>
  );
}
