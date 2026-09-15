/**
 * GuildContributionTrack.tsx
 * 길드 로비 주간 기여도 5단계 마일스톤 보상 트랙 컴포넌트
 * (백로그 ID 455: 길드 로비 주간 기여도 5단계 마일스톤 보상 트랙)
 */

import React, { useState, useEffect } from 'react';
import { Award, Gift, Check, Sparkles } from 'lucide-react';

interface GuildContributionTrackProps {
  language?: string;
  onClaimReward?: (tier: number, rewardType: string, amount: number) => void;
}

interface Milestone {
  tier: number;
  points: number;
  rewardType: 'gold' | 'sns' | 'pack';
  rewardAmount: number;
  labelKo: string;
  labelEn: string;
}

const MILESTONES: Milestone[] = [
  { tier: 1, points: 100, rewardType: 'gold', rewardAmount: 1000, labelKo: '1,000 골드', labelEn: '1,000 Gold' },
  { tier: 2, points: 250, rewardType: 'sns', rewardAmount: 50, labelKo: '50 SNS', labelEn: '50 SNS' },
  { tier: 3, points: 500, rewardType: 'gold', rewardAmount: 3000, labelKo: '3,000 골드', labelEn: '3,000 Gold' },
  { tier: 4, points: 800, rewardType: 'sns', rewardAmount: 150, labelKo: '150 SNS', labelEn: '150 SNS' },
  { tier: 5, points: 1200, rewardType: 'pack', rewardAmount: 1, labelKo: '길드 레전드 팩', labelEn: 'Guild Legend Pack' },
];

export const GuildContributionTrack: React.FC<GuildContributionTrackProps> = ({
  language = 'ko',
  onClaimReward,
}) => {
  const isKo = language === 'ko';
  const [contributionPoints, setContributionPoints] = useState<number>(() => {
    return Number(localStorage.getItem('hero_guild_weekly_contribution') || 650);
  });
  const [claimedTiers, setClaimedTiers] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem('hero_guild_contribution_claimed_tiers');
      return raw ? JSON.parse(raw) : [1, 2];
    } catch {
      return [1, 2];
    }
  });

  const handleClaim = (milestone: Milestone) => {
    if (contributionPoints < milestone.points || claimedTiers.includes(milestone.tier)) return;

    const nextClaimed = [...claimedTiers, milestone.tier];
    setClaimedTiers(nextClaimed);
    localStorage.setItem('hero_guild_contribution_claimed_tiers', JSON.stringify(nextClaimed));

    onClaimReward?.(milestone.tier, milestone.rewardType, milestone.rewardAmount);
  };

  const currentMaxTier = MILESTONES[MILESTONES.length - 1].points;
  const progressPct = Math.min(100, Math.round((contributionPoints / currentMaxTier) * 100));

  return (
    <div className="p-4 bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 rounded-none font-mono space-y-3 select-none text-[#201d1d] dark:text-[#fdfcfc]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          <span className="font-black text-xs uppercase tracking-wider">
            {isKo ? '주간 길드 기여도 마일스톤' : 'Weekly Contribution Track'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
          {contributionPoints} / {currentMaxTier} P
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-stone-200 dark:bg-stone-800 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 5 Milestone Nodes */}
      <div className="grid grid-cols-5 gap-1 pt-1 text-center">
        {MILESTONES.map((m) => {
          const isReached = contributionPoints >= m.points;
          const isClaimed = claimedTiers.includes(m.tier);

          return (
            <div key={m.tier} className="space-y-1">
              <div className="text-[9px] font-bold opacity-75">{m.points}P</div>
              <button
                onClick={() => handleClaim(m)}
                disabled={!isReached || isClaimed}
                className={`w-full py-1.5 px-1 border text-[9px] font-black uppercase transition-all flex flex-col items-center justify-center min-h-[44px] ${
                  isClaimed
                    ? 'bg-stone-200 dark:bg-stone-800 border-stone-300 text-stone-500 cursor-default opacity-60'
                    : isReached
                    ? 'bg-amber-500 hover:bg-amber-400 border-amber-500 text-stone-950 cursor-pointer shadow-xs animate-bounce'
                    : 'bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 opacity-50 cursor-not-allowed'
                }`}
              >
                {isClaimed ? (
                  <Check size={12} className="text-stone-500" />
                ) : (
                  <Gift size={12} className={isReached ? 'text-stone-950' : 'text-stone-400'} />
                )}
                <span className="truncate w-full mt-0.5">{isKo ? m.labelKo : m.labelEn}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
