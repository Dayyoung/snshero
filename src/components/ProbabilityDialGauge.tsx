/**
 * ProbabilityDialGauge.tsx - SCR-08-20
 * 슬롯 중앙 실시간 확률 비중 3색(대성공, 성공, 실패) 원형 게이지 다이얼
 */

import React from 'react';

interface ProbabilityDialGaugeProps {
  greatSuccessRate: number; // 0 - 100
  successRate: number;      // 0 - 100
  failRate: number;         // 0 - 100
  size?: number;
}

export const ProbabilityDialGauge: React.FC<ProbabilityDialGaugeProps> = ({
  greatSuccessRate,
  successRate,
  failRate,
  size = 120,
}) => {
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;

  const greatOffset = 0;
  const greatDash = (greatSuccessRate / 100) * circumference;

  const successOffset = -greatDash;
  const successDash = (successRate / 100) * circumference;

  const failOffset = -(greatDash + successDash);
  const failDash = (failRate / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center font-mono select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="10"
        />
        {/* Great Success (Amber) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="10"
          strokeDasharray={`${greatDash} ${circumference}`}
          strokeDashoffset={greatOffset}
        />
        {/* Success (Emerald) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth="10"
          strokeDasharray={`${successDash} ${circumference}`}
          strokeDashoffset={successOffset}
        />
        {/* Fail (Rose) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="10"
          strokeDasharray={`${failDash} ${circumference}`}
          strokeDashoffset={failOffset}
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-[10px] text-slate-400">성공률</span>
        <span className="text-sm font-black text-white">{greatSuccessRate + successRate}%</span>
      </div>
    </div>
  );
};
