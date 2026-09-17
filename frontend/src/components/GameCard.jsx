import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getDomainIcon, DOMAIN_ICONS } from '../utils/domainIcons';

// Definir THEME_STYLES fuera del componente para evitar TDZ (Temporal Dead Zone) y recreación en cada render
const THEME_STYLES = {
  red: {
    border: 'border-rose-500',
    bg: 'bg-gradient-to-b from-rose-600 to-rose-700',
    badgeBg: 'bg-rose-950 text-rose-200 border-rose-400',
    footerBg: 'bg-[#1b253b] text-rose-200',
    glow: 'shadow-[0_4px_18px_rgba(244,63,94,0.5)]',
    accentTag: 'bg-rose-900/80 text-rose-300 border-rose-500/60'
  },
  blue: {
    border: 'border-cyan-400',
    bg: 'bg-gradient-to-b from-cyan-600 to-blue-700',
    badgeBg: 'bg-cyan-950 text-cyan-200 border-cyan-400',
    footerBg: 'bg-[#1b253b] text-cyan-200',
    glow: 'shadow-[0_4px_18px_rgba(34,211,238,0.5)]',
    accentTag: 'bg-cyan-900/80 text-cyan-300 border-cyan-500/60'
  },
  purple: {
    border: 'border-purple-400',
    bg: 'bg-gradient-to-b from-indigo-700 to-purple-800',
    badgeBg: 'bg-purple-950 text-purple-200 border-purple-400',
    footerBg: 'bg-[#1b253b] text-purple-200',
    glow: 'shadow-[0_4px_18px_rgba(168,85,247,0.5)]',
    accentTag: 'bg-purple-900/80 text-purple-300 border-purple-500/60'
  },
  emerald: {
    border: 'border-emerald-400',
    bg: 'bg-gradient-to-b from-emerald-600 to-teal-800',
    badgeBg: 'bg-emerald-950 text-emerald-200 border-emerald-400',
    footerBg: 'bg-[#1b253b] text-emerald-200',
    glow: 'shadow-[0_4px_18px_rgba(52,211,153,0.5)]',
    accentTag: 'bg-emerald-900/80 text-emerald-300 border-emerald-500/60'
  },
  yellow: {
    border: 'border-amber-400',
    bg: 'bg-gradient-to-b from-amber-500 to-yellow-600',
    badgeBg: 'bg-amber-950 text-amber-200 border-amber-400',
    footerBg: 'bg-[#1b253b] text-amber-200',
    glow: 'shadow-[0_4px_18px_rgba(251,191,36,0.5)]',
    accentTag: 'bg-amber-900/80 text-amber-300 border-amber-500/60'
  }
};

export default function GameCard({ 
  id, 
  name, 
  cost = "+1", 
  type = "red", // "red" | "blue" | "purple" | "emerald" | "yellow"
  sourceType = "document", 
  domain = "", // ej: 'derecho', 'contaduria', 'finanzas', 'tecnologia', 'medicina'
  rotation = 0,
  zIndex = 10,
  isDraggable = true,
  onDragEnd,
  className = ""
}) {
  // Ícono contextual dinámico según el área de conocimiento o tipo de archivo
  const IconComponent = getDomainIcon(domain || name) || DOMAIN_ICONS[sourceType] || Sparkles;

  // Etiqueta semántica de dominio
  const domainTag = (domain || sourceType || 'CONCEPTO').toUpperCase();

  // Estilo temático seguro (con fallback directo)
  const currentTheme = THEME_STYLES[type] || THEME_STYLES.red;

  return (
    <motion.div
      drag={isDraggable}
      dragSnapToOrigin={true}
      dragElastic={0.2}
      whileHover={{ scale: 1.15, y: -32, zIndex: 70 }}
      whileDrag={{ 
        scale: 0.55, 
        zIndex: 100,
        opacity: 0.9,
        boxShadow: '0 0 25px rgba(34, 211, 238, 0.9)' 
      }}
      style={{
        rotate: `${rotation}deg`,
        zIndex: zIndex,
      }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      onDragEnd={(e, info) => {
        if (onDragEnd) onDragEnd(id, info);
      }}
      className={`relative w-28 sm:w-32 h-44 sm:h-52 rounded-2xl border-2 ${currentTheme.border} ${currentTheme.glow} cursor-grab active:cursor-grabbing select-none flex flex-col justify-between p-2 bg-[#12192a] ${className}`}
    >
      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-yellow-400 border border-slate-900 rounded-sm" />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 border border-slate-900 rounded-sm" />

      {/* Cabecera con Etiqueta de Área (ej. DERECHO, CONTADURÍA, FINANZAS) */}
      <div className="flex items-center justify-between">
        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${currentTheme.accentTag} font-mono truncate max-w-[70px]`}>
          {domainTag}
        </span>
        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${currentTheme.badgeBg} tracking-wider font-mono`}>
          {cost}
        </span>
      </div>

      {/* Cuerpo central con Icono del Área (Balanza, Calculadora, Dólar, etc.) */}
      <div className={`w-full h-24 sm:h-28 rounded-xl ${currentTheme.bg} flex flex-col items-center justify-center p-2 border border-white/20 shadow-inner relative overflow-hidden group`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
        
        <div className="relative p-2.5 rounded-2xl bg-black/30 border border-white/20 shadow-md backdrop-blur-sm">
          <IconComponent className="w-8 h-8 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]" />
        </div>
        
        <div className="w-full mt-2 space-y-1 z-10">
          <div className="h-1 bg-white/40 rounded-full w-3/4 mx-auto" />
          <div className="h-1 bg-white/20 rounded-full w-1/2 mx-auto" />
        </div>
      </div>

      {/* Pie de carta con nombre del concepto */}
      <div className={`w-full py-1.5 px-2 rounded-xl ${currentTheme.footerBg} border border-slate-700/80 flex items-center justify-center shadow-md`}>
        <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-center truncate uppercase">
          {name}
        </span>
      </div>
    </motion.div>
  );
}
