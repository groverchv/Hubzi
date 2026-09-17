import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, HelpCircle } from 'lucide-react';
import { getDomainIcon, DOMAIN_ICONS } from '../utils/domainIcons';

export default function ArcadeNode({ 
  id, 
  icon = "database", 
  color = "blue", // "blue" | "yellow" | "purple" | "emerald" | "rose" | "indigo"
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

  const colorStyles = {
    blue: {
      border: 'border-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(56,189,248,0.85)]',
      bg: 'bg-cyan-950/85',
      iconColor: 'text-cyan-300',
      accent: 'bg-cyan-400'
    },
    yellow: {
      border: 'border-amber-400',
      glow: 'shadow-[0_0_20px_rgba(251,191,36,0.85)]',
      bg: 'bg-amber-950/85',
      iconColor: 'text-amber-300',
      accent: 'bg-amber-400'
    },
    purple: {
      border: 'border-fuchsia-400',
      glow: 'shadow-[0_0_20px_rgba(232,121,249,0.85)]',
      bg: 'bg-purple-950/85',
      iconColor: 'text-fuchsia-300',
      accent: 'bg-fuchsia-400'
    },
    emerald: {
      border: 'border-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(52,211,153,0.85)]',
      bg: 'bg-emerald-950/85',
      iconColor: 'text-emerald-300',
      accent: 'bg-emerald-400'
    },
    rose: {
      border: 'border-rose-400',
      glow: 'shadow-[0_0_20px_rgba(251,113,133,0.85)]',
      bg: 'bg-rose-950/85',
      iconColor: 'text-rose-300',
      accent: 'bg-rose-400'
    },
    indigo: {
      border: 'border-indigo-400',
      glow: 'shadow-[0_0_20px_rgba(129,140,248,0.85)]',
      bg: 'bg-indigo-950/85',
      iconColor: 'text-indigo-300',
      accent: 'bg-indigo-400'
    }
  }[color] || colorStyles.blue;

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
      className={`relative w-12 h-12 sm:w-14 sm:h-14 border-2 ${colorStyles.border} ${colorStyles.bg} ${colorStyles.glow} ${shapeClasses} flex items-center justify-center cursor-pointer transition-all duration-300 group ${
        isOver ? 'scale-110 ring-4 ring-cyan-300' : ''
      } ${placedCard ? 'ring-2 ring-emerald-400' : ''}`}
    >
      {/* Puntos de soldadura / Chip táctico en esquinas */}
      <div className={`absolute -top-1 -left-1 w-1.5 h-1.5 rounded-full ${colorStyles.accent}`} />
      <div className={`absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full ${colorStyles.accent}`} />

      {/* Ícono dinámico del dominio (o check si está resuelto) */}
      {placedCard ? (
        <div className={shape === 'diamond' ? '-rotate-45' : ''}>
          <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-300 drop-shadow-[0_0_10px_#34d399]" />
        </div>
      ) : (
        <div className={`relative flex items-center justify-center ${shape === 'diamond' ? '-rotate-45' : ''}`}>
          <IconComp className={`w-5 h-5 sm:w-6 sm:h-6 ${colorStyles.iconColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] group-hover:scale-110 transition-transform`} />
          
          {/* Badge interactivo ? */}
          <span className="absolute -top-2 -right-2 w-3.5 h-3.5 rounded-full bg-slate-900 border border-cyan-400 text-cyan-300 text-[8px] font-black flex items-center justify-center shadow-sm group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
            ?
          </span>
        </div>
      )}

      {/* Label inferior temático compacto */}
      {label && (
        <span 
          title={label}
          className={`absolute -bottom-4 z-20 max-w-[105px] truncate text-[8.5px] font-mono text-slate-200 font-bold px-1.5 py-0.5 rounded bg-slate-900/95 border border-slate-700/80 shadow-md pointer-events-none transition-all group-hover:max-w-none group-hover:z-50 ${
            shape === 'diamond' ? '-rotate-45 -bottom-6' : ''
          }`}
        >
          {label}
        </span>
      )}

      {/* TOOLTIP RÁPIDO PARA LEER LA PREGUNTA AL PASAR EL CURSOR (INCLUSO EN TURNO RIVAL) */}
      {question && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 sm:w-56 p-2 rounded-xl bg-slate-950/95 border border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.4)] text-[9px] text-slate-200 font-sans opacity-0 scale-90 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto z-50 backdrop-blur-md">
          <p className="text-cyan-300 font-bold font-mono text-[8px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-cyan-400" />
            <span>{label || 'Pregunta'}:</span>
          </p>
          <p className="line-clamp-2 leading-tight text-slate-100 font-medium">
            {question}
          </p>
          <span className="text-[7.5px] text-cyan-400/80 mt-1 block font-mono text-right">
            (Haz clic para abrir detalle)
          </span>
        </div>
      )}
    </motion.div>
  );
}
