import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Lock,
  Play,
  Folder,
  Crown,
  Skull,
  Swords,
  X,
  Compass,
  Package,
  BookOpen,
} from "lucide-react";
import capyEscolar from "../assets/mascots/capy_escolar_nino_m.webp";
import { useTranslation } from "react-i18next";
import { levelName, levelDesc } from "../utils/gameConfig";
import { getLevelNodeA11y, BIOME_DESCRIPTIONS } from "../utils/a11yDescriptions";
import A11yControls from "./A11yControls";

/**
 * Coordenadas fijas en porcentajes para los 20 niveles sobre la Isla 2.5D
 * Guiadas exactamente por el mockup Santuario Capibara (media_1795279239558_48935ac0.jpg)
 */
const ISLAND_COORDS = [
  // ── BIOMA 1: PLAYA DE LOS APUNTES (Niveles 1 a 5) ──
  { level: 1, x: 50.0, y: 84.5, biome: 'beach' },
  { level: 2, x: 37.5, y: 76.5, biome: 'beach' },
  { level: 3, x: 42.5, y: 70.8, biome: 'beach' },
  { level: 4, x: 50.0, y: 70.8, biome: 'beach' },
  { level: 5, x: 59.5, y: 74.2, biome: 'beach' },

  // ── BIOMA 2: BOSQUE DE BAMBÚ (Niveles 6 a 10) ──
  { level: 6, x: 62.5, y: 65.5, biome: 'bamboo' },
  { level: 7, x: 57.0, y: 60.5, biome: 'bamboo' },
  { level: 8, x: 54.0, y: 56.5, biome: 'bamboo' },
  { level: 9, x: 52.5, y: 53.5, biome: 'bamboo' },
  { level: 10, x: 48.0, y: 50.0, biome: 'bamboo' },

  // ── BIOMA 3: AGUAS TERMALES ZEN (Niveles 11 a 15) ──
  { level: 11, x: 44.0, y: 46.5, biome: 'springs' },
  { level: 12, x: 40.0, y: 42.5, biome: 'springs' },
  { level: 13, x: 38.5, y: 36.5, biome: 'springs' },
  { level: 14, x: 41.5, y: 30.8, biome: 'springs' },
  { level: 15, x: 45.5, y: 26.5, biome: 'springs' },

  // ── BIOMA 4: CUMBRE DEL TEMPLO BOSS (Niveles 16 a 20) ──
  { level: 16, x: 49.0, y: 24.0, biome: 'temple' },
  { level: 17, x: 53.0, y: 22.5, biome: 'temple' },
  { level: 18, x: 55.0, y: 19.5, biome: 'temple' },
  { level: 19, x: 53.5, y: 16.5, biome: 'temple' },
  { level: 20, x: 54.0, y: 12.8, biome: 'temple', isBoss: true },
];

