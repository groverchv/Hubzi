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
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Waves,
  Trees,
  Mountain,
  Castle,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import capyEscolar from "../assets/mascots/capy_escolar_nino_m.webp";
import { useTranslation } from "react-i18next";
import { levelName, levelDesc } from "../utils/gameConfig";

/**
 * AdventureMap - OPCIÓN 3: El Archipiélago de 5 Islas (Estilo Monster Legends / Mario World / RPG)
 * - Agrupa los 20 niveles en 5 Islas Temáticas de 4 niveles cada una.
 * - Elimina por completo los vacíos de la pantalla: cada isla es un escenario completo con su propio bioma.
 * - Navegación fluida entre islas con pestañas interactivas y flechas de navegación.
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

  // Generar los 20 niveles
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

  // Las 5 Islas del Archipiélago (4 niveles cada una)
  const ISLANDS = useMemo(() => [
    {
      id: 0,
      name: "Costa Zen",
      tag: "Bioma 1: Aguas Cálidas",
      desc: "Playas tranquilas para asimilar los conceptos fundamentales del tema.",
      levelsRange: [1, 2, 3, 4],
      accent: "#06b6d4",
      bgGradient: "from-[#082a3e] via-[#051c2a] to-[#020d14]",
      glowColor: "rgba(6, 182, 212, 0.25)",
      borderColor: "border-cyan-500/30",
      icon: Waves,
      iconColor: "text-cyan-400",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-400/40",
    },
    {
      id: 1,
      name: "Valle de Trampas",
      tag: "Bioma 2: Selva Intensa",
      desc: "Bosque denso con puentes colgantes. ¡Aparecen las primeras cartas trampa!",
      levelsRange: [5, 6, 7, 8],
      accent: "#10b981",
      bgGradient: "from-[#063321] via-[#042216] to-[#02100a]",
      glowColor: "rgba(16, 185, 129, 0.25)",
      borderColor: "border-emerald-500/30",
      icon: Trees,
      iconColor: "text-emerald-400",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
    },
    {
      id: 2,
      name: "Desfiladero de Retos",
      tag: "Bioma 3: Rocas de Altura",
      desc: "Cañones rocosos donde se consolida tu memoria y agilidad mental.",
      levelsRange: [9, 10, 11, 12],
      accent: "#f59e0b",
      bgGradient: "from-[#382006] via-[#241403] to-[#120a01]",
      glowColor: "rgba(245, 158, 11, 0.25)",
      borderColor: "border-amber-500/30",
      icon: Mountain,
      iconColor: "text-amber-400",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-400/40",
    },
    {
      id: 3,
      name: "Cumbre Mística",
      tag: "Bioma 4: Meseta Astral",
      desc: "Templo sobre las nubes para afinar maestría antes del gran duelo.",
      levelsRange: [13, 14, 15, 16],
      accent: "#a855f7",
      bgGradient: "from-[#29144a] via-[#1a0c30] to-[#0c0517]",
      glowColor: "rgba(168, 85, 247, 0.25)",
      borderColor: "border-purple-500/30",
      icon: Sparkles,
      iconColor: "text-purple-400",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-400/40",
    },
    {
      id: 4,
      name: "Volcán de Hubzi Boss",
      tag: "Bioma 5: Fortaleza Final",
      desc: "La fortaleza volcánica del Jefe. ¡Supera los 20 reactivos para coronarte!",
      levelsRange: [17, 18, 19, 20],
      accent: "#ef4444",
      bgGradient: "from-[#450a0a] via-[#2b0606] to-[#140202]",
      glowColor: "rgba(239, 68, 68, 0.3)",
      borderColor: "border-red-500/40",
      icon: Castle,
      iconColor: "text-red-400",
      badgeColor: "bg-red-500/20 text-red-300 border-red-400/40",
    },
  ], []);

  // Calcular la isla actual según el nivel más alto desbloqueado
  const currentIslandIndex = Math.min(
    4,
    Math.floor((Math.max(1, unlockedLevel) - 1) / 4)
  );
  const [selectedIslandIdx, setSelectedIslandIdx] = useState(currentIslandIndex);

  // Sincronizar isla seleccionada con el nivel desbloqueado
  useEffect(() => {
    setSelectedIslandIdx(currentIslandIndex);
  }, [currentIslandIndex]);

  const activeIsland = ISLANDS[selectedIslandIdx];

  // Niveles de la isla activa
  const islandLevels = useMemo(() => {
    return activeIsland.levelsRange.map((lvlNum) => {
      return (
        mapLevels.find((l) => l.level === lvlNum) || {
          level: lvlNum,
          questions: lvlNum,
          hasTraps: lvlNum >= 3,
          trapCount: lvlNum < 8 ? 1 : lvlNum < 15 ? 2 : 3,
          isBoss: lvlNum === 20,
        }
      );
    });
  }, [activeIsland, mapLevels]);

  // Estadísticas globales
  const totalStars = useMemo(() => {
    return Object.values(levelStars || {}).reduce((acc, s) => acc + (s || 0), 0);
  }, [levelStars]);
  const maxStars = mapLevels.length * 3;

  // Estrellas de la isla activa
  const islandStars = useMemo(() => {
    return activeIsland.levelsRange.reduce((acc, lvlNum) => acc + (levelStars[lvlNum] || 0), 0);
  }, [activeIsland, levelStars]);

  const handleNodeClick = (lvl) => {
    const isUnlocked = lvl.level <= unlockedLevel;
    if (!isUnlocked) return;
    setSelectedLevelModal(lvl);
  };

  const handleStartGame = (lvl = null) => {
    const target = lvl || selectedLevelModal;
    if (target) {
      onSelectLevel(target.level);
      setSelectedLevelModal(null);
    }
  };

  const prevIsland = () => {
    if (selectedIslandIdx > 0) setSelectedIslandIdx((i) => i - 1);
  };

  const nextIsland = () => {
    if (selectedIslandIdx < ISLANDS.length - 1) setSelectedIslandIdx((i) => i + 1);
  };

  // Coordenadas fijas armónicas para los 4 niveles de la isla (Diseño de camino espacioso en 2D)
  // [Nivel 1 abajo-izq] -> [Nivel 2 centro-bajo] -> [Nivel 3 centro-alto] -> [Nivel 4 cumbre derecha]
  const nodePositions = [
    { xPct: 18, yPct: 70 },
    { xPct: 40, yPct: 40 },
    { xPct: 62, yPct: 65 },
    { xPct: 84, yPct: 35 },
  ];

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none font-sans bg-radial ${activeIsland.bgGradient} flex flex-col transition-colors duration-700`}
    >
      {/* ── RESPLANDORES Y MALLA AMBIENTAL DE LA ISLA ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full blur-[160px] transition-all duration-700"
          style={{ backgroundColor: activeIsland.glowColor }}
        />
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
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
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider truncate">
              {folderName || t("map.world")}
            </span>
          </div>
          <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
            {documentTitle || t("map.topic")} · Archipiélago de 5 Islas
          </h1>
        </div>

        {/* Total de Estrellas y Racha */}
        <div className="flex items-center gap-2 sm:gap-3">
          {studyStreak >= 2 && (
            <div
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/50 text-[10px] font-black text-orange-300 shadow-sm"
              title={t("map.streak_t", { count: studyStreak })}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{studyStreak}d</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-xs font-black text-amber-300 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{totalStars}/{maxStars}</span>
          </div>

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

      {/* ── PESTAÑAS SELECTORAS DE LAS 5 ISLAS (TIPO MUNDOS) ── */}
      <nav aria-label="Navegación de islas" className="relative z-30 px-3 sm:px-6 py-2.5 flex items-center justify-center gap-1.5 sm:gap-3 bg-slate-950/60 backdrop-blur-md border-b border-slate-800/80 overflow-x-auto">
        {ISLANDS.map((isl) => {
          const isSelected = isl.id === selectedIslandIdx;
          const isIslandUnlocked = isl.levelsRange[0] <= unlockedLevel;
          const starsInIsl = isl.levelsRange.reduce((acc, l) => acc + (levelStars[l] || 0), 0);
          const isCompleted = starsInIsl >= 8;

          return (
            <button
              key={isl.id}
              onClick={() => setSelectedIslandIdx(isl.id)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-arcade transition-all cursor-pointer border-2 shrink-0 ${
                isSelected
                  ? `bg-slate-900 ${isl.borderColor} shadow-lg scale-105 ring-2 ring-[var(--color-arcade-yellow)]/50`
                  : "bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100"
              }`}
            >
              <isl.icon className={`w-4 h-4 ${isl.iconColor}`} />
              <div className="flex flex-col items-start text-left">
                <span className="text-[10px] sm:text-xs font-black uppercase text-white tracking-wide">
                  {isl.name}
                </span>
                <span className="text-[8px] font-bold text-slate-400">
                  Niveles {isl.levelsRange[0]}-{isl.levelsRange[isl.levelsRange.length - 1]}
                </span>
              </div>

              {!isIslandUnlocked ? (
                <Lock className="w-3.5 h-3.5 text-slate-500 ml-1" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />
              ) : (
                <div className="flex items-center gap-0.5 text-[9px] font-black text-amber-300 ml-1">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{starsInIsl}/12</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── ESCENARIO PRINCIPAL DE LA ISLA (PANTALLA COMPLETA 2D) ── */}
      <main className="relative z-10 flex-1 w-full h-full flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden">
        {/* Cabecera Informativa de la Isla Activa */}
        <div className="w-full max-w-4xl flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-950/50 border border-white/10 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-arcade bg-slate-900 border ${activeIsland.borderColor}`}>
              <activeIsland.icon className={`w-6 h-6 ${activeIsland.iconColor}`} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${activeIsland.badgeColor}`}>
                  {activeIsland.tag}
                </span>
                <span className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {islandStars} de 12 estrellas
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                {activeIsland.name}
              </h2>
              <p className="text-xs text-slate-300 font-medium hidden sm:block">
                {activeIsland.desc}
              </p>
            </div>
          </div>

          {/* Botones de navegación entre islas */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevIsland}
              disabled={selectedIslandIdx === 0}
              className="p-2 sm:px-3 sm:py-2 rounded-arcade bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 text-white text-xs font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-md"
              title="Isla anterior"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            <button
              onClick={nextIsland}
              disabled={selectedIslandIdx === ISLANDS.length - 1}
              className="p-2 sm:px-3 sm:py-2 rounded-arcade bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-700 text-white text-xs font-black uppercase flex items-center gap-1 transition-all cursor-pointer shadow-md"
              title="Isla siguiente"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── LIENZO DEL CAMINO DE LA ISLA CON 4 NIVELES ── */}
        <div className="relative w-full max-w-4xl flex-1 my-3 rounded-3xl border-2 border-white/10 bg-slate-950/40 backdrop-blur-xl shadow-2xl flex items-center justify-center overflow-hidden">
          {/* Sendero Curvo SVG que conecta los 4 niveles */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 500"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="islandShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Sombra ancha del camino */}
            <path
              d="M 180 350 C 290 200, 290 200, 400 200 C 510 200, 510 325, 620 325 C 730 325, 730 175, 840 175"
              fill="none"
              stroke="#020917"
              strokeWidth="22"
              strokeLinecap="round"
              filter="url(#islandShadow)"
            />

            {/* Pista de piedra */}
            <path
              d="M 180 350 C 290 200, 290 200, 400 200 C 510 200, 510 325, 620 325 C 730 325, 730 175, 840 175"
              fill="none"
              stroke="#1e293b"
              strokeWidth="15"
              strokeLinecap="round"
            />

            {/* Línea punteada dorada / blanca */}
            <path
              d="M 180 350 C 290 200, 290 200, 400 200 C 510 200, 510 325, 620 325 C 730 325, 730 175, 840 175"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeDasharray="16 12"
              strokeLinecap="round"
              className="drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]"
            />
          </svg>

          {/* ── LOS 4 NODOS DE NIVEL DE LA ISLA ── */}
          {islandLevels.map((lvl, idx) => {
            const pos = nodePositions[idx];
            const isUnlocked = lvl.level <= unlockedLevel;
            const isCurrent = lvl.level === unlockedLevel;
            const isBoss = lvl.isBoss || lvl.level === 20;
            const hasTraps = lvl.hasTraps;
            const stars = levelStars[lvl.level] || 0;

            return (
              <div
                key={lvl.level}
                style={{
                  left: `${pos.xPct}%`,
                  top: `${pos.yPct}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer group"
                onClick={() => handleNodeClick(lvl)}
              >
                {/* Avatar animado de Hubzi sobre el nivel actual activo */}
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

                {/* Corona y aura dorada para Hubzi Boss (Nivel 20) */}
                {isBoss && (
                  <div className="absolute -top-12 flex flex-col items-center text-[var(--color-arcade-yellow)] animate-bounce z-10 pointer-events-none">
                    <Crown className="w-10 h-10 fill-[var(--color-arcade-yellow)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]" />
                    <span className="text-[9px] font-black uppercase text-amber-300 bg-black/85 px-2.5 py-0.5 rounded-full border border-amber-400 -mt-1 shadow-md whitespace-nowrap">
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
                <div className="flex items-center gap-0.5 mb-1.5 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/20 shadow-sm">
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

                {/* Botón Circular 3D del Nivel */}
                <motion.button
                  whileHover={isUnlocked ? { scale: 1.15 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                  disabled={!isUnlocked}
                  className={`relative ${
                    isBoss ? "w-20 h-20 sm:w-24 sm:h-24" : "w-16 h-16 sm:w-18 sm:h-18"
                  } rounded-full flex items-center justify-center border-4 text-white shadow-2xl transition-all cursor-pointer ${
                    !isUnlocked
                      ? "bg-gradient-to-b from-slate-600 to-slate-800 border-slate-900 shadow-[0_6px_0_#1e293b] opacity-80 cursor-not-allowed"
                      : isBoss
                        ? "bg-gradient-to-b from-[var(--color-arcade-orange)] via-[#ea580c] to-[#9a3412] border-[#ffedd5] shadow-[0_8px_0_#7c2d12,0_0_30px_rgba(249,115,22,0.95)] animate-pulse"
                        : hasTraps
                          ? "bg-gradient-to-b from-[var(--color-sky-400)] via-[#0284c7] to-[#0369a1] border-[#bae6fd] shadow-[0_6px_0_#075985,0_0_16px_rgba(56,189,248,0.65)]"
                          : "bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#15803d] border-[#dcfce7] shadow-[0_6px_0_#166534,0_0_16px_rgba(74,222,128,0.65)]"
                  }`}
                >
                  <div className="absolute top-1 inset-x-2 h-4 bg-gradient-to-b from-white/60 to-transparent rounded-full pointer-events-none" />

                  {isUnlocked ? (
                    <span
                      className={`${
                        isBoss ? "text-3xl sm:text-4xl font-extrabold" : "text-xl sm:text-2xl font-black"
                      } font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                    >
                      {lvl.level}
                    </span>
                  ) : (
                    <Lock className="w-6 h-6 text-slate-300 drop-shadow" />
                  )}
                </motion.button>

                {/* Etiqueta inferior con el número de preguntas */}
                <div
                  className={`mt-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-md whitespace-nowrap ${
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

        {/* Pie Informativo con Progreso de la Materia */}
        <div className="w-full max-w-4xl flex items-center justify-between text-[11px] font-bold text-slate-400 px-2">
          <span>Progreso de Materia: Nivel {unlockedLevel}/20</span>
          <span>Completa al menos 2 estrellas en cada nivel para avanzar</span>
        </div>
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
