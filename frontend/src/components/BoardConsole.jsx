import React from "react";
import { Lock } from "lucide-react";
import ArcadeNode from "./ArcadeNode";
import { GAME_LEVELS } from "../utils/gameConfig";

/**
 * Consola octogonal 3D del tablero: carcasa decorativa, conexiones de red
 * entre nodos, render de ArcadeNode e indicador de pista.
 */
export default function BoardConsole({
  boardInfo,
  currentLevel,
  nodes,
  hintNodeId,
  onNodeClick,
}) {
  const nodeArr = Object.values(nodes);
  const totalNodes = nodeArr.length;

  return (
    <div className="isometric-board-container flex-1 flex items-center justify-center w-full my-1 sm:my-auto px-2 z-10 overflow-visible">
      {/* Carcasa Octogonal Externa con Extrusión de Sombra 3D */}
      <div
        className="board-table-3d table-3d relative w-[96%] max-w-6xl h-[410px] sm:h-[445px] lg:h-[485px] max-h-[66vh] bg-[#e2e8f0] border-4 border-[#cbd5e1] p-3 sm:p-4 flex flex-col justify-between"
        style={{
          clipPath:
            "polygon(5% 0%, 95% 0%, 100% 9%, 100% 91%, 95% 100%, 5% 100%, 0% 91%, 0% 9%)",
          boxShadow:
            "0 28px 45px -8px rgba(15, 23, 42, 0.40), 0 14px 0 #94a3b8, inset 0 3px 6px rgba(255,255,255,0.95)",
        }}
      >
        {/* Superficie Interior Biselada del Tablero */}
        <div
          className="absolute inset-2 bg-[#f8fafc] border-2 border-slate-300 pointer-events-none"
          style={{
            clipPath:
              "polygon(4.8% 0%, 95.2% 0%, 100% 8.5%, 100% 91.5%, 95.2% 100%, 4.8% 100%, 0% 91.5%, 0% 8.5%)",
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.20) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* MÓDULOS DECORATIVOS COLORIDOS INCRUSTADOS EN LOS BORDES */}
        {/* 1. ESQUINA SUPERIOR IZQUIERDA */}
        <div className="absolute top-1 left-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#1e293b] to-[#334155] border border-[#475569] shadow-md transform -rotate-[35deg] board-deco pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
          <span className="w-5 h-1 rounded-full bg-slate-300/60" />
        </div>

        {/* 2. ESQUINA SUPERIOR DERECHA */}
        <div className="absolute top-1 right-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] border border-[#fb923c] shadow-md transform rotate-[35deg] board-deco pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-amber-200 shadow-[0_0_8px_#fde68a]" />
          <span className="w-5 h-1 rounded-full bg-white/70" />
        </div>

        {/* 3. ESQUINA INFERIOR IZQUIERDA */}
        <div className="absolute bottom-1 left-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#312e81] to-[#4f46e5] border border-[#6366f1] shadow-md transform rotate-[35deg] board-deco pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-indigo-200 shadow-[0_0_8px_#c7d2fe]" />
          <span className="w-5 h-1 rounded-full bg-white/60" />
        </div>

        {/* 4. ESQUINA INFERIOR DERECHA */}
        <div className="absolute bottom-1 right-2 z-20 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#ca8a04] to-[#eab308] border border-[#facc15] shadow-md transform -rotate-[35deg] board-deco pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff]" />
          <span className="w-5 h-1 rounded-full bg-amber-950/40" />
        </div>

        {/* 5. LATERAL IZQUIERDO */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5 py-4 px-1.5 rounded-2xl bg-gradient-to-b from-[#f87171] to-[#fb923c] border-2 border-[#fdba74] shadow-[0_4px_12px_rgba(248,113,113,0.35)] board-deco pointer-events-none">
          <div className="w-2 h-8 rounded-full bg-white/50 border border-white/70 flex items-center justify-center">
            <div className="w-1 h-4 rounded-full bg-white" />
          </div>
          <div className="w-4 h-4 rounded-lg bg-[#b91c1c]/50 border border-white/80 flex items-center justify-center shadow-inner">
            <div className="w-2 h-2 rounded-full bg-white shadow-sm" />
          </div>
          <div className="w-2 h-8 rounded-full bg-white/50 border border-white/70" />
        </div>

        {/* 6. LATERAL DERECHO */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5 py-4 px-1.5 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#1e293b] border-2 border-[#475569] shadow-[0_4px_12px_rgba(15,23,42,0.45)] board-deco pointer-events-none">
          <div className="w-2 h-8 rounded-full bg-slate-700/80 border border-slate-500/60" />
          <div className="w-4 h-4 rounded-lg bg-orange-500 border border-orange-300 flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.8)]">
            <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white ml-0.5" />
          </div>
          <div className="w-2 h-8 rounded-full bg-slate-700/80 border border-slate-500/60" />
        </div>

        {/* 7. BORDE SUPERIOR */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-6 py-1 rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-inner board-deco pointer-events-none">
          <span className="w-10 h-1.5 rounded-full bg-[#64748b]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_var(--color-amber-400)]" />
          <span className="w-10 h-1.5 rounded-full bg-[#64748b]/40" />
        </div>

        {/* 8. BORDE INFERIOR */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 px-10 py-1 rounded-full bg-[#cbd5e1] border border-[#94a3b8] shadow-inner board-deco pointer-events-none">
          <span className="w-16 h-1.5 rounded-full bg-[#64748b]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185]" />
          <span className="w-16 h-1.5 rounded-full bg-[#64748b]/40" />
        </div>

        {/* PANTALLA TÁCTICA CON DISTRIBUCIÓN ESPACIAL ABIERTA */}
        <div className="w-full h-full rounded-2xl bg-[#f8fafc]/70 border border-slate-300/80 p-3 sm:p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-300/70 pb-2 z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-300">
                {boardInfo?.theme || "Circuito de Estudio"}
              </span>
              <h1 className="text-sm sm:text-base font-black tracking-widest text-slate-700 font-mono uppercase">
                {boardInfo?.title || "Tablero de Aprendizaje"}
              </h1>
            </div>

            {/* Título de Nivel Actual Discreto */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-300/60 shadow-xs">
              <span className="text-[10px] font-black uppercase text-orange-600 font-mono tracking-wider">
                Nivel {currentLevel}:{" "}
                {GAME_LEVELS.find((l) => l.level === currentLevel)?.name ||
                  "Fácil"}
              </span>
            </div>
          </div>

          {/* ÁREA CENTRAL DE NODOS */}
          <div className="relative flex-1 w-full h-full my-2 flex items-center justify-center">
            {/* Conexiones de red con flechas de flujo */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <marker
                  id="arrow-coral"
                  markerWidth="8"
                  markerHeight="8"
                  refX="5"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 7 4, 0 7" fill="#ea580c" />
                </marker>
                <marker
                  id="arrow-dark"
                  markerWidth="8"
                  markerHeight="8"
                  refX="5"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 7 4, 0 7" fill="#1e293b" />
                </marker>
              </defs>
              {nodeArr.map((node, i) => {
                // Si hay muchos nodos (>8), conectar solo con el siguiente sin cerrar el bucle cruzado del último con el primero
                if (totalNodes > 8 && i === totalNodes - 1) return null;
                const nextNode = nodeArr[(i + 1) % totalNodes];
                if (!node.pos || !nextNode.pos) return null;
                const isEven = i % 2 === 0;
                return (
                  <line
                    key={`line-${node.id}-${nextNode.id}`}
                    x1={node.pos.left}
                    y1={node.pos.top}
                    x2={nextNode.pos.left}
                    y2={nextNode.pos.top}
                    stroke={isEven ? "#ea580c" : "#1e293b"}
                    strokeWidth={totalNodes > 8 ? "2" : "3"}
                    strokeDasharray={totalNodes > 8 ? "4 4" : "none"}
                    strokeLinecap="round"
                    opacity={
                      totalNodes > 8 ? "0.40" : isEven ? "0.85" : "0.75"
                    }
                    markerEnd={
                      isEven ? "url(#arrow-coral)" : "url(#arrow-dark)"
                    }
                  />
                );
              })}
            </svg>

            {/* Render de los Nodos */}
            {nodeArr.map((node) => (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: node.pos?.top || "50%",
                  left: node.pos?.left || "50%",
                }}
              >
                <div className="relative">
                  {node.lockedByOpponent && (
                    <span className="absolute -top-3 -right-3 z-30 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[8px] flex items-center gap-0.5 shadow-md animate-pulse">
                      <Lock className="w-2.5 h-2.5" /> RIVAL
                    </span>
                  )}

                  {/* Indicador de casilla destino para la pista de 30s */}
                  {hintNodeId === node.id && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-2.5 py-0.5 rounded-full bg-[var(--color-arcade-yellow)] text-[var(--color-arcade-navy)] font-black text-[9px] uppercase tracking-wider shadow-lg flex items-center gap-1 animate-bounce border-2 border-white">
                      <span>¡COLOCA AQUÍ!</span>
                    </div>
                  )}

                  <ArcadeNode
                    id={node.id}
                    icon={node.icon}
                    color={node.color}
                    shape={node.shape}
                    domain={node.domain}
                    theme={node.theme || boardInfo?.theme}
                    index={node.nodeIndex ?? 0}
                    label={node.label}
                    question={node.question}
                    questionLatex={node.questionLatex}
                    hint={node.hint}
                    placedCard={node.placedCard}
                    onClick={onNodeClick}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Luces Neón de Piso */}
          <div className="flex items-center justify-center gap-12 mt-1">
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
