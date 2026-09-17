import React from 'react';
import { CardData, Language } from '../types';
import { getCardSpriteStyle } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';

interface BattleHandFanProps {
  hand: CardData[];
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
  language: Language;
  disabled?: boolean;
}

export const BattleHandFan: React.FC<BattleHandFanProps> = ({
  hand,
  selectedIndex,
  onSelectCard,
  language,
  disabled,
}) => {
  const isKo = language === 'ko';
  const totalCards = hand.length;

  return (
    <div className="w-full flex flex-col items-center justify-center font-mono select-none py-1">
      {/* 선택된 카드의 4방향 스탯 확대 HUD */}
      {selectedIndex !== null && hand[selectedIndex] && (
        <div className="mb-2 px-3 py-1 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold rounded-xs flex items-center gap-3 shadow-md animate-fadeIn">
          <span>{hand[selectedIndex].title_dis || 'HERO'}</span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300">
            <span>↑{hand[selectedIndex].stats.N}</span>
            <span>→{hand[selectedIndex].stats.E}</span>
            <span>↓{hand[selectedIndex].stats.S}</span>
            <span>←{hand[selectedIndex].stats.W}</span>
          </div>
          <span className="text-[10px] text-stone-300 font-normal">
            {isKo ? '(보드 빈칸 탭 시 착수)' : '(Tap board tile)'}
          </span>
        </div>
      )}

      {/* 부채꼴(Fan-out) 손패 영역 */}
      <div className="relative h-28 sm:h-32 w-full max-w-sm flex items-center justify-center">
        {hand.map((card, idx) => {
          const isSelected = selectedIndex === idx;
          // 부채꼴 회전 각도 (-12deg ~ +12deg)
          const mid = (totalCards - 1) / 2;
          const rotateDeg = totalCards > 1 ? (idx - mid) * 7 : 0;
          const translateY = isSelected ? -24 : Math.abs(idx - mid) * 4;

          const spriteStyle = getCardSpriteStyle(card.imageIndex || 1);

          return (
            <button
              key={card.id || `hand-${idx}`}
              type="button"
              disabled={disabled}
              onClick={() => {
                triggerHaptic('light');
                onSelectCard(idx);
              }}
              style={{
                transform: `translateX(${(idx - mid) * 38}px) translateY(${translateY}px) rotate(${rotateDeg}deg)`,
                zIndex: isSelected ? 30 : idx + 10,
              }}
              className={`absolute bottom-0 w-16 h-22 sm:w-18 sm:h-26 rounded-xs border transition-all duration-150 cursor-pointer overflow-hidden flex flex-col items-center justify-between p-1 shadow-md ${
                isSelected
                  ? 'border-indigo-600 ring-2 ring-indigo-400 bg-indigo-50 shadow-xl'
                  : 'border-[#201d1d]/30 bg-white hover:border-[#201d1d]'
              }`}
            >
              {/* 상단 N 스탯 */}
              <div className="text-[10px] font-black text-center leading-none text-rose-700">
                {card.stats.N}
              </div>

              {/* 중앙 스프라이트 & 좌우 스탯 */}
              <div className="w-full flex items-center justify-between px-0.5 my-auto">
                <span className="text-[9px] font-black text-blue-700">{card.stats.W}</span>
                <div
                  className="w-8 h-8 rounded-xs border border-[#201d1d]/20 shrink-0"
                  style={spriteStyle}
                />
                <span className="text-[9px] font-black text-emerald-700">{card.stats.E}</span>
              </div>

              {/* 하단 S 스탯 */}
              <div className="text-[10px] font-black text-center leading-none text-amber-700">
                {card.stats.S}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
