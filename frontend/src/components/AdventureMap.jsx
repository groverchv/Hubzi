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
  Trophy,
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  Medal,
  ChevronUp,
} from "lucide-react";
import capyEscolar from "../assets/mascots/capy_escolar_nino_m.webp";
import { useTranslation } from "react-i18next";
import { levelName, levelDesc } from "../utils/gameConfig";

/**
 * AdventureMap - OPCIÓN 2: Pantalla Dividida con Panel de Campaña (Estilo Duolingo Web)
 * - Columna Izquierda / Centro: Camino de niveles vertical clásico, táctil y fluido con scroll
 * - Columna Derecha: Panel de Misión del Estudiante, Avatar de Hubzi con diálogo,
 *   Estadísticas de la campaña, botón de acción rápida "JUGAR AHORA" y medallas desbloqueables
 * - En móvil: El panel derecho se contrae elegantemente debajo del mapa o en un drawer
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
  const scrollContainerRef = useRef(null);

  // Generar los 20 niveles si no vienen provistos
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

  // Nivel activo actual (el más alto desbloqueado hasta el 20)
  const currentTargetLevel = Math.min(unlockedLevel, mapLevels.length);
  const currentLevelData = mapLevels.find((l) => l.level === currentTargetLevel) || mapLevels[0];

  // Cálculo de estadísticas
  const totalStars = useMemo(() => {
    return Object.values(levelStars || {}).reduce((acc, s) => acc + (s || 0), 0);
  }, [levelStars]);
  const maxStars = mapLevels.length * 3;
  const completedLevelsCount = Object.keys(levelStars || {}).filter(
    (k) => (levelStars[k] || 0) >= 2
  ).length;
  const progressPct = Math.round((completedLevelsCount / mapLevels.length) * 100);

  // ──────────────────────────────────────────────────────────────────────────
  // 1. COORDENADAS DEL CAMINO VERTICAL (Columna Principal)
  // ──────────────────────────────────────────────────────────────────────────
  const LEVEL_GAP = 135;
  const TOTAL_HEIGHT = 320 + LEVEL_GAP * Math.max(1, mapLevels.length - 1);

  const levelCoords = useMemo(() => {
    return mapLevels.map((lvl, idx) => {
      const t = idx / Math.max(1, mapLevels.length - 1);
      // Nivel 1 en el fondo (abajo), Nivel 20 en la cumbre (arriba)
      const y = TOTAL_HEIGHT - 160 - t * (TOTAL_HEIGHT - 320);
      const xPct = 50 + Math.sin(idx * 0.95) * 32;
      return { level: lvl.level, xPct, y };
    });
  }, [mapLevels, TOTAL_HEIGHT]);

  // Sendero SVG curvo
  const pathD = useMemo(() => {
    if (!levelCoords.length) return "";
    return levelCoords.reduce((acc, coord, i) => {
      const x = (coord.xPct * 8).toFixed(1);
      const y = coord.y.toFixed(1);
      if (i === 0) return `M ${x} ${y}`;
      const prev = levelCoords[i - 1];
      const prevX = (prev.xPct * 8).toFixed(1);
      const prevY = prev.y.toFixed(1);
      const midY = ((parseFloat(prevY) + parseFloat(y)) / 2).toFixed(1);
      return `${acc} C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
    }, "");
  }, [levelCoords]);

  // Centrado automático en el nivel actual del jugador
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeCoord = levelCoords.find((c) => c.level === currentTargetLevel);
      if (activeCoord) {
        scrollContainerRef.current.scrollTop = Math.max(0, activeCoord.y - 360);
      }
    }
  }, [currentTargetLevel, levelCoords]);

  const handleNodeClick = (lvl) => {
    const isUnlocked = lvl.level <= unlockedLevel;
    if (!isUnlocked) return;
    setSelectedLevelModal(lvl);
  };

  const handleStartGame = (lvl = null) => {
    const target = lvl || selectedLevelModal || currentLevelData;
    if (target) {
      onSelectLevel(target.level);
      setSelectedLevelModal(null);
    }
  };

  // Frase dinámica de Hubzi según la etapa del estudiante
  const hubziAdvice = useMemo(() => {
    if (currentTargetLevel >= 20) {
      return "¡Llegaste a la Cumbre! Derrota a Hubzi Boss para completar esta materia con honores.";
    }
    if (currentTargetLevel >= 15) {
      return "¡Estás en la recta final! Los circuitos son más exigentes, tómate tu tiempo para memorizar.";
    }
    if (currentTargetLevel >= 8) {
      return "¡Atento a las cartas trampa! Si dudas, respira hondo antes de seleccionar una respuesta.";
    }
    if (currentTargetLevel >= 4) {
      return "¡Buen ritmo de estudio! Completar 2 estrellas en cada nivel te desbloquea el siguiente paso.";
    }
    return "¡Bienvenido a la expedición! Comienza por el Nivel 1 para dominar las preguntas iniciales.";
  }, [currentTargetLevel]);

  // 4 Medallas de logro de la campaña
  const ACHIEVEMENTS = [
    {
      id: "first_step",
      name: "Primer Paso",
      desc: "Supera el Nivel 1",
      unlocked: unlockedLevel > 1,
      icon: CheckCircle2,
      color: "text-emerald-400",
    },
    {
      id: "trap_hunter",
      name: "Cazador de Trampas",
      desc: "Llega al Nivel 6",
      unlocked: unlockedLevel >= 6,
      icon: Skull,
      color: "text-rose-400",
    },
    {
      id: "star_collector",
      name: "Coleccionista",
      desc: "Consigue 15+ estrellas",
      unlocked: totalStars >= 15,
      icon: Star,
      color: "text-amber-400",
    },
    {
      id: "boss_slayer",
      name: "Campeón de Isla",
      desc: "Derrota a Hubzi Boss",
      unlocked: (levelStars[20] || 0) >= 2,
      icon: Crown,
      color: "text-yellow-300",
    },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden select-none font-sans bg-radial from-[#13284a] via-[#091830] to-[#040b17] flex flex-col">
      {/* ── MALLA DECORATIVA DE FONDO ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]" />
      </div>

      {/* ── BARRA SUPERIOR FIJA ── */}
      <header className="relative z-40 px-4 sm:px-8 py-3 flex items-center justify-between bg-slate-950/85 border-b-2 border-slate-800/80 backdrop-blur-md shadow-xl shrink-0">
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

        {/* Título de la Materia */}
        <div className="flex flex-col items-center text-center max-w-sm sm:max-w-md">
          <div className="flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider truncate">
              {folderName || t("map.world")}
            </span>
          </div>
          <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
            {documentTitle || t("map.topic")} · {t("map.campaign")}
          </h1>
        </div>

        {/* Botones de control */}
        <div className="flex items-center gap-2">
          {studyStreak >= 2 && (
            <div
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/50 text-[10px] font-black text-orange-300 shadow-sm"
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

      {/* ── CONTENIDO PRINCIPAL: PANTALLA DIVIDIDA (MAPA + PANEL DE CAMPAÑA) ── */}
      <div className="relative z-10 flex-1 w-full max-w-[1500px] mx-auto flex flex-col lg:flex-row overflow-hidden">
        {/* ==========================================================
           COLUMNA IZQUIERDA / CENTRO: EL MAPA VERTICAL ASCENDENTE (62%)
           ========================================================== */}
        <div
          ref={scrollContainerRef}
          className="relative flex-1 h-full overflow-y-auto overflow-x-hidden pt-12 pb-24 scroll-smooth border-b lg:border-b-0 lg:border-r border-slate-800/80"
        >
          <div
            className="relative w-full max-w-lg mx-auto"
            style={{ height: `${TOTAL_HEIGHT}px` }}
          >
            {/* SVG del Camino Vertical */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 800 ${TOTAL_HEIGHT}`}
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="roadShadowOpt2" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#020917" floodOpacity="0.85" />
                </filter>
              </defs>

              {/* Sombra de la carretera */}
              <path
                d={pathD}
                fill="none"
                stroke="#020917"
                strokeWidth="18"
                strokeLinecap="round"
                filter="url(#roadShadowOpt2)"
              />

              {/* Calzada base */}
              <path
                d={pathD}
                fill="none"
                stroke="#172554"
                strokeWidth="13"
                strokeLinecap="round"
              />

              {/* Línea punteada blanca brillante */}
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth="6"
                strokeDasharray="16 12"
                strokeLinecap="round"
                className="drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]"
              />
            </svg>

            {/* Islas de Soporte Decorativas */}
            {[
              { y: TOTAL_HEIGHT - 260, label: t("map.zone1") },
              { y: TOTAL_HEIGHT - 880, label: t("map.zone2") },
              { y: TOTAL_HEIGHT - 1520, label: t("map.zone3") },
              { y: TOTAL_HEIGHT - 2160, label: t("map.zone4") },
              { y: 160, label: t("map.zone5") },
            ]
              .filter((island) => island.y > 0 && island.y < TOTAL_HEIGHT - 60)
              .map((island, idx) => (
                <div
                  key={idx}
                  style={{ top: `${island.y}px` }}
                  className="absolute left-1/2 -translate-x-1/2 w-[85%] max-w-md h-24 rounded-full bg-emerald-900/25 border-2 border-emerald-500/20 blur-xs pointer-events-none flex items-center justify-center"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200/40">
                    {island.label}
                  </span>
                </div>
              ))}

            {/* Nodos de Nivel del Camino */}
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
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
                  onClick={() => handleNodeClick(lvl)}
                >
                  {/* Avatar animado de Hubzi en el nivel actual */}
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
                    <div className="absolute -top-10 flex flex-col items-center text-[var(--color-arcade-yellow)] animate-bounce z-10 pointer-events-none">
                      <Crown className="w-8 h-8 fill-[var(--color-arcade-yellow)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
                      <span className="text-[9px] font-black uppercase text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400 -mt-1 shadow-md whitespace-nowrap">
                        {t("map.boss")}
                      </span>
                    </div>
                  )}

                  {/* Distintivo de Cartas Trampa */}
                  {hasTraps && !isBoss && isUnlocked && (
                    <div
                      className="absolute -top-3 -right-2 z-10 p-1 rounded-full bg-rose-950 border border-rose-500 shadow-md"
                      title={t("map.traps_t", { count: lvl.trapCount })}
                    >
                      <Skull className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                  )}

                  {/* Estrellas ⭐⭐⭐ */}
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

                  {/* Botón Circular 3D */}
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
                          ? "bg-gradient-to-b from-[var(--color-arcade-orange)] via-[#ea580c] to-[#9a3412] border-[#ffedd5] shadow-[0_8px_0_#7c2d12,0_0_25px_rgba(249,115,22,0.9)] animate-pulse"
                          : hasTraps
                            ? "bg-gradient-to-b from-[var(--color-sky-400)] via-[#0284c7] to-[#0369a1] border-[#bae6fd] shadow-[0_6px_0_#075985,0_0_14px_rgba(56,189,248,0.6)]"
                            : "bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#15803d] border-[#dcfce7] shadow-[0_6px_0_#166534,0_0_14px_rgba(74,222,128,0.6)]"
                    }`}
                  >
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

                  {/* Etiqueta inferior con el número de preguntas */}
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
        </div>

        {/* ==========================================================
           COLUMNA DERECHA: PANEL DE CAMPAÑA Y COMPAÑERO HUBZI (38%)
           ========================================================== */}
        <aside className="w-full lg:w-[420px] xl:w-[460px] h-auto lg:h-full overflow-y-auto p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xl flex flex-col gap-4 shrink-0">
          {/* ── CARD 1: COMPAÑERO HUBZI CON GLOBO DE DIÁLOGO ── */}
          <div className="relative p-4 rounded-arcade-lg bg-[var(--color-arcade-navy)]/90 border-2 border-[var(--color-arcade-navy-light)] shadow-xl flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-[var(--color-arcade-yellow)] shadow-md bg-slate-950 shrink-0">
              <img
                src={capyEscolar}
                alt="Hubzi Coach"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-center text-[7.5px] font-black uppercase text-amber-300 py-0.5">
                Coach
              </div>
            </div>

            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hubzi dice:</span>
              </div>
              <p className="mt-1 text-xs text-slate-200 leading-snug font-medium">
                "{hubziAdvice}"
              </p>
            </div>
          </div>

          {/* ── CARD 2: RETO ACTUAL & ACCIÓN RÁPIDA "JUGAR AHORA" ── */}
          <div className="p-4 rounded-arcade-lg bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-700 shadow-xl flex flex-col gap-3 text-left">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-black uppercase text-emerald-300">
                Tu Próximo Desafío
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                Fase {currentTargetLevel} de 20
              </span>
            </div>

            <div>
              <h2 className="text-base font-black text-white">
                {currentLevelData.name || levelName(currentLevelData, t)}
              </h2>
              <p className="mt-0.5 text-xs text-slate-300 line-clamp-2">
                {currentLevelData.desc || levelDesc(currentLevelData, t)}
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-300 pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300">
                <Target className="w-3.5 h-3.5" />
                <span>{currentLevelData.questions} preguntas</span>
              </div>
              {currentLevelData.hasTraps && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400">
                  <Skull className="w-3.5 h-3.5" />
                  <span>{currentLevelData.trapCount} cartas trampa</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleStartGame(currentLevelData)}
              className="mt-1 w-full py-3 rounded-arcade bg-[var(--color-arcade-orange)] hover:bg-[var(--color-arcade-orange-bright)] border-2 border-[var(--color-arcade-orange-light)] border-b-arcade border-b-[var(--color-arcade-orange-shadow)] text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-btn-arcade transition-all cursor-pointer active:translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Jugar Nivel {currentTargetLevel} Ahora</span>
            </button>
          </div>

          {/* ── CARD 3: RESUMEN DE PROGRESO DE CAMPAÑA ── */}
          <div className="p-4 rounded-arcade-lg bg-[var(--color-arcade-navy)]/80 border-2 border-[var(--color-arcade-navy-light)] shadow-lg flex flex-col gap-2.5 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" /> Progreso de Materia
              </span>
              <span className="text-xs font-black text-emerald-400">
                {progressPct}% completado
              </span>
            </div>

            {/* Barra de progreso */}
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400 rounded-full"
              />
            </div>

            {/* Grid 3 Métricas */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
              <div className="p-2 rounded-arcade-sm bg-slate-950/60 border border-slate-800 flex flex-col items-center">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 mb-0.5" />
                <span className="text-xs font-black text-white">{totalStars}/{maxStars}</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Estrellas</span>
              </div>

              <div className="p-2 rounded-arcade-sm bg-slate-950/60 border border-slate-800 flex flex-col items-center">
                <Target className="w-4 h-4 text-emerald-400 mb-0.5" />
                <span className="text-xs font-black text-white">{completedLevelsCount}/20</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Dominados</span>
              </div>

              <div className="p-2 rounded-arcade-sm bg-slate-950/60 border border-slate-800 flex flex-col items-center">
                <Flame className="w-4 h-4 text-orange-400 mb-0.5" />
                <span className="text-xs font-black text-white">{studyStreak}d</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase">Racha</span>
              </div>
            </div>
          </div>

          {/* ── CARD 4: MEDALLAS Y LOGROS DE LA ISLA ── */}
          <div className="p-4 rounded-arcade-lg bg-[var(--color-arcade-navy)]/80 border-2 border-[var(--color-arcade-navy-light)] shadow-lg flex flex-col gap-2.5 text-left">
            <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-400" /> Logros Desbloqueables
            </span>

            <div className="grid grid-cols-2 gap-2">
              {ACHIEVEMENTS.map((a) => (
                <div
                  key={a.id}
                  className={`p-2.5 rounded-arcade-sm border flex items-center gap-2 transition-all ${
                    a.unlocked
                      ? "bg-slate-900/90 border-slate-700 shadow-sm"
                      : "bg-slate-950/50 border-slate-850 opacity-60"
                  }`}
                >
                  <div className={`p-1.5 rounded-full bg-slate-800 ${a.color} shrink-0`}>
                    <a.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[10px] font-black uppercase text-white truncate">
                      {a.name}
                    </h3>
                    <p className="text-[8.5px] text-slate-400 truncate">
                      {a.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── MODAL DE MISIÓN AL HACER CLIC EN UN NODO DEL MAPA ── */}
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
                onClick={() => handleStartGame(selectedLevelModal)}
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
