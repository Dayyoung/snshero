/**
 * LivePointSettlementHUD.tsx
 * 3D 미션 플레이 타임 기반 실시간 SNS 포인트 카운터 HUD & 즉시 정산 배지
 * (구글 스프레드시트 Row 726 / ID 567 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Coins, Sparkles } from 'lucide-react';

interface LivePointSettlementHUDProps {
  isPlaying: boolean;
  basePointsPerMinute?: number;
  difficultyMultiplier?: number;
  bonusPoints?: number;
  language?: string;
  className?: string;
}

export const LivePointSettlementHUD: React.FC<LivePointSettlementHUDProps> = ({
  isPlaying,
  basePointsPerMinute = 50,
  difficultyMultiplier = 1.0,
  bonusPoints = 0,
  language = 'ko',
  className = ''
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const isKo = language === 'ko';

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // 분당 50P 기준 실시간 누적치 (초당 ~0.83P)
  const accumulatedPoints = Math.round(
    ((elapsedSeconds / 60) * basePointsPerMinute * difficultyMultiplier) + bonusPoints
  );

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 bg-black/70 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold rounded-xs shadow-xs ${className}`}>
      <Coins size={12} className="text-amber-400 animate-pulse shrink-0" />
      <span>
        {isKo ? '적립 예정:' : 'ESTIMATED:'} +{accumulatedPoints} SNS
      </span>
      <Sparkles size={10} className="text-amber-400" />
    </div>
  );
};
