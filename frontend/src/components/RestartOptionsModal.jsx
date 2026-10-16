import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, RefreshCw, Dices } from "lucide-react";

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
            className="relative w-full max-w-lg rounded-3xl bg-[#122443] border-4 border-[#0a162b] p-6 sm:p-7 text-white shadow-[0_16px_0_#050a13,0_25px_50px_rgba(0,0,0,0.7)] flex flex-col items-center text-center overflow-hidden"
          >
            {/* Botón cerrar X */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl bg-[#0a162b] text-slate-400 hover:text-white transition-colors cursor-pointer border border-[#1e3a6c]"
              title="Cancelar y volver al juego"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Encabezado */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0a162b] border-2 border-[#1e3a6c] mb-3">
              <RotateCcw className="w-4 h-4 text-[#FF7A00]" />
              <span className="text-[11px] font-black uppercase text-[#FF7A00] tracking-wider">
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
                className="group relative p-4 rounded-2xl bg-[#0d1b33] hover:bg-[#162c52] border-2 border-[#1e3a6c] hover:border-[#48C838] border-b-4 hover:border-b-[#2e8a22] text-left transition-all cursor-pointer shadow-[0_4px_0_#050a13] active:translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#48C838]/20 border border-[#48C838]/50 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-[#48C838] group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#48C838]/20 text-[#48C838] border border-[#48C838]/40">
                    ⚡ Instantáneo
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-[#48C838] transition-colors mb-1">
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
                className="group relative p-4 rounded-2xl bg-[#0d1b33] hover:bg-[#162c52] border-2 border-[#1e3a6c] hover:border-[#FFB400] border-b-4 hover:border-b-[#b88200] text-left transition-all cursor-pointer shadow-[0_4px_0_#050a13] active:translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFB400]/20 border border-[#FFB400]/50 flex items-center justify-center">
                    <Dices className="w-5 h-5 text-[#FFB400] group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#FFB400]/20 text-[#FFB400] border border-[#FFB400]/40">
                    ✨ IA Gemini
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-[#FFB400] transition-colors mb-1">
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
              className="w-full py-2.5 rounded-xl bg-[#0a162b] hover:bg-[#142340] border border-[#1e3a6c] text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
            >
              Volver al juego
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
