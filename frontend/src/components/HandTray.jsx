import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard from "./GameCard";
import { useTranslation } from "react-i18next";

const CARDS_PER_PAGE = 7;

/**
 * Bandeja física de cartas "El Mazo" con paginación inteligente.
 * Salta automáticamente a la página donde está la carta sugerida por la pista.
 */
export default function HandTray({
  hand,
  handPage,
  setHandPage,
  hintCardId,
  selectedCardInHand,
  isActualTurn,
  theme,
  compact = false, // móvil: deck horizontal deslizable sin paginación
  onCardClick,
  onCardKeyActivate,
  onCardDrag,
  onCardDragEnd,
}) {
  const { t } = useTranslation();
  if (!hand.length) return null;

  const totalPages = compact ? 1 : Math.ceil(hand.length / CARDS_PER_PAGE);
  // Si la carta sugerida por la pista está en otra página, saltar a ella
  const hintedIndex = hintCardId
    ? hand.findIndex((c) => c.id === hintCardId)
    : -1;
  const activePage =
    hintedIndex >= 0
      ? Math.floor(hintedIndex / CARDS_PER_PAGE)
      : Math.min(handPage, Math.max(0, totalPages - 1));
  const visibleCards =
    totalPages > 1
      ? hand.slice(
          activePage * CARDS_PER_PAGE,
          (activePage + 1) * CARDS_PER_PAGE,
        )
      : hand;

  return (
    <div
      className={`relative w-full flex flex-col items-center justify-center pb-2 z-40 transition-all duration-300 overflow-visible ${
        !isActualTurn
          ? "opacity-50 grayscale-[35%] pointer-events-none cursor-not-allowed"
          : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-1.5">
        {/* Cápsula del mazo (MAZO: X / Y) */}
        <div className="flex items-center gap-2.5 px-4 py-1 rounded-full bg-[#1E2F3A] text-white shadow-md z-50 font-['Fredoka'] border border-[#3A4D5C]">
          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => setHandPage((prev) => Math.max(0, prev - 1))}
              disabled={activePage === 0}
              className={`p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                activePage === 0 ? "opacity-30 cursor-not-allowed" : "text-[#F4B942]"
              }`}
              title={t('hand.prev')}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-[11px] font-bold uppercase tracking-wider">
            MAZO: {activePage + 1} / {totalPages} ({hand.length} CARTAS)
          </span>

          {totalPages > 1 && (
            <button
              type="button"
              onClick={() => setHandPage((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={activePage >= totalPages - 1}
              className={`p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                activePage >= totalPages - 1 ? "opacity-30 cursor-not-allowed" : "text-[#F4B942]"
              }`}
              title={t('hand.next')}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bandeja Flotante Crema Translúcida */}
        <div
          className={`hand-tray relative px-4 ${compact ? "py-1.5" : "py-3"} rounded-[2rem] bg-[#FAF6EE]/94 backdrop-blur-md border-2 border-[#E6DEC8] shadow-[0_12px_32px_rgba(30,47,58,0.12)] flex items-center justify-center max-w-full`}
          role="group"
          aria-label={t('hand.aria', { count: hand.length })}
        >
          <div className={`flex items-center gap-3 px-1 py-0.5 ${
            compact
              ? "overflow-x-auto overflow-y-visible w-full max-w-[86vw]"
              : "overflow-visible"
          }`}>
            {visibleCards.map((card, idx) => {
              const isHinted = hintCardId === card.id;
              const isHandSelected = selectedCardInHand?.id === card.id;
              return (
                <div
                  key={`slot-${card.id || idx}`}
                  className={`hand-slot relative rounded-2xl p-1 transition-all ${
                    isHandSelected
                      ? "bg-[#FEF3E7] border-2 border-[#F58A29] shadow-[0_0_18px_rgba(245,138,41,0.5)] scale-105"
                      : isHinted
                        ? "bg-[#FEF3E7] border-2 border-[#F4B942] shadow-[0_0_16px_rgba(244,185,66,0.5)]"
                        : "bg-[#F2EBD9]/60 border border-[#E6DEC8]"
                  } ${hintCardId && !isHinted && !isHandSelected ? "opacity-35" : ""} flex items-center justify-center`}
                >
                  {/* FLECHA ANIMADA DE PISTA (ANTI-DESÁNIMO TRAS 30 SEGUNDOS) */}
                  {isHinted && (
                    <div className="absolute -top-11 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none animate-bounce">
                      <span className="px-2 py-0.5 rounded-full bg-[var(--color-arcade-orange)] text-white font-black text-[9px] uppercase tracking-wider shadow-md whitespace-nowrap border border-white">
                        {t('hand.use_this')}
                      </span>
                      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[var(--color-arcade-orange)]" />
                    </div>
                  )}

                  <GameCard
                    id={card.id}
                    name={card.name}
                    cost={card.cost}
                    type={card.type}
                    sourceType={card.sourceType}
                    domain={card.domain}
                    theme={card.theme || theme}
                    index={card.cardIndex ?? idx}
                    rotation={0}
                    zIndex={
                      isHandSelected ? 60 : isHinted ? 50 : card.zIndex
                    }
                    isDraggable={isActualTurn}
                    isSelected={isHinted || isHandSelected}
                    isTrap={Boolean(card.isTrap || card.isDistractor)}
                    compact={compact}
                    onDrag={onCardDrag}
                    onDragEnd={onCardDragEnd}
                    onClick={() => onCardClick(card)}
                    onKeyActivate={() =>
                      onCardKeyActivate ? onCardKeyActivate(card) : onCardClick(card)
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
