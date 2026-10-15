import React, { useState, useEffect } from 'react';
import {
  GuildBountyState,
  getGuildBountyState,
  claimBountyReward,
  clearWeeklyRaidBoss,
} from '../../utils/guildBountyStore';

interface GuildBountyBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (gold: number) => void;
  onStartRaidBattle?: () => void;
}

export const GuildBountyBoardModal: React.FC<GuildBountyBoardModalProps> = ({
  isOpen,
  onClose,
  onRewardClaimed,
  onStartRaidBattle,
}) => {
  const [state, setState] = useState<GuildBountyState>(getGuildBountyState());
  const [claimToast, setClaimToast] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<GuildBountyState>;
      if (custom.detail) {
        setState(custom.detail);
      } else {
        setState(getGuildBountyState());
      }
    };

    window.addEventListener('snshero_guild_bounties_updated', handleUpdate);
    return () => {
      window.removeEventListener('snshero_guild_bounties_updated', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const handleClaim = (bountyId: string) => {
    const res = claimBountyReward(bountyId);
    if (res.success) {
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      setClaimToast(`+${res.rewardGold} SNS 보상 수령 완료!`);
      setTimeout(() => setClaimToast(null), 2000);
      if (onRewardClaimed) {
        onRewardClaimed(res.rewardGold);
      }
    }
  };

  const handleRaidVictory = () => {
    const res = clearWeeklyRaidBoss();
    if (res.success) {
      if (navigator.vibrate) {
        navigator.vibrate([40, 40, 80]);
      }
      setClaimToast('주간 마수 토벌 성공! +3,000 SNS 지급');
      setTimeout(() => setClaimToast(null), 2500);
      if (onRewardClaimed) {
        onRewardClaimed(3000);
      }
      if (onStartRaidBattle) {
        onStartRaidBattle();
      }
    }
  };

  const allClaimed = state.bounties.every((b) => b.isClaimed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm select-none font-mono">
      <div className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-[#090d16] text-stone-200 border border-emerald-500/30 rounded-none p-5 shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-bold">
                [ADVENTURER GUILD // DAILY BOUNTIES]
              </span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-white mt-1">
              모험가 길드 의뢰 게시판
            </h2>
            <div className="text-[11px] text-stone-400">
              일일 의뢰 완주 시 주간 토벌 인장 수여 (자정 리셋)
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-sm transition-colors border border-transparent hover:border-white/20"
            aria-label="Close"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Claim Toast Notice */}
        {claimToast && (
          <div className="mb-3 p-2 bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs text-center font-bold rounded-sm animate-pulse">
            {claimToast}
          </div>
        )}

        {/* Weekly Seals Tracker Card */}
        <div className="p-3 bg-black/60 border border-white/10 rounded-sm mb-4">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-amber-400 font-bold">[주간 토벌 인장]</span>
            <span className="text-stone-300 font-bold">
              {state.weeklySeals} / 5 인장 {state.weeklyRaidUnlocked && '(토벌전 해금됨!)'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((index) => {
              const hasSeal = state.weeklySeals >= index;
              return (
                <div
                  key={index}
                  className={`h-9 border flex items-center justify-center rounded-sm transition-all ${
                    hasSeal
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                      : 'bg-stone-900 border-stone-800 text-stone-600'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 14 14"></polyline>
                  </svg>
                </div>
              );
            })}
          </div>

          <div className="text-[10px] text-stone-400 flex items-center justify-between">
            <span>매일 3개 의뢰를 모두 완료하면 인장 1개 지급</span>
            <span className="text-amber-400">5개 모으면 주말 네임드 보스 개방</span>
          </div>
        </div>

        {/* Daily 3 Bounties List */}
        <div className="space-y-2.5 mb-4">
          <div className="text-xs text-stone-400 font-bold">
            [오늘의 길드 의뢰: 3종]
          </div>

          {state.bounties.map((bounty) => {
            const isCompleted = bounty.currentCount >= bounty.targetCount;
            return (
              <div
                key={bounty.id}
                className={`p-3 border rounded-sm flex items-center justify-between min-h-[64px] transition-all ${
                  bounty.isClaimed
                    ? 'bg-stone-950/40 border-stone-800 text-stone-500'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-stone-200'
                    : 'bg-black/50 border-white/10 text-stone-300'
                }`}
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">
                      {bounty.titleKo}
                    </span>
                    {bounty.isClaimed && (
                      <span className="px-1.5 py-0.2 text-[9px] bg-stone-800 text-stone-400 rounded-xs">
                        [수령완료]
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">
                    {bounty.descriptionKo}
                  </p>
                  <div className="flex items-center space-x-3 text-[10px] mt-1 text-amber-400">
                    <span>진행: {bounty.currentCount}/{bounty.targetCount}</span>
                    <span>보상: +{bounty.rewardGold} SNS</span>
                  </div>
                </div>

                <div>
                  {bounty.isClaimed ? (
                    <div className="py-2 px-3 text-[11px] text-stone-600 font-bold border border-stone-800 bg-black/40 rounded-sm">
                      완료됨
                    </div>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(bounty.id)}
                      className="py-2.5 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-sm transition-all shadow-sm min-h-[44px]"
                    >
                      [보상수령]
                    </button>
                  ) : (
                    <div className="py-2 px-3 text-[11px] text-stone-500 border border-stone-800 rounded-sm bg-black/20">
                      진행중
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Named Boss Raid Section */}
        <div className="p-3 bg-gradient-to-r from-purple-950/40 to-black/60 border border-purple-500/30 rounded-sm mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-purple-300 font-bold">
              [주간 네임드 마수 토벌전: 설원 폭룡 아그나르]
            </span>
            <span className="text-[10px] text-stone-400">
              {state.weeklyRaidCleared
                ? '[이번 주 토벌 완료]'
                : state.weeklyRaidUnlocked
                ? '[입장 가능]'
                : '[인장 5개 필요]'}
            </span>
          </div>
          <p className="text-[10px] text-stone-400 mb-2 leading-relaxed">
            인장 5개를 달성한 용사만이 도전할 수 있는 대륙 최강의 마수. 격파 시 3,000 SNS 군자금 수여.
          </p>

          <button
            onClick={handleRaidVictory}
            disabled={!state.weeklyRaidUnlocked || state.weeklyRaidCleared}
            className={`w-full py-2.5 text-xs font-bold rounded-sm border transition-all min-h-[44px] ${
              state.weeklyRaidCleared
                ? 'bg-stone-900 border-stone-800 text-stone-600 cursor-not-allowed'
                : state.weeklyRaidUnlocked
                ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400 shadow-md cursor-pointer'
                : 'bg-black/40 border-stone-800 text-stone-600 cursor-not-allowed'
            }`}
          >
            {state.weeklyRaidCleared
              ? '[이번 주 토벌 작전 완료 (리셋 대기)]'
              : state.weeklyRaidUnlocked
              ? '[마수 토벌전 출격 // +3,000 SNS]'
              : `[토벌전 잠김 // 인장 ${state.weeklySeals}/5]`}
          </button>
        </div>

        {/* Footer Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-stone-800/90 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-sm border border-stone-600 transition-all min-h-[48px]"
        >
          [게시판 닫기]
        </button>
      </div>
    </div>
  );
};

// Mini badge for Lobby Navigation
export const LobbyBountyBadge: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const [state, setState] = useState<GuildBountyState>(getGuildBountyState());

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<GuildBountyState>;
      if (custom.detail) {
        setState(custom.detail);
      } else {
        setState(getGuildBountyState());
      }
    };

    window.addEventListener('snshero_guild_bounties_updated', handleUpdate);
    return () => {
      window.removeEventListener('snshero_guild_bounties_updated', handleUpdate);
    };
  }, []);

  const hasClaimable = state.bounties.some(
    (b) => b.currentCount >= b.targetCount && !b.isClaimed
  );

  return (
    <button
      onClick={onClick}
      className="relative flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#090d16] border border-emerald-500/30 hover:border-emerald-400 text-emerald-400 text-xs rounded-sm font-mono shadow-sm transition-all"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span>길드의뢰</span>
      {hasClaimable && (
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      )}
    </button>
  );
};
