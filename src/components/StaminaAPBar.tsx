/**
 * StaminaAPBar.tsx
 * 모바일 최적화 1줄 스태미나 AP 게이지 & 실시간 자연 충전 타이머 바
 * (구글 스프레드시트 Row 705 / ID 554 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Zap, PlusCircle } from 'lucide-react';
import { getStaminaState, StaminaState } from '../lib/marketplaceEconomyService';

interface StaminaAPBarProps {
  language?: string;
  onChargeClick?: () => void;
  className?: string;
}

export const StaminaAPBar: React.FC<StaminaAPBarProps> = ({
  language = 'ko',
  onChargeClick,
  className = ''
}) => {
  const [stamina, setStamina] = useState<StaminaState>(getStaminaState);
  const isKo = language === 'ko';

  useEffect(() => {
    const interval = setInterval(() => {
      setStamina(getStaminaState());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const pct = Math.min(100, Math.max(0, (stamina.currentAp / stamina.maxAp) * 100));

  return (
    <div className={`flex items-center gap-2 bg-[#201d1d] text-white px-2.5 py-1 border border-cyan-500/40 font-mono text-[10px] select-none rounded-none shadow-xs ${className}`}>
      <div className="flex items-center gap-1 text-cyan-400 font-black">
        <Zap size={12} className="animate-pulse fill-cyan-400" />
        <span>AP</span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="w-16 sm:w-24 bg-black/80 h-2 border border-cyan-500/30 overflow-hidden relative">
          <div
            className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-bold text-cyan-200">
          {stamina.currentAp}/{stamina.maxAp}
        </span>
      </div>

      {onChargeClick && (
        <button
          onClick={onChargeClick}
          className="text-cyan-400 hover:text-cyan-200 transition-colors ml-0.5 cursor-pointer"
          title={isKo ? '스태미나 충전' : 'Recharge AP'}
        >
          <PlusCircle size={13} />
        </button>
      )}
    </div>
  );
};
