/**
 * DeckBuilderSwipeUI.tsx
 * 모바일 한손 엄지 스와이프 기반 3D 카드 덱 빌더 및 실시간 덱 시너지 인스펙터
 * (구글 스프레드시트 Row 691 / ID 560 요구사항 구현)
 */

import React, { useState, useRef, useMemo } from 'react';
import { CardData, InventoryRecord, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { calculateDeckSynergies } from './DeckSynergyCalculator';
import { CardItem } from './CardItem';
import { cn, getCardSpriteStyle } from '../lib/utils';
import { t } from '../lib/i18n';
import { ChevronLeft, ChevronRight, Zap, Shield, Sparkles, RefreshCw, Layers, Check, ArrowLeftRight, RotateCw } from 'lucide-react';
import { SpinningProfileShowcase } from './SpinningProfileShowcase';

interface DeckBuilderSwipeUIProps {
  currentDeck: CardData[];
  ownedCards: CardData[];
  inventory: Record<number, InventoryRecord>;
  language: Language;
  onUpdateDeck: (newDeck: CardData[]) => void;
  onClose?: () => void;
}

export const DeckBuilderSwipeUI: React.FC<DeckBuilderSwipeUIProps> = ({
  currentDeck,
  ownedCards,
  inventory,
  language = 'ko',
  onUpdateDeck,
  onClose
}) => {
  const isKo = language === 'ko';
  const [activeSlotIndex, setActiveSlotIndex] = useState<number>(0);
  const [selectedVaultFilter, setSelectedVaultFilter] = useState<string>('ALL');
  const [showOrbitMode, setShowOrbitMode] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Deck synergy calculations
  const synergyResult = useMemo(() => {
    return calculateDeckSynergies(currentDeck, language);
  }, [currentDeck, language]);

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const swipeThreshold = 40;

    if (diffX > swipeThreshold) {
      // Swiped left -> next slot
      setActiveSlotIndex((prev) => Math.min(4, prev + 1));
    } else if (diffX < -swipeThreshold) {
      // Swiped right -> prev slot
      setActiveSlotIndex((prev) => Math.max(0, prev - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Replace card in active slot
  const handleSelectVaultCard = (card: CardData) => {
    const nextDeck = [...currentDeck];
    // Check if card is already in another slot
    const existingIndex = nextDeck.findIndex((c) => c && c.imageIndex === card.imageIndex);
    if (existingIndex !== -1 && existingIndex !== activeSlotIndex) {
      // Swap slots
      const temp = nextDeck[activeSlotIndex];
      nextDeck[activeSlotIndex] = card;
      nextDeck[existingIndex] = temp;
    } else {
      nextDeck[activeSlotIndex] = card;
    }
    onUpdateDeck(nextDeck);
  };

  // Filter vault cards
  const filteredVaultCards = useMemo(() => {
    return ownedCards.filter((card) => {
      if (!card) return false;
      const dbCard = CARD_DATABASE[card.imageIndex || 0] || card;
      const elem = (card.element || dbCard.element || 'FIRE').toUpperCase();
      if (selectedVaultFilter === 'ALL') return true;
      return elem === selectedVaultFilter;
    });
  }, [ownedCards, selectedVaultFilter]);

  const activeCard = currentDeck[activeSlotIndex];
  const dbActiveCard = activeCard ? (CARD_DATABASE[activeCard.imageIndex || 0] || activeCard) : null;

  return (
    <div className="w-full flex flex-col bg-[#fdfcfc] text-[#201d1d] font-mono border-2 border-[#201d1d] rounded-none select-none overflow-hidden">
      {/* 1. Ultra-Clean 1-Line Synergy Telemetry Bar (Top) */}
      <div className="w-full bg-[#201d1d] text-[#fdfcfc] px-3 py-2 flex items-center justify-between text-xs border-b border-[#201d1d]">
        <div className="flex items-center gap-2">
          <span className="bg-amber-400 text-[#201d1d] px-1.5 py-0.5 text-[10px] font-black">
            GRADE {synergyResult.grade}
          </span>
          <span className="font-bold text-[11px] text-amber-300">
            PWR +{synergyResult.powerBonusPct}%
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-[10px]">
          {synergyResult.activeSynergies.slice(0, 3).map((syn) => (
            <span key={syn.id} className="bg-stone-800 text-stone-200 px-1.5 py-0.5 border border-stone-700">
              {syn.icon} {syn.name}
            </span>
          ))}
          {synergyResult.activeSynergies.length === 0 && (
            <span className="text-stone-400 text-[10px]">
              {isKo ? '시너지 활성화 대기중' : 'No Synergies'}
            </span>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-stone-300 hover:text-white px-2 py-0.5 bg-stone-800 text-[10px] font-bold cursor-pointer"
          >
            [X]
          </button>
        )}
      </div>

      {/* 2. 5-Slot Horizontal Selector / Indicator */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d]/5 border-b border-[#201d1d]/20 text-xs">
        <div className="flex items-center gap-1.5">
          <Layers size={13} className="text-[#201d1d]/70" />
          <span className="font-black tracking-tight uppercase">
            {isKo ? '덱 슬롯' : 'DECK SLOTS'} ({activeSlotIndex + 1}/5)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowOrbitMode(!showOrbitMode)}
            className={cn(
              'px-2 py-1 border text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all',
              showOrbitMode
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-[#fdfcfc] text-[#201d1d] border-[#201d1d]/40 hover:bg-[#201d1d]/10'
            )}
          >
            <RotateCw size={11} className={cn(showOrbitMode && 'animate-spin')} />
            <span>{showOrbitMode ? (isKo ? '스와이프 뷰' : 'Swipe View') : (isKo ? '3D 궤도 회전' : '3D Orbit')}</span>
          </button>

          {!showOrbitMode && [0, 1, 2, 3, 4].map((slotIdx) => {
            const card = currentDeck[slotIdx];
            const isSelected = activeSlotIndex === slotIdx;
            return (
              <button
                key={slotIdx}
                type="button"
                onClick={() => setActiveSlotIndex(slotIdx)}
                className={cn(
                  'w-7 h-7 flex flex-col items-center justify-center text-[10px] font-bold border transition-all cursor-pointer rounded-none',
                  isSelected
                    ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] scale-105 shadow-xs'
                    : 'bg-[#fdfcfc] text-[#201d1d] border-[#201d1d]/30 hover:bg-[#201d1d]/10'
                )}
              >
                <span>#{slotIdx + 1}</span>
                {card && (
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {showOrbitMode ? (
        <div className="p-3 bg-slate-950 flex flex-col items-center">
          <SpinningProfileShowcase
            playerCard={currentDeck[0] || null}
            opponentCard={CARD_DATABASE[22] || null}
            playerName={isKo ? '내 대표 히어로' : 'My Leader Hero'}
            opponentName={isKo ? '가상 대전 상대' : 'Training Bot'}
            playerDeck={currentDeck}
            onReorderDeck={onUpdateDeck}
            language={language}
          />
        </div>
      ) : (
        <>
          {/* 3. Main 3D Perspective Swipeable Card Viewport */}
          <div
            className="relative w-full py-6 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-[#fdfcfc] to-stone-100 touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation Arrow Controls */}
            <button
              type="button"
              disabled={activeSlotIndex === 0}
              onClick={() => setActiveSlotIndex((prev) => Math.max(0, prev - 1))}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 p-2 border border-[#201d1d] bg-[#fdfcfc] text-[#201d1d] z-20 cursor-pointer disabled:opacity-30',
                activeSlotIndex === 0 && 'pointer-events-none'
              )}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              disabled={activeSlotIndex === 4}
              onClick={() => setActiveSlotIndex((prev) => Math.min(4, prev + 1))}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 p-2 border border-[#201d1d] bg-[#fdfcfc] text-[#201d1d] z-20 cursor-pointer disabled:opacity-30',
                activeSlotIndex === 4 && 'pointer-events-none'
              )}
            >
              <ChevronRight size={18} />
            </button>

            {/* 3D Holographic Card Stage */}
            <div className="w-48 sm:w-56 h-72 sm:h-80 relative flex items-center justify-center perspective-[1000px]">
              {activeCard ? (
                <div className="w-full h-full transform transition-all duration-300 hover:rotate-y-6 hover:rotate-x-3 shadow-xl border-2 border-[#201d1d] bg-[#fdfcfc] p-2 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[10px] font-bold border-b border-[#201d1d]/20 pb-1">
                    <span className="text-amber-800">{activeCard.rarity || 'SSR'}</span>
                    <span>{activeCard.element || 'FIRE'}</span>
                  </div>

                  {/* Card Sprite / Image */}
                  <div className="w-full h-40 bg-stone-200 border border-[#201d1d]/30 relative overflow-hidden flex items-center justify-center">
                    <div
                      className="w-24 h-24 bg-contain bg-no-repeat bg-center"
                      style={getCardSpriteStyle(activeCard.imageIndex || 0)}
                    />
                  </div>

                  <div className="text-center">
                    <div className="text-xs font-black truncate">{activeCard.name}</div>
                    <div className="flex justify-center gap-3 text-[10px] font-bold text-[#201d1d]/80 mt-1">
                      <span>ATK {activeCard.atk || 100}</span>
                      <span>DEF {activeCard.def || 100}</span>
                      <span>HP {activeCard.hp || 500}</span>
                    </div>
                  </div>

                  <div className="text-[9px] text-center text-[#201d1d]/60 border-t border-[#201d1d]/10 pt-1">
                    {isKo ? '좌우 스와이프로 슬롯 이동' : 'Swipe left/right to switch slots'}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full border-2 border-dashed border-[#201d1d]/40 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-sm font-bold text-[#201d1d]/60 mb-2">
                    {isKo ? '빈 슬롯' : 'Empty Slot'}
                  </span>
                  <span className="text-[10px] text-[#201d1d]/40">
                    {isKo ? '아래 카드 보관함에서 카드를 선택하세요' : 'Select a card from the vault below'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 4. Vault Card Selector (Bottom 1-Tap Swapper) */}
          <div className="p-3 bg-[#fdfcfc] border-t-2 border-[#201d1d] flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-black uppercase">
                <ArrowLeftRight size={13} />
                <span>{isKo ? '보관함 카드 교체' : 'SWAP FROM VAULT'}</span>
              </div>

              <div className="flex items-center gap-1 text-[10px]">
                {['ALL', 'FIRE', 'WATER', 'EARTH', 'WIND', 'LIGHT', 'DARK'].map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedVaultFilter(filter)}
                    className={cn(
                      'px-1.5 py-0.5 border text-[9px] font-bold cursor-pointer',
                      selectedVaultFilter === filter
                        ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                        : 'bg-[#fdfcfc] text-[#201d1d] border-[#201d1d]/20 hover:bg-[#201d1d]/10'
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Horizontal Scrollable Card Vault */}
            <div className="w-full flex items-center gap-2 overflow-x-auto py-1 scrollbar-thin">
              {filteredVaultCards.map((card, idx) => {
                const isEquipped = currentDeck.some((c) => c && c.imageIndex === card.imageIndex);
                const isEquippedInActive = activeCard && activeCard.imageIndex === card.imageIndex;

                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectVaultCard(card)}
                    className={cn(
                      'min-w-[80px] max-w-[80px] p-1.5 border border-[#201d1d] bg-[#fdfcfc] flex flex-col items-center justify-between cursor-pointer transition-all hover:scale-105 active:scale-95 select-none relative',
                      isEquippedInActive && 'ring-2 ring-amber-500 bg-amber-500/10'
                    )}
                  >
                    {isEquipped && (
                      <div className="absolute top-0.5 right-0.5 bg-[#201d1d] text-[#fdfcfc] text-[8px] px-1 font-bold">
                        IN DECK
                      </div>
                    )}

                    <div
                      className="w-12 h-12 bg-contain bg-no-repeat bg-center my-1"
                      style={getCardSpriteStyle(card.imageIndex || 0)}
                    />

                    <div className="text-[10px] font-bold truncate w-full text-center">
                      {card.name}
                    </div>
                    <div className="text-[8px] text-[#201d1d]/70 font-semibold">
                      {card.rarity || 'SSR'} | {card.element || 'FIRE'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
