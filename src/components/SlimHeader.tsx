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
      <div className="flex items-center gap-2 sm:gap-3">
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

        {/* AP Stamina */}
        <button
          onClick={() => onResourceClick?.('ap')}
          className="flex items-center gap-1 bg-[rgba(15,0,0,0.04)] dark:bg-[rgba(255,255,255,0.06)] px-2 py-1 rounded-sm border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] text-cyan-600 dark:text-cyan-400 font-bold cursor-pointer active:scale-95 transition-transform"
          title={isKo ? '스태미나 AP' : 'Stamina AP'}
        >
          <Zap size={12} className="text-cyan-500 fill-cyan-500" />
          <span>
            {stamina.currentAp}/{stamina.maxAp}
          </span>
        </button>
      </div>
    </header>
  );
};
