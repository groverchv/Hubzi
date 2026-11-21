import React from "react";
import { Lock } from "lucide-react";
import ArcadeNode from "./ArcadeNode";
import { useTranslation } from "react-i18next";

/**
 * Consola táctil cálida del tablero: Pizarra color crema papel (#FAF6EE),
 * textura punteada sutil (radial-gradient), conexiones curvas suaves
 * y esquinas muy redondeadas (rounded-[2.5rem]).
 * Fiel a la captura Santuario Capibara (media_1795279254403_6f5002b2.jpg).
 */
function BoardConsole({
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
  const { t } = useTranslation();
  const nodeArr = Object.values(nodes);
  const totalNodes = nodeArr.length;

  return (
    <div className="isometric-board-container flex-1 flex items-center justify-center w-full mt-14 mb-1 sm:mb-auto pl-[10%] pr-2 z-10 overflow-visible">
      {/* Tablero Táctil Crema Cálido */}
      <div
        className="board-table-3d relative w-[96%] max-w-5xl h-[410px] sm:h-[445px] lg:h-[485px] max-h-[66vh] bg-[#FAF6EE] border-2 border-[#E6DEC8] rounded-[2.5rem] p-4 sm:p-6 flex flex-col justify-between shadow-[0_20px_45px_-12px_rgba(30,47,58,0.12),inset_0_2px_4px_rgba(255,255,255,0.9)]"
      >
        {/* Textura de Rejilla Punteada Sutil (Dotted Grid) */}
        <div
          className="absolute inset-4 rounded-[2rem] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#D5CBB3 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* ÁREA CENTRAL DE NODOS */}
        <div
          className="relative flex-1 w-full h-full my-2 flex items-center justify-center"
          role="group"
          aria-label={t('board.nodes_aria', {
            done: nodeArr.filter((n) => n.placedCard).length,
            total: totalNodes,
          })}
        >
          {/* Conexiones de red con líneas curvas suaves Bezier */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {nodeArr.map((node, i) => {
              if (totalNodes > 8 && i === totalNodes - 1) return null;
              const nextNode = nodeArr[(i + 1) % totalNodes];
              if (!node.pos || !nextNode.pos) return null;
              const isEven = i % 2 === 0;

              // Coordenadas en porcentaje
              const x1 = parseFloat(node.pos.left);
              const y1 = parseFloat(node.pos.top);
              const x2 = parseFloat(nextNode.pos.left);
              const y2 = parseFloat(nextNode.pos.top);

              // Curvatura suave orgánica Bezier
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2 + (isEven ? -4 : 4);

              return (
                <path
                  key={`bezier-${node.id}-${nextNode.id}`}
                  d={`M ${x1}% ${y1}% Q ${midX}% ${midY}%, ${x2}% ${y2}%`}
                  fill="none"
                  stroke={isEven ? "#F58A29" : "#1E2F3A"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  opacity={isEven ? "0.85" : "0.75"}
                />
              );
            })}
          </svg>

          {/* Render de los Nodos Conceptuales */}
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
                    <Lock className="w-2.5 h-2.5" /> {t('board.rival')}
                  </span>
                )}

                {/* Indicador de destino para la pista */}
                {hintNodeId === node.id && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 px-2.5 py-0.5 rounded-full bg-[#F58A29] text-white font-black text-[9px] uppercase tracking-wider shadow-lg flex items-center gap-1 animate-bounce border-2 border-white">
                    <span>{t('board.place_here')}</span>
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
                  isOver={dragPreview?.nodeId === node.id}
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
                  preview={null}
                  onClick={onNodeClick}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Paginación con Puntos al Pie del Tablero */}
        <div className="flex items-center justify-center gap-2 mt-2 z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-[#78C2C4]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#D5CBB3]" />
        </div>
      </div>
    </div>
  );
}

export default React.memo(BoardConsole);
