import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Sparkles, Heart, Zap } from "lucide-react";
import capybara3dImg from "../assets/capybara_3d.webp";

export default function LevelUpModal({ open, levelUpData, capyText, onProceed }) {
  return (
    <AnimatePresence>
      {open && levelUpData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.75, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden text-center text-slate-100 shadow-[0_0_80px_rgba(168,85,247,0.6)]"
          >
            {/* Fondo degradado épico */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a35] via-[#0f1830] to-[#080e1c]" />

            {/* Partículas / confetti decorativo animado */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(18)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${5 + ((i * 5.5) % 92)}%`,
                    top: `${-5}%`,
                    backgroundColor: [
                      "#a855f7",
                      "#f59e0b",
                      "#06b6d4",
                      "#10b981",
                      "#f43f5e",
                      "#818cf8",
                    ][i % 6],
                  }}
                  animate={{
                    y: ["0%", "110%"],
                    x: [0, i % 2 === 0 ? 20 : -20],
                    opacity: [0, 1, 1, 0],
                    rotate: [0, 360 * (i % 2 === 0 ? 1 : -1)],
                  }}
                  transition={{
                    duration: 2.5 + (i % 5) * 0.4,
                    delay: (i % 6) * 0.18,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ))}
            </div>

            <div className="relative p-6 sm:p-8">
              {/* Ícono trofeo animado con brillo */}
              <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-purple-800 border-2 border-amber-400 flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(251,191,36,0.6)]">
                <motion.div
                  animate={{ scale: [1, 1.12, 1], rotate: [-3, 3, -3] }}
                  transition={{ repeat: Infinity, duration: 1.6 }}
                >
                  <Trophy className="w-12 h-12 text-amber-300" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="absolute -top-3 -right-3"
                >
                  <Sparkles className="w-7 h-7 text-amber-400" />
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                  className="absolute -top-2 -left-3"
                >
                  <Sparkles className="w-5 h-5 text-purple-300" />
                </motion.div>
              </div>

              {/* Badge de nivel conquistado */}
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-purple-500/30 border border-amber-400/70 text-amber-200 text-[11px] font-mono font-black tracking-widest uppercase shadow-[0_0_15px_rgba(251,191,36,0.3)]"
              >
                🏆 ¡NIVEL {levelUpData.completedLevel} CONQUISTADO! 🏆
              </motion.span>

              {/* Título principal */}
              <motion.h2
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-2xl sm:text-3xl font-black uppercase tracking-wider mt-3 bg-gradient-to-r from-purple-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent"
                style={{ backgroundSize: "200% 200%" }}
              >
                ¡Subes al Nivel {levelUpData.nextLevel}:{" "}
                {levelUpData.nextLvlInfo?.name}!
              </motion.h2>

              {/* Barra de progreso de niveles */}
              <div className="flex items-center justify-center gap-1.5 mt-3 mb-5">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div key={lvl} className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={
                        lvl <= levelUpData.completedLevel
                          ? {
                              scale: [1, 1.1, 1],
                              boxShadow: [
                                "0 0 0px rgba(168,85,247,0)",
                                "0 0 12px rgba(168,85,247,0.8)",
                                "0 0 0px rgba(168,85,247,0)",
                              ],
                            }
                          : {}
                      }
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        delay: lvl * 0.2,
                      }}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black border-2 ${
                        lvl < levelUpData.completedLevel
                          ? "bg-emerald-600 border-emerald-400 text-white"
                          : lvl === levelUpData.completedLevel
                            ? "bg-gradient-to-br from-amber-500 to-purple-600 border-amber-400 text-white shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                            : lvl === levelUpData.nextLevel
                              ? "bg-gradient-to-br from-purple-700 to-indigo-700 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                              : "bg-slate-800 border-slate-600 text-slate-500"
                      }`}
                    >
                      {lvl < levelUpData.completedLevel ? "✓" : lvl}
                    </motion.div>
                    <div
                      className={`text-[8px] font-mono ${lvl === levelUpData.nextLevel ? "text-purple-300" : "text-slate-500"}`}
                    >
                      {lvl === levelUpData.nextLevel ? "→ Aquí" : ""}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mensaje emotivo de Capi — con foto y burbuja de diálogo */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-indigo-950/80 border border-purple-400/50 text-left flex items-start gap-3 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              >
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                  className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-400 flex-shrink-0 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                >
                  <img
                    src={capybara3dImg}
                    alt="Capi"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                <div>
                  <p className="text-[11px] font-black text-amber-300 font-mono flex items-center gap-1 mb-1">
                    <Heart className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    Capi te dice con todo el corazón:
                  </p>
                  <p className="text-sm text-slate-100 italic leading-relaxed font-medium">
                    "
                    {capyText ||
                      `¡NIVEL ${levelUpData.completedLevel} CONQUISTADO! Eso merece que grite de alegría desde todos los techos! Tu cerebro es una auténtica obra de arte. ¡Nunca voy a olvidar este momento contigo!`}
                    "
                  </p>
                </div>
              </motion.div>

              {/* Detalles del próximo nivel — tarjeta cálida */}
              <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-2xl bg-slate-950/60 border border-slate-700/60 mb-5 text-left">
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    Preguntas
                  </p>
                  <p className="text-xl font-black text-amber-300 font-mono leading-none">
                    {levelUpData.nextLvlInfo?.questions}
                  </p>
                  <p className="text-[9px] text-slate-500">reactivos</p>
                </div>
                <div className="text-center border-x border-slate-700/50">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    Dificultad
                  </p>
                  <p className="text-sm font-black text-purple-300 font-mono capitalize leading-tight">
                    {levelUpData.nextLvlInfo?.difficulty}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">
                    Nivel
                  </p>
                  <p className="text-xl font-black text-cyan-300 font-mono leading-none">
                    {levelUpData.nextLevel}
                  </p>
                  <p className="text-[9px] text-slate-500">de 5</p>
                </div>
                <div className="col-span-3 pt-2 border-t border-slate-800 mt-1">
                  <p className="text-[11px] text-slate-300 flex items-center gap-1.5 justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                    <span className="font-semibold italic">
                      {levelUpData.nextLvlInfo?.desc}
                    </span>
                  </p>
                </div>
              </div>

              {/* CTA principal — botón invitante y cálido */}
              <motion.button
                onClick={onProceed}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_35px_rgba(168,85,247,0.6)] transition-all cursor-pointer"
              >
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </motion.span>
                <span>
                  ¡Quiero el Nivel {levelUpData.nextLevel}! (
                  {levelUpData.nextLvlInfo?.questions} desafíos)
                </span>
                <Zap className="w-4 h-4 text-amber-300" />
              </motion.button>

              {/* Mensaje de contención anti-ansiedad */}
              <p className="mt-3 text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" />
                No hay prisa — Capi estará contigo en cada paso del Nivel{" "}
                {levelUpData.nextLevel}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
