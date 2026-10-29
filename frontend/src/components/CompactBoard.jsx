import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, HelpCircle, Star } from "lucide-react";

/**
 * Tablero compacto para móvil: los nodos se listan como filas densas con
 * scroll vertical (en vez del layout absoluto hexagonal de escritorio) y
 * el mazo pasa a deck horizontal. Mantiene data-node-id / role="button" /
 * tabIndex para que el hit-test de drag-drop, el foco por teclado y las
 * affordances funcionen igual que en ArcadeNode.
 */
function CompactNodeCell({ node, fx, afford, preview, hint, onClick }) {
  const placed = Boolean(node.placedCard);
  return (
    <div
      data-node-id={node.id}
      role="button"
      tabIndex={0}
      aria-label={`Casilla ${node.label || node.id}${placed ? `, completada con ${node.placedCard.name}` : ", vacía"}. ${node.question || "Toca o arrastra una carta aquí"}`}
      onClick={() => onClick?.(node.id)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          e.preventDefault();
          onClick(node.id);
        } else if (
          e.key === "ArrowRight" ||
          e.key === "ArrowDown" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowUp"
        ) {
          e.preventDefault();
          const cells = [
            ...document.querySelectorAll('[data-node-id][role="button"]'),
          ];
          const idx = cells.indexOf(e.currentTarget);
          if (idx === -1 || !cells.length) return;
          const step =
            e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1;
          cells[(idx + step + cells.length) % cells.length]?.focus();
        }
      }}
      className={`relative flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 cursor-pointer select-none transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/80 ${
        placed
          ? "bg-green-50 border-green-400"
          : preview === "wrong"
            ? "bg-rose-50 border-rose-400"
            : preview === "correct"
              ? "bg-orange-50 border-orange-400"
              : afford === "match"
                ? "bg-amber-50 border-amber-400"
                : "bg-white/85 border-slate-300 hover:border-slate-400"
      }`}
    >
      {/* Pulso sutil en la casilla compatible (pista suave al seleccionar) */}
      {afford === "match" && !placed && (
        <motion.div
          className="absolute -inset-0.5 rounded-xl border-2 border-amber-400/70 pointer-events-none"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
        />
      )}

      {/* Sacudida suave al fallar */}
      {fx?.kind === "wrong" && (
        <motion.div
          key={`shake-${fx.seq}`}
          animate={{ x: [0, -5, 5, -3, 0] }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="absolute inset-0 rounded-xl border-2 border-amber-400 pointer-events-none"
        />
      )}

      {/* Estrella de acierto */}
      {fx?.kind === "correct" && (
        <motion.div
          key={`star-${fx.seq}`}
          className="absolute -top-2 -right-1 z-30 pointer-events-none"
          initial={{ opacity: 0, scale: 0.3, y: 8 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.3, 1.4, 1, 1],
            y: [8, -14, -18, -18],
          }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <Star className="w-5 h-5 text-amber-400 fill-amber-300 drop-shadow" />
        </motion.div>
      )}

      <div
        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${
          placed
            ? "bg-green-100 border-green-400"
            : "bg-slate-100 border-slate-300"
        }`}
      >
        {placed ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-[10px] font-black leading-tight truncate ${
            placed ? "text-green-800" : "text-slate-700"
          }`}
        >
          {node.label || `Concepto ${(node.nodeIndex ?? 0) + 1}`}
        </p>
        <p className="text-[8.5px] text-slate-500 leading-tight truncate">
          {placed ? node.placedCard.name : node.question}
        </p>
      </div>

      {hint && (
        <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[var(--color-arcade-yellow)] text-[var(--color-arcade-navy)] text-[8px] font-black uppercase animate-bounce border border-white">
          ¡Aquí!
        </span>
      )}
    </div>
  );
}

function CompactBoard({
  boardInfo,
  currentLevel,
  nodes,
  hintNodeId,
  nodeFx,
  hasActiveCard = false,
  matchNodeId = null,
  dragPreview = null,
  onNodeClick,
}) {
  const nodeArr = Object.values(nodes);
  const done = nodeArr.filter((n) => n.placedCard).length;

  return (
    <div className="flex-1 min-h-0 w-full px-2 py-1 flex z-10 overflow-hidden">
      {/* ml-[104px] deja el carril izquierdo libre para Hubzi */}
      <div className="flex-1 min-h-0 ml-[104px] rounded-2xl bg-[#f8fafc]/95 border-2 border-slate-300 shadow-[0_10px_24px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-300/80 bg-white/60 shrink-0">
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-300 truncate">
            {boardInfo?.theme || "Circuito"}
          </span>
          <span className="text-[10px] font-black text-slate-600 whitespace-nowrap">
            Nivel {currentLevel} · {done}/{nodeArr.length}
          </span>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1.5 flex flex-col gap-1.5"
          role="group"
          aria-label={`Casillas del nivel: ${done} de ${nodeArr.length} completadas`}
        >
          {nodeArr.map((node) => (
            <CompactNodeCell
              key={node.id}
              node={node}
              hint={hintNodeId === node.id}
              fx={nodeFx?.nodeId === node.id ? nodeFx : null}
              afford={
                node.placedCard || dragPreview?.nodeId === node.id
                  ? null
                  : matchNodeId === node.id
                    ? "match"
                    : hasActiveCard
                      ? "open"
                      : null
              }
              preview={
                dragPreview?.nodeId === node.id
                  ? dragPreview.correct
                    ? "correct"
                    : "wrong"
                  : null
              }
              onClick={onNodeClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(CompactBoard);
