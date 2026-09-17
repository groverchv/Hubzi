import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { getDomainIcon, DOMAIN_ICONS } from '../utils/domainIcons';

const ALL_COLOR_STYLES = {
  blue: {
    border: 'border-sky-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(14,165,233,0.4)]',
    bg: 'bg-slate-900',
    iconColor: 'text-sky-400',
    accent: 'bg-sky-500'
  },
  cyan: {
    border: 'border-cyan-400',
    glow: 'shadow-[0_4px_16px_-2px_rgba(34,211,238,0.4)]',
    bg: 'bg-slate-900',
    iconColor: 'text-cyan-400',
    accent: 'bg-cyan-500'
  },
  yellow: {
    border: 'border-amber-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(245,158,11,0.4)]',
    bg: 'bg-slate-900',
    iconColor: 'text-amber-400',
    accent: 'bg-amber-500'
  },
  purple: {
    border: 'border-purple-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(168,85,247,0.4)]',
    bg: 'bg-slate-900',
    iconColor: 'text-purple-400',
    accent: 'bg-purple-500'
  },
  emerald: {
    border: 'border-emerald-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(16,185,129,0.4)]',
    bg: 'bg-slate-900',
    iconColor: 'text-emerald-400',
    accent: 'bg-emerald-500'
  },
  rose: {
    border: 'border-rose-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(244,63,94,0.4)]',
    bg: 'bg-slate-900',
    iconColor: 'text-rose-400',
    accent: 'bg-rose-500'
  },
  indigo: {
    border: 'border-indigo-500',
    glow: 'shadow-[0_4px_16px_-2px_rgba(99,102,241,0.4)]',
    bg: 'bg-slate-900',
    iconColor: 'text-indigo-400',
    accent: 'bg-indigo-500'
  }
};

export default function ArcadeNode({ 
  id, 
  icon = "database", 
  color = "blue", // "blue" | "cyan" | "yellow" | "purple" | "emerald" | "rose" | "indigo"
  shape = "hexagon", // "hexagon" | "circle" | "squircle" | "diamond" | "pill" | "octagon"
  active = true,
  placedCard = null,
  isOver = false,
  label = "",
  domain = "",
  question = "",
  hint = "",
  style = {},
  onClick
}) {
  // Obtener el ícono dinámico según el área/concepto (Derecho, Finanzas, Contaduría, Tecnología, etc.)
  const IconComp = DOMAIN_ICONS[icon?.toLowerCase()] || getDomainIcon(domain || label || icon);

  const colorStyles = ALL_COLOR_STYLES[color] || ALL_COLOR_STYLES.blue;

  // Formas geométricas variadas aleatorias / dinámicas (círculos, esquinas biseladas, hexágonos redondeados, diamantes, cápsulas, etc.)
  const shapeClasses = {
    circle: 'rounded-full',
    squircle: 'rounded-3xl',
    diamond: 'rounded-xl rotate-45 scale-90',
    hexagon: 'rounded-2xl border-dashed',
    pill: 'rounded-full aspect-square',
    octagon: 'rounded-2xl',
    shield: 'rounded-b-3xl rounded-t-xl'
  }[shape] || 'rounded-2xl';

  return (
    <motion.div
      data-node-id={id}
      style={style}
      whileHover={{ scale: 1.18, zIndex: 30 }}
      whileTap={{ scale: 0.94 }}
      onClick={() => {
        if (onClick) onClick(id);
      }}
      className={`relative w-12 h-12 sm:w-14 sm:h-14 border-2 ${colorStyles.border} ${colorStyles.bg} ${colorStyles.glow} ${shapeClasses} flex items-center justify-center cursor-pointer transition-all duration-300 group backdrop-blur-sm ${
        isOver ? 'scale-110 ring-4 ring-emerald-300' : ''
      } ${placedCard ? 'ring-2 ring-emerald-400' : ''}`}
    >
      {/* Puntos de detalle sutil en esquinas */}
      <div className={`absolute -top-1 -left-1 w-1.5 h-1.5 rounded-full ${colorStyles.accent}`} />
      <div className={`absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full ${colorStyles.accent}`} />

      {/* Ícono dinámico del dominio (o check si está resuelto) */}
      {placedCard ? (
        <div className={shape === 'diamond' ? '-rotate-45' : ''}>
          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400 drop-shadow-sm" />
        </div>
      ) : (
        <div className={`relative flex items-center justify-center ${shape === 'diamond' ? '-rotate-45' : ''}`}>
          <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${colorStyles.iconColor} group-hover:scale-110 transition-transform`} />
          
          {/* Badge interactivo ? */}
          <span className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-600 text-slate-300 text-[8px] font-black flex items-center justify-center shadow-sm group-hover:border-emerald-400 group-hover:text-emerald-300 transition-colors">
            ?
          </span>
        </div>
      )}

      {/* Label inferior temático compacto */}
      {label && (
        <span 
          title={label}
          className={`absolute -bottom-4 z-20 max-w-[105px] truncate text-[8.5px] font-medium text-slate-200 px-1.5 py-0.5 rounded bg-slate-900/95 border border-slate-700 shadow-md pointer-events-none transition-all group-hover:max-w-none group-hover:z-50 ${
            shape === 'diamond' ? '-rotate-45 -bottom-6' : ''
          }`}
        >
          {label}
        </span>
      )}

      {/* TOOLTIP RÁPIDO PARA LEER LA PREGUNTA AL PASAR EL CURSOR */}
      {question && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 sm:w-56 p-2.5 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-2xl text-[9.5px] text-slate-200 font-sans opacity-0 scale-90 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto z-50 backdrop-blur-md">
          <p className="text-emerald-400 font-bold text-[8.5px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-emerald-400" />
            <span>{label || 'Pregunta'}:</span>
          </p>
          <p className="line-clamp-2 leading-tight text-slate-300 font-medium">
            {question}
          </p>
          <span className="text-[7.5px] text-slate-400 mt-1 block font-mono text-right">
            (Haz clic para abrir detalle)
          </span>
        </div>
      )}
    </motion.div>
  );
}
