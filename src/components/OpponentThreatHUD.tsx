import React from 'react';
import { CardData, Language } from '../types';

interface OpponentThreatHUDProps {
  remainingCards: CardData[];
  playedCardsCount: number;
  language: Language;
}

/**
 * ID 431: 상대방 잔여 손패 위협 수치 예측 미니 힌트 위젯
 */
export const OpponentThreatHUD: React.FC<OpponentThreatHUDProps> = ({
  remainingCards,
  playedCardsCount,
  language,
}) => {
  // 공개되지 않은 상태에서 덱의 평균 통계를 기반으로 대략적인 최대 공격력(7~9 등) 계산
  const estimatedMaxPowerRange = React.useMemo(() => {
    if (remainingCards.length === 0) return '0';
    let maxKnown = 6;
    for (const c of remainingCards) {
      const p = c.power || 1000;
      // 4방향 스탯 중 최댓값 추정
      const stats = c.stats;
      if (stats) {
        const top = Math.max(stats.top, stats.right, stats.bottom, stats.left);
        if (top > maxKnown) maxKnown = top;
      }
    }
    const lowBound = Math.max(5, maxKnown - 1);
    const highBound = Math.min(10, maxKnown + 1);
    return `${lowBound}-${highBound}`;
  }, [remainingCards]);

  return (
    <div
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none bg-rose-950/80 border border-rose-500/40 text-[9px] font-mono text-rose-300 backdrop-blur-xs select-none shadow-2xs"
      title={language === 'ko' ? '상대방 잔여 손패 최대 위협치 예측' : 'Estimated Opponent Hand Max Threat Power'}
    >
      <span className="text-rose-400 font-bold">⚠️ THREAT:</span>
      <span className="font-black text-white">{estimatedMaxPowerRange}</span>
    </div>
  );
};