export default function AdventureMap({
  folderName = null,
  documentTitle = null,
  levels = [],
  unlockedLevel = 1,
  levelStars = {},
  onSelectLevel,
  onBackToFolders,
  onOpenTutorial,
  onOpenLegal,
  studyStreak = 0,
}) {
  const { t } = useTranslation();
  const [selectedLevelModal, setSelectedLevelModal] = useState(null);

  // Generar datos de los 20 niveles
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
            name: null,
            questions: lvl,
            hasTraps,
            trapCount: hasTraps ? trapCount : 0,
            isBoss,
            desc: null,
          };
        });

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

  // Construir el sendero continuo en SVG que une los 20 niveles
  const pathD = ISLAND_COORDS.reduce((acc, coord, i) => {
    const x = coord.x * 10;
    const y = coord.y * 10;
    if (i === 0) return `M ${x} ${y}`;
    const prev = ISLAND_COORDS[i - 1];
    const prevX = prev.x * 10;
    const prevY = prev.y * 10;
    const midX = (prevX + x) / 2;
    const midY = (prevY + y) / 2;
    return `${acc} Q ${midX} ${prevY}, ${x} ${y}`;
  }, "");

  const activeLevelCoord = ISLAND_COORDS.find((c) => c.level === Math.min(unlockedLevel, 20)) || ISLAND_COORDS[0];

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden select-none font-sans bg-gradient-to-b from-[#78C2C4] via-[#85CDCF] to-[#A8DADC]">
      
      {/* ── MAR Y OLAS ESTILIZADAS EN MOVIMIENTO SUAVE ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Cielo superior con nubes esponjosas */}
        <div className="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#D8F0F2] via-[#E2F5F6] to-transparent">
          <div className="absolute top-6 left-[8%] w-36 h-12 bg-white/75 rounded-full blur-[1px]" />
          <div className="absolute top-4 left-[12%] w-18 h-18 bg-white/75 rounded-full blur-[1px]" />
          <div className="absolute top-10 right-[10%] w-44 h-14 bg-white/75 rounded-full blur-[1px]" />
          <div className="absolute top-6 right-[14%] w-22 h-22 bg-white/75 rounded-full blur-[1px]" />
        </div>

        {/* Olas decorativas en el mar */}
        <svg
          className="absolute inset-0 w-full h-full text-white/20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <pattern id="waves-pattern" width="120" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M0 20 Q 30 10, 60 20 T 120 20"
              fill="none"
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </pattern>
          <rect width="100%" height="100%" fill="url(#waves-pattern)" />
        </svg>

        {/* Efecto de vapor termal ascendente en CSS */}
        <style>{`
          @keyframes steamFlow {
            0% { transform: translateY(0) scale(0.9); opacity: 0; }
            50% { opacity: 0.65; }
            100% { transform: translateY(-35px) scale(1.3); opacity: 0; }
          }
          .steam-particle {
            animation: steamFlow 3.6s ease-out infinite;
          }
        `}</style>
      </div>

      {/* ── HUD SUPERIOR GLASSMÓRFICO CÁLIDO (PÍLDORAS CREMA #FAF6EE) ── */}
      <header className="absolute top-0 inset-x-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between pointer-events-none">
        {/* Izquierda: Logo Hubzi + Campaña + Baúles + Modo Zen */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Logo HUBZI */}
          <div className="hud-capsule-cozy px-4 py-2 font-['Fredoka'] text-base sm:text-lg font-black tracking-wide text-[#1E2F3A] bg-[#FAF6EE] border border-[#E6DEC8] shadow-sm rounded-full">
            HUBZI
          </div>

          {/* Contador de Campaña: X / 20 Niveles */}
          <div className="hud-capsule-cozy hidden md:flex items-center gap-2 px-4 py-2 font-['Fredoka'] text-xs sm:text-sm font-bold text-[#1E2F3A] bg-[#FAF6EE] border border-[#E6DEC8] shadow-sm rounded-full">
            <span>Campaña: {Math.min(unlockedLevel, 20)}/20 Niveles</span>
          </div>

          {/* Baúles */}
          <button
            type="button"
            onClick={onBackToFolders}
            className="hud-capsule-cozy flex items-center gap-1.5 px-3.5 py-2 font-['Fredoka'] text-xs sm:text-sm font-bold text-[#1E2F3A] bg-[#FAF6EE] hover:bg-[#F2EBD9] border border-[#E6DEC8] shadow-sm rounded-full cursor-pointer transition-colors"
            title="Abrir baúles de estudio"
          >
            <Package className="w-4 h-4 text-[#F58A29]" />
            <span className="hidden sm:inline">Baúles</span>
          </button>

          {/* Modo Zen (Lavanda Exclusivo) */}
          <a
            href="/zen"
            className="hud-capsule-cozy flex items-center gap-1.5 px-4 py-2 font-['Fredoka'] text-xs sm:text-sm font-bold text-[#6D58D6] bg-[#EDE9FE] hover:bg-[#E2DBFC] border border-[#D8D0F8] shadow-sm rounded-full cursor-pointer transition-colors"
          >
            <span>🌙</span>
            <span className="hidden sm:inline">Modo Zen</span>
          </a>
        </div>

        {/* Derecha: Mapa + Ajustes A11y + Carpetas */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Botón Mapa */}
          <div className="hud-capsule-cozy hidden sm:flex items-center gap-1.5 px-3.5 py-2 font-['Fredoka'] text-xs sm:text-sm font-bold text-[#1E2F3A] bg-[#FAF6EE] border border-[#E6DEC8] shadow-sm rounded-full">
            <Compass className="w-4 h-4 text-[#2F8F6B]" />
            <span>MAPA</span>
          </div>

          {/* Accesibilidad A11y */}
          <A11yControls />

          {/* Botón Carpetas */}
          <button
            type="button"
            onClick={onBackToFolders}
            className="hud-capsule-cozy flex items-center gap-1.5 px-4 py-2 font-['Fredoka'] text-xs sm:text-sm font-bold text-[#1E2F3A] bg-[#FAF6EE] hover:bg-[#F2EBD9] border border-[#E6DEC8] shadow-sm rounded-full cursor-pointer transition-colors"
          >
            <Folder className="w-4 h-4 text-[#F58A29]" />
            <span className="hidden sm:inline">CARPETAS</span>
          </button>
        </div>
      </header>

      {/* ── PÍLDORA LATERAL IZQUIERDA: TÉRMINOS & LEGAL ── */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-30 hidden sm:block">
        <button
          type="button"
          onClick={() => onOpenLegal && onOpenLegal('terms')}
          className="hud-capsule-cozy flex flex-col items-center gap-1 px-3 py-3 bg-[#FAF6EE] hover:bg-[#F2EBD9] border border-[#E6DEC8] shadow-md rounded-2xl cursor-pointer text-[#1E2F3A] transition-all"
        >
          <BookOpen className="w-5 h-5 text-[#F58A29]" />
          <span className="text-[9px] font-black uppercase font-['Fredoka'] tracking-wider leading-tight text-center">
            Términos<br />& Legal
          </span>
        </button>
      </div>

      {/* ── ESCENARIO CENTRAL: ISLA FLOTANTE DE AVENTURA 2.5D (4 BIOMAS) ── */}
      <main className="relative w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden">
        {/* Contenedor responsivo con relación de aspecto que escala la isla y nodos */}
        <div className="relative w-full max-w-4xl h-[86dvh] max-h-[820px] flex items-center justify-center">
          
          {/* LIENZO DE LA ISLA ILUSTRADA EN SVG 2.5D */}
          <svg
            viewBox="0 0 1000 1000"
            className="w-full h-full object-contain filter drop-shadow-[0_20px_35px_rgba(20,55,70,0.3)] select-none pointer-events-none"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Gradiente de arena playa */}
              <linearGradient id="beachGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F9E8B8" />
                <stop offset="100%" stopColor="#E5C784" />
              </linearGradient>

              {/* Gradiente de pasto salvia / bosque */}
              <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8AC696" />
                <stop offset="60%" stopColor="#55996D" />
                <stop offset="100%" stopColor="#2F8F6B" />
              </linearGradient>

              {/* Gradiente de montaña rocosa */}
              <linearGradient id="rockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A88B74" />
                <stop offset="50%" stopColor="#846853" />
                <stop offset="100%" stopColor="#5E4332" />
              </linearGradient>

              {/* Gradiente de aguas termales */}
              <radialGradient id="hotSpringGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#D5F7F6" />
                <stop offset="65%" stopColor="#8AE4E2" />
                <stop offset="100%" stopColor="#57BCBA" />
              </radialGradient>

              {/* Gradiente de techo de templo boss */}
              <linearGradient id="templeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FDE68A" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>

            {/* Sombra de la isla sobre el agua */}
            <ellipse cx="500" cy="880" rx="360" ry="60" fill="rgba(24, 76, 92, 0.22)" />

            {/* Capa de orilla de arena cálida (Niveles 1 a 5) */}
            <path
              d="M 230,760 C 200,840 320,910 500,910 C 680,910 800,840 760,760 C 720,680 620,680 500,680 C 380,680 260,680 230,760 Z"
              fill="url(#beachGrad)"
              stroke="#D3AE69"
              strokeWidth="4"
            />

            {/* Palmeras y conchas en la playa */}
            <g id="beach-details">
              {/* Palmera izquierda */}
              <path d="M 290,780 Q 285,730 310,700" stroke="#7A5638" strokeWidth="6" fill="none" strokeLinecap="round" />
              <circle cx="310" cy="695" r="16" fill="#4E9966" />
              <circle cx="295" cy="698" r="14" fill="#3D7E54" />
              <circle cx="325" cy="698" r="14" fill="#5FAD77" />

              {/* Palmera derecha */}
              <path d="M 580,870 Q 585,820 605,790" stroke="#7A5638" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="605" cy="785" r="14" fill="#4E9966" />
              <circle cx="590" cy="788" r="12" fill="#3D7E54" />
              <circle cx="620" cy="788" r="12" fill="#5FAD77" />

              {/* Pequeño cofre del tesoro */}
              <rect x="450" y="780" width="22" height="16" rx="3" fill="#8C5C38" stroke="#5E381C" strokeWidth="2" />
              <rect x="458" y="786" width="6" height="5" rx="1" fill="#F4B942" />

              {/* Estrellas de mar */}
              <text x="445" y="805" fontSize="16">⭐</text>
              <text x="350" y="810" fontSize="14">🐚</text>
            </g>

            {/* Capa de roca central y mesetas de la montaña */}
            <path
              d="M 280,720 C 260,600 320,400 440,240 C 470,200 530,200 560,240 C 680,400 740,600 710,720 C 650,750 350,750 280,720 Z"
              fill="url(#rockGrad)"
              stroke="#4A3425"
              strokeWidth="4"
            />

            {/* Meseta de pasto y bosque de bambú (Izquierda, Niveles 6 a 10) */}
            <path
              d="M 280,700 C 270,580 340,480 430,460 C 470,540 430,650 380,710 Z"
              fill="url(#grassGrad)"
              stroke="#216347"
              strokeWidth="3"
            />
            {/* Cañas de bambú verdes estilizadas */}
            <g id="bamboo-grove" stroke="#2F8F6B" strokeWidth="4" strokeLinecap="round">
              <line x1="290" y1="620" x2="290" y2="520" />
              <line x1="305" y1="630" x2="305" y2="500" />
              <line x1="320" y1="615" x2="320" y2="480" />
              <line x1="335" y1="635" x2="335" y2="510" />
              <line x1="350" y1="625" x2="350" y2="495" />
              <line x1="365" y1="640" x2="365" y2="530" />
              <line x1="380" y1="630" x2="380" y2="520" />
              {/* Nudos de bambú */}
              <circle cx="305" cy="540" r="3" fill="#1F664B" />
              <circle cx="320" cy="520" r="3" fill="#1F664B" />
              <circle cx="335" cy="550" r="3" fill="#1F664B" />
              <circle cx="350" cy="535" r="3" fill="#1F664B" />
            </g>

            {/* Poza de Aguas Termales Zen (Centro, Niveles 11 a 15) */}
            <g id="zen-hot-springs">
              {/* Borde de piedras zen alrededor de la poza */}
              <ellipse cx="560" cy="390" rx="95" ry="55" fill="#756253" stroke="#4F4035" strokeWidth="4" />
              {/* Espejo de agua termal turquesa */}
              <ellipse cx="560" cy="390" rx="82" ry="44" fill="url(#hotSpringGrad)" />
              {/* Piedras zen redondeadas */}
              <ellipse cx="490" cy="410" rx="14" ry="9" fill="#526673" />
              <ellipse cx="580" cy="435" rx="18" ry="11" fill="#475569" />
              <ellipse cx="640" cy="415" rx="12" ry="8" fill="#64748B" />
            </g>

            {/* Cumbre del Templo Boss (Nivel 20) */}
            <g id="boss-temple" transform="translate(480, 105)">
              {/* Resplandor áurico del templo */}
              <circle cx="50" cy="40" r="60" fill="rgba(245, 158, 11, 0.25)" filter="blur(8px)" />
              {/* Base de piedra del templo */}
              <rect x="25" y="55" width="50" height="20" rx="3" fill="#6B7280" stroke="#374151" strokeWidth="2" />
              {/* Columnas */}
              <rect x="32" y="32" width="6" height="24" fill="#B45309" />
              <rect x="62" y="32" width="6" height="24" fill="#B45309" />
              {/* Techo curvado de pagoda tradicional dorada */}
              <path
                d="M 10,32 Q 50,15 90,32 L 80,24 Q 50,5 20,24 Z"
                fill="url(#templeGrad)"
                stroke="#78350F"
                strokeWidth="2"
              />
              {/* Linterna dorada en el centro */}
              <circle cx="50" cy="44" r="7" fill="#FDE68A" />
              <text x="44" y="48" fontSize="11">☀️</text>
            </g>

            {/* SENDERO ORGÁNICO DE PIEDRA SERPENTEANTE */}
            <g id="stone-path">
              {/* Sombra base del sendero */}
              <path
                d={pathD}
                fill="none"
                stroke="#6B533E"
                strokeWidth="36"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Superficie de piedra clara */}
              <path
                d={pathD}
                fill="none"
                stroke="#FAF6EE"
                strokeWidth="28"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Línea central punteada de adoquines */}
              <path
                d={pathD}
                fill="none"
                stroke="#D5CBB3"
                strokeWidth="18"
                strokeDasharray="6 14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </svg>

          {/* PARTÍCULAS CSS DE VAPOR ASCENDENTE EN LAS AGUAS TERMALES */}
          <div className="absolute top-[34%] left-[50%] pointer-events-none z-10 flex gap-4">
            <div className="steam-particle w-6 h-6 rounded-full bg-white/70 blur-[3px]" />
            <div className="steam-particle w-8 h-8 rounded-full bg-white/60 blur-[4px]" style={{ animationDelay: '1.2s' }} />
            <div className="steam-particle w-5 h-5 rounded-full bg-white/65 blur-[3px]" style={{ animationDelay: '2.4s' }} />
          </div>

          {/* ── RENDERIZADO DE LOS 20 NODOS DE NIVEL TÁCTILES ── */}
          {mapLevels.map((lvl) => {
            const coord = ISLAND_COORDS.find((c) => c.level === lvl.level);
            if (!coord) return null;

            const isUnlocked = lvl.level <= unlockedLevel;
            const isCurrent = lvl.level === unlockedLevel;
            const isBoss = lvl.isBoss || lvl.level === 20;
            const stars = levelStars[lvl.level] || 0;

            return (
              <div
                key={lvl.level}
                style={{
                  left: `${coord.x}%`,
                  top: `${coord.y}%`,
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center cursor-pointer"
                onClick={() => handleNodeClick(lvl)}
                role="button"
                tabIndex={0}
                aria-label={getLevelNodeA11y({
                  number: lvl.level,
                  status: isCurrent ? 'current' : isUnlocked ? 'completed' : 'locked',
                  stars,
                  questionCount: lvl.questions,
                  isBoss
                })}
              >
                {/* AVATAR DE HUBZI DE PIE SOBRE EL NIVEL ACTUAL */}
                {isCurrent && (
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="absolute -top-14 sm:-top-16 z-30 flex flex-col items-center pointer-events-none"
                  >
                    {/* Capibara con base dorada de juego */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                      <img
                        src={capyEscolar}
                        alt="Hubzi aquí"
                        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
                      />
                    </div>
                    {/* Anillo de pulso activo */}
                    <div className="w-10 h-3 -mt-2 bg-[#F58A29] rounded-full border-2 border-white shadow-lg animate-pulse" />
                  </motion.div>
                )}

                {/* CORONA DEL JEFE FINAL (NIVEL 20) */}
                {isBoss && (
                  <div className="absolute -top-8 z-10 flex items-center justify-center animate-bounce">
                    <Crown className="w-7 h-7 text-[#F4B942] fill-[#F4B942] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                  </div>
                )}

                {/* ESTRELLAS DORADAS ⭐ SOBRE NIVELES COMPLETADOS */}
                {isUnlocked && !isCurrent && (
                  <div className="flex items-center gap-0.5 -mb-1 z-10 bg-[#FAF6EE]/90 px-1.5 py-0.2 rounded-full border border-[#E6DEC8] shadow-xs">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                          s <= stars
                            ? "text-[#F4B942] fill-[#F4B942]"
                            : "text-[#B8B2A6] fill-[#E6DEC8]"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* BOTÓN CIRCULAR TÁCTIL 3D DEL NODO */}
                <motion.div
                  whileHover={isUnlocked ? { scale: 1.15 } : {}}
                  whileTap={isUnlocked ? { scale: 0.95 } : {}}
                  className={`relative flex items-center justify-center rounded-full font-['Fredoka'] font-black shadow-md transition-all ${
                    isBoss
                      ? "w-14 h-14 sm:w-16 sm:h-16 text-xl sm:text-2xl bg-gradient-to-b from-[#F58A29] to-[#C96812] text-white border-2 border-[#FDE68A] border-b-4 border-b-[#8C3B00] shadow-lg"
                      : isCurrent
                        ? "w-12 h-12 sm:w-14 sm:h-14 text-lg sm:text-xl bg-[#F58A29] text-white border-2 border-white border-b-4 border-b-[#C96812] ring-4 ring-[#F58A29]/30"
                        : isUnlocked
                          ? "w-11 h-11 sm:w-13 sm:h-13 text-base sm:text-lg bg-[#2F8F6B] text-white border-2 border-[#E8F5F0] border-b-4 border-b-[#1F664B]"
                          : "w-10 h-10 sm:w-12 sm:h-12 text-sm sm:text-base bg-[#B8B2A6] text-[#716B61] border-2 border-[#FAF6EE] border-b-4 border-b-[#948E82]"
                  }`}
                >
                  {isUnlocked ? (
                    <span>{lvl.level}</span>
                  ) : (
                    <Lock className="w-4 h-4 text-[#716B61]" />
                  )}
                </motion.div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ── MODAL COZY AL TOCAR UN NODO DE NIVEL ── */}
      <AnimatePresence>
        {selectedLevelModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E2F3A]/60 backdrop-blur-sm"
            onClick={() => setSelectedLevelModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl bg-[#FAF6EE] border-2 border-[#E6DEC8] p-6 shadow-2xl flex flex-col items-center text-center text-[#1E2F3A]"
            >
              {/* Botón Cerrar */}
              <button
                type="button"
                onClick={() => setSelectedLevelModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2EBD9] hover:bg-[#E6DEC8] text-[#1E2F3A] flex items-center justify-center cursor-pointer transition-colors"
                aria-label="Cerrar modal de nivel"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icono / Distintivo */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-['Fredoka'] font-black text-2xl text-white shadow-md mb-3 ${
                  selectedLevelModal.isBoss
                    ? "bg-[#F58A29] border-b-4 border-[#C96812]"
                    : "bg-[#2F8F6B] border-b-4 border-[#1F664B]"
                }`}
              >
                {selectedLevelModal.isBoss ? (
                  <Crown className="w-9 h-9 fill-[#F4B942]" />
                ) : (
                  <span>{selectedLevelModal.level}</span>
                )}
              </div>

              {/* Título de Nivel */}
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#F58A29] font-['Fredoka'] mb-1">
                Nivel {selectedLevelModal.level} de 20
              </div>
              <h2 className="text-xl font-bold font-['Fredoka'] text-[#1E2F3A] mb-2">
                {selectedLevelModal.name || levelName(selectedLevelModal, t)}
              </h2>

              {/* Descripción */}
              <p className="text-xs text-[#526673] font-medium leading-relaxed mb-4 px-2">
                {selectedLevelModal.desc || levelDesc(selectedLevelModal, t)}
              </p>

              {/* Alerta de Carta Trampa si aplica */}
              {selectedLevelModal.hasTraps && (
                <div className="w-full py-1.5 px-3 rounded-full bg-[#EDE9FE] border border-[#D8D0F8] text-[#6D58D6] text-xs font-bold flex items-center justify-center gap-1.5 mb-3 font-['Fredoka']">
                  <Skull className="w-4 h-4 text-[#8C7AE6]" />
                  <span>Cuidado con las Cartas Trampa 💀</span>
                </div>
              )}

              {/* Botón de acción: Jugar Nivel */}
              <button
                type="button"
                onClick={handleStartGame}
                className="w-full btn-tactile-amber py-3.5 rounded-full text-base font-bold uppercase font-['Fredoka'] shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {selectedLevelModal.isBoss ? (
                  <Swords className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
                <span>{selectedLevelModal.isBoss ? "Batalla Final" : "Comenzar Nivel"}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
