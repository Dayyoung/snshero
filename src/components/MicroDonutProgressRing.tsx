/**
 * MicroDonutProgressRing.tsx - SCR-11-17
 * 카드 좌측에 실시간 잔여 진척도를 보여주는 마이크로 도넛 링
 */

import React from 'react';

interface MicroDonutProgressRingProps {
  progressPercent: number;
  size?: number;
  strokeWidth?: number;
}

export const MicroDonutProgressRing: React.FC<MicroDonutProgressRingProps> = ({
  progressPercent,
  size = 28,
  strokeWidth = 3,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center font-mono select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke="#f59e0b"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-[8px] font-black text-amber-400">
        {Math.round(progressPercent)}%
      </span>
    </div>
  );
};
