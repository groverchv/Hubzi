import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Lock,
  Play,
  ArrowLeft,
  Folder,
  HelpCircle,
  Crown,
  Skull,
  Swords,
  RotateCcw,
  Flame,
  X,
  Compass,
  Sparkles,
  Mountain,
  Castle,
  Waves,
  Trees,
} from "lucide-react";
import capyEscolar from "../assets/mascots/capy_escolar_nino_m.webp";
import { useTranslation } from "react-i18next";
import { levelName, levelDesc } from "../utils/gameConfig";

/**
 * Generador de curva Spline suave (Catmull-Rom a Bézier cúbica)
 */
function getSmoothCurvePath(points) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 4.5;
    const cp1y = p1.y + (p2.y - p0.y) / 4.5;
    const cp2x = p2.x - (p3.x - p1.x) / 4.5;
    const cp2y = p2.y - (p3.y - p1.y) / 4.5;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/**
 * AdventureMap - OPCIÓN 1: Tablero Sinuoso 2D (Estilo Mario Party / Slay the Spire)
 * - Llena el 100% de la pantalla en PC sin franjas vacías
 * - Ruta serpentina 2D que asciende desde la Costa (Nivel 1) hasta la Cumbre del Jefe (Nivel 20)
 * - Biomas visuales temáticos integrados: Costa Zen, Valle de Trampas, Desfiladero Místico y Castillo del Jefe
 */
