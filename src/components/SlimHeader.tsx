/**
 * SlimHeader.tsx
 * 전 플랫폼 design.md 준수 상단 1줄 슬림 리소스 헤더 (Gold, SNS Tokens, AP Stamina)
 * (구글 스프레드시트 Row 1020 / ID 560 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Coins, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { getStaminaState } from '../lib/marketplaceEconomyService';
import { getUserSnsBalance } from '../lib/rewardSettlementService';

interface SlimHeaderProps {
  gold?: number;
  snsPoints?: number;
  onResourceClick?: (resourceType: 'gold' | 'sns' | 'ap') => void;
  language?: string;
  className?: string;
}

export const SlimHeader: React.FC<SlimHeaderProps> = ({
  gold: propGold,
  snsPoints: propSns,
  onResourceClick,
  language = 'ko',
  className = '',
}) => {
  const isKo = language === 'ko';
  const [gold, setGold] = useState<number>(propGold ?? 1500);
  const [sns, setSns] = useState<number>(propSns ?? getUserSnsBalance());
  const [stamina, setStamina] = useState(getStaminaState());

  useEffect(() => {
    if (propGold !== undefined) setGold(propGold);
  }, [propGold]);

  useEffect(() => {
    if (propSns !== undefined) setSns(propSns);
  }, [propSns]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStamina(getStaminaState());
      if (propSns === undefined) {
        setSns(getUserSnsBalance());
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [propSns]);

  const isApOverflow = stamina.currentAp > stamina.maxAp;
  const [showApPopover, setShowApPopover] = useState(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 bg-[#fdfcfc]/95 dark:bg-[#181616]/95 backdrop-blur-md border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] font-mono select-none pointer-events-auto h-11 px-3 flex items-center justify-between text-[11px] ${className}`}
      role="banner"
    >
      {/* Brand / Logo */}
      <div className="flex items-center gap-1.5 font-black text-[#201d1d] dark:text-white">
        <Sparkles size={14} className="text-amber-500" />
        <span className="tracking-tight text-[12px]">SNSHERO</span>
      </div>

      {/* 1-Line Slim Resource Status */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        {/* Gold */}
        <button
          onClick={() => onResourceClick?.('gold')}
          className="flex items-center gap-1 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded-sm border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] text-[#201d1d] dark:text-white cursor-pointer active:scale-95 transition-transform"
          title={isKo ? '보유 골드' : 'Gold'}
        >
          <Coins size={12} className="text-amber-500" />
          <span className="font-bold">{gold.toLocaleString()}</span>
        </button>

        {/* SNS Token */}
        <button
          onClick={() => onResourceClick?.('sns')}
          className="flex items-center gap-1 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded-sm border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] text-purple-700 dark:text-purple-300 font-bold cursor-pointer active:scale-95 transition-transform"
          title={isKo ? 'SNS 포인트 토큰' : 'SNS Tokens'}
        >
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-black">SNS</span>
          <span>{sns.toLocaleString()}P</span>
        </button>

        {/* AP Stamina & ID 458 Overflow Popover */}
        <div className="relative">
          <button
            onClick={() => {
              if (isApOverflow) {
                setShowApPopover(prev => !prev);
              } else {
                onResourceClick?.('ap');
              }
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-sm border cursor-pointer active:scale-95 transition-all ${
              isApOverflow
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-600 dark:text-amber-400 font-black animate-pulse'
                : 'bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] text-cyan-600 dark:text-cyan-400 font-bold'
            }`}
            title={isKo ? (isApOverflow ? 'AP 상한 초과: 자연 회복 정지' : '스태미나 AP') : (isApOverflow ? 'AP Overflow: Recovery paused' : 'Stamina AP')}
          >
            <Zap size={12} className={isApOverflow ? 'text-amber-500 fill-amber-500' : 'text-cyan-500 fill-cyan-500'} />
            <span>
              {stamina.currentAp}/{stamina.maxAp}
            </span>
            {isApOverflow && (
              <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1 rounded-xs uppercase leading-none py-0.5">
                MAX+
              </span>
            )}
          </button>

          {/* ID 458 AP Overflow Popover Tooltip */}
          {showApPopover && isApOverflow && (
            <div className="absolute right-0 top-full mt-2 w-64 p-2.5 bg-[#201d1d] text-[#fdfcfc] border border-amber-500/40 shadow-xl rounded-none z-50 font-mono text-[11px] space-y-1.5 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-white/10 pb-1">
                <span className="font-black text-amber-400 flex items-center gap-1">
                  <Zap size={12} className="fill-amber-400" />
                  {isKo ? '스태미나 초과 충전' : 'AP Overflow Active'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowApPopover(false);
                  }}
                  className="text-stone-400 hover:text-white px-1 text-[10px]"
                >
                  [x]
                </button>
              </div>
              <p className="text-stone-300 leading-snug">
                {isKo
                  ? '현재 AP가 최대 상한을 초과했습니다. 자연 회복이 일시 중단되었습니다. AP를 소모하여 재생을 재개하세요!'
                  : 'Natural recovery paused. Spend AP to resume regeneration!'}
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-amber-300/80 font-bold">
                <span>{stamina.currentAp} / {stamina.maxAp} AP</span>
                <span className="underline cursor-pointer hover:text-amber-200" onClick={() => onResourceClick?.('ap')}>
                  {isKo ? '던전/배틀 플레이하기 →' : 'Spend AP in Battle →'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
