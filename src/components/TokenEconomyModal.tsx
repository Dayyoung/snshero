/**
 * TokenEconomyModal.tsx
 * 50회 소환 확정 천장(Pity) 및 경매장 실시간 수수료 바이백/소각 순환 경제 모달
 * (구글 스프레드시트 Row 693 / ID 562 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Coins, RefreshCw, Sparkles, TrendingUp, ShieldCheck, X, Award } from 'lucide-react';
import { TokenEconomyState, loadTokenEconomyState } from '../lib/tokenEconomyPacing';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

interface TokenEconomyModalProps {
  isOpen: boolean;
  onClose: () => void;
  season?: string;
  language?: string;
}

export const TokenEconomyModal: React.FC<TokenEconomyModalProps> = ({
  isOpen,
  onClose,
  season = 'season1',
  language = 'ko'
}) => {
  const isKo = language === 'ko';
  const [state, setState] = useState<TokenEconomyState>(() => loadTokenEconomyState(season));

  useEffect(() => {
    const handleUpdate = () => {
      setState(loadTokenEconomyState(season));
    };

    window.addEventListener('hero_token_economy_updated', handleUpdate);
    return () => window.removeEventListener('hero_token_economy_updated', handleUpdate);
  }, [season]);

  if (!isOpen) return null;

  const pityPercent = Math.min(100, Math.round((state.pityCount / 50) * 100));

  return (
    <div className="fixed inset-0 z-[9999] bg-[#201d1d]/80 flex items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#fdfcfc] text-[#201d1d] border-2 border-[#201d1d] w-full max-w-lg p-5 flex flex-col justify-between shadow-2xl relative rounded-none max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#201d1d]/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#201d1d] text-[#fdfcfc]">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight uppercase">
                {isKo ? '토큰 바이백 & 소환 천장 시스템' : 'TOKEN BUYBACK & SUMMON PITY'}
              </h2>
              <p className="text-[10px] text-[#201d1d]/60">
                {isKo ? '선순환 지속형 SNS 경제 모델 & 50연차 확정 천장' : 'Sustainable SNS Economy & 50-Pull Guaranteed Pity'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-[#201d1d] hover:bg-[#201d1d]/10 text-xs font-bold cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. 50-Pull Legendary Summon Pity Gauge */}
        <div className="my-4 p-3.5 bg-[#201d1d]/5 border border-[#201d1d]">
          <div className="flex justify-between items-center text-xs font-bold mb-1.5">
            <span className="flex items-center gap-1">
              <Award size={14} className="text-amber-800" />
              {isKo ? '50회 소환 전설(UR) 확정 천장 (Pity)' : '50-Pull Guaranteed Legendary Pity'}
            </span>
            <span className="text-amber-900 font-black">
              {state.pityCount} / 50 PULLS ({pityPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-stone-200 border border-[#201d1d]/30 overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
              style={{ width: `${pityPercent}%` }}
            />
          </div>

          <div className="mt-2 text-[10px] text-[#201d1d]/70 flex justify-between">
            <span>
              {isKo ? '미션으로 획득한 SNS 포인트로 소환 가능' : 'Summon using SNS Points earned from missions'}
            </span>
            <span className="font-bold">
              {50 - state.pityCount} {isKo ? '회 남음' : 'pulls left'}
            </span>
          </div>
        </div>

        {/* 2. Marketplace Fee Buyback & Burn Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
          {/* Burned Tokens */}
          <div className="p-3 border border-[#201d1d] bg-[#fdfcfc] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#201d1d]/70 text-[10px] font-bold uppercase mb-1">
              <span className="flex items-center gap-1">
                <Flame size={13} className="text-red-600" />
                {isKo ? '누적 소각된 SNS' : 'TOTAL BURNED SNS'}
              </span>
              <span className="text-red-700 bg-red-50 px-1 py-0.5 border border-red-200">50% BURN</span>
            </div>
            <div className="text-lg font-black text-red-700">
              🔥 {state.totalBurnedSns.toLocaleString()} SNS
            </div>
            <p className="text-[9px] text-[#201d1d]/60 mt-1">
              {isKo ? '거래 수수료의 50%가 영구 소각되어 가치를 방어합니다.' : '50% of trade fees are permanently burned.'}
            </p>
          </div>

          {/* Weekly Prize Pool */}
          <div className="p-3 border border-[#201d1d] bg-[#fdfcfc] flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#201d1d]/70 text-[10px] font-bold uppercase mb-1">
              <span className="flex items-center gap-1">
                <Trophy size={13} className="text-amber-600" />
                {isKo ? '주간 랭킹 상금 풀' : 'WEEKLY PRIZE POOL'}
              </span>
              <span className="text-amber-800 bg-amber-50 px-1 py-0.5 border border-amber-200">50% REWARD</span>
            </div>
            <div className="text-lg font-black text-amber-900">
              🏆 {state.weeklyPrizePoolSns.toLocaleString()} SNS
            </div>
            <p className="text-[9px] text-[#201d1d]/60 mt-1">
              {isKo ? '거래 수수료의 50%가 상위 랭커 보상으로 환원됩니다.' : '50% of trade fees reward weekly rankers.'}
            </p>
          </div>
        </div>

        {/* 3. Transaction Volume Telemetry */}
        <div className="bg-[#201d1d]/5 border border-[#201d1d]/20 p-2.5 text-[11px] mb-4 space-y-1">
          <div className="flex justify-between text-[#201d1d]/80">
            <span>{isKo ? '• P2P 거래소 총 거래액' : '• Total P2P Trade Volume'}</span>
            <span className="font-bold">{state.totalMarketplaceVolume.toLocaleString()} SNS</span>
          </div>
          <div className="flex justify-between text-[#201d1d]/80">
            <span>{isKo ? '• 거래소 총 수수료 징수 (5%)' : '• Total Fees Collected (5%)'}</span>
            <span className="font-bold">{state.totalMarketplaceFeesCollected.toLocaleString()} SNS</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-[#201d1d] hover:bg-stone-800 text-[#fdfcfc] text-xs font-bold rounded-sm cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
        >
          <ShieldCheck size={14} />
          <span>{isKo ? '확인 완료' : 'Confirm'}</span>
        </button>
      </div>
    </div>
  );
};
