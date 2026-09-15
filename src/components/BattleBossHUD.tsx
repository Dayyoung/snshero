import React from 'react';
import { Language } from '../types';

interface BattleBossHUDProps {
  bossName: string;
  turnCount: number;
  maxFurySegments?: number;
  language: Language;
}

/**
 * ID 442: PVE / 보스전 보스 분노 게이지(3단계) 및 특수 스킬 예고 텔레그래프 HUD
 */
export const BattleBossHUD: React.FC<BattleBossHUDProps> = ({
  bossName,
  turnCount,
  maxFurySegments = 3,
  language,
}) => {
  const currentFury = (turnCount % maxFurySegments) + 1;
  const isEnraged = currentFury === maxFurySegments;

  const nextSkillNotice = isEnraged
    ? language === 'ko'
      ? '⚠️ [경고] 다음 턴: 화염 전열 참격 (수속성 방어막 추천)'
      : '⚠️ [WARNING] Next Turn: Fire Tile Cleave (Water Shield recommended)'
    : language === 'ko'
      ? '대기: 일반 공격 준비 중'
      : 'Idle: Preparing standard strike';

  return (
    <div className="w-full bg-red-950/70 border border-red-500/50 p-2 font-mono select-none rounded-none text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-red-400 font-black">👹 {bossName}</span>
          <span className="text-[10px] text-red-300/70">[BOSS]</span>
        </div>
        {/* 3-Segment Fury Meter */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-red-400 font-bold mr-1">FURY:</span>
          {Array.from({ length: maxFurySegments }).map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-2 border border-red-500/80 transition-all ${
                idx < currentFury
                  ? isEnraged
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-red-500'
                  : 'bg-red-950/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Telegraph Banner */}
      <div
        className={`text-[10px] py-0.5 px-1.5 border border-dashed rounded-none transition-all ${
          isEnraged
            ? 'bg-red-900/60 border-red-400 text-amber-300 font-bold animate-pulse'
            : 'bg-black/30 border-red-900/50 text-red-300/80'
        }`}
      >
        {nextSkillNotice}
      </div>
    </div>
  );
};
