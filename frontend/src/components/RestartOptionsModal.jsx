import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, RefreshCw, Dices, Zap, Sparkles } from "lucide-react";

/**
 * Modal de opciones de reinicio: repetir el mismo examen (instantáneo)
 * o regenerar nuevas preguntas del documento con IA.
 */
export default function RestartOptionsModal({
  open,
  onClose,
  onSameExam,
  onNewQuestions,
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 25 }}
            className="relative w-full max-w-lg rounded-3xl bg-[var(--color-arcade-navy)] border-4 border-[var(--color-arcade-navy-dark)] p-6 sm:p-7 text-white shadow-[0_16px_0_var(--color-arcade-ink),0_25px_50px_rgba(0,0,0,0.7)] flex flex-col items-center text-center overflow-hidden"
          >
            {/* Botón cerrar X */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[var(--color-arcade-navy-dark)] text-slate-400 hover:text-white transition-colors cursor-pointer border border-[var(--color-arcade-navy-light)]"
              title="Cancelar y volver al juego"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Encabezado */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-arcade-navy-dark)] border-2 border-[var(--color-arcade-navy-light)] mb-3">
              <RotateCcw className="w-4 h-4 text-[var(--color-arcade-orange)]" />
              <span className="text-[11px] font-black uppercase text-[var(--color-arcade-orange)] tracking-wider">
                ¿Cómo deseas reiniciar?
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight mb-2">
              Elige tu modo de práctica
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mb-6 max-w-md">
              Puedes reintentar el examen actual para afianzar conceptos o
              generar preguntas completamente nuevas con IA.
            </p>

            {/* Las 2 Opciones en tarjetas interactivas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-5">
              {/* OPCIÓN A */}
              <button
                onClick={onSameExam}
                className="group relative p-4 rounded-2xl bg-[#0d1b33] hover:bg-[#162c52] border-2 border-[var(--color-arcade-navy-light)] hover:border-[var(--color-arcade-green)] border-b-4 hover:border-b-[#2e8a22] text-left transition-all cursor-pointer shadow-[0_4px_0_var(--color-arcade-ink)] active:translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-arcade-green)]/20 border border-[var(--color-arcade-green)]/50 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-[var(--color-arcade-green)] group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--color-arcade-green)]/20 text-[var(--color-arcade-green)] border border-[var(--color-arcade-green)]/40">
                    <Zap className="w-2.5 h-2.5" /> Instantáneo
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-[var(--color-arcade-green)] transition-colors mb-1">
                    Mismo Examen
                  </h4>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    Limpia el tablero y devuelve tus cartas a la mano para
                    reintentar este mismo circuito (0 seg).
                  </p>
                </div>
              </button>

              {/* OPCIÓN B */}
              <button
                onClick={onNewQuestions}
                className="group relative p-4 rounded-2xl bg-[#0d1b33] hover:bg-[#162c52] border-2 border-[var(--color-arcade-navy-light)] hover:border-[var(--color-arcade-yellow)] border-b-4 hover:border-b-[#b88200] text-left transition-all cursor-pointer shadow-[0_4px_0_var(--color-arcade-ink)] active:translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--color-arcade-yellow)]/20 border border-[var(--color-arcade-yellow)]/50 flex items-center justify-center">
                    <Dices className="w-5 h-5 text-[var(--color-arcade-yellow)] group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--color-arcade-yellow)]/20 text-[var(--color-arcade-yellow)] border border-[var(--color-arcade-yellow)]/40">
                    <Sparkles className="w-2.5 h-2.5" /> IA Gemini
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-[var(--color-arcade-yellow)] transition-colors mb-1">
                    Nuevas Preguntas
                  </h4>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                    La IA extraerá nuevos conceptos y preguntas diferentes del
                    mismo documento (~2-5 seg).
                  </p>
                </div>
              </button>
            </div>

            {/* Botón cancelar */}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-[var(--color-arcade-navy-dark)] hover:bg-[#142340] border border-[var(--color-arcade-navy-light)] text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Volver al juego
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
