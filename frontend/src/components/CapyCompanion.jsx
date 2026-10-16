import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Wind,
  X,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Music,
  Music2,
  Crown,
} from "lucide-react";
import capybara3dImg from "../assets/capybara_3d.webp";
import { capyVoice } from "../utils/capyVoice";
import { hubziAmbient } from "../utils/hubziAmbient";
import { getMascotByDomain } from "../utils/mascotCatalog";

/**
 * Guardián táctico 3D Zen interactivo: la mascota Capi con su bocadillo de
 * diálogo, overlays por mood, barra de vida del jefe (nivel 20), controles
 * de micrófono/voz/música y el banner de pausa Zen.
 */
export default function CapyCompanion({
  capySpeech,
  capyMood,
  isCapySad,
  isCapySpeaking,
  isListening,
  isThinkingHint,
  isCapyMuted,
  isAmbientPlaying,
  zenOffer,
  nodes,
  currentLevel,
  boardInfo,
  activeFolder,
  currentUser,
  onCapyClick,
  onToggleMicrophone,
  onToggleMute,
  onZenAccept,
  onZenDismiss,
}) {
  return (
      <div className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center select-none pointer-events-auto">
        {/* BOCADILLO DE DIÁLOGO FLOTANTE (ESTILO CÓMIC NEÓN CON TEXTO SINTÉTICO Y MOTIVADOR) */}
        <AnimatePresence>
          {capySpeech.isVisible && capySpeech.text && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`absolute -top-26 sm:-top-28 left-0 sm:left-2 w-64 sm:w-72 p-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md z-50 text-left ${
                capyMood === "encouraging" || isCapySad
                  ? "bg-rose-950/98 border-rose-400 text-rose-100 shadow-[0_0_25px_rgba(244,63,94,0.45)]"
                  : capyMood === "happy"
                    ? "bg-emerald-950/98 border-emerald-400 text-emerald-100 shadow-[0_0_25px_rgba(52,211,153,0.45)]"
                    : capyMood === "hint"
                      ? "bg-[#101b2b]/98 border-amber-400 text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.45)]"
                      : "bg-slate-900/98 border-cyan-400 text-slate-100 shadow-[0_0_25px_rgba(6,182,212,0.45)]"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-1 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[8.5px] font-mono font-black uppercase flex items-center gap-1 ${
                      capyMood === "encouraging" || isCapySad
                        ? "text-rose-300"
                        : capyMood === "happy"
                          ? "text-emerald-300"
                          : capyMood === "hint"
                            ? "text-amber-300"
                            : "text-cyan-300"
                    }`}
                  >
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                    <span>
                      HUBZI{" "}
                      {capyMood === "hint"
                        ? "PISTA"
                        : capyMood === "happy"
                          ? "CELEBRA"
                          : capyMood === "encouraging"
                            ? "TE ANIMA"
                            : "DICE"}
                      :
                    </span>
                  </span>
                </div>

                {/* Ondas / ecualizador de voz animado */}
                {isCapySpeaking ? (
                  <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-black/40">
                    <motion.span
                      animate={{ height: [4, 12, 4] }}
                      transition={{ repeat: Infinity, duration: 0.35 }}
                      className="w-1 bg-cyan-400 rounded-full"
                    />
                    <motion.span
                      animate={{ height: [6, 16, 6] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.4,
                        delay: 0.1,
                      }}
                      className="w-1 bg-amber-400 rounded-full"
                    />
                    <motion.span
                      animate={{ height: [4, 14, 4] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.3,
                        delay: 0.2,
                      }}
                      className="w-1 bg-cyan-300 rounded-full"
                    />
                  </div>
                ) : (
                  <span className="text-[7.5px] text-cyan-400/80 font-mono">
                    Voz Capi Local
                  </span>
                )}
              </div>

              <p className="text-[10.5px] sm:text-[11.5px] font-medium leading-snug break-words">
                {capySpeech.text}
              </p>

              {/* Flecha cómic del bocadillo */}
              <div
                className={`absolute -bottom-2 left-8 w-3.5 h-3.5 rotate-45 border-r-2 border-b-2 ${
                  capyMood === "encouraging" || isCapySad
                    ? "bg-rose-950 border-rose-400"
                    : capyMood === "happy"
                      ? "bg-emerald-950 border-emerald-400"
                      : capyMood === "hint"
                        ? "bg-[#101b2b] border-amber-400"
                        : "bg-slate-900 border-cyan-400"
                }`}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* BANNER INTERACTIVO DE APOYO DE ESTUDIO */}
        <AnimatePresence>
          {zenOffer.show && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-28 right-0 z-50 p-3 w-64 rounded-2xl bg-gradient-to-br from-[#122443] via-[#0a162b] to-slate-900 border-3 border-[#1e3a6c] shadow-[0_8px_0_#050a13] backdrop-blur-md flex flex-col gap-2 pointer-events-auto text-left text-white"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#FFB400] font-mono flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#FFB400] animate-pulse" />
                  Hubzy • Pausa de Estudio
                </span>
                <button
                  onClick={onZenDismiss}
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[10.5px] text-slate-200 leading-snug font-bold">
                {zenOffer.distortion
                  ? `¡No te preocupes por ese detalle! Repasar los errores es la mejor forma de fijar el concepto.`
                  : "¡Buen ritmo de estudio! ¿Hacemos 30 segundos de pausa para despejar la mente y volver con todo?"}
              </p>
              <button
                onClick={() => {
                  onZenDismiss();
                  onZenAccept();
                }}
                className="w-full py-2 px-3 rounded-xl bg-[#48C838] hover:bg-[#57d847] border-2 border-[#67dc59] border-b-3 border-b-[#28871E] text-white font-black text-[10px] tracking-wide uppercase shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 transition-all"
              >
                <Sparkles className="w-3 h-3 text-white" />
                Pausar y Respirar con Hubzy
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          animate={
            capyMood === "dancing"
              ? {
                  x: [0, -14, 14, -10, 10, -6, 6, 0],
                  rotateZ: [-12, 12, -12, 12, -8, 8, 0],
                  scale: [1, 1.08, 0.95, 1.08, 1],
                  y: [0, -8, 0, -8, 0],
                }
              : capyMood === "celebrating"
                ? {
                    y: [0, -20, 0, -15, 0, -10, 0],
                    scale: [1, 1.12, 0.9, 1.12, 1],
                    rotateZ: [-5, 5, -5, 5, 0],
                  }
                : capyMood === "love"
                  ? {
                      scale: [1, 1.06, 1, 1.06, 1],
                      y: [0, -5, 0, -5, 0],
                      rotateZ: [-2, 2, -2, 2, 0],
                    }
                  : capyMood === "happy"
                    ? {
                        y: [0, -12, 0, -8, 0],
                        scale: [1, 1.08, 1],
                        rotateZ: [-3, 3, -3],
                      }
                    : capyMood === "thinking"
                      ? {
                          rotateZ: [-3, 3, -3],
                          y: [0, -4, 0],
                          scale: [1, 1.02, 1],
                        }
                      : capyMood === "surprised"
                        ? {
                            y: [0, -18, 4, 0],
                            scale: [1, 1.15, 0.92, 1],
                            rotateZ: [-6, 6, -3, 0],
                          }
                        : isCapySad
                          ? {
                              x: [0, -8, 8, -8, 8, -5, 5, 0],
                              y: [0, 4, 0, 4, 0],
                              rotateZ: [-4, 4, -4, 4, 0],
                              scale: [1, 0.96, 1],
                            }
                          : isCapySpeaking
                            ? {
                                y: [0, -6, 0],
                                scale: [1, 1.05, 1],
                                rotateZ: [-1.5, 1.5, -1.5],
                              }
                            : {
                                y: [0, -10, 0],
                                rotateZ: [-2, 2, -2],
                                scale: [1, 1.03, 1],
                              }
          }
          transition={
            capyMood === "dancing"
              ? { repeat: Infinity, duration: 0.55, ease: "easeInOut" }
              : capyMood === "celebrating"
                ? { repeat: Infinity, duration: 0.7, ease: "easeInOut" }
                : capyMood === "love"
                  ? { repeat: Infinity, duration: 1.8, ease: "easeInOut" }
                  : capyMood === "happy"
                    ? { repeat: Infinity, duration: 0.6, ease: "easeInOut" }
                    : capyMood === "thinking"
                      ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" }
                      : capyMood === "surprised"
                        ? { duration: 0.5, repeat: 2, ease: "easeOut" }
                        : isCapySad
                          ? { duration: 0.6, repeat: 2, ease: "easeInOut" }
                          : isCapySpeaking
                            ? {
                                repeat: Infinity,
                                duration: 0.45,
                                ease: "easeInOut",
                              }
                            : {
                                repeat: Infinity,
                                duration: 3.8,
                                ease: "easeInOut",
                              }
          }
          whileHover={{ scale: 1.15, rotate: 4 }}
          whileTap={{ scale: 0.92 }}
          onClick={onCapyClick}
          className="relative group cursor-pointer flex flex-col items-center"
          title="¡Haz clic en Capi! Te dará una pista con todo su amor 💙"
        >
          {/* Base Holográfica — brillo en los pies según mood */}
          <div
            className={`w-32 h-7 rounded-full blur-md -mb-4 transition-colors duration-300 ${
              isCapySad
                ? "bg-rose-500/40"
                : capyMood === "dancing"
                  ? "bg-purple-500/60"
                  : capyMood === "celebrating"
                    ? "bg-amber-400/60"
                    : capyMood === "love"
                      ? "bg-rose-400/50"
                      : capyMood === "happy"
                        ? "bg-emerald-400/50"
                        : capyMood === "thinking"
                          ? "bg-cyan-400/40"
                          : capyMood === "surprised"
                            ? "bg-indigo-400/50"
                            : isCapySpeaking
                              ? "bg-amber-400/50"
                              : "bg-cyan-400/40"
            }`}
          />

          {/* Mascota de Cuerpo Completo (sin recorte circular ni bordes oscuros) */}
          <motion.div
            className={`relative w-28 h-36 sm:w-32 sm:h-40 flex items-center justify-center transition-all duration-500 ${
              isCapySad
                ? "drop-shadow-[0_10px_20px_rgba(244,63,94,0.7)]"
                : capyMood === "dancing"
                  ? "drop-shadow-[0_10px_25px_rgba(168,85,247,0.85)]"
                  : capyMood === "celebrating"
                    ? "drop-shadow-[0_10px_30px_rgba(251,191,36,0.9)]"
                    : capyMood === "love"
                      ? "drop-shadow-[0_10px_25px_rgba(251,113,133,0.8)]"
                      : capyMood === "happy"
                        ? "drop-shadow-[0_10px_25px_rgba(52,211,153,0.75)]"
                        : capyMood === "thinking"
                          ? "drop-shadow-[0_10px_20px_rgba(34,211,238,0.6)]"
                          : capyMood === "surprised"
                            ? "drop-shadow-[0_10px_25px_rgba(99,102,241,0.8)]"
                            : isCapySpeaking
                              ? "drop-shadow-[0_10px_25px_rgba(251,191,36,0.8)]"
                              : "drop-shadow-[0_10px_20px_rgba(52,211,153,0.5)] group-hover:drop-shadow-[0_12px_28px_rgba(34,211,238,0.8)]"
            }`}
          >
            {/* CORONA Y BARRA DE VIDA DE JEFE FINAL (NIVEL 20) */}
            {currentLevel === 20 && (
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                <Crown className="w-8 h-8 text-[#FFB400] fill-[#FFB400] drop-shadow-[0_3px_6px_rgba(0,0,0,0.8)] animate-bounce" />
                <div className="w-24 h-2 bg-slate-900 border border-amber-400 rounded-full overflow-hidden shadow-md mt-0.5">
                  {(() => {
                    const totalNodes = Object.keys(nodes).length || 20;
                    const solvedNodes = Object.values(nodes).filter((n) =>
                      Boolean(n.placedCard),
                    ).length;
                    const remainingHpPct = Math.max(
                      0,
                      Math.round(
                        ((totalNodes - solvedNodes) / totalNodes) * 100,
                      ),
                    );
                    return (
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${remainingHpPct}%` }}
                      />
                    );
                  })()}
                </div>
                <span className="text-[8px] font-black uppercase tracking-wider text-amber-300 drop-shadow">
                  JEFE CAPI HP
                </span>
              </div>
            )}

            {(() => {
              const activeTheme =
                boardInfo?.theme || activeFolder?.name || "general";
              const resolvedMascot = getMascotByDomain(
                activeTheme,
                currentUser?.gender,
              );
              const mascotSrc = resolvedMascot?.image || capybara3dImg;
              const mascotTitle = resolvedMascot?.name || "Hubzi Compañero";

              return (
                <img
                  src={mascotSrc}
                  alt={mascotTitle}
                  title={`${mascotTitle} - ${resolvedMascot?.role || "Acompañante de Estudio"}`}
                  className={`w-full h-full object-contain object-bottom pointer-events-none select-none transition-all duration-300 ${
                    isCapySad
                      ? "brightness-90 saturate-85"
                      : capyMood === "love"
                        ? "brightness-105 saturate-110"
                        : capyMood === "celebrating"
                          ? "brightness-110 saturate-120"
                          : "group-hover:scale-105"
                  }`}
                />
              );
            })()}

            {/* ===== OVERLAYS POR MOOD ===== */}

            {/* OVERLAY DANCING: notas musicales */}
            {capyMood === "dancing" && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {["♪", "♫", "♩", "♬"].map((note, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-purple-300 font-bold text-xs"
                    style={{ left: `${15 + i * 20}%`, top: "10%" }}
                    animate={{
                      y: [0, -30],
                      opacity: [0, 1, 0],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      delay: i * 0.25,
                    }}
                  >
                    {note}
                  </motion.span>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-950/50 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY CELEBRATING: estrellas y destellos */}
            {capyMood === "celebrating" && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {["⭐", "✨", "🌟", "💫", "⚡"].map((star, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-sm"
                    style={{
                      left: `${5 + i * 18}%`,
                      top: `${10 + (i % 3) * 15}%`,
                    }}
                    animate={{
                      y: [0, -25],
                      x: [i % 2 === 0 ? 5 : -5],
                      opacity: [0, 1, 1, 0],
                      scale: [0.5, 1.3, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: i * 0.16,
                    }}
                  >
                    {star}
                  </motion.span>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-amber-950/40 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY LOVE: corazones flotando */}
            {capyMood === "love" && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {["❤️", "💙", "💕", "🥰", "💖"].map((heart, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-xs"
                    style={{ left: `${8 + i * 18}%`, bottom: "5%" }}
                    animate={{
                      y: [0, -50],
                      opacity: [0, 1, 1, 0],
                      x: [0, i % 2 === 0 ? 8 : -8],
                      scale: [0.7, 1.1, 0.7],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.6,
                      delay: i * 0.32,
                    }}
                  >
                    {heart}
                  </motion.span>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/40 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY HAPPY: chispas verdes */}
            {capyMood === "happy" && !isCapySad && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-emerald-400"
                    style={{ left: `${15 + i * 20}%`, top: "20%" }}
                    animate={{ y: [0, -20], opacity: [1, 0], scale: [1, 0.5] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.7,
                      delay: i * 0.18,
                    }}
                  />
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/30 via-transparent to-transparent" />
              </div>
            )}

            {/* OVERLAY THINKING: burbujas de pensamiento */}
            {capyMood === "thinking" && (
              <div className="absolute inset-0 pointer-events-none z-20">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-cyan-400/70"
                    style={{
                      width: `${6 + i * 3}px`,
                      height: `${6 + i * 3}px`,
                      top: `${20 + i * 12}%`,
                      right: `${10 + i * 5}%`,
                    }}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1 + i * 0.3,
                      delay: i * 0.2,
                    }}
                  />
                ))}
                <span className="absolute top-2 right-2 text-xs text-cyan-300">
                  💭
                </span>
              </div>
            )}

            {/* OVERLAY SURPRISED: destellos de sorpresa */}
            {capyMood === "surprised" && (
              <div className="absolute inset-0 pointer-events-none z-20">
                <motion.span
                  className="absolute top-2 left-1/2 -translate-x-1/2 text-lg"
                  animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.7, 1, 0.7] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                >
                  😲
                </motion.span>
                {[...Array(4)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-6 bg-indigo-400 rounded-full"
                    style={{
                      top: "30%",
                      left: "50%",
                      transformOrigin: "50% 100%",
                      rotate: `${i * 90}deg`,
                    }}
                    animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      delay: i * 0.12,
                    }}
                  />
                ))}
              </div>
            )}

            {/* OVERLAY SAD: lágrimas (existente mejorado) */}
            {isCapySad && (
              <div className="absolute inset-0 flex flex-col items-center justify-between p-2 pointer-events-none z-20">
                <div className="relative w-full h-full">
                  <motion.div
                    animate={{ y: [0, 40], opacity: [1, 0], scale: [0.8, 1.2] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.45,
                      ease: "easeIn",
                    }}
                    className="absolute top-1/4 left-[28%] w-1.5 h-4 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
                  />
                  <motion.div
                    animate={{ y: [0, 40], opacity: [1, 0], scale: [0.8, 1.2] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.5,
                      delay: 0.12,
                      ease: "easeIn",
                    }}
                    className="absolute top-1/4 right-[28%] w-1.5 h-4 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee]"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/80 via-transparent to-black/30 pointer-events-none" />
                <AlertTriangle className="w-6 h-6 text-rose-300 animate-bounce drop-shadow-md z-10" />
              </div>
            )}

            <div
              className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping ${
                isCapySad
                  ? "bg-rose-400"
                  : capyMood === "dancing"
                    ? "bg-purple-400"
                    : capyMood === "celebrating"
                      ? "bg-amber-400"
                      : capyMood === "love"
                        ? "bg-rose-400"
                        : capyMood === "happy"
                          ? "bg-emerald-400"
                          : capyMood === "thinking"
                            ? "bg-cyan-300"
                            : capyMood === "surprised"
                              ? "bg-indigo-400"
                              : isCapySpeaking
                                ? "bg-amber-300"
                                : "bg-cyan-300"
              }`}
            />
          </motion.div>

          {/* Badge 3D interactivo con estado — refleja todos los moods */}
          <div className="mt-2 flex items-center gap-1.5 z-20">
            <div
              className={`px-3 py-0.5 rounded-full bg-slate-900/95 shadow-lg text-center backdrop-blur-sm border transition-colors duration-500 ${
                isCapySad
                  ? "border-rose-500/80"
                  : capyMood === "dancing"
                    ? "border-purple-400/80"
                    : capyMood === "celebrating"
                      ? "border-amber-400/80"
                      : capyMood === "love"
                        ? "border-rose-400/80"
                        : capyMood === "happy"
                          ? "border-emerald-400/80"
                          : capyMood === "thinking"
                            ? "border-cyan-400/80"
                            : capyMood === "surprised"
                              ? "border-indigo-400/80"
                              : isCapySpeaking
                                ? "border-cyan-400"
                                : "border-emerald-400/80"
              }`}
            >
              <span
                className={`text-[9px] font-black font-mono tracking-wider flex items-center gap-1 justify-center transition-colors duration-300 ${
                  isCapySad
                    ? "text-rose-300"
                    : capyMood === "dancing"
                      ? "text-purple-300"
                      : capyMood === "celebrating"
                        ? "text-amber-300"
                        : capyMood === "love"
                          ? "text-rose-300"
                          : capyMood === "happy"
                            ? "text-emerald-300"
                            : capyMood === "thinking"
                              ? "text-cyan-300"
                              : capyMood === "surprised"
                                ? "text-indigo-300"
                                : isCapySpeaking
                                  ? "text-cyan-300"
                                  : "text-emerald-300"
                }`}
              >
                {isCapySad ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-rose-400 animate-pulse" />{" "}
                    HUBZY TE APOYA
                  </>
                ) : capyMood === "dancing" ? (
                  <>
                    <span className="text-[9px]">🎵</span> HUBZY MOTIVADO
                  </>
                ) : capyMood === "celebrating" ? (
                  <>
                    <span className="text-[9px]">🎉</span> HUBZY CELEBRA
                  </>
                ) : capyMood === "love" ? (
                  <>
                    <Heart className="w-2.5 h-2.5 text-rose-400 animate-pulse" />{" "}
                    HUBZY CONTIGO
                  </>
                ) : capyMood === "happy" ? (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> HUBZY
                    GENIAL
                  </>
                ) : capyMood === "thinking" ? (
                  <>
                    <span className="text-[9px]">💭</span> HUBZY PENSANDO
                  </>
                ) : capyMood === "surprised" ? (
                  <>
                    <Zap className="w-2.5 h-2.5 text-indigo-400 animate-pulse" />{" "}
                    HUBZY ASOMBRADO
                  </>
                ) : isCapySpeaking ? (
                  <>
                    <MessageCircle className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />{" "}
                    HUBZY
                  </>
                ) : (
                  <>
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 animate-pulse" />{" "}
                    HUBZY
                  </>
                )}
              </span>
            </div>

            {/* Botón Micrófono para hablar por voz con Hubzi */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMicrophone();
              }}
              className={`p-1 rounded-full border transition-all duration-300 shadow-md cursor-pointer flex items-center justify-center ${
                isListening
                  ? "bg-rose-600 border-rose-400 text-white ring-4 ring-rose-400/60 animate-pulse shadow-[0_0_15px_#f43f5e]"
                  : isThinkingHint
                    ? "bg-amber-600 border-amber-400 text-white ring-4 ring-amber-400/60 animate-spin"
                    : "bg-slate-900/90 border-cyan-400/70 hover:border-cyan-300 text-cyan-300 hover:scale-110 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
              }`}
              title={
                isListening
                  ? "Detener micrófono"
                  : "Habla por micrófono con Hubzi para pedirle apoyo o pistas"
              }
            >
              {isListening ? (
                <MicOff className="w-3 h-3 text-white" />
              ) : (
                <Mic className="w-3 h-3 text-cyan-300" />
              )}
            </button>

            {/* Botón Silenciar / Activar Voz Tierna */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextMuted = !isCapyMuted;
                onToggleMute(nextMuted);
                capyVoice.isMuted = nextMuted;
                if (nextMuted) capyVoice.stop();
              }}
              className="p-1 rounded-full bg-slate-900/90 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors shadow-md cursor-pointer"
              title={
                isCapyMuted ? "Activar voz de Hubzi" : "Silenciar voz de Hubzi"
              }
            >
              {isCapyMuted ? (
                <VolumeX className="w-3 h-3 text-rose-400" />
              ) : (
                <Volume2 className="w-3 h-3 text-cyan-300" />
              )}
            </button>

            {/* Botón Música Ambient Calmante */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                hubziAmbient.toggle();
              }}
              className={`p-1 rounded-full border transition-all duration-300 shadow-md cursor-pointer ${
                isAmbientPlaying
                  ? "bg-purple-900/90 border-purple-400 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.6)] ring-2 ring-purple-400/40"
                  : "bg-slate-900/90 border-slate-700 hover:border-purple-400 text-slate-400 hover:text-purple-300"
              }`}
              title={
                isAmbientPlaying
                  ? "Detener música calmante"
                  : "Reproducir música ambient calmante"
              }
            >
              {isAmbientPlaying ? (
                <Music2 className="w-3 h-3 text-purple-300 animate-pulse" />
              ) : (
                <Music className="w-3 h-3" />
              )}
            </button>
          </div>

          {/* Micro-pista interactiva al pasar el mouse */}
          <span
            className={`text-[7.5px] font-mono mt-1 text-center transition-colors ${
              isListening
                ? "text-rose-400 font-bold animate-pulse"
                : "text-cyan-300/80 group-hover:text-cyan-200"
            }`}
          >
            {isListening
              ? "Hubzi te escucha..."
              : isThinkingHint
                ? "Hubzi preparando sus palabras con calidez..."
                : "Toca el micrófono para hablar con Hubzi"}
          </span>
        </motion.div>
      </div>
  );
}
