import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Sparkles, ArrowRight, ShieldAlert, CheckCircle2, Lightbulb } from 'lucide-react';

export default function QuestionModal({ isOpen, node, onClose }) {
  if (!isOpen || !node) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg rounded-3xl bg-[#151e2e] border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(6,182,212,0.4)] overflow-hidden text-slate-100 p-6 flex flex-col"
        >
          {/* Luz Neón Superior */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee]" />

          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300 font-bold shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/50">
                  {node.label || 'Nodo Táctico'}
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Desafío Arquitectónico / Pedagógico
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo: Pregunta Formulada */}
          <div className="my-5 p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 shadow-inner">
            <p className="text-xs font-mono uppercase text-cyan-400 font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              Pregunta Formulada:
            </p>
            <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
              "{node.question || '¿Qué componente o servicio debe conectarse en esta etapa para garantizar el flujo de datos?'}"
            </p>
          </div>

          {/* Pista Pedagógica Zen de la Mascota */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/80 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-300">Pista del Capiguara Zen:</p>
              <p className="text-[11px] text-emerald-200/80 leading-snug">
                {node.hint || 'Revisa tu mano de cartas y arrastra la que cumpla exactamente este rol en el circuito.'}
              </p>
            </div>
          </div>

          {/* Estado de la Carta si ya fue colocada */}
          {node.placedCard && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-900/30 border border-emerald-400/40 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Respuesta colocada: {node.placedCard.name}
              </span>
              <span className="font-mono">{node.placedCard.cost}</span>
            </div>
          )}

          {/* Botón Entendido */}
          <div className="mt-5 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            >
              Entendido, Buscaré la Carta
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
