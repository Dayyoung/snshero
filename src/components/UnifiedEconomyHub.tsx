/**
 * UnifiedEconomyHub.tsx
 * 일일 퀘스트 마일스톤 및 스태미나(AP) 페이싱 연동 '통합 SNS 보상 정산 허브'
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 1006 / ID 554 요구사항 구현)
 */

import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Zap, X, Check, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { StaminaPacingService, EconomyHubState } from '../lib/staminaPacingService';

interface UnifiedEconomyHubProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const UnifiedEconomyHub: React.FC<UnifiedEconomyHubProps> = ({
  isOpen,
  onClose,
  language = 'ko',
}) => {
  const isKo = language === 'ko';
  const service = StaminaPacingService.getInstance();
  const [state, setState] = useState<EconomyHubState>(service.getState());

  useEffect(() => {
    if (isOpen) {
      setState(service.getState());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClaim = (tier: number) => {
    const res = service.claimMilestone(tier);
    if (res.success) {
      setState(service.getState());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-mono select-none">
      <div className="w-full max-w-md bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d] dark:border-white rounded-none p-4 text-[#201d1d] dark:text-[#fdfcfc] flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] pb-2">
          <div className="flex items-center gap-1.5">
            <Trophy size={16} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-black">
              {isKo ? '일일 활동 마일스톤 & 정산 허브' : 'Daily Economy Milestone Hub'}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-1 text-[#6e6e73] hover:text-[#201d1d] dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 1. 50회 가챠 천장 카운터 */}
        <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-purple-950 dark:text-purple-200">
                {isKo ? '전설 소환 50회 확정 천장' : 'Legendary 50-Pull Pity'}
              </span>
              <span className="text-[10px] text-purple-700 dark:text-purple-400">
                {50 - state.gachaPityCount}회 후 최고 등급 100% 보장
              </span>
            </div>
          </div>
          <span className="text-sm font-black text-purple-700 dark:text-purple-300">
            {state.gachaPityCount} / 50
          </span>
        </div>

        {/* 2. 오늘 활동 점수 게이지 */}
        <div className="flex flex-col gap-1 bg-[rgba(15,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)] p-3 rounded-sm border border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>{isKo ? '오늘의 활동 점수' : 'Active Points'}</span>
            <span className="text-blue-600 dark:text-blue-400 font-black">
              {state.currentActivityPoints} / 100 PT
            </span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-none overflow-hidden mt-1">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${state.currentActivityPoints}%` }}
            />
          </div>
        </div>

        {/* 3. 티어별 마일스톤 보상 목록 */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#555] dark:text-[#ccc]">
            {isKo ? '일일 활동 보상 티어' : 'Active Reward Tiers'}
          </span>
          {state.milestones.map((m) => (
            <div
              key={m.pointsRequired}
              className={`p-2.5 border rounded-sm flex items-center justify-between text-xs transition-colors ${
                m.isClaimed
                  ? 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-400'
                  : m.canClaim
                  ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-400'
                  : 'bg-white dark:bg-[#201d1d] border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[11px] px-1.5 py-0.5 bg-black/5 dark:bg-white/5 rounded-xs">
                  {m.pointsRequired} PT
                </span>
                <div className="flex items-center gap-1.5 font-bold">
                  <Gift size={13} className="text-amber-600" />
                  <span>+{m.rewardSns} SNS</span>
                  <span className="text-blue-600 dark:text-blue-400 text-[11px]">
                    (+{m.rewardAp} AP)
                  </span>
                </div>
              </div>

              {m.isClaimed ? (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-neutral-500">
                  <Check size={12} /> {isKo ? '수령 완료' : 'Claimed'}
                </span>
              ) : (
                <button
                  onClick={() => handleClaim(m.pointsRequired)}
                  disabled={!m.canClaim}
                  className={`px-2.5 py-1 text-[11px] font-black rounded-sm active:scale-95 cursor-pointer ${
                    m.canClaim
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm animate-pulse'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  {isKo ? '수령' : 'Claim'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-2 text-xs font-black bg-[#201d1d] text-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#201d1d] rounded-sm active:scale-98 cursor-pointer mt-1"
        >
          {isKo ? '확인 및 닫기' : 'Close'}
        </button>
      </div>
    </div>
  );
};