export default function AdventureMap({
  folderName = null,
  documentTitle = null,
  levels = [],
  unlockedLevel = 1,
  levelStars = {},
  onSelectLevel,
  onBackToFolders,
  onOpenTutorial,
  onResetCampaign,
  studyStreak = 0,
}) {
  const { t } = useTranslation();
  const [selectedLevelModal, setSelectedLevelModal] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  // Detección de vista (Desktop >= 860px usa el Tablero 2D panorámico; Móvil usa el flujo vertical)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 860;
  });

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 860);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Generar niveles si no se proveen
  const mapLevels = useMemo(() => {
    if (levels && levels.length > 0) return levels;
    return Array.from({ length: 20 }, (_, i) => {
      const lvl = i + 1;
      const isBoss = lvl === 20;
      const hasTraps = lvl >= 3;
      const trapCount = lvl < 8 ? 1 : lvl < 15 ? 2 : 3;
      return {
        level: lvl,
        name: null,
        questions: lvl,
        hasTraps,
        trapCount: hasTraps ? trapCount : 0,
        isBoss,
        desc: null,
      };
    });
  }, [levels]);

  const totalStars = useMemo(() => {
    return Object.values(levelStars || {}).reduce((acc, s) => acc + (s || 0), 0);
  }, [levelStars]);
  const maxStars = mapLevels.length * 3;
  const progressPct = Math.round((Math.min(unlockedLevel, mapLevels.length) / mapLevels.length) * 100);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COORDENADAS 2D DEL TABLERO SINUOSO (Canvas 1200 x 740)
  // Serpentea en 4 filas llenando armoniosamente todo el ancho y alto del monitor
  // ──────────────────────────────────────────────────────────────────────────
  const BOARD_W = 1200;
  const BOARD_H = 740;

  const board2dCoords = useMemo(() => {
    // Definición precisa de los 20 hitos para un trazado en S armonioso
    const rawPoints = [
      // Fila 1 (Base - Costa Zen): Avanza de izquierda a derecha
      { level: 1, x: 140, y: 650 },
      { level: 2, x: 290, y: 640 },
      { level: 3, x: 440, y: 660 },
      { level: 4, x: 590, y: 640 },
      { level: 5, x: 740, y: 655 },
      { level: 6, x: 890, y: 640 },
      // Transición subiendo por la derecha
      { level: 7, x: 1040, y: 535 },
      // Fila 2 (Media Baja - Valle de Trampas): Cruza de derecha a izquierda
      { level: 8, x: 910, y: 440 },
      { level: 9, x: 760, y: 455 },
      { level: 10, x: 610, y: 435 },
      { level: 11, x: 460, y: 450 },
      { level: 12, x: 310, y: 435 },
      // Transición subiendo por la izquierda
      { level: 13, x: 160, y: 330 },
      // Fila 3 (Media Alta - Desfiladero Místico): Cruza de izquierda a derecha
      { level: 14, x: 300, y: 235 },
      { level: 15, x: 460, y: 220 },
      { level: 16, x: 620, y: 240 },
      { level: 17, x: 780, y: 220 },
      // Transición hacia la cumbre
      { level: 18, x: 940, y: 165 },
      { level: 19, x: 800, y: 95 },
      // Nivel 20 (Castillo del Jefe Final en la cumbre superior)
      { level: 20, x: 580, y: 85 },
    ];

    // Si hay menos de 20 niveles proporcionados, adaptamos la lista
    return mapLevels.map((lvl, idx) => {
      const pt = rawPoints[idx] || rawPoints[rawPoints.length - 1];
      return { level: lvl.level, x: pt.x, y: pt.y };
    });
  }, [mapLevels]);

  // Camino SVG completo del tablero 2D
  const boardPathD = useMemo(() => {
    return getSmoothCurvePath(board2dCoords);
  }, [board2dCoords]);

  // Camino SVG iluminado para los niveles ya desbloqueados
  const unlockedBoardPathD = useMemo(() => {
    const unlockedCoords = board2dCoords.filter((c) => c.level <= unlockedLevel);
    if (unlockedCoords.length < 2) return "";
    return getSmoothCurvePath(unlockedCoords);
  }, [board2dCoords, unlockedLevel]);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. COORDENADAS PARA MODO MÓVIL (VERTICAL)
  // ──────────────────────────────────────────────────────────────────────────
  const MOBILE_GAP = 130;
  const MOBILE_H = 340 + MOBILE_GAP * Math.max(1, mapLevels.length - 1);

  const mobileCoords = useMemo(() => {
    return mapLevels.map((lvl, idx) => {
      const t = idx / Math.max(1, mapLevels.length - 1);
      const y = MOBILE_H - 160 - t * (MOBILE_H - 320);
      const xPct = 50 + Math.sin(idx * 0.95) * 32;
      return { level: lvl.level, xPct, y };
    });
  }, [mapLevels, MOBILE_H]);

  const mobilePathD = useMemo(() => {
    if (!mobileCoords.length) return "";
    const pts = mobileCoords.map((c) => ({ x: c.xPct * 8, y: c.y }));
    return getSmoothCurvePath(pts);
  }, [mobileCoords]);

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

  return (
    <div className="relative w-full h-full overflow-hidden select-none font-sans bg-radial from-[#12284c] via-[#08172e] to-[#030914] flex flex-col">
      {/* ── MALLA DECORATIVA DE FONDO CON CONSTELACIONES Y RUMBO ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#60a5fa_1.5px,transparent_1.5px)] [background-size:36px_36px]" />
        {/* Resplandores ambientales */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-10 right-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-[140px]" />
      </div>

      {/* ── BARRA SUPERIOR CON METADATOS Y PROGRESO GENERAL ── */}
      <header className="relative z-40 px-4 sm:px-8 py-3 flex items-center justify-between bg-slate-950/85 border-b-2 border-slate-800/80 backdrop-blur-md shadow-xl shrink-0">
        {/* Botón Volver a Carpetas */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFolders}
            className="group flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-arcade bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-arcade border-b-[var(--color-arcade-ink)] text-white shadow-btn-orange-flat active:translate-y-0.5 transition-all cursor-pointer"
            title={t("map.back_title")}
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              {t("map.back_btn")}
            </span>
          </button>
        </div>

        {/* Banner Central: Título + Medidor de Campaña */}
        <div className="flex flex-col items-center text-center max-w-sm sm:max-w-lg">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
            <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider truncate">
              {folderName || t("map.world")}
            </span>
          </div>
          <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
            {documentTitle || t("map.topic")} · Tablero de Campaña
          </h1>

          {/* Barra de progreso visual con estrellas */}
          <div className="mt-1 flex items-center gap-2.5 w-full">
            <div className="w-36 sm:w-56 h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 rounded-full"
              />
            </div>
            <span className="text-[9.5px] font-black text-emerald-300 whitespace-nowrap">
              Nivel {unlockedLevel}/{mapLevels.length} ({progressPct}%)
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-[9.5px] font-black text-amber-300">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{totalStars}/{maxStars}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción derecha */}
        <div className="flex items-center gap-2">
          {studyStreak >= 2 && (
            <div
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/50 text-[10px] font-black text-orange-300 shadow-sm"
              title={t("map.streak_t", { count: studyStreak })}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{studyStreak}d</span>
            </div>
          )}

          {onResetCampaign && unlockedLevel > 1 && (
            <button
              onClick={onResetCampaign}
              className="p-2 rounded-arcade bg-[var(--color-arcade-navy)] hover:bg-rose-950/80 border-2 border-[var(--color-arcade-navy-light)] border-b-arcade-sm border-b-[var(--color-arcade-ink)] text-rose-300 shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
              title={t("map.reset_title")}
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="p-2 rounded-arcade bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-arcade-sm border-b-[var(--color-arcade-ink)] text-amber-400 shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
              title={t("map.how_to")}
            >
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL DEL TABLERO ── */}
      <main className="relative z-10 flex-1 w-full h-full overflow-auto flex items-center justify-center p-2 sm:p-4">
        {isDesktop ? (
          /* ==========================================================
             OPCIÓN 1: TABLERO SINUOSO 2D (PANTALLA COMPLETA EN PC)
             ========================================================== */
          <div className="relative w-full max-w-[1300px] h-[calc(100vh-80px)] max-h-[820px] aspect-[1200/740] mx-auto rounded-3xl border-2 border-slate-700/60 bg-slate-950/40 backdrop-blur-xl shadow-2xl overflow-hidden p-2">
            {/* ── TERRENOS Y BIOMAS ILUSTRADOS EN EL TABLERO ── */}
            {/* Bioma 1: Costa & Playa Zen (Fila 1 - Abajo) */}
            <div className="absolute bottom-2 left-4 right-4 h-48 rounded-2xl bg-gradient-to-t from-emerald-950/50 via-teal-950/25 to-transparent border-t border-emerald-500/20 pointer-events-none flex items-end justify-between px-6 pb-2">
              <div className="flex items-center gap-2 text-emerald-400/50 text-[10px] font-black uppercase tracking-widest">
                <Waves className="w-4 h-4 text-emerald-400/60" />
                <span>Costa Zen (Niveles 1 a 6)</span>
              </div>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                Inicio de Expedición
              </span>
            </div>

            {/* Bioma 2: Valle de Trampas & Bosque (Fila 2 - Centro Bajo) */}
            <div className="absolute top-[38%] left-12 right-12 h-36 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 border border-cyan-500/15 pointer-events-none flex items-center justify-between px-8">
              <div className="flex items-center gap-2 text-cyan-400/50 text-[10px] font-black uppercase tracking-widest">
                <Trees className="w-4 h-4 text-cyan-400/60" />
                <span>Valle de Trampas (Niveles 7 a 12)</span>
              </div>
              <span className="text-[9px] text-rose-400/40 font-black uppercase tracking-wider">
                💀 Cuidado con Cartas Trampa
              </span>
            </div>

            {/* Bioma 3: Desfiladero Místico (Fila 3 - Centro Alto) */}
            <div className="absolute top-[18%] left-24 right-24 h-32 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-amber-950/30 border border-indigo-500/15 pointer-events-none flex items-center justify-between px-8">
              <div className="flex items-center gap-2 text-indigo-300/50 text-[10px] font-black uppercase tracking-widest">
                <Mountain className="w-4 h-4 text-indigo-300/60" />
                <span>Desfiladero Místico (Niveles 13 a 17)</span>
              </div>
            </div>

            {/* Bioma 4: Fortaleza de Hubzi Boss (Fila 4 - Cima Arriba) */}
            <div className="absolute top-2 left-1/4 right-1/4 h-28 rounded-2xl bg-gradient-to-b from-rose-950/60 via-amber-950/40 to-transparent border-b border-amber-500/30 pointer-events-none flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase tracking-widest drop-shadow">
                <Castle className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>Cima Legendaria: Hubzi Boss (Nivel 20)</span>
              </div>
            </div>

            {/* ── SVG DEL SENDERO 2D (CURVA SUAVE CATMULL-ROM) ── */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${BOARD_W} ${BOARD_H}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="trailShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#020617" floodOpacity="0.9" />
                </filter>
                <linearGradient id="activeTrailGlow" x1="0%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="45%" stopColor="#06b6d4" />
                  <stop offset="75%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {/* Sombra ancha profunda de la carretera */}
              <path
                d={boardPathD}
                fill="none"
                stroke="#020617"
                strokeWidth="24"
                strokeLinecap="round"
                filter="url(#trailShadow)"
              />

              {/* Calzada base de tierra/piedra */}
              <path
                d={boardPathD}
                fill="none"
                stroke="#172554"
                strokeWidth="16"
                strokeLinecap="round"
              />

              {/* Borde exterior del sendero */}
              <path
                d={boardPathD}
                fill="none"
                stroke="#1e3a8a"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Sendero punteado base */}
              <path
                d={boardPathD}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="5"
                strokeDasharray="14 12"
                strokeLinecap="round"
                opacity="0.35"
              />

              {/* Sendero desbloqueado iluminado con gradiente vivo */}
              {unlockedBoardPathD && (
                <path
                  d={unlockedBoardPathD}
                  fill="none"
                  stroke="url(#activeTrailGlow)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]"
                />
              )}
            </svg>

            {/* ── NODOS DEL TABLERO EN COORDENADAS 2D ── */}
            {mapLevels.map((lvl) => {
              const coord = board2dCoords.find((c) => c.level === lvl.level);
              if (!coord) return null;

              // Mapeo porcentual dentro del contenedor con viewBox 1200 x 740
              const leftPct = (coord.x / BOARD_W) * 100;
              const topPct = (coord.y / BOARD_H) * 100;

              const isUnlocked = lvl.level <= unlockedLevel;
              const isCurrent = lvl.level === unlockedLevel;
              const isBoss = lvl.isBoss || lvl.level === 20;
              const hasTraps = lvl.hasTraps;
              const stars = levelStars[lvl.level] || 0;

              return (
                <div
                  key={lvl.level}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
                  onClick={() => handleNodeClick(lvl)}
                  onMouseEnter={() => setHoveredLevel(lvl)}
                  onMouseLeave={() => setHoveredLevel(null)}
                >
                  {/* Tooltip de Hover Preview para Escritorio */}
                  <AnimatePresence>
                    {hoveredLevel?.level === lvl.level && isUnlocked && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.92 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-3 pointer-events-none z-40 px-3 py-1.5 rounded-arcade bg-slate-900/95 border-2 border-slate-700 text-white shadow-2xl backdrop-blur-md flex flex-col items-center whitespace-nowrap"
                      >
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wide">
                          {lvl.name || levelName(lvl, t)}
                        </span>
                        <span className="text-[9px] text-slate-300 font-medium">
                          {lvl.questions} {lvl.questions === 1 ? t("map.q_one") : t("map.q_many")}
                          {lvl.hasTraps && " · 💀 Cartas Trampa"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Avatar de Hubzi saltando sobre el nivel actual activo */}
                  {isCurrent && (
                    <motion.div
                      initial={{ y: 0 }}
                      animate={{ y: [-8, 0, -8] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        ease: "easeInOut",
                      }}
                      className="absolute -top-16 z-30 flex flex-col items-center pointer-events-none"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-3 border-[var(--color-arcade-yellow)] shadow-btn-arcade bg-[var(--color-arcade-navy-dark)]">
                        <img
                          src={capyEscolar}
                          alt="Hubzi Aquí"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-[var(--color-arcade-orange)] text-white font-black text-[8px] uppercase tracking-wider border border-[var(--color-arcade-navy-dark)] shadow-md -mt-1">
                        {t("map.here")}
                      </div>
                    </motion.div>
                  )}

                  {/* Corona y aura para Hubzi Boss (Nivel 20) */}
                  {isBoss && (
                    <div className="absolute -top-11 flex flex-col items-center text-[var(--color-arcade-yellow)] animate-bounce z-10 pointer-events-none">
                      <Crown className="w-9 h-9 fill-[var(--color-arcade-yellow)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]" />
                      <span className="text-[9px] font-black uppercase text-amber-300 bg-black/85 px-2.5 py-0.5 rounded-full border border-amber-400 -mt-1 shadow-md whitespace-nowrap">
                        {t("map.boss")}
                      </span>
                    </div>
                  )}

                  {/* Distintivo de Cartas Trampa */}
                  {hasTraps && !isBoss && isUnlocked && (
                    <div
                      className="absolute -top-2.5 -right-2 z-10 p-1 rounded-full bg-rose-950 border border-rose-500 shadow-md"
                      title={t("map.traps_t", { count: lvl.trapCount })}
                    >
                      <Skull className="w-3 h-3 text-rose-400" />
                    </div>
                  )}

                  {/* Estrellas ⭐⭐⭐ ganadas */}
                  <div className="flex items-center gap-0.5 mb-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/20 shadow-sm">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 ${
                          s <= stars
                            ? "text-[var(--color-arcade-yellow)] fill-[var(--color-arcade-yellow)] drop-shadow"
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
                    className={`relative ${
                      isBoss ? "w-18 h-18 sm:w-20 sm:h-20" : "w-13 h-13 sm:w-15 sm:h-15"
                    } rounded-full flex items-center justify-center border-4 text-white shadow-2xl transition-all cursor-pointer ${
                      !isUnlocked
                        ? "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-900 shadow-[0_5px_0_#1e293b] opacity-80 cursor-not-allowed"
                        : isBoss
                          ? "bg-gradient-to-b from-[var(--color-arcade-orange)] via-[#ea580c] to-[#9a3412] border-[#ffedd5] shadow-[0_8px_0_#7c2d12,0_0_30px_rgba(249,115,22,0.95)] animate-pulse"
                          : hasTraps
                            ? "bg-gradient-to-b from-[var(--color-sky-400)] via-[#0284c7] to-[#0369a1] border-[#bae6fd] shadow-[0_6px_0_#075985,0_0_16px_rgba(56,189,248,0.65)]"
                            : "bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#15803d] border-[#dcfce7] shadow-[0_6px_0_#166534,0_0_16px_rgba(74,222,128,0.65)]"
                    }`}
                  >
                    {/* Brillo especular superior */}
                    <div className="absolute top-1 inset-x-2 h-3.5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />

                    {isUnlocked ? (
                      <span
                        className={`${
                          isBoss ? "text-2xl sm:text-3xl font-extrabold" : "text-lg sm:text-xl font-black"
                        } font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                      >
                        {lvl.level}
                      </span>
                    ) : (
                      <Lock className="w-5 h-5 text-slate-300 drop-shadow" />
                    )}
                  </motion.button>

                  {/* Etiqueta inferior con preguntas */}
                  <div
                    className={`mt-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-md whitespace-nowrap ${
                      isUnlocked
                        ? isBoss
                          ? "bg-amber-950 border-amber-500 text-amber-200"
                          : "bg-[var(--color-arcade-navy)] border-[var(--color-arcade-navy-light)] text-white"
                        : "bg-slate-900/80 border-slate-700 text-slate-400"
                    }`}
                  >
                    {lvl.questions}{" "}
                    {lvl.questions === 1 ? t("map.q_one") : t("map.q_many")}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ==========================================================
             MODO MÓVIL (VERTICAL ASCENDENTE PARA TELÉFONOS)
             ========================================================== */
          <div
            className="relative w-full max-w-md mx-auto py-6"
            style={{ height: `${MOBILE_H}px` }}
          >
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 800 ${MOBILE_H}`}
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="roadShadowM" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#020917" floodOpacity="0.8" />
                </filter>
              </defs>
              <path
                d={mobilePathD}
                fill="none"
                stroke="#020917"
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#roadShadowM)"
              />
              <path
                d={mobilePathD}
                fill="none"
                stroke="#172554"
                strokeWidth="12"
                strokeLinecap="round"
              />
              <path
                d={mobilePathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeDasharray="16 12"
                strokeLinecap="round"
                className="drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]"
              />
            </svg>

            {mapLevels.map((lvl) => {
              const coord = mobileCoords.find((c) => c.level === lvl.level);
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
                  {isCurrent && (
                    <motion.div
                      animate={{ y: [-8, 0, -8] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                      className="absolute -top-16 z-30 flex flex-col items-center"
                    >
                      <div className="relative w-12 h-12 rounded-full overflow-hidden border-3 border-[var(--color-arcade-yellow)] shadow-btn-arcade bg-[var(--color-arcade-navy-dark)]">
                        <img src={capyEscolar} alt="Hubzi Aquí" className="w-full h-full object-cover" />
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-[var(--color-arcade-orange)] text-white font-black text-[8px] uppercase tracking-wider border border-[var(--color-arcade-navy-dark)] shadow-md -mt-1">
                        {t("map.here")}
                      </div>
                    </motion.div>
                  )}

                  {isBoss && (
                    <div className="absolute -top-9 flex flex-col items-center text-[var(--color-arcade-yellow)] animate-bounce z-10">
                      <Crown className="w-8 h-8 fill-[var(--color-arcade-yellow)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
                      <span className="text-[9px] font-black uppercase text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400 -mt-1 shadow-md whitespace-nowrap">
                        {t("map.boss")}
                      </span>
                    </div>
                  )}

                  {hasTraps && !isBoss && isUnlocked && (
                    <div
                      className="absolute -top-3 -right-2 z-10 p-1 rounded-full bg-rose-950 border border-rose-500 shadow-md"
                      title={t("map.traps_t", { count: lvl.trapCount })}
                    >
                      <Skull className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                  )}

                  <div className="flex items-center gap-0.5 mb-1 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/20 shadow-sm">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${
                          s <= stars
                            ? "text-[var(--color-arcade-yellow)] fill-[var(--color-arcade-yellow)] drop-shadow"
                            : "text-slate-600 fill-slate-800"
                        }`}
                      />
                    ))}
                  </div>

                  <motion.button
                    whileHover={isUnlocked ? { scale: 1.15 } : {}}
                    whileTap={isUnlocked ? { scale: 0.95 } : {}}
                    disabled={!isUnlocked}
                    className={`relative ${
                      isBoss ? "w-18 h-18" : "w-14 h-14"
                    } rounded-full flex items-center justify-center border-4 text-white shadow-2xl transition-all cursor-pointer ${
                      !isUnlocked
                        ? "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-900 shadow-[0_5px_0_#1e293b] opacity-80 cursor-not-allowed"
                        : isBoss
                          ? "bg-gradient-to-b from-[var(--color-arcade-orange)] via-[#ea580c] to-[#9a3412] border-[#ffedd5] shadow-[0_8px_0_#7c2d12,0_0_25px_rgba(249,115,22,0.9)] animate-pulse"
                          : hasTraps
                            ? "bg-gradient-to-b from-[var(--color-sky-400)] via-[#0284c7] to-[#0369a1] border-[#bae6fd] shadow-[0_6px_0_#075985,0_0_14px_rgba(56,189,248,0.6)]"
                            : "bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#15803d] border-[#dcfce7] shadow-[0_6px_0_#166534,0_0_14px_rgba(74,222,128,0.6)]"
                    }`}
                  >
                    <div className="absolute top-1 inset-x-2 h-3.5 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />

                    {isUnlocked ? (
                      <span className={`${isBoss ? "text-2xl font-extrabold" : "text-lg font-black"} font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                        {lvl.level}
                      </span>
                    ) : (
                      <Lock className="w-5 h-5 text-slate-300 drop-shadow" />
                    )}
                  </motion.button>

                  <div
                    className={`mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-md whitespace-nowrap ${
                      isUnlocked
                        ? isBoss
                          ? "bg-amber-950 border-amber-500 text-amber-200"
                          : "bg-[var(--color-arcade-navy)] border-[var(--color-arcade-navy-light)] text-white"
                        : "bg-slate-900/80 border-slate-700 text-slate-400"
                    }`}
                  >
                    {lvl.questions}{" "}
                    {lvl.questions === 1 ? t("map.q_one") : t("map.q_many")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── POP-UP / MODAL DE MISIÓN DE NIVEL ── */}
      <AnimatePresence>
        {selectedLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="relative w-full max-w-sm rounded-arcade-lg bg-[var(--color-arcade-navy)] border-4 border-[var(--color-arcade-navy-dark)] p-6 text-white shadow-[0_16px_0_var(--color-arcade-ink),0_25px_40px_rgba(0,0,0,0.8)] flex flex-col items-center text-center overflow-hidden"
            >
              <div
                className={`absolute -top-14 -right-14 w-36 h-36 ${
                  selectedLevelModal.isBoss
                    ? "bg-[var(--color-arcade-yellow)]/30"
                    : "bg-[var(--color-arcade-orange)]/20"
                } rounded-full blur-2xl pointer-events-none`}
              />

              <button
                onClick={() => setSelectedLevelModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-arcade-sm bg-[var(--color-arcade-navy-dark)] hover:bg-[var(--color-arcade-navy-hover)] border border-[var(--color-arcade-navy-light)] text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label={t("map.close_detail")}
              >
                <X className="w-4 h-4" />
              </button>

              <div
                className={`w-16 h-16 rounded-arcade flex items-center justify-center text-white shadow-btn-arcade-lg mb-3 ${
                  selectedLevelModal.isBoss
                    ? "bg-gradient-to-b from-[var(--color-arcade-orange)] to-[var(--color-arcade-orange-shadow)] border-3 border-[var(--color-arcade-yellow)]"
                    : "bg-gradient-to-b from-[var(--color-arcade-green)] to-[var(--color-arcade-green-shadow)] border-3 border-[var(--color-arcade-green-light)]"
                }`}
              >
                {selectedLevelModal.isBoss ? (
                  <Crown className="w-9 h-9 fill-[var(--color-arcade-yellow)] text-white" />
                ) : (
                  <span className="text-3xl font-black">{selectedLevelModal.level}</span>
                )}
              </div>

              <div className="text-[10px] font-black uppercase text-[var(--color-arcade-yellow)] tracking-widest mb-0.5">
                {t("map.level_of", { level: selectedLevelModal.level, max: 20 })}
              </div>
              <h2 className="text-xl font-black text-white tracking-wide mb-2">
                {selectedLevelModal.name || levelName(selectedLevelModal, t)}
              </h2>

              <p className="text-xs text-slate-300 leading-relaxed mb-3 px-2">
                {selectedLevelModal.desc || levelDesc(selectedLevelModal, t)}
              </p>

              {selectedLevelModal.hasTraps && (
                <div className="w-full py-1.5 px-3 rounded-arcade-sm bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[10px] font-bold flex items-center justify-center gap-1.5 mb-3">
                  <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{t("map.trap_alert", { count: selectedLevelModal.trapCount })}</span>
                </div>
              )}

              <div className="w-full py-1 px-2.5 rounded-arcade-sm bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[9.5px] font-bold flex items-center justify-center gap-1 mb-4">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{t("map.need_stars")}</span>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 p-2.5 rounded-arcade bg-[var(--color-arcade-navy-dark)] border border-[var(--color-arcade-navy-light)] mb-5">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    {t("map.questions")}
                  </span>
                  <span className="text-sm font-black text-[var(--color-arcade-yellow)]">
                    {t("map.nodes_n", { count: selectedLevelModal.questions })}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    {t("map.max_score")}
                  </span>
                  <span className="text-sm font-black text-[var(--color-arcade-green)]">
                    +{selectedLevelModal.questions * 10} pts
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartGame}
                className="w-full py-3.5 rounded-arcade bg-[var(--color-arcade-orange)] hover:bg-[var(--color-arcade-orange-bright)] border-2 border-[var(--color-arcade-orange-light)] border-b-arcade-lg border-b-[var(--color-arcade-orange-shadow)] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-btn-arcade-lg active:translate-y-1 active:shadow-none"
              >
                {selectedLevelModal.isBoss ? (
                  <Swords className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 fill-white" />
                )}
                <span>
                  {selectedLevelModal.isBoss
                    ? t("map.boss_fight")
                    : t("map.play")}
                </span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
