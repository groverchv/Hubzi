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
  Monitor,
  Smartphone,
} from "lucide-react";
import capyEscolar from "../assets/mascots/capy_escolar_nino_m.webp";
import { useTranslation } from "react-i18next";
import { levelName, levelDesc } from "../utils/gameConfig";

/**
 * AdventureMap - Mapa de Aventura Adaptativo
 * - MODO ESCRITORIO / PC: Scroll horizontal panorámico (izquierda a derecha, estilo Mario World / Kingdom Rush)
 * - MODO MÓVIL: Scroll vertical ascendente (abajo hacia arriba, estilo Duolingo / Candy Crush)
 * - 20 Niveles pedagógicos progresivos con biomas temáticos, cartas trampa y batalla final contra Hubzi Boss
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
  const scrollContainerRef = useRef(null);

  // Detección automática responsiva (ancho >= 900px es Desktop)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= 900;
  });

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 900);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  // Total de estrellas acumuladas
  const totalStars = useMemo(() => {
    return Object.values(levelStars || {}).reduce((acc, s) => acc + (s || 0), 0);
  }, [levelStars]);
  const maxStars = mapLevels.length * 3;
  const progressPct = Math.round((Math.min(unlockedLevel, mapLevels.length) / mapLevels.length) * 100);

  // ── 1. CÁLCULO DE COORDENADAS PARA MODO HORIZONTAL (DESKTOP) ──
  const DESKTOP_GAP_X = 148;
  const DESKTOP_PAD_START = 180;
  const DESKTOP_PAD_END = 260;
  const DESKTOP_TOTAL_WIDTH =
    DESKTOP_PAD_START + (mapLevels.length - 1) * DESKTOP_GAP_X + DESKTOP_PAD_END;
  const DESKTOP_MAP_HEIGHT = 560;

  const desktopCoords = useMemo(() => {
    const yCenter = DESKTOP_MAP_HEIGHT / 2;
    const yAmplitude = 115;
    return mapLevels.map((lvl, idx) => {
      const x = DESKTOP_PAD_START + idx * DESKTOP_GAP_X;
      // Onda senoidal armónica
      const y = yCenter + Math.sin(idx * 0.92) * yAmplitude;
      return { level: lvl.level, x, y };
    });
  }, [mapLevels]);

  // Camino SVG Horizontal
  const desktopPathD = useMemo(() => {
    if (!desktopCoords.length) return "";
    return desktopCoords.reduce((acc, coord, i) => {
      if (i === 0) return `M ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`;
      const prev = desktopCoords[i - 1];
      const midX = ((prev.x + coord.x) / 2).toFixed(1);
      return `${acc} C ${midX} ${prev.y.toFixed(1)}, ${midX} ${coord.y.toFixed(1)}, ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`;
    }, "");
  }, [desktopCoords]);

  // Camino SVG Desbloqueado Horizontal (solo hasta el nivel alcanzado)
  const desktopUnlockedPathD = useMemo(() => {
    const unlockedCoords = desktopCoords.filter((c) => c.level <= unlockedLevel);
    if (unlockedCoords.length < 2) return "";
    return unlockedCoords.reduce((acc, coord, i) => {
      if (i === 0) return `M ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`;
      const prev = unlockedCoords[i - 1];
      const midX = ((prev.x + coord.x) / 2).toFixed(1);
      return `${acc} C ${midX} ${prev.y.toFixed(1)}, ${midX} ${coord.y.toFixed(1)}, ${coord.x.toFixed(1)} ${coord.y.toFixed(1)}`;
    }, "");
  }, [desktopCoords, unlockedLevel]);

  // ── 2. CÁLCULO DE COORDENADAS PARA MODO VERTICAL (MÓVIL) ──
  const MOBILE_LEVEL_GAP = 135;
  const MOBILE_TOTAL_HEIGHT = 320 + MOBILE_LEVEL_GAP * Math.max(1, mapLevels.length - 1);

  const mobileCoords = useMemo(() => {
    return mapLevels.map((lvl, idx) => {
      const t = idx / Math.max(1, mapLevels.length - 1);
      const y = MOBILE_TOTAL_HEIGHT - 160 - t * (MOBILE_TOTAL_HEIGHT - 320);
      const xPct = 50 + Math.sin(idx * 0.95) * 32;
      return { level: lvl.level, xPct, y };
    });
  }, [mapLevels, MOBILE_TOTAL_HEIGHT]);

  // Camino SVG Vertical
  const mobilePathD = useMemo(() => {
    if (!mobileCoords.length) return "";
    return mobileCoords.reduce((acc, coord, i) => {
      const x = (coord.xPct * 8).toFixed(1);
      const y = coord.y.toFixed(1);
      if (i === 0) return `M ${x} ${y}`;
      const prev = mobileCoords[i - 1];
      const prevX = (prev.xPct * 8).toFixed(1);
      const prevY = prev.y.toFixed(1);
      const midY = ((parseFloat(prevY) + parseFloat(y)) / 2).toFixed(1);
      return `${acc} C ${prevX} ${midY}, ${x} ${midY}, ${x} ${y}`;
    }, "");
  }, [mobileCoords]);

  // ── 3. SCROLL Y RUEDA DE RATÓN ──
  // Centrar scroll en el nivel actual del jugador al cargar o alternar vista
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const currentTargetLevel = Math.min(unlockedLevel, mapLevels.length);

    if (isDesktop) {
      const activeCoord = desktopCoords.find((c) => c.level === currentTargetLevel);
      if (activeCoord) {
        const clientW = scrollContainerRef.current.clientWidth || 1000;
        scrollContainerRef.current.scrollLeft = Math.max(0, activeCoord.x - clientW / 2);
      }
    } else {
      const activeCoord = mobileCoords.find((c) => c.level === currentTargetLevel);
      if (activeCoord) {
        const clientH = scrollContainerRef.current.clientHeight || 700;
        scrollContainerRef.current.scrollTop = Math.max(0, activeCoord.y - clientH / 2);
      }
    }
  }, [isDesktop, unlockedLevel, desktopCoords, mobileCoords, mapLevels.length]);

  // Scroll horizontal suave con rueda del ratón en escritorio
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || !isDesktop) return;

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.2;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [isDesktop]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -420, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 420, behavior: "smooth" });
    }
  };

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

  // ── BIOMAS DECORATIVOS ──
  const BIOMES = [
    { zone: 1, name: t("map.zone1"), color: "from-emerald-950/40 via-teal-900/30 to-transparent", border: "border-emerald-500/20", glow: "#10b981", xDesktop: 420, yMobile: MOBILE_TOTAL_HEIGHT - 260 },
    { zone: 2, name: t("map.zone2"), color: "from-cyan-950/40 via-blue-900/30 to-transparent", border: "border-cyan-500/20", glow: "#06b6d4", xDesktop: 1020, yMobile: MOBILE_TOTAL_HEIGHT - 880 },
    { zone: 3, name: t("map.zone3"), color: "from-indigo-950/40 via-violet-900/30 to-transparent", border: "border-indigo-500/20", glow: "#6366f1", xDesktop: 1620, yMobile: MOBILE_TOTAL_HEIGHT - 1520 },
    { zone: 4, name: t("map.zone4"), color: "from-amber-950/40 via-orange-900/30 to-transparent", border: "border-amber-500/20", glow: "#f59e0b", xDesktop: 2220, yMobile: MOBILE_TOTAL_HEIGHT - 2160 },
    { zone: 5, name: t("map.zone5"), color: "from-red-950/50 via-rose-900/40 to-transparent", border: "border-rose-500/30", glow: "#ef4444", xDesktop: 2820, yMobile: 160 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden select-none font-sans bg-radial from-[#132c54] via-[#091b38] to-[#040d1c]">
      {/* ── FONDO AMBIENTAL DE AVENTURA CON MALLA ESTELAR ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Luces auroras de ambiente */}
        <div className="absolute -top-32 left-1/4 w-[650px] h-[400px] bg-blue-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 w-[700px] h-[450px] bg-emerald-500/10 rounded-full blur-[160px]" />
        <div className="absolute -bottom-20 right-10 w-[500px] h-[400px] bg-amber-500/10 rounded-full blur-[150px]" />

        {/* Micro-cuadrícula sutil */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1.5px,transparent_1.5px)] [background-size:32px_32px]" />
      </div>

      {/* ── BARRA SUPERIOR FIJA DE NAVEGACIÓN Y PROGRESO ── */}
      <header className="absolute top-0 inset-x-0 z-40 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between bg-slate-950/80 border-b-2 border-slate-800/80 backdrop-blur-md shadow-xl">
        {/* Botón Volver a Carpetas */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBackToFolders}
            className="group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-arcade bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-arcade border-b-[var(--color-arcade-ink)] text-white shadow-btn-orange-flat active:translate-y-0.5 transition-all cursor-pointer"
            title={t("map.back_title")}
          >
            <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black uppercase tracking-wider hidden sm:inline">
              {t("map.back_btn")}
            </span>
          </button>
        </div>

        {/* Banner Central: Título del Mundo + Barra de Progreso */}
        <div className="flex flex-col items-center max-w-[240px] sm:max-w-md md:max-w-xl text-center">
          <div className="flex items-center gap-1.5">
            <Folder className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase text-amber-400 tracking-wider truncate">
              {folderName || t("map.world")}
            </span>
          </div>

          <h1 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
            {documentTitle || t("map.topic")}
          </h1>

          {/* Medidor de Progreso de Campaña y Estrellas */}
          <div className="mt-1 flex items-center gap-2 w-full max-w-xs sm:max-w-sm">
            <div className="flex-1 h-2 rounded-full bg-slate-800 border border-slate-700 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 rounded-full"
              />
            </div>
            <span className="text-[9px] font-black text-emerald-300 whitespace-nowrap">
              {unlockedLevel}/{mapLevels.length} ({progressPct}%)
            </span>
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-[9px] font-black text-amber-300">
              <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
              <span>{totalStars}/{maxStars}</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción (Orientación, Racha, Reinicio, Ayuda) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {studyStreak >= 2 && (
            <div
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-400/50 text-[10px] font-black text-orange-300 shadow-sm"
              title={t("map.streak_t", { count: studyStreak })}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>{studyStreak}d</span>
            </div>
          )}

          {/* Toggle manual Horizontal / Vertical */}
          <button
            type="button"
            onClick={() => setIsDesktop((prev) => !prev)}
            className="p-1.5 sm:p-2 rounded-arcade bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-arcade-sm border-b-[var(--color-arcade-ink)] text-slate-200 hover:text-white shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
            title={isDesktop ? "Cambiar a vista vertical móvil" : "Cambiar a vista horizontal escritorio"}
            aria-label="Alternar orientación"
          >
            {isDesktop ? (
              <Smartphone className="w-4 h-4 text-cyan-300" />
            ) : (
              <Monitor className="w-4 h-4 text-cyan-300" />
            )}
          </button>

          {onResetCampaign && unlockedLevel > 1 && (
            <button
              onClick={onResetCampaign}
              className="p-1.5 sm:p-2 rounded-arcade bg-[var(--color-arcade-navy)] hover:bg-rose-950/80 border-2 border-[var(--color-arcade-navy-light)] border-b-arcade-sm border-b-[var(--color-arcade-ink)] text-rose-300 shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
              title={t("map.reset_title")}
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {onOpenTutorial && (
            <button
              onClick={onOpenTutorial}
              className="p-1.5 sm:p-2 rounded-arcade bg-[var(--color-arcade-navy)] hover:bg-[var(--color-arcade-navy-hover)] border-2 border-[var(--color-arcade-navy-light)] border-b-arcade-sm border-b-[var(--color-arcade-ink)] text-amber-400 shadow-sm active:translate-y-0.5 transition-all cursor-pointer"
              title={t("map.how_to")}
            >
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </header>

      {/* ── BOTONES FLOTANTES DE NAVEGACIÓN EN ESCRITORIO (IZQ / DER) ── */}
      {isDesktop && (
        <>
          <button
            type="button"
            onClick={handleScrollLeft}
            aria-label="Desplazar a la izquierda"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border-2 border-slate-700/80 shadow-2xl flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all cursor-pointer group"
          >
            <ChevronLeft className="w-6 h-6 text-slate-300 group-hover:text-amber-400 transition-colors" />
          </button>

          <button
            type="button"
            onClick={handleScrollRight}
            aria-label="Desplazar a la derecha"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border-2 border-slate-700/80 shadow-2xl flex items-center justify-center backdrop-blur-md hover:scale-110 active:scale-95 transition-all cursor-pointer group"
          >
            <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-amber-400 transition-colors" />
          </button>
        </>
      )}

      {/* ── LIENZO PRINCIPAL DEL MAPA (HORIZONTAL EN DESKTOP / VERTICAL EN MÓVIL) ── */}
      <div
        ref={scrollContainerRef}
        className={`relative w-full h-full pt-16 pb-6 scroll-smooth ${
          isDesktop
            ? "overflow-x-auto overflow-y-hidden flex items-center"
            : "overflow-y-auto overflow-x-hidden"
        }`}
      >
        {isDesktop ? (
          /* ==========================================================
             A. MODO ESCRITORIO (HORIZONTAL PANORÁMICO DE IZQUIERDA A DERECHA)
             ========================================================== */
          <div
            className="relative h-[560px] my-auto"
            style={{ width: `${DESKTOP_TOTAL_WIDTH}px` }}
          >
            {/* SVG del Camino Horizontal */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${DESKTOP_TOTAL_WIDTH} ${DESKTOP_MAP_HEIGHT}`}
            >
              <defs>
                <filter id="roadShadowDesktop" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#020917" floodOpacity="0.85" />
                </filter>
                <linearGradient id="completedPathDesktop" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="60%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>

              {/* Sombra de la carretera */}
              <path
                d={desktopPathD}
                fill="none"
                stroke="#020917"
                strokeWidth="20"
                strokeLinecap="round"
                filter="url(#roadShadowDesktop)"
              />

              {/* Calzada de piedra base */}
              <path
                d={desktopPathD}
                fill="none"
                stroke="#172554"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Sendero punteado base */}
              <path
                d={desktopPathD}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="6"
                strokeDasharray="14 12"
                strokeLinecap="round"
                opacity="0.4"
              />

              {/* Tramo superado / desbloqueado brillante */}
              {desktopUnlockedPathD && (
                <path
                  d={desktopUnlockedPathD}
                  fill="none"
                  stroke="url(#completedPathDesktop)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                />
              )}
            </svg>

            {/* Islas de Biomas Horizontales de Fondo */}
            {BIOMES.map((b) => (
              <div
                key={b.zone}
                style={{
                  left: `${b.xDesktop}px`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
                className={`absolute w-[500px] h-72 rounded-[60px] bg-gradient-to-r ${b.color} border-2 ${b.border} blur-[1px] pointer-events-none flex flex-col items-center justify-between py-5 px-6 shadow-2xl`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300/40">
                  {b.name}
                </span>
                <div
                  className="w-24 h-1 rounded-full opacity-30"
                  style={{ backgroundColor: b.glow }}
                />
              </div>
            ))}

            {/* Nodos de Nivel en Horizontal */}
            {mapLevels.map((lvl) => {
              const coord = desktopCoords.find((c) => c.level === lvl.level);
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
                    left: `${coord.x}px`,
                    top: `${coord.y}px`,
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
                        initial={{ opacity: 0, y: 10, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.92 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full mb-3 pointer-events-none z-40 px-3 py-1.5 rounded-arcade bg-slate-900/95 border-2 border-slate-700 text-white shadow-2xl backdrop-blur-md flex flex-col items-center whitespace-nowrap"
                      >
                        <span className="text-[10px] font-black uppercase text-amber-400 tracking-wide">
                          {lvl.name || levelName(lvl, t)}
                        </span>
                        <span className="text-[9px] text-slate-300 font-medium">
                          {lvl.questions} {lvl.questions === 1 ? t("map.q_one") : t("map.q_many")}
                          {lvl.hasTraps && " · 💀 Trampas"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

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
                      className="absolute -top-16 z-30 flex flex-col items-center"
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
                    <div className="absolute -top-10 flex flex-col items-center text-[var(--color-arcade-yellow)] animate-bounce z-10">
                      <Crown className="w-8 h-8 fill-[var(--color-arcade-yellow)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]" />
                      <span className="text-[9px] font-black uppercase text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400 -mt-1 shadow-md whitespace-nowrap">
                        {t("map.boss")}
                      </span>
                    </div>
                  )}

                  {/* Distintivo de Cartas Trampa para niveles 3+ */}
                  {hasTraps && !isBoss && isUnlocked && (
                    <div
                      className="absolute -top-3 -right-2 z-10 p-1 rounded-full bg-rose-950 border border-rose-500 shadow-md"
                      title={t("map.traps_t", { count: lvl.trapCount })}
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
                          ? "bg-gradient-to-b from-[var(--color-arcade-orange)] via-[#ea580c] to-[#9a3412] border-[#ffedd5] shadow-[0_8px_0_#7c2d12,0_0_25px_rgba(249,115,22,0.9)] animate-pulse"
                          : hasTraps
                            ? "bg-gradient-to-b from-[var(--color-sky-400)] via-[#0284c7] to-[#0369a1] border-[#bae6fd] shadow-[0_6px_0_#075985,0_0_14px_rgba(56,189,248,0.6)]"
                            : "bg-gradient-to-b from-[#4ade80] via-[#16a34a] to-[#15803d] border-[#dcfce7] shadow-[0_6px_0_#166534,0_0_14px_rgba(74,222,128,0.6)]"
                    }`}
                  >
                    {/* Brillo especular superior 3D */}
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
        ) : (
          /* ==========================================================
             B. MODO MÓVIL (VERTICAL ASCENDENTE DE ABAJO HACIA ARRIBA)
             ========================================================== */
          <div
            className="relative w-full max-w-md mx-auto"
            style={{ height: `${MOBILE_TOTAL_HEIGHT}px` }}
          >
            {/* SVG del Camino Vertical */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 800 ${MOBILE_TOTAL_HEIGHT}`}
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="roadShadowMobile" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#020917" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Sombra de la carretera */}
              <path
                d={mobilePathD}
                fill="none"
                stroke="#020917"
                strokeWidth="16"
                strokeLinecap="round"
                filter="url(#roadShadowMobile)"
              />

              {/* Calzada base */}
              <path
                d={mobilePathD}
                fill="none"
                stroke="#172554"
                strokeWidth="12"
                strokeLinecap="round"
              />

              {/* Línea punteada blanca */}
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

            {/* Islas de Soporte Decorativas Verticales */}
            {BIOMES.map((b) => (
              <div
                key={b.zone}
                style={{ top: `${b.yMobile}px` }}
                className={`absolute left-1/2 -translate-x-1/2 w-[85%] max-w-sm h-24 rounded-full bg-gradient-to-b ${b.color} border-2 ${b.border} blur-xs pointer-events-none flex items-center justify-center`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300/40">
                  {b.name}
                </span>
              </div>
            ))}

            {/* Nodos de Nivel en Vertical */}
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
                      className="absolute -top-16 z-30 flex flex-col items-center"
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
                    <div className="absolute -top-9 flex flex-col items-center text-[var(--color-arcade-yellow)] animate-bounce z-10">
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
                      <span
                        className={`${
                          isBoss ? "text-2xl font-extrabold" : "text-lg font-black"
                        } font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
                      >
                        {lvl.level}
                      </span>
                    ) : (
                      <Lock className="w-5 h-5 text-slate-300 drop-shadow" />
                    )}
                  </motion.button>

                  {/* Etiqueta inferior */}
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
      </div>

      {/* ── POP-UP / MODAL DE MISIÓN DE NIVEL AL HACER CLIC EN UN BOTÓN ── */}
      <AnimatePresence>
        {selectedLevelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="relative w-full max-w-sm rounded-arcade-lg bg-[var(--color-arcade-navy)] border-4 border-[var(--color-arcade-navy-dark)] p-6 text-white shadow-[0_16px_0_var(--color-arcade-ink),0_25px_40px_rgba(0,0,0,0.8)] flex flex-col items-center text-center overflow-hidden"
            >
              {/* Glow decorativo */}
              <div
                className={`absolute -top-14 -right-14 w-36 h-36 ${
                  selectedLevelModal.isBoss
                    ? "bg-[var(--color-arcade-yellow)]/30"
                    : "bg-[var(--color-arcade-orange)]/20"
                } rounded-full blur-2xl pointer-events-none`}
              />

              {/* Botón cerrar X */}
              <button
                onClick={() => setSelectedLevelModal(null)}
                className="absolute top-3 right-3 p-1.5 rounded-arcade-sm bg-[var(--color-arcade-navy-dark)] hover:bg-[var(--color-arcade-navy-hover)] border border-[var(--color-arcade-navy-light)] text-slate-400 hover:text-white transition-colors cursor-pointer"
                aria-label={t("map.close_detail")}
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icono de Nivel / Jefe */}
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
                  <span className="text-3xl font-black">
                    {selectedLevelModal.level}
                  </span>
                )}
              </div>

              {/* Título de Nivel */}
              <div className="text-[10px] font-black uppercase text-[var(--color-arcade-yellow)] tracking-widest mb-0.5">
                {t("map.level_of", { level: selectedLevelModal.level, max: 20 })}
              </div>
              <h2 className="text-xl font-black text-white tracking-wide mb-2">
                {selectedLevelModal.name || levelName(selectedLevelModal, t)}
              </h2>

              {/* Descripción pedagógica */}
              <p className="text-xs text-slate-300 leading-relaxed mb-3 px-2">
                {selectedLevelModal.desc || levelDesc(selectedLevelModal, t)}
              </p>

              {/* Alerta de Cartas Trampa si aplica */}
              {selectedLevelModal.hasTraps && (
                <div className="w-full py-1.5 px-3 rounded-arcade-sm bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[10px] font-bold flex items-center justify-center gap-1.5 mb-3">
                  <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{t("map.trap_alert", { count: selectedLevelModal.trapCount })}</span>
                </div>
              )}

              {/* Alerta de Requisito de 2 Estrellas */}
              <div className="w-full py-1 px-2.5 rounded-arcade-sm bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[9.5px] font-bold flex items-center justify-center gap-1 mb-4">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span>{t("map.need_stars")}</span>
              </div>

              {/* Estadísticas del Nivel */}
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

              {/* Botón Acción: JUGAR AHORA Y ENTRAR AL TABLERO */}
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
