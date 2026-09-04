/**
 * MobileDeckBuilder.tsx
 * 마이덱 및 카드보관함 모바일 썸존 5슬롯 스마트 장착 덱 빌더 (design.md 준수)
 * (구글 스프레드시트 Row 848 / ID 569 요구사항 구현)
 */

import React, { useState } from 'react';
import { CardData, Language } from '../types';
import { Sparkles, Plus, X, Zap } from 'lucide-react';

interface MobileDeckBuilderProps {
  deck: CardData[];
  inventory: CardData[];
  onEquipCard: (card: CardData, slotIndex: number) => void;
  onRemoveCard: (slotIndex: number) => void;
  language: Language;
}

export const MobileDeckBuilder: React.FC<MobileDeckBuilderProps> = ({
  deck,
  inventory,
  onEquipCard,
  onRemoveCard,
  language,
}) => {
  const isKo = language === 'ko';
  const [filterElement, setFilterElement] = useState<string>('all');

  // Find first empty slot or replace slot
  const handleSmartEquip = (card: CardData) => {
    const emptyIndex = deck.findIndex((c) => !c || !c.id);
    const targetSlot = emptyIndex !== -1 ? emptyIndex : 0;
    onEquipCard(card, targetSlot);
  };

  const filteredInventory = inventory.filter((c) => {
    if (filterElement === 'all') return true;
    return c.element?.toLowerCase() === filterElement;
  });

  return (
    <div className="w-full h-full flex flex-col font-mono select-none bg-[#fdfcfc] text-[#201d1d]">
      {/* 1. Top 1-Line Compact Filter Chips */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[rgba(15,0,0,0.12)] bg-[#f4f2ee] overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[10px] uppercase font-bold text-[#6e6e73] mr-1">
          {isKo ? '속성필터' : 'ELEMENT'}:
        </span>
        {['all', 'fire', 'water', 'wind', 'earth'].map((el) => (
          <button
            key={el}
            onClick={() => setFilterElement(el)}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border cursor-pointer transition-colors ${
              filterElement === el
                ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d]'
                : 'bg-white text-[#6e6e73] border-[rgba(15,0,0,0.1)] hover:border-[rgba(15,0,0,0.25)]'
            }`}
          >
            {el.toUpperCase()}
          </button>
        ))}
      </div>

      {/* 2. Middle Scrollable Card Collection Area */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
        {filteredInventory.map((card, idx) => (
          <div
            key={`${card.id}_${idx}`}
            onClick={() => handleSmartEquip(card)}
            className="p-2 bg-white border border-[rgba(15,0,0,0.12)] rounded-sm hover:border-[#201d1d] cursor-pointer flex flex-col items-center justify-between active:scale-95 transition-all text-center relative shadow-xs"
          >
            <div className="text-[10px] text-[#6e6e73]">{card.element || 'FIRE'}</div>
            <div className="text-xs font-black truncate w-full text-[#201d1d] my-1">{card.name}</div>
            <div className="text-[10px] font-bold text-cyan-700">PWR {card.totalPower || 100}</div>
            <div className="absolute top-1 right-1 text-[9px] text-[#6e6e73]">
              <Plus size={11} />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bottom 35% Thumb-Zone Docked 5-Slot Deck Bar */}
      <div className="h-28 bg-[#181616] text-[#fdfcfc] border-t border-[rgba(255,255,255,0.1)] p-2 shrink-0 flex flex-col justify-between safe-area-inset">
        <div className="flex items-center justify-between px-1 text-[10px] text-[#aaa]">
          <span className="flex items-center gap-1 font-bold text-amber-400">
            <Zap size={11} />
            {isKo ? '현재 대표 덱 (1-Tap 스마트 교체)' : 'Active Deck (1-Tap Smart Swap)'}
          </span>
          <span>{deck.filter(Boolean).length} / 5</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 h-16">
          {[0, 1, 2, 3, 4].map((slotIdx) => {
            const card = deck[slotIdx];
            return (
              <div
                key={slotIdx}
                className="relative bg-black/40 border border-white/15 rounded-sm p-1 flex flex-col items-center justify-center text-center overflow-hidden"
              >
                {card ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveCard(slotIdx);
                      }}
                      className="absolute top-0.5 right-0.5 text-white/50 hover:text-white cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                    <span className="text-[9px] font-bold text-amber-300 truncate w-full px-0.5">
                      {card.name}
                    </span>
                    <span className="text-[8px] text-cyan-400 font-bold">
                      {card.totalPower || 100}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px] text-white/30 font-bold">
                    SLOT {slotIdx + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
