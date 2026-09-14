/**
 * BattleTacticalThreatOverlay.tsx
 * 배틀 보드 전술 시각 가이드 오버레이
 * - ID 346: 상대 턴 중 아군 카드가 2장 이상 뒤집힐 수 있는 위험 슬롯 붉은 점선 오버레이
 * - ID 406: 카드 드래그 시 인접 상대 카드의 약점 방향 수치 맥동 하이라이트
 * - ID 391: 연쇄 뒤집기 방향성 벡터 화살표
 * - ID 411: 카드 뒤집힘 판정 수치 비교 툴팁 [8 > 6 (+2)]
 */

import React from 'react';
import { AlertTriangle, ArrowRight, ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { CardData } from '../types';

export interface ThreatSlotInfo {
  index: number;
  threatLevel: number; // 2장 이상 뒤집힐 위험
}

export interface StatComparisonBadgeInfo {
  slotIndex: number;
  attackerStat: number;
  defenderStat: number;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  diff: number;
}

interface BattleTacticalThreatOverlayProps {
  threatSlots?: ThreatSlotInfo[];
  statComparisonBadge?: StatComparisonBadgeInfo | null;
  draggingCard?: CardData | null;
  boardState?: (CardData | null)[];
  slotIndex: number;
}

export const BattleTacticalThreatOverlay: React.FC<BattleTacticalThreatOverlayProps> = ({
  threatSlots = [],
  statComparisonBadge = null,
  draggingCard = null,
  boardState = [],
  slotIndex,
}) => {
  // 1. ID 346: 위험 슬롯 검사
  const isThreatSlot = threatSlots.some((t) => t.index === slotIndex && t.threatLevel >= 2);

  // 2. ID 406: 인접 상대 카드의 약점 방향 분석
  // 슬롯에 카드가 있고 상대방 카드일 때, 드래그 중인 카드의 대향 수치보다 낮으면 약점으로 표시
  const currentCard = boardState[slotIndex];
  const isOpponentCard = currentCard && currentCard.owner === 'opponent';

  // 3. ID 411: 수치 비교 툴팁
  const isTargetBadge = statComparisonBadge && statComparisonBadge.slotIndex === slotIndex;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
      {/* ID 346: 상대 공격 위험 슬롯 붉은 점선 테두리 */}
      {isThreatSlot && !currentCard && (
        <div className="absolute inset-0 border-2 border-dashed border-rose-500/80 bg-rose-500/10 rounded-sm animate-pulse flex items-center justify-center">
          <div className="flex items-center gap-0.5 px-1 py-0.5 bg-rose-950/90 text-rose-300 font-mono text-[9px] border border-rose-500/50 rounded-xs shadow-xs">
            <AlertTriangle size={10} className="text-rose-400 animate-bounce" />
            <span>위험 지역</span>
          </div>
        </div>
      )}

      {/* ID 406: 드래그 중 상대 카드의 약점 방향 글로우 */}
      {isOpponentCard && draggingCard && (
        <div className="absolute inset-0 flex flex-col justify-between p-1">
          {/* 상단 약점 */}
          {draggingCard.stats.down > (currentCard.stats?.up || 0) && (
            <div className="w-full flex justify-center">
              <span className="w-2 h-1 bg-emerald-400 rounded-full animate-ping opacity-75" />
            </div>
          )}
          <div className="flex justify-between items-center w-full">
            {/* 좌측 약점 */}
            {draggingCard.stats.right > (currentCard.stats?.left || 0) && (
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-ping opacity-75" />
            )}
            {/* 우측 약점 */}
            {draggingCard.stats.left > (currentCard.stats?.right || 0) && (
              <span className="w-1 h-2 bg-emerald-400 rounded-full animate-ping opacity-75" />
            )}
          </div>
          {/* 하단 약점 */}
          {draggingCard.stats.up > (currentCard.stats?.down || 0) && (
            <div className="w-full flex justify-center">
              <span className="w-2 h-1 bg-emerald-400 rounded-full animate-ping opacity-75" />
            </div>
          )}
        </div>
      )}

      {/* ID 411 & ID 391: 판정 수치 비교 일시 툴팁 & 방향 벡터 화살표 */}
      {isTargetBadge && statComparisonBadge && (
        <div className="absolute z-30 flex items-center gap-1 px-1.5 py-0.5 bg-indigo-950/95 border border-indigo-400 text-indigo-100 rounded-xs shadow-lg font-mono text-[10px] animate-bounce">
          {statComparisonBadge.direction === 'RIGHT' && <ArrowRight size={10} className="text-emerald-400" />}
          {statComparisonBadge.direction === 'LEFT' && <ArrowLeft size={10} className="text-emerald-400" />}
          {statComparisonBadge.direction === 'DOWN' && <ArrowDown size={10} className="text-emerald-400" />}
          {statComparisonBadge.direction === 'UP' && <ArrowUp size={10} className="text-emerald-400" />}
          <span className="font-bold text-emerald-400">{statComparisonBadge.attackerStat}</span>
          <span className="text-slate-400">&gt;</span>
          <span className="text-rose-400">{statComparisonBadge.defenderStat}</span>
          <span className="text-amber-300 text-[9px]">(+{statComparisonBadge.diff})</span>
        </div>
      )}
    </div>
  );
};
