/**
 * CardCompareModal.tsx
 * ID 377: 카드 덱 구성 화면 내 카드 1:1 비교 팝오버
 * - 선택한 2장의 카드 스탯을 상하좌우 방향별로 비교하여 수치 차이를 초록/빨강으로 명확히 표시
 */

import React from 'react';
import { X, ArrowRight, ArrowUp, ArrowDown, ArrowLeft, Swords } from 'lucide-react';
import { CardData, Language } from '../types';
import { CardItem } from './CardItem';

interface CardCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardA: CardData | null;
  cardB: CardData | null;
  language: Language;
}

export const CardCompareModal: React.FC<CardCompareModalProps> = ({
  isOpen,
  onClose,
  cardA,
  cardB,
  language,
}) => {
  if (!isOpen || !cardA || !cardB) return null;

  const getStatDiff = (statA: number, statB: number) => {
    const diff = statA - statB;
    if (diff > 0) {
      return <span className="text-emerald-400 font-bold">+{diff}</span>;
    } else if (diff < 0) {
      return <span className="text-rose-400 font-bold">{diff}</span>;
    }
    return <span className="text-slate-400 font-bold">0</span>;
  };

  const aUp = cardA.stats?.up || cardA.stats?.[0] || 0;
  const aRight = cardA.stats?.right || cardA.stats?.[1] || 0;
  const aDown = cardA.stats?.down || cardA.stats?.[2] || 0;
  const aLeft = cardA.stats?.left || cardA.stats?.[3] || 0;

  const bUp = cardB.stats?.up || cardB.stats?.[0] || 0;
  const bRight = cardB.stats?.right || cardB.stats?.[1] || 0;
  const bDown = cardB.stats?.down || cardB.stats?.[2] || 0;
  const bLeft = cardB.stats?.left || cardB.stats?.[3] || 0;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-sm w-full max-w-md p-5 text-slate-100 font-mono space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Swords size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">
              {language === 'ko' ? '카드 1:1 비교 (Side-by-Side)' : '1:1 Card Comparison'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Dual Card Display */}
        <div className="grid grid-cols-2 gap-4 items-center justify-center pt-1">
          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs font-bold text-indigo-400 truncate max-w-[140px]">
              {cardA.title || cardA.title_en}
            </span>
            <div className="scale-90 origin-top">
              <CardItem card={cardA} language={language} />
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs font-bold text-amber-400 truncate max-w-[140px]">
              {cardB.title || cardB.title_en}
            </span>
            <div className="scale-90 origin-top">
              <CardItem card={cardB} language={language} />
            </div>
          </div>
        </div>

        {/* Directional Stat Comparison Table */}
        <div className="bg-slate-950 border border-slate-800 rounded-xs p-3 space-y-2 text-xs">
          <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
            <span>{language === 'ko' ? '방향' : 'Dir'}</span>
            <span>{cardA.title} vs {cardB.title}</span>
            <span>{language === 'ko' ? '격차' : 'Diff'}</span>
          </div>

          {/* UP */}
          <div className="flex justify-between items-center py-0.5">
            <span className="flex items-center gap-1 text-slate-300">
              <ArrowUp size={12} className="text-indigo-400" /> 상단 (UP)
            </span>
            <span className="font-mono">{aUp} vs {bUp}</span>
            <span>{getStatDiff(aUp, bUp)}</span>
          </div>

          {/* RIGHT */}
          <div className="flex justify-between items-center py-0.5">
            <span className="flex items-center gap-1 text-slate-300">
              <ArrowRight size={12} className="text-indigo-400" /> 우측 (RIGHT)
            </span>
            <span className="font-mono">{aRight} vs {bRight}</span>
            <span>{getStatDiff(aRight, bRight)}</span>
          </div>

          {/* DOWN */}
          <div className="flex justify-between items-center py-0.5">
            <span className="flex items-center gap-1 text-slate-300">
              <ArrowDown size={12} className="text-indigo-400" /> 하단 (DOWN)
            </span>
            <span className="font-mono">{aDown} vs {bDown}</span>
            <span>{getStatDiff(aDown, bDown)}</span>
          </div>

          {/* LEFT */}
          <div className="flex justify-between items-center py-0.5">
            <span className="flex items-center gap-1 text-slate-300">
              <ArrowLeft size={12} className="text-indigo-400" /> 좌측 (LEFT)
            </span>
            <span className="font-mono">{aLeft} vs {bLeft}</span>
            <span>{getStatDiff(aLeft, bLeft)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xs cursor-pointer"
        >
          {language === 'ko' ? '닫기' : 'Close'}
        </button>
      </div>
    </div>
  );
};
