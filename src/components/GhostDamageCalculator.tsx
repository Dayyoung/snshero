/**
 * GhostDamageCalculator.tsx - SCR-02-17
 * 카드 선택/홀드 시 적 체력바에 예상 감쇄량을 반투명 붉은 고스트 게이지로 선행 시각화하는 계산기
 */

import React from 'react';

interface GhostDamageCalculatorProps {
  currentHp: number;
  maxHp: number;
  previewDamage: number;
}

export const GhostDamageCalculator: React.FC<GhostDamageCalculatorProps> = ({
  currentHp,
  maxHp,
  previewDamage,
}) => {
  const currentPercent = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const remainingAfterDamage = Math.max(0, currentHp - previewDamage);
  const remainingPercent = Math.max(0, Math.min(100, (remainingAfterDamage / maxHp) * 100));
  const ghostPercent = currentPercent - remainingPercent;

  return (
    <div className="w-full flex flex-col gap-1 font-mono select-none">
      <div className="flex justify-between text-[11px] text-slate-300">
        <span>적 체력</span>
        <span>
          {currentHp} / {maxHp}{' '}
          {previewDamage > 0 && (
            <span className="text-rose-400 font-bold">(-{previewDamage})</span>
          )}
        </span>
      </div>

      <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
        {/* Real remaining HP bar */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-emerald-500 transition-all duration-200"
          style={{ width: `${remainingPercent}%` }}
        />

        {/* Ghost Damage Bar */}
        {ghostPercent > 0 && (
          <div
            className="absolute top-0 bottom-0 bg-rose-500/70 animate-pulse transition-all duration-150"
            style={{ left: `${remainingPercent}%`, width: `${ghostPercent}%` }}
          />
        )}
      </div>
    </div>
  );
};
