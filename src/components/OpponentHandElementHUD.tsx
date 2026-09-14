/**
 * OpponentHandElementHUD.tsx
 * ID 336: 대전 중 상대방 잔여 손패 수 및 속성 분포 힌트 HUD 미니 인디케이터
 * - 상대 아바타 주변에 미사용 5슬롯 카드랙 렌더링
 * - 스카우트/공개된 카드 정보를 바탕으로 은은한 속성 글로우 틴트 및 속성 요약 배지 표시
 */

import React from 'react';
import { Shield, Sparkles } from 'lucide-react';
import { CardData } from '../types';

interface OpponentHandElementHUDProps {
  remainingCount: number;
  totalHandSize?: number;
  knownElements?: string[]; // e.g. ['FIRE', 'WATER', 'EARTH']
  opponentCards?: CardData[];
}

export const OpponentHandElementHUD: React.FC<OpponentHandElementHUDProps> = ({
  remainingCount,
  totalHandSize = 5,
  knownElements = [],
  opponentCards = [],
}) => {
  // 상대방 덱/패의 알려진 속성 카운트 집계
  const elementCounts: Record<string, number> = {};
  
  if (knownElements.length > 0) {
    knownElements.forEach((el) => {
      elementCounts[el] = (elementCounts[el] || 0) + 1;
    });
  } else if (opponentCards.length > 0) {
    opponentCards.forEach((c) => {
      const el = c.element || 'NEUTRAL';
      elementCounts[el] = (elementCounts[el] || 0) + 1;
    });
  }

  const getElementColor = (el?: string) => {
    switch (el) {
      case 'FIRE':
        return 'border-rose-500/60 bg-rose-500/20 text-rose-300';
      case 'WATER':
        return 'border-sky-500/60 bg-sky-500/20 text-sky-300';
      case 'EARTH':
      case 'NATURE':
        return 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300';
      case 'LIGHT':
        return 'border-amber-400/60 bg-amber-400/20 text-amber-200';
      default:
        return 'border-slate-600/50 bg-slate-800/40 text-slate-400';
    }
  };

  const getElementBadge = (el: string, count: number) => {
    let name = '무';
    if (el === 'FIRE') name = '화';
    if (el === 'WATER') name = '수';
    if (el === 'EARTH' || el === 'NATURE') name = '지';
    if (el === 'LIGHT') name = '광';

    return (
      <span
        key={el}
        className={`px-1 py-0.5 text-[10px] font-mono rounded-xs border ${getElementColor(el)}`}
      >
        {name} {count}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center gap-1.5 py-1 px-2 bg-slate-900/80 backdrop-blur-xs border border-slate-700/60 rounded-sm select-none">
      {/* 5-Slot Hand Rack */}
      <div className="flex items-center gap-1">
        {Array.from({ length: totalHandSize }).map((_, idx) => {
          const isRemaining = idx < remainingCount;
          const assignedElement = knownElements[idx] || (opponentCards[idx]?.element);

          return (
            <div
              key={idx}
              className={`relative w-4 h-6 rounded-xs border transition-all duration-300 flex items-center justify-center ${
                isRemaining
                  ? `${getElementColor(assignedElement)} shadow-xs`
                  : 'border-slate-800 bg-slate-900/40 opacity-30'
              }`}
              title={isRemaining ? `상대 카드 ${idx + 1}` : '사용됨'}
            >
              {isRemaining && (
                <div className="w-1.5 h-2 rounded-[1px] bg-indigo-500/40 border border-indigo-400/30" />
              )}
            </div>
          );
        })}
      </div>

      {/* 속성 분포 힌트 태그 */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
          <Shield size={10} className="text-slate-500" />
          {remainingCount}장
        </span>
        {Object.entries(elementCounts).length > 0 && (
          <div className="flex items-center gap-1 ml-1 border-l border-slate-700 pl-1">
            <Sparkles size={10} className="text-amber-400" />
            {Object.entries(elementCounts).slice(0, 3).map(([el, cnt]) => getElementBadge(el, cnt))}
          </div>
        )}
      </div>
    </div>
  );
};
