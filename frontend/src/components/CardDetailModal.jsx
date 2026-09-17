import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, CheckCircle2, ShieldCheck, Zap, BookOpen, Layers } from 'lucide-react';
import { getDomainIcon, DOMAIN_ICONS } from '../utils/domainIcons';

export default function CardDetailModal({ isOpen, card, matchingNode, onClose }) {
  if (!isOpen || !card) return null;

  const IconComponent = getDomainIcon(card.domain || card.name) || DOMAIN_ICONS[card.sourceType] || Sparkles;

  return (
    <AnimatePresence>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer select-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#182338] via-[#101726] to-[#0a0f19] border-2 border-cyan-400/80 p-6 shadow-[0_0_40px_rgba(6,182,212,0.4)] text-slate-100 flex flex-col cursor-default"
        >
          {/* Luces decorativas */}
          <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 rounded shadow-md" />
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded shadow-md" />

          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-cyan-950 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-inner">
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                  {card.domain || 'CONCEPTO CLAVE'}
                </span>
                <span className="ml-2 text-xs font-mono font-black text-amber-400">
                  {card.cost || '+1x'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TÍTULO / CONCEPTO (LA RESPUESTA) */}
          <div className="mt-4 text-center">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest block mb-1">
              ✨ RESPUESTA / CONCEPTO APLICABLE:
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase px-2 py-1.5 rounded-2xl bg-slate-900/90 border border-cyan-400/40 shadow-inner">
              {card.name}
            </h2>
          </div>

          {/* FUNDAMENTACIÓN O DEFINICIÓN DE LA CARTA */}
          <div className="mt-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-700/70 shadow-inner">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-amber-300 font-bold mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Fundamentación del Documento:</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {card.content || 'Este término técnico fue extraído directamente del texto universitario como principio rector evaluable.'}
            </p>
          </div>

          {/* SI COINCIDE CON ALGUNA PREGUNTA DEL CIRCUITO */}
          {matchingNode && (
            <div className="mt-3 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex flex-col gap-1">
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Responde a la pregunta:
              </span>
              <p className="text-xs text-emerald-100/90 italic font-sans leading-snug">
                "{matchingNode.question}"
              </p>
            </div>
          )}

          {/* BOTÓN CERRAR / CONTINUAR */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_4px_0_#0284c7] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Entendido, ¡Listo para Jugarla!</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

