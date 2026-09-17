import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Lightbulb } from 'lucide-react';

export default function QuestionModal({ isOpen, node, onClose }) {
  if (!isOpen || !node) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl bg-[#0f172a] border border-slate-700 shadow-2xl overflow-hidden text-slate-100 p-6 sm:p-7 flex flex-col"
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-500/50 flex items-center justify-center text-sky-400 font-bold shadow-sm">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  Simulacro de Examen
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Pregunta de Evaluación
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo: Pregunta Formulada */}
          <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <p className="text-xs font-mono uppercase text-amber-400 font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              REACTIVO DE EVALUACIÓN:
            </p>
            <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
              "{node.question || 'Identifica el concepto o principio que responde al planteamiento analítico.'}"
            </p>
          </div>

          {/* Pista Pedagógica Zen de la Mascota */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0 shadow-sm">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-300">Pista del Capiguara Zen:</p>
              <p className="text-[11px] text-emerald-100/90 leading-snug">
                {node.hint || 'Revisa tu mano de cartas y arrastra la que cumpla exactamente este rol en el circuito.'}
              </p>
            </div>
          </div>

          {/* Estado de la Carta si ya fue colocada */}
          {node.placedCard && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Respuesta colocada: {node.placedCard.name}
              </span>
              <span className="font-mono font-bold text-emerald-300">{node.placedCard.cost}</span>
            </div>
          )}

          {/* Botón Entendido */}
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              Entendido, Buscaré la Carta
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
