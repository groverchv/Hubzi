import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Lock,
  Play,
  ArrowLeft,
  Zap,
  Folder,
  HelpCircle,
  Crown,
  Skull,
  ShieldAlert,
  Swords,
} from "lucide-react";
import capybara3dImg from "../assets/capybara_3d.jpg";

/**
 * AdventureMap - Mapa de Aventura de 20 Niveles
 * - Nivel K = K preguntas progresivas
 * - Niveles 3+ tienen cartas trampa 💀
 * - Nivel 20 es la batalla de Jefe Final contra Capi Boss 👑
 * - Requiere mínimo 2 estrellas para avanzar
 * - Scroll vertical fluido que asciende desde el Nivel 1 (costa) hasta el Nivel 20 (cumbre del volcán)
 */
export default function AdventureMap({
  folderName = "Mundo de Aprendizaje",
  documentTitle = "Tema de Estudio",
  levels = [],
  currentLevel = 1,
  unlockedLevel = 1,
  levelStars = {},
  energy = 4,
  maxEnergy = 4,
  onSelectLevel,
  onBackToFolders,
  onOpenTutorial,
}) {
  const [selectedLevelModal, setSelectedLevelModal] = useState(null);
  const scrollContainerRef = useRef(null);

  // Generar los 20 niveles si no vienen provistos
  const mapLevels =
    levels && levels.length > 0
      ? levels
      : Array.from({ length: 20 }, (_, i) => {
          const lvl = i + 1;
          const isBoss = lvl === 20;
          const hasTraps = lvl >= 3;
          const trapCount = lvl < 8 ? 1 : lvl < 15 ? 2 : 3;
          return {
            level: lvl,
            name: isBoss ? "Duelo Legendario: Capi Boss" : `Nivel ${lvl}`,
            questions: lvl,
            hasTraps,
            trapCount: hasTraps ? trapCount : 0,
            isBoss,
            desc: isBoss
              ? "¡Examen definitivo de 20 preguntas! Derrota a Capi Boss completando el circuito."
              : hasTraps
                ? `${lvl} preguntas con ${trapCount} carta(s) trampa en el mazo.`
                : `${lvl} pregunta(s) directa(s).`,
          };
        });

  // 20 posiciones en zigzag vertical (de abajo hacia arriba, Nivel 1 en el fondo, Nivel 20 arriba)
  // X varía entre 22% y 78% alternando; Y espaciado uniformemente
  const TOTAL_HEIGHT = 2800; // Altura del lienzo en píxeles para scroll vertical
  const levelCoords = mapLevels.map((lvl, idx) => {
    // Alternancia suave en onda senoidal
    const t = idx / (mapLevels.length - 1);
    const y = TOTAL_HEIGHT - 160 - t * (TOTAL_HEIGHT - 320);
    // Curva zigzag dinámica
    const xPct = 50 + Math.sin(idx * 0.95) * 32;
    return { level: lvl.level, xPct, y };
  });

  // Centrar scroll en el nivel actual del jugador al cargar
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeCoord = levelCoords.find(
        (c) => c.level === Math.min(unlockedLevel, 20),
      );
      if (activeCoord) {
        scrollContainerRef.current.scrollTop = Math.max(0, activeCoord.y - 350);
      }
    }
  }, [unlockedLevel]);

  const handleNodeClick = (lvl) => {
    const isUnlocked = lvl.level <= unlockedLevel;
    if (!isUnlocked) return;
    setSelectedLevelModal(lvl);
  };

  const handleStartGame = () => {
    if (selectedLevelModal) {
      onSelectLevel(selectedLevelModal.level);
      setSelectedLevelModal(null);
    }
  };

  // Construir el path SVG curvo conectando del Nivel 1 al 20
  const pathD = levelCoords.reduce((acc, coord, i) => {
    const x = (coord.xPct * 8).toFixed(1); // Mapeado a un viewBox de 800 width
    const y = coord.y.toFixed(1);
    if (i === 0) return `M ${x} ${y}`;
    const prev = levelCoords[i - 1];
    const prevX = (prev.xPct * 8).toFixed(1);
    const prevY = prev.y.toFixed(1);
    const midY = ((parseFloat(prevY) + parseFloat(y)) / 2).toFixed(1);
    return `${acc} C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
  }, "");

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-sans bg-radial from-[#1e88e5] via-[#1565c0] to-[#0a2756]">
      {/* ── AMBIENTE DE FONDO CON NUBES FLOTANTES ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:28px_28px]" />
      </div>

      {/* ── BARRA SUPERIOR FIJA (ESTILO MONSTER LEGENDS / ARCADE) ── */}
      <div className="absolute top-0 inset-x-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between bg-slate-950/70 border-b-2 border-[#1e3a6c] backdrop-blur-md shadow-lg">
        {/* Botón Volver a Carpetas */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFolders}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-4 border-b-[#050a13] text-white shadow-[0_4px_0_#FF7A00] active:translate-y-1 active:shadow-none transition-all cursor-pointer"
            title="Volver a mis Carpetas"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              Carpetas
            </span>
          </button>
        </div>

        {/* Banner Central: Título del Mundo / Documento */}
        <div className="flex flex-col items-center px-4 py-1.5 rounded-2xl bg-[#122443]/90 border-2 border-[#1e3a6c] shadow-sm">
          <div className="flex items-center gap-1.5">
            <Folder className="w-3 h-3 text-amber-400" />
            <span className="text-[9px] font-mono font-black uppercase text-amber-400 tracking-wider">
              {folderName}
            </span>
          </div>
          <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate max-w-[200px] sm:max-w-md">
            {documentTitle} (Campaña de 20 Niveles)
          </h1>
        </div>

        {/* Botón Cómo Jugar */}
        <div className="flex items-center gap-2">
          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="p-2 rounded-2xl bg-[#122443] hover:bg-[#1a335e] border-2 border-[#1e3a6c] border-b-3 border-b-[#050a13] text-amber-400 shadow-sm active:translate-y-1 transition-all cursor-pointer"
              title="Cómo Jugar"
            >
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      {/* ── LIENZO SCROLLABLE DEL MAPA (20 NIVELES EN CAMINO ASCENDENTE) ── */}
      <div
        ref={scrollContainerRef}
        className="relative w-full h-full overflow-y-auto overflow-x-hidden pt-20 pb-24 scroll-smooth"
      >
        <div
          className="relative w-full max-w-3xl mx-auto"
          style={{ height: `${TOTAL_HEIGHT}px` }}
        >
          {/* SVG para el Camino Curvo Punteado */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 800 ${TOTAL_HEIGHT}`}
            preserveAspectRatio="none"
          >
            <defs>
              <filter
                id="roadShadow"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feDropShadow
                  dx="0"
                  dy="6"
                  stdDeviation="6"
                  floodColor="#05142b"
                  floodOpacity="0.7"
                />
              </filter>
            </defs>

            {/* Sombra del camino */}
            <path
              d={pathD}
              fill="none"
              stroke="#071b38"
              strokeWidth="12"
              strokeLinecap="round"
              filter="url(#roadShadow)"
            />

            {/* Línea punteada blanca brillante */}
            <path
              d={pathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth="7"
              strokeDasharray="16 12"
              strokeLinecap="round"
              className="drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]"
            />
          </svg>

          {/* Islas de Soporte Decorativas a lo largo del mapa */}
          {[
            { y: TOTAL_HEIGHT - 260, label: "Tierras Costeras (N1 - N5)" },
            { y: TOTAL_HEIGHT - 880, label: "Valle de las Trampas (N6 - N10)" },
            { y: TOTAL_HEIGHT - 1520, label: "Tierras Altas (N11 - N15)" },
            { y: TOTAL_HEIGHT - 2160, label: "Meseta de Élite (N16 - N19)" },
            { y: 160, label: "Cima Legendaria: Capi Boss (N20)" },
          ].map((island, idx) => (
            <div
              key={idx}
              style={{ top: `${island.y}px` }}
              className="absolute left-1/2 -translate-x-1/2 w-[85%] max-w-xl h-28 rounded-full bg-emerald-800/30 border-2 border-emerald-400/20 blur-xs pointer-events-none flex items-center justify-center"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200/40">
                {island.label}
              </span>
            </div>
          ))}

          {/* ── RENDERIZADO DE LOS 20 NODOS DE NIVEL ── */}
          {mapLevels.map((lvl) => {
            const coord = levelCoords.find((c) => c.level === lvl.level);
            if (!coord) return null;

            const isUnlocked = lvl.level <= unlockedLevel;
            const isCurrent = lvl.level === unlockedLevel;
            const isBoss = lvl.isBoss || lvl.level === 20;
            const hasTraps = lvl.hasTraps;
            const stars = levelStars[lvl.level] || 0;

            return (
              <div
                key={lvl.level}
                style={{
                  left: `${coord.xPct}%`,
                  top: `${coord.y}px`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer"
                onClick={() => handleNodeClick(lvl)}
              >
                {/* Avatar animado de Capi sobre el nivel actual activo */}
                {isCurrent && (
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-8, 0, -8] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      ease: "easeInOut",
                    }}
                    className="absolute -top-16 z-30 flex flex-col items-center"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-3 border-[#FFB400] shadow-[0_4px_0_#050a13] bg-[#0a162b]">
                      <img
                        src={capybara3dImg}
                        alt="Capi Aquí"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-[#FF7A00] text-white font-black text-[8px] uppercase tracking-wider border border-[#0a162b] shadow-md -mt-1">
                      ¡AQUÍ!
                    </div>
                  </motion.div>
                )}

                {/* Corona y aura dorada para Capi Boss (Nivel 20) */}
                {isBoss && (
                  <div className="absolute -top-9 flex flex-col items-center text-[#FFB400] animate-bounce z-10">
                    <Crown className="w-8 h-8 fill-[#FFB400] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
                    <span className="text-[9px] font-black uppercase text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400 -mt-1 shadow-md whitespace-nowrap">
                      👑 JEFE FINAL
                    </span>
                  </div>
                )}

                {/* Distintivo de Cartas Trampa para niveles 3+ */}
                {hasTraps && !isBoss && isUnlocked && (
                  <div
                    className="absolute -top-3 -right-2 z-10 p-1 rounded-full bg-rose-950 border border-rose-500 shadow-md"
                    title={`¡Contiene ${lvl.trapCount} carta(s) trampa!`}
                  >
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                )}

                {/* Estrellas ⭐⭐⭐ ganadas sobre el botón del nivel */}
                <div className="flex items-center gap-0.5 mb-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/20 shadow-sm">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`w-3 h-3 ${
                        s <= stars
                          ? "text-[#FFB400] fill-[#FFB400] drop-shadow"
                          : "text-slate-600 fill-slate-800"
                      }`}
                    />
                  ))}
                </div>

                {/* Botón Circular 3D del Nivel */}
                <motion.button
                  whileHover={isUnlocked ? { scale: 1.15 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                  disabled={!isUnlocked}
                  className={`relative ${isBoss ? "w-18 h-18 sm:w-20 sm:h-20" : "w-13 h-13 sm:w-15 sm:h-15"} rounded-full flex items-center justify-center border-4 text-white shadow-2xl transition-all cursor-pointer ${
                    !isUnlocked
                      ? "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-900 shadow-[0_5px_0_#1e293b] opacity-80 cursor-not-allowed"
                      : isBoss
                        ? "bg-gradient-to-b from-[#ff7a00] via-[#ea580c] to-[#9a3412] border-[#ffedd5] shadow-[0_8px_0_#7c2d12,0_0_25px_rgba(249,115,22,0.9)] animate-pulse"
                        : hasTraps
                          ? "bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-[#bae6fd] shadow-[0_6px_0_#075985,0_0_14px_rgba(56,189,248,0.6)]"
                          : "bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#15803d] border-[#dcfce7] shadow-[0_6px_0_#166534,0_0_14px_rgba(74,222,128,0.6)]"
                  }`}
                >
                  {/* Brillo especular superior 3D */}
                  <div className="absolute top-1 inset-x-2 h-3.5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />

                  {isUnlocked ? (
                    <span
                      className={`${isBoss ? "text-2xl sm:text-3xl font-extrabold" : "text-lg sm:text-xl font-black"} font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                    >
                      {lvl.level}
                    </span>
                  ) : (
                    <Lock className="w-5 h-5 text-slate-300 drop-shadow" />
                  )}
                </motion.button>

                {/* Etiqueta inferior con el número de preguntas */}
                <div
                  className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-md whitespace-nowrap ${
                    isUnlocked
                      ? isBoss
                        ? "bg-amber-950 border-amber-500 text-amber-200"
                        : "bg-[#122443] border-[#1e3a6c] text-white"
                      : "bg-slate-900/80 border-slate-700 text-slate-400"
                  }`}
                >
                  {lvl.questions}{" "}
                  {lvl.questions === 1 ? "pregunta" : "preguntas"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── POP-UP / MODAL DE MISIÓN DE NIVEL AL HACER CLIC EN UN BOTÓN ── */}
      <AnimatePresence>
        {selectedLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="relative w-full max-w-sm rounded-3xl bg-[#122443] border-4 border-[#0a162b] p-6 text-white shadow-[0_16px_0_#050a13,0_25px_40px_rgba(0,0,0,0.8)] flex flex-col items-center text-center overflow-hidden"
            >
              {/* Glow decorativo */}
              <div
                className={`absolute -top-14 -right-14 w-36 h-36 ${selectedLevelModal.isBoss ? "bg-[#FFB400]/30" : "bg-[#FF7A00]/20"} rounded-full blur-2xl pointer-events-none`}
              />

              {/* Botón cerrar X */}
              <button
                onClick={() => setSelectedLevelModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-xl bg-[#0a162b] hover:bg-[#1a335e] border border-[#1e3a6c] text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>

              {/* Icono de Nivel / Jefe */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-[0_5px_0_#050a13] mb-3 ${
                  selectedLevelModal.isBoss
                    ? "bg-gradient-to-b from-[#FF7A00] to-[#D45B00] border-3 border-[#FFB400]"
                    : "bg-gradient-to-b from-[#48C838] to-[#28871E] border-3 border-[#67dc59]"
                }`}
              >
                {selectedLevelModal.isBoss ? (
                  <Crown className="w-9 h-9 fill-[#FFB400] text-white" />
                ) : (
                  <span className="text-3xl font-black">
                    {selectedLevelModal.level}
                  </span>
                )}
              </div>

              {/* Título de Nivel */}
              <div className="text-[10px] font-black uppercase text-[#FFB400] tracking-widest mb-0.5">
                Nivel {selectedLevelModal.level} de 20
              </div>
              <h2 className="text-xl font-black text-white tracking-wide mb-2">
                {selectedLevelModal.name}
              </h2>

              {/* Descripción pedagógica */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3 px-2">
                {selectedLevelModal.desc}
              </p>

              {/* Alerta de Cartas Trampa si aplica */}
              {selectedLevelModal.hasTraps && (
                <div className="w-full py-1.5 px-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[10px] font-bold flex items-center justify-center gap-1.5 mb-3">
                  <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>
                    ¡Atención! Hay {selectedLevelModal.trapCount} carta(s)
                    trampa con penalización.
                  </span>
                </div>
              )}

              {/* Alerta de Requisito de 2 Estrellas */}
              <div className="w-full py-1 px-2.5 rounded-xl bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[9.5px] font-bold flex items-center justify-center gap-1 mb-4">
                <span>
                  ⭐ Mínimo 2 estrellas para desbloquear el siguiente nivel
                </span>
              </div>

              {/* Estadísticas del Nivel */}
              <div className="w-full grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-[#0a162b] border border-[#1e3a6c] mb-5">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Preguntas
                  </span>
                  <span className="text-sm font-black text-[#FFB400]">
                    {selectedLevelModal.questions} nodos
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    Puntaje Máx
                  </span>
                  <span className="text-sm font-black text-[#48C838]">
                    +{selectedLevelModal.questions * 10} pts
                  </span>
                </div>
              </div>

              {/* Botón Acción: JUGAR AHORA Y ENTRAR AL TABLERO */}
              <button
                onClick={handleStartGame}
                className="w-full py-3.5 rounded-2xl bg-[#FF7A00] hover:bg-[#ff8c1a] border-2 border-[#ff9b38] border-b-5 border-b-[#D45B00] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_5px_0_#050a13] active:translate-y-1 active:shadow-none"
              >
                {selectedLevelModal.isBoss ? (
                  <Swords className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                <span>
                  {selectedLevelModal.isBoss
                    ? "¡Comenzar Batalla de Jefe!"
                    : "¡Entrar al Tablero!"}
                </span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
