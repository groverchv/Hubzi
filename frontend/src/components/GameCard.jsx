import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { getDomainIcon, DOMAIN_ICONS } from '../utils/domainIcons';

// Definir THEME_STYLES fuera del componente para evitar TDZ (Temporal Dead Zone) y recreación en cada render
// Paleta fuerte, profesional y calmante: colores sólidos sobre fondo pizarra azulada
const THEME_STYLES = {
  red: {
    border: 'border-rose-500/80',
    bg: 'bg-gradient-to-b from-rose-950/80 to-slate-900',
    badgeBg: 'bg-rose-950 text-rose-300 border-rose-500/50',
    footerBg: 'bg-slate-900 text-rose-200',
    glow: 'shadow-[0_4px_18px_-2px_rgba(244,63,94,0.35)]',
    accentTag: 'bg-rose-950/90 text-rose-300 border-rose-500/50'
  },
  blue: {
    border: 'border-sky-500/80',
    bg: 'bg-gradient-to-b from-sky-950/80 to-slate-900',
    badgeBg: 'bg-sky-950 text-sky-300 border-sky-500/50',
    footerBg: 'bg-slate-900 text-sky-200',
    glow: 'shadow-[0_4px_18px_-2px_rgba(14,165,233,0.35)]',
    accentTag: 'bg-sky-950/90 text-sky-300 border-sky-500/50'
  },
  purple: {
    border: 'border-purple-500/80',
    bg: 'bg-gradient-to-b from-purple-950/80 to-slate-900',
    badgeBg: 'bg-purple-950 text-purple-300 border-purple-500/50',
    footerBg: 'bg-slate-900 text-purple-200',
    glow: 'shadow-[0_4px_18px_-2px_rgba(168,85,247,0.35)]',
    accentTag: 'bg-purple-950/90 text-purple-300 border-purple-500/50'
  },
  emerald: {
    border: 'border-emerald-500/80',
    bg: 'bg-gradient-to-b from-emerald-950/80 to-slate-900',
    badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/50',
    footerBg: 'bg-slate-900 text-emerald-200',
    glow: 'shadow-[0_4px_18px_-2px_rgba(16,185,129,0.35)]',
    accentTag: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
  },
  yellow: {
    border: 'border-amber-500/80',
    bg: 'bg-gradient-to-b from-amber-950/80 to-slate-900',
    badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/50',
    footerBg: 'bg-slate-900 text-amber-200',
    glow: 'shadow-[0_4px_18px_-2px_rgba(245,158,11,0.35)]',
    accentTag: 'bg-amber-950/90 text-amber-300 border-amber-500/50'
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
  onClick,
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
      onTap={(e) => {
        if (onClick) onClick(id);
      }}
      onDragEnd={(e, info) => {
        if (onDragEnd) onDragEnd(id, info);
      }}
      className={`relative w-28 sm:w-32 h-44 sm:h-52 rounded-2xl border-2 ${currentTheme.border} ${currentTheme.glow} cursor-grab active:cursor-grabbing select-none flex flex-col justify-between p-2 bg-[#0f172a] ${className}`}
    >
      <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-amber-400 border border-slate-900 rounded-sm shadow-xs" />
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border border-slate-900 rounded-sm shadow-xs" />

      {/* Cabecera con Etiqueta de Área (ej. DERECHO, CONTADURÍA, FINANZAS) */}
      <div className="flex items-center justify-between">
        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${currentTheme.accentTag} font-mono truncate max-w-[70px]`}>
          {domainTag}
        </span>
        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md border ${currentTheme.badgeBg} tracking-wider font-mono`}>
          {cost}
        </span>
      </div>

      {/* Cuerpo central con Icono del Área (Balanza, Calculadora, Dólar, etc.) */}
      <div className={`w-full h-24 sm:h-28 rounded-xl ${currentTheme.bg} flex flex-col items-center justify-center p-2 border border-slate-700/50 shadow-inner relative overflow-hidden group`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />
        
        <div className="relative p-2.5 rounded-2xl bg-slate-950/70 border border-white/10 shadow-sm backdrop-blur-sm">
          <IconComponent className="w-8 h-8 text-white drop-shadow-xs" />
        </div>
        
        <div className="w-full mt-2 space-y-1 z-10">
          <div className="h-1 bg-white/30 rounded-full w-3/4 mx-auto" />
          <div className="h-1 bg-white/15 rounded-full w-1/2 mx-auto" />
        </div>
      </div>

      {/* Pie de carta con nombre del concepto */}
      <div className={`w-full py-1.5 px-2 rounded-xl ${currentTheme.footerBg} border border-slate-700/80 flex items-center justify-center shadow-xs`}>
        <span className="text-[10px] sm:text-[11px] font-bold tracking-tight text-center truncate uppercase text-slate-100">
          {name}
        </span>
      </div>
    </motion.div>
  );
}
