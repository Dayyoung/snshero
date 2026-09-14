/**
 * BattleDeckCardStack.tsx
 * ID 401: 대전 중 양측 플레이어 핸드 잔여 매수 및 덱 뭉치 시각적 카드 스택 렌더링
 * - 남은 카드 수에 비례하여 동적으로 겹쳐지는 덱 두께감 (Layered Card Stack)
 * - 슬릭한 카드 뒷면 및 모노스페이스 수량 뱃지
 */

import React from 'react';
import { Layers } from 'lucide-react';

interface BattleDeckCardStackProps {
  remainingCount: number;
  maxCount?: number;
  isOpponent?: boolean;
  className?: string;
}

export const BattleDeckCardStack: React.FC<BattleDeckCardStackProps> = ({
  remainingCount,
  maxCount = 5,
  isOpponent = false,
  className = '',
}) => {
  const count = Math.max(0, Math.min(maxCount, remainingCount));

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      title={`${isOpponent ? '상대' : '내'} 잔여 덱: ${count}장`}
    >
      {/* 덱 스택 레이어 (남은 장수만큼 미세한 오프셋 겹침) */}
      <div className="relative w-8 h-12 flex items-center justify-center">
        {Array.from({ length: count }).map((_, i) => {
          const offset = i * 1.5;
          return (
            <div
              key={i}
              className={`absolute w-7 h-10 rounded-xs border transition-all duration-300 ${
                isOpponent
                  ? 'bg-rose-950/80 border-rose-600/50 shadow-xs'
                  : 'bg-indigo-950/80 border-indigo-500/50 shadow-xs'
              }`}
              style={{
                transform: `translateY(-${offset}px) translateX(${offset * 0.4}px)`,
                zIndex: i,
              }}
            >
              {/* 카드 뒷면 격자 패턴 */}
              <div className="w-full h-full flex items-center justify-center opacity-30">
                <div className="w-3 h-5 border border-dashed border-white/40 rounded-[1px]" />
              </div>
            </div>
          );
        })}

        {count === 0 && (
          <div className="w-7 h-10 rounded-xs border border-dashed border-slate-700 flex items-center justify-center opacity-40">
            <span className="text-[9px] font-mono text-slate-500">0</span>
          </div>
        )}
      </div>

      {/* 남은 장수 수량 뱃지 */}
      <div className="absolute -bottom-1.5 flex items-center gap-0.5 px-1 py-0.2 bg-slate-900/95 border border-slate-700 text-[9px] font-mono text-slate-300 rounded-xs z-20 shadow-xs">
        <Layers size={9} className={isOpponent ? 'text-rose-400' : 'text-indigo-400'} />
        <span>{count}</span>
      </div>
    </div>
  );
};
