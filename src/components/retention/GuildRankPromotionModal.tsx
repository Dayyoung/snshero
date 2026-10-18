/**
 * GuildRankPromotionModal.tsx
 * 모험가 길드 명예 칭호 계급장 승급 의식 및 주간 랭킹 정산 리텐션 퍼널 모달 (RSI-025)
 * DESIGN.md: 100% font-mono, 0px modal, 4px buttons, 1px hairline border, zero gradient, 44px+ touch targets
 */

import React, { useState, useEffect } from 'react';
import { Award, Shield, ChevronRight, Check, Sparkles, X, Gift } from 'lucide-react';
import {
 GuildMemberRankState,
 getGuildMemberRank,
 GUILD_RANKS,
 GuildRankTier,
 executePromotion,
 claimWeeklyDividend,
 addHonorPoints
} from '../../utils/guildRankStore';
import { triggerHaptic } from '../../lib/haptic';

interface GuildRankPromotionModalProps {
 isOpen: boolean;
 onClose: () => void;
 language?: string;
 onRewardReceived?: (amount: number) => void;
}

export const GuildRankPromotionModal: React.FC<GuildRankPromotionModalProps> = ({
 isOpen,
 onClose,
 language = 'ko',
 onRewardReceived
}) => {
 const [state, setState] = useState<GuildMemberRankState>(getGuildMemberRank());
 const [promotedTier, setPromotedTier] = useState<GuildRankTier | null>(null);
 const [toastMessage, setToastMessage] = useState<string | null>(null);

 const isKo = language === 'ko';

 useEffect(() => {
 setState(getGuildMemberRank());
 }, [isOpen]);

 if (!isOpen) return null;

 const currentRankInfo = GUILD_RANKS[state.currentTier];
 const tiers: GuildRankTier[] = ['BRONZE', 'SILVER', 'GOLD', 'MITHRIL', 'ORICHALCUM'];
 const currentIndex = tiers.indexOf(state.currentTier);
 const nextTier = currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
 const nextRankInfo = nextTier ? GUILD_RANKS[nextTier] : null;

 const progressPct = nextRankInfo
 ? Math.min(100, Math.round((state.honorPoints / nextRankInfo.minPoints) * 100))
 : 100;

 const handlePromote = () => {
 triggerHaptic('success');
 const res = executePromotion();
 if (res.success && res.newTier) {
 setState(getGuildMemberRank());
 setPromotedTier(res.newTier);
 if (res.rewardSns && onRewardReceived) {
 onRewardReceived(res.rewardSns);
 }
 setToastMessage(isKo ? `축하합니다! ${GUILD_RANKS[res.newTier].titleKo} 계급으로 승급 완료!` : `Promoted to ${GUILD_RANKS[res.newTier].titleEn}!`);
 setTimeout(() => setToastMessage(null), 3000);
 }
 };

 const handleClaimDividend = () => {
 triggerHaptic('tap');
 const amount = claimWeeklyDividend();
 if (amount > 0) {
 setState(getGuildMemberRank());
 if (onRewardReceived) {
 onRewardReceived(amount);
 }
 setToastMessage(isKo ? `주간 길드 배당금 +${amount} SNS 수령 완료!` : `Weekly dividend +${amount} SNS claimed!`);
 setTimeout(() => setToastMessage(null), 2500);
 }
 };

 // 테스트/체험용 명예 포인트 획득 버튼
 const handleEarnHonor = () => {
 triggerHaptic('tap');
 const { state: updated } = addHonorPoints(300);
 setState({ ...updated });
 };

 return (
 <div className="fixed inset-0 z-[10030] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 font-mono select-none">
 <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 p-4 sm:p-5 rounded-none max-w-md w-full shadow-none space-y-4 text-[#201d1d] dark:text-[#fdfcfc]">
 {/* Header */}
 <div className="flex items-center justify-between border-b border-[#201d1d]/10 dark:border-white/10 pb-2.5">
 <div className="flex items-center gap-2">
 <Award size={18} className="text-amber-500" />
 <h3 className="font-black text-sm uppercase tracking-wider">
 {isKo ? '모험가 길드 계급장 승급 의식' : 'Guild Rank Promotion Rite'}
 </h3>
 </div>
 <button
 onClick={onClose}
 className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1 hover:bg-[#201d1d]/5 dark:hover:bg-white/5 cursor-pointer text-xs"
 aria-label="Close"
 >
 [x]
 </button>
 </div>

 {/* Toast */}
 {toastMessage && (
 <div className="px-3 py-2 bg-amber-500 text-stone-950 text-xs font-black flex items-center gap-1.5 border border-amber-600 rounded-sm">
 <Check size={14} />
 <span>{toastMessage}</span>
 </div>
 )}

 {/* Current Rank Badge Banner */}
 <div className="bg-[#201d1d]/5 dark:bg-white/5 p-3.5 border border-[#201d1d]/10 dark:border-white/10 space-y-2">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-bold opacity-75 uppercase tracking-wide">
 {isKo ? '현재 길드 계급' : 'Current Guild Rank'}
 </span>
 <span className="px-2 py-0.5 bg-[#201d1d] text-[#fdfcfc] dark:bg-white dark:text-[#201d1d] text-[10px] font-black rounded-sm">
 {currentRankInfo.badgeLabel}
 </span>
 </div>

 <div className="flex items-center justify-between pt-1">
 <div className="text-base font-black text-amber-600 dark:text-amber-400">
 {isKo ? currentRankInfo.titleKo : currentRankInfo.titleEn}
 </div>
 <div className="text-right text-xs">
 <span className="font-bold">{isKo ? '공격력 보너스' : 'ATK Bonus'}</span>
 <span className="text-emerald-500 font-black ml-1.5">+{currentRankInfo.bonusAtkPct}%</span>
 </div>
 </div>

 {/* Progress Bar */}
 {nextRankInfo ? (
 <div className="space-y-1 pt-1.5">
 <div className="flex items-center justify-between text-[10px] opacity-80">
 <span>{isKo ? '다음 계급 승급 진행도' : 'Next Tier Progress'}</span>
 <span className="font-bold">{state.honorPoints} / {nextRankInfo.minPoints} PT ({progressPct}%)</span>
 </div>
 <div className="w-full bg-stone-300 dark:bg-stone-800 h-2 border border-[#201d1d]/20 dark:border-white/20">
 <div
 className="bg-amber-500 h-full transition-all duration-300"
 style={{ width: `${progressPct}%` }}
 />
 </div>
 </div>
 ) : (
 <div className="text-center text-[10px] text-amber-500 font-black py-1">
 [MAX RANK ACHIEVED // 최고 계급 도달]
 </div>
 )}
 </div>

 {/* Weekly Dividend Section */}
 <div className="p-3 bg-stone-100 dark:bg-stone-900 border border-[#201d1d]/10 dark:border-white/10 flex items-center justify-between text-xs">
 <div>
 <div className="font-bold flex items-center gap-1.5">
 <Gift size={13} className="text-amber-500" />
 <span>{isKo ? '주간 모험가 배당금' : 'Weekly Guild Dividend'}</span>
 </div>
 <div className="text-[10px] opacity-75 mt-0.5">
 {isKo ? `매주 정산: +${currentRankInfo.weeklyDividendSns} SNS` : `Weekly payout: +${currentRankInfo.weeklyDividendSns} SNS`}
 </div>
 </div>

 <button
 onClick={handleClaimDividend}
 disabled={state.unclaimedDividend <= 0}
 className={`min-h-[44px] px-3 py-1.5 text-xs font-black rounded-sm border cursor-pointer active:scale-95 ${
 state.unclaimedDividend > 0
 ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-600'
 : 'bg-stone-200 dark:bg-stone-800 text-stone-400 border-stone-300 dark:border-stone-700 opacity-60 cursor-not-allowed'
 }`}
 >
 {state.unclaimedDividend > 0
 ? `${state.unclaimedDividend} SNS ${isKo ? '수령' : 'Claim'}`
 : (isKo ? '수령 완료' : 'Claimed')}
 </button>
 </div>

 {/* Promotion Action */}
 <div className="space-y-2 pt-1">
 {nextRankInfo && state.honorPoints >= nextRankInfo.minPoints ? (
 <button
 onClick={handlePromote}
 className="w-full min-h-[48px] py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-sm cursor-pointer active:scale-98 flex items-center justify-center gap-2 border border-amber-600 shadow-sm"
 >
 <Sparkles size={16} />
 <span>{isKo ? `[${nextRankInfo.badgeLabel}] 계급장 승급 서약 거행` : `Ascend to [${nextRankInfo.badgeLabel}]`}</span>
 </button>
 ) : (
 <button
 onClick={handleEarnHonor}
 className="w-full min-h-[44px] py-2 px-3 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-900 dark:text-stone-100 font-bold text-xs rounded-sm cursor-pointer active:scale-98 border border-stone-400 dark:border-stone-600"
 >
 {isKo ? '+300 길드 명예 포인트 훈련 적립 (테스트)' : '+300 Honor Points (Training)'}
 </button>
 )}

 <button
 onClick={onClose}
 className="w-full min-h-[44px] py-2 bg-transparent text-stone-600 dark:text-stone-400 font-bold text-xs cursor-pointer hover:opacity-80 active:scale-98"
 >
 {isKo ? '닫기' : 'Close'}
 </button>
 </div>
 </div>
 </div>
 );
};

export default GuildRankPromotionModal;
