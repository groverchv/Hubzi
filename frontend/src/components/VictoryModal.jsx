import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  Flame, 
  Star,
  Target,
  Zap,
  BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import capybara3dImg from '../assets/capybara_3d.jpg';

export default function VictoryModal({ 
  isOpen, 
  level = 1, 
  accuracy = 100, 
  totalQuestions = 5, 
  masteredConcepts = [],
  onNextLevel, 
  onRetry,
  onGoToMenu,
  onReview 
}) {
  const [showSummary, setShowSummary] = React.useState(false);
  React.useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF7A00', '#48C838', '#FFB400', '#1C8FE8']
        });
      } catch (_) {}
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 30 }}
        transition={{ type: 'spring', stiffness: 320, damping: 25 }}
        className="relative w-full max-w-md rounded-3xl bg-[#122443] border-4 border-[#0a162b] p-6 sm:p-7 text-white shadow-[0_16px_0_#050a13,0_25px_50px_rgba(0,0,0,0.7)] flex flex-col items-center text-center overflow-hidden"
      >
        {/* Glow de fondo */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#FFB400]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-[#48C838]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Badge superior Arcade */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a162b] border-2 border-[#1e3a6c] mb-3">
          <Trophy className="w-4 h-4 text-[#FFB400] animate-bounce" />
          <span className="text-[10px] font-black uppercase text-[#FFB400] tracking-wider">
            ¡Nivel {level} Superado!
          </span>
        </div>

        {/* Título de Victoria */}
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide drop-shadow mb-1">
          ¡EXCELENTE TRABAJO!
        </h2>
        <p className="text-xs text-slate-300 font-bold mb-4">
          Completaste todos los nodos del circuito de estudio con maestría.
        </p>

        {/* Estrellas de Recompensa */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= stars;
            return (
              <motion.div
                key={starIdx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: starIdx * 0.15, type: 'spring', stiffness: 400 }}
                className={`p-2 rounded-2xl border-3 shadow-md ${
                  isEarned
                    ? 'bg-[#FFB400] border-[#0a162b] text-[#122443] shadow-[0_4px_0_#D48800]'
                    : 'bg-[#0a162b] border-[#1e3a6c] text-slate-600'
                }`}
              >
                <Star className={`w-8 h-8 ${isEarned ? 'fill-current stroke-[2]' : 'stroke-[1.5]'}`} />
              </motion.div>
            );
          })}
        </div>

        {/* Indicador de Desbloqueo (Mínimo 2 estrellas) */}
        <div className={`w-full py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wide mb-4 ${
          stars >= 2 
            ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300' 
            : 'bg-rose-950/80 border border-rose-500/60 text-rose-300'
        }`}>
          {stars >= 2 
            ? '🎉 ¡Nivel Superado! (Mínimo 2★ conseguidas)' 
            : '⚠️ Necesitas mínimo 2★ para desbloquear el siguiente nivel'}
        </div>

        {/* Estadísticas de la Ronda */}
        <div className="grid grid-cols-3 gap-2.5 w-full p-3 rounded-2xl bg-[#0a162b] border-3 border-[#1e3a6c] mb-5">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
              <Target className="w-3.5 h-3.5 text-[#45B1E8]" />
              <span>Precisión</span>
            </div>
            <span className="text-lg font-black text-[#48C838] mt-0.5">{accuracy}%</span>
          </div>

          <div className="flex flex-col items-center border-x-2 border-[#1e3a6c]">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7A00]" />
              <span>Reactivos</span>
            </div>
            <span className="text-lg font-black text-white mt-0.5">{totalQuestions}</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-400">
              <Flame className="w-3.5 h-3.5 text-[#FFB400]" />
              <span>Racha</span>
            </div>
            <span className="text-lg font-black text-[#FFB400] mt-0.5">X{stars}</span>
          </div>
        </div>

        {/* Micro-evaluación de Alivio Emocional / Estrés (KPI Central del MVP) */}
        <div className="w-full p-3 rounded-2xl bg-[#0a162b] border-2 border-[#1e3a6c] mb-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-wide text-cyan-300 mb-2">
            ¿Cómo sientes tu nivel de calma tras esta ronda?
          </p>
          <div className="flex items-center justify-between gap-1 px-1">
            {[
              { val: 1, label: 'Aún tenso' },
              { val: 2, label: 'Un poco mejor' },
              { val: 3, label: 'Enfocado' },
              { val: 4, label: 'Tranquilo' },
              { val: 5, label: 'Zen total' }
            ].map(item => (
              <button
                key={item.val}
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('hubzy_last_stress_score', item.val);
                  } catch (_) {}
                }}
                className="flex-1 py-1.5 px-1 rounded-xl bg-[#122443] hover:bg-[#FFB400] hover:text-[#122443] border border-[#1e3a6c] text-[10px] font-black transition-all cursor-pointer text-slate-200"
                title={item.label}
              >
                {item.val}★
              </button>
            ))}
          </div>
        </div>

        {/* Mensaje de Capibara Acompañante */}
        <div className="flex items-center gap-3 w-full p-3 rounded-2xl bg-[#1a335e]/60 border-2 border-[#1e3a6c] mb-3 text-left">
          <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-[#FFB400] shrink-0 bg-[#0a162b]">
            <img src={capybara3dImg} alt="Capi" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-[#FFB400] tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FFB400]" /> Capi dice:
            </p>
            <p className="text-xs text-slate-200 font-bold leading-tight mt-0.5">
              "{stars === 3 ? '¡Increíble retención! Estás dominando este tema con soltura.' : '¡Buen progreso! Cada ronda afianza mejor los conceptos en tu mente.'}"
            </p>
          </div>
        </div>

        {/* Resumen / Glosario de Aprendizaje del Nivel */}
        {masteredConcepts && masteredConcepts.length > 0 && (
          <div className="w-full mb-4">
            <button
              type="button"
              onClick={() => setShowSummary(prev => !prev)}
              className="w-full py-2 px-3 rounded-xl bg-[#0a162b] hover:bg-[#152747] border border-[#1e3a6c] text-[11px] font-black text-[#FFB400] uppercase tracking-wider flex items-center justify-between cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#FFB400]" />
                Glosario Dominado ({masteredConcepts.length} conceptos)
              </span>
              <span className="text-xs text-slate-400">{showSummary ? '▲ Ocultar' : '▼ Ver'}</span>
            </button>

            {showSummary && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#081224] border border-[#1e3a6c] max-h-44 overflow-y-auto space-y-2 text-left">
                {masteredConcepts.map((item, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-[#0e1e38] border border-slate-700/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#48C838] uppercase">
                        {item.name || item.concept_name || item.label}
                      </span>
                      <span className="text-[9px] font-mono text-cyan-300">✓ Dominado</span>
                    </div>
                    {item.content && (
                      <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                        {item.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Botones de Acción Estilo Card Clash */}
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 w-full">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex-1 py-3 px-3 rounded-2xl bg-[#0a162b] hover:bg-[#162a4d] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-slate-200 font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_3px_0_#050a13] active:translate-y-1 active:shadow-none"
              >
                <RotateCcw className="w-4 h-4 text-[#FF7A00]" />
                <span>Reiniciar</span>
              </button>
            )}

            {onGoToMenu && (
              <button
                onClick={onGoToMenu}
                className="flex-1 py-3 px-3 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-[#FFB400] font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_3px_0_#050a13] active:translate-y-1 active:shadow-none"
              >
                <span>🗺️ Menú / Mapa</span>
              </button>
            )}
          </div>

          {onNextLevel && stars >= 2 && (
            <button
              onClick={onNextLevel}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#48C838] hover:bg-[#57d847] border-2 border-[#67dc59] border-b-4 border-b-[#28871E] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_0_#050a13] active:translate-y-1 active:shadow-none"
            >
              <span>¡Avanzar al Siguiente Nivel!</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
