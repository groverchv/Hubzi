import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';
import { getDomainIcon, DOMAIN_ICONS, resolveDynamicIcon } from '../utils/domainIcons';

export default function ArcadeNode({ 
  id, 
  icon = null, 
  color = "blue",
  shape = "card",
  active = true,
  placedCard = null,
  isOver = false,
  label = "",
  domain = "",
  theme = "",
  question = "",
  hint = "",
  index = 0,
  style = {},
  onClick
}) {
  // Resolución 100% dinámica de icono adaptada a la temática del documento (abogacía, medicina, psicología, etc.)
  const IconComp = resolveDynamicIcon({
    label: label || (typeof icon === 'string' ? icon : ''),
    question,
    hint,
    theme: theme || domain,
    index
  }) || Sparkles;

  return (
    <div 
      data-node-id={id}
      onClick={() => { if (onClick) onClick(id); }}
      className="relative flex flex-col items-center select-none cursor-pointer"
      style={{ zIndex: 1 }}
    >
      {/* HEXAGONAL SLOT — matches the reference image honeycomb cells */}
      <motion.div
        data-node-id={id}
        style={style}
        whileHover={{ scale: 1.1, y: -4, zIndex: 40 }}
        whileTap={{ scale: 0.95 }}
        className="relative group"
      >
        {/* Outer hexagonal bezel — white/light with shadow (the board slot) */}
        <svg
          width="60"
          height="68"
          viewBox="0 0 60 68"
          className="absolute inset-0"
          style={{ filter: isOver ? 'drop-shadow(0 0 8px #f97316)' : placedCard ? 'drop-shadow(0 0 6px #22c55e)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.18))' }}
        >
          {/* Outer filled hexagon — bezel */}
          <polygon
            points="30,2 58,17 58,51 30,66 2,51 2,17"
            fill={placedCard ? '#dcfce7' : isOver ? '#fff7ed' : '#f1f5f9'}
            stroke={placedCard ? '#22c55e' : isOver ? '#f97316' : '#cbd5e1'}
            strokeWidth="2.5"
          />
          {/* Inner inset hexagon — the "slot hole" */}
          <polygon
            points="30,12 50,23 50,45 30,56 10,45 10,23"
            fill={placedCard ? '#bbf7d0' : '#e2e8f0'}
            stroke={placedCard ? '#16a34a' : '#94a3b8'}
            strokeWidth="1.5"
          />
          {/* Corner rivet dots */}
          <circle cx="30" cy="4" r="2.5" fill="#fbbf24" />
          <circle cx="56" cy="17" r="2.5" fill="#fbbf24" />
          <circle cx="56" cy="51" r="2.5" fill="#fbbf24" />
          <circle cx="30" cy="64" r="2.5" fill="#fbbf24" />
          <circle cx="4" cy="51" r="2.5" fill="#fbbf24" />
          <circle cx="4" cy="17" r="2.5" fill="#fbbf24" />
        </svg>

        {/* RECTANGULAR CARD DROP AREA — inside the hexagon, where the card sits */}
        <div
          className={`relative z-10 w-[46px] h-[44px] mx-auto mt-[12px] rounded-lg flex flex-col items-center justify-center overflow-hidden transition-all duration-200 ${
            placedCard
              ? 'bg-green-100 border-2 border-green-400'
              : isOver
              ? 'bg-orange-100 border-2 border-orange-400 border-dashed'
              : 'bg-slate-200/80 border-2 border-dashed border-slate-400/60 group-hover:border-slate-500'
          }`}
          style={{ minHeight: 44, minWidth: 46 }}
        >
          {placedCard ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 drop-shadow-sm" />
          ) : (
            <IconComp className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
          )}
        </div>

        {/* Spacer to fill SVG height */}
        <div style={{ height: 68, width: 60 }} className="invisible pointer-events-none" />
      </motion.div>

      {/* LABEL PILL — below the hexagonal slot */}
      {label && (
        <span 
          title={label}
          className={`mt-1 max-w-[82px] truncate text-[8px] font-bold text-center px-1.5 py-0.5 rounded-md shadow-sm pointer-events-none transition-all ${
            placedCard
              ? 'bg-green-50 border border-green-300 text-green-700'
              : 'bg-white/90 border border-slate-300 text-slate-600'
          }`}
        >
          {label}
        </span>
      )}

      {/* HOVER TOOLTIP */}
      {question && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-52 sm:w-60 p-2.5 rounded-2xl bg-slate-900/98 border border-orange-400/60 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-[9.5px] text-slate-200 font-sans opacity-0 scale-90 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto z-50 backdrop-blur-md">
          <p className="text-orange-300 font-bold text-[8.5px] uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Pregunta:</span>
          </p>
          <p className="line-clamp-3 leading-tight text-slate-200 font-medium">{question}</p>
          <span className="text-[7.5px] text-orange-300/80 mt-1 block font-mono text-right">(Arrastra aquí tu carta)</span>
        </div>
      )}
    </div>
  );
}
