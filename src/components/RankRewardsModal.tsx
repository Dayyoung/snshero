import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Trophy, Gift, Sparkles, X, Shield, Crown } from 'lucide-react';
import { Language } from '../types';
import { cn } from '../lib/utils';

interface RankRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface TierReward {
  tierName: string;
  minRank: string;
  snsPoints: number;
  badgeName: string;
  cardPacks: string;
  color: string;
  badgeBg: string;
}

const TIER_REWARDS: TierReward[] = [
  {
    tierName: 'Grandmaster (1위 ~ 10위)',
    minRank: 'Top 10',
    snsPoints: 50000,
    badgeName: '👑 시즌 챔피언 트로피 & 한정 배지',
    cardPacks: '전설 컬렉터 카드팩 x10',
    color: 'from-amber-400 to-yellow-500 text-slate-950',
    badgeBg: 'bg-amber-500'
  },
  {
    tierName: 'Master (11위 ~ 50위)',
    minRank: 'Top 50',
    snsPoints: 25000,
    badgeName: '🥇 마스터 랭커 배지',
    cardPacks: 'SSR 히어로 카드팩 x5',
    color: 'from-purple-500 to-indigo-600 text-white',
    badgeBg: 'bg-purple-600'
  },
  {
    tierName: 'Diamond (51위 ~ 100위)',
    minRank: 'Top 100',
    snsPoints: 12000,
    badgeName: '💎 다이아몬드 헌터 배지',
    cardPacks: '프리미엄 카드팩 x3',
    color: 'from-cyan-400 to-blue-500 text-white',
    badgeBg: 'bg-cyan-500'
  },
  {
    tierName: 'Platinum (상위 10%)',
    minRank: 'Top 10%',
    snsPoints: 6000,
    badgeName: '⚔️ 플래티넘 도전자 배지',
    cardPacks: '고급 카드팩 x2',
    color: 'from-slate-300 to-slate-400 text-slate-900',
    badgeBg: 'bg-slate-400'
  },
  {
    tierName: 'Gold (상위 25%)',
    minRank: 'Top 25%',
    snsPoints: 3000,
    badgeName: '🎖️ 골드 파이터 배지',
    cardPacks: '일반 카드팩 x3',
    color: 'from-yellow-400 to-amber-500 text-slate-900',
    badgeBg: 'bg-yellow-500'
  },
  {
    tierName: 'Silver & Bronze (전체 참가자)',
    minRank: 'Participation',
    snsPoints: 1000,
    badgeName: '🎗️ 시즌1 참가자 기념 배지',
    cardPacks: '시작 카드팩 x1',
    color: 'from-slate-200 to-slate-300 text-slate-800',
    badgeBg: 'bg-slate-300'
  }
];

export const RankRewardsModal: React.FC<RankRewardsModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-md">
                <Crown size={22} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {language === 'ko' ? '시즌 랭킹 보상 안내 (Rank Rewards)' : 'Season Leaderboard Rewards'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {language === 'ko' ? '시즌 종료 시 정산 후 티어에 따라 지급되는 보상 목록입니다.' : 'Rewards granted upon season completion based on rank.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Reward Tiers List */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            {TIER_REWARDS.map((tier, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 transition-all space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "px-3 py-1 rounded-xl text-xs font-black uppercase shadow-xs bg-gradient-to-r",
                    tier.color
                  )}>
                    {tier.tierName}
                  </span>
                  <span className="text-xs font-black text-amber-600">
                    +{tier.snsPoints.toLocaleString()} SNS Points
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold text-slate-700 pt-1">
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200/60">
                    <Award size={15} className="text-indigo-600 shrink-0" />
                    <span className="truncate">{tier.badgeName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200/60">
                    <Gift size={15} className="text-amber-500 shrink-0" />
                    <span className="truncate">{tier.cardPacks}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-right">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-black hover:bg-slate-800 transition-all cursor-pointer"
            >
              {language === 'ko' ? '확인' : 'OK'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
