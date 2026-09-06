/**
 * StaminaRecoveryBar.tsx
 * 실시간 AP 자연 회복 카운트다운 타이머 바 & 마켓 수수료 환원 풀 뷰
 * (구글 스프레드시트 Row 1022 / ID 562 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Zap, Clock, Coins, Info, PlusCircle } from 'lucide-react';
import { TokenEconomyService } from '../lib/tokenEconomyService';
import { getStaminaState } from '../lib/marketplaceEconomyService';

interface StaminaRecoveryBarProps {
  language?: string;
  onRechargeClick?: () => void;
  className?: string;
}

export const StaminaRecoveryBar: React.FC<StaminaRecoveryBarProps> = ({
  language = 'ko',
  onRechargeClick,
  className = '',
}) => {
  const isKo = language === 'ko';
  const service = TokenEconomyService.getInstance();

  const [apTelemetry, setApTelemetry] = useState(() => {
    const raw = getStaminaState();
    return service.getApRecoveryTelemetry(raw.currentAp, raw.maxAp);
  });
  const [showDetail, setShowDetail] = useState(false);
  const economyState = service.getState();

  useEffect(() => {
    const timer = setInterval(() => {
      const raw = getStaminaState();
      setApTelemetry(service.getApRecoveryTelemetry(raw.currentAp, raw.maxAp));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isFull = apTelemetry.currentAp >= apTelemetry.maxAp;

  return (
    <div className={`relative font-mono select-none ${className}`}>
      {/* 1줄 슬림 카운트다운 바 */}
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-1.5 bg-[#201d1d] text-white px-2 py-1 border border-cyan-500/40 rounded-sm text-[10px] cursor-pointer hover:border-cyan-400 active:scale-98 transition-all"
        title={isKo ? '스태미나 회복 정보' : 'Stamina Recovery Info'}
      >
        <Zap size={11} className="text-cyan-400 fill-cyan-400 animate-pulse" />
        <span className="font-bold text-cyan-200">
          {apTelemetry.currentAp}/{apTelemetry.maxAp}
        </span>

        {/* 회복 프로그레스 바 */}
        <div className="w-12 sm:w-16 bg-black/70 h-1.5 border border-cyan-500/30 overflow-hidden relative rounded-xs">
          <div
            className="bg-cyan-400 h-full transition-all duration-300"
            style={{ width: `${isFull ? 100 : apTelemetry.progressPct}%` }}
          />
        </div>

        {/* 타이머 카운트다운 */}
        <div className="flex items-center gap-0.5 text-cyan-300 text-[9px]">
          <Clock size={10} />
          <span>{apTelemetry.formattedCountdown}</span>
        </div>

        {onRechargeClick && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRechargeClick();
            }}
            className="ml-0.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            title={isKo ? 'AP 충전' : 'Recharge'}
          >
            <PlusCircle size={11} />
          </span>
        )}
      </button>

      {/* 수수료 환원 및 AP 회복 상세 팝업 */}
      {showDetail && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d] dark:border-white p-3 z-50 rounded-none shadow-lg text-[#201d1d] dark:text-[#fdfcfc] text-[11px] flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] pb-1.5">
            <span className="font-black text-xs flex items-center gap-1">
              <Zap size={13} className="text-cyan-500" />
              {isKo ? '스태미나 & 경제 풀 현황' : 'Stamina & Economy Telemetry'}
            </span>
            <button
              onClick={() => setShowDetail(false)}
              className="text-[#888] hover:text-[#201d1d] dark:hover:text-white cursor-pointer"
            >
              [x]
            </button>
          </div>

          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between text-[#555] dark:text-[#aaa]">
              <span>{isKo ? '자연 회복 속도' : 'Auto Recovery'}</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">5분당 +1 AP</span>
            </div>
            <div className="flex justify-between text-[#555] dark:text-[#aaa]">
              <span>{isKo ? '다음 충전까지' : 'Next In'}</span>
              <span className="font-bold">{apTelemetry.formattedCountdown}</span>
            </div>
          </div>

          <div className="border-t border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] pt-2 flex flex-col gap-1 text-[10px]">
            <div className="flex items-center gap-1 font-bold text-purple-700 dark:text-purple-300">
              <Coins size={12} className="text-amber-500" />
              <span>{isKo ? '마켓 수수료 환원 풀 (50%)' : 'Fee Cashback Pool (50%)'}</span>
            </div>
            <p className="text-[#666] dark:text-[#aaa] text-[9px] leading-tight">
              {isKo
                ? '마켓 카드 거래 수수료(5%)의 절반이 일일 미션 보상 풀로 자동 재분배됩니다.'
                : '50% of market trade fees are routed back to daily active mission pools.'}
            </p>
            <div className="bg-purple-50 dark:bg-purple-950/40 p-1.5 rounded-sm flex justify-between font-bold">
              <span>{isKo ? '현재 풀 누적액' : 'Pool Balance'}:</span>
              <span className="text-purple-600 dark:text-purple-400">
                +{economyState.missionRewardPoolBalance.toLocaleString()} SNS
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
