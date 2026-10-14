import React, { useState, useEffect } from 'react';
import {
  type ChallengePayload,
  decodeChallengeDeck,
  type GrowthHeroCard,
  type GrowthRewardPayload,
} from './growthTypes';
import { FtueOnboardingModal } from './FtueOnboardingModal';
import {
  InstantChallengeBattleModal,
  ViralDeckShareModal,
} from './DeckChallengeSystem';
import { WildCardEncounterWidget } from './WildCardEncounterWidget';
import { DailyRetentionAndArcadeLoop } from './DailyRetentionAndArcadeLoop';

interface SNSHeroGrowthManagerProps {
  userNickname?: string;
  userDeck?: GrowthHeroCard[];
  onGrantReward?: (reward: GrowthRewardPayload) => void;
  onNavigateTab?: (tab: 'card-shop' | 'my-deck' | 'battle-arena') => void;
}

export const SNSHeroGrowthManager: React.FC<SNSHeroGrowthManagerProps> = ({
  userNickname = 'SNS지휘관',
  userDeck = [],
  onGrantReward,
  onNavigateTab,
}) => {
  const [showFtue, setShowFtue] = useState<boolean>(false);
  const [challengeData, setChallengeData] = useState<ChallengePayload | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const challengeParam = params.get('challenge');

    if (challengeParam) {
      const decoded = decodeChallengeDeck(challengeParam);
      if (decoded) {
        setChallengeData(decoded);
        return;
      }
    }

    const ftueDone = localStorage.getItem('snshero_ftue_completed');
    if (ftueDone !== 'true') {
      const timer = setTimeout(() => {
        setShowFtue(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRewardGranted = (reward: GrowthRewardPayload) => {
    const prevPoints = Number(localStorage.getItem('snshero_bonus_points') || '0');
    const prevTickets = Number(localStorage.getItem('snshero_free_tickets') || '0');
    localStorage.setItem('snshero_bonus_points', String(prevPoints + reward.snsPoints));
    localStorage.setItem('snshero_free_tickets', String(prevTickets + reward.freeTickets));

    window.dispatchEvent(new CustomEvent('snshero:growth-reward', { detail: reward }));

    onGrantReward?.(reward);
    setToastMessage(
      `🎁 보상 지급 완료: +${reward.snsPoints.toLocaleString()} SNS & 무료 뽑기 티켓 +${reward.freeTickets}장!`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const clearChallengeQueryParam = () => {
    setChallengeData(null);
    if (typeof window !== 'undefined' && window.history.replaceState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('challenge');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-full border border-amber-400/50 bg-slate-900/95 px-6 py-3 text-xs md:text-sm font-extrabold text-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-bounce">
          {toastMessage}
        </div>
      )}

      <DailyRetentionAndArcadeLoop onClaimDailyReward={handleRewardGranted} />

      <WildCardEncounterWidget
        onClaimLoot={handleRewardGranted}
        onStartTrialBattle={() => setShowFtue(true)}
      />

      <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-2 items-end">
        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 rounded-full border border-fuchsia-400/50 bg-gradient-to-r from-fuchsia-600 to-indigo-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-[0_0_25px_rgba(217,70,239,0.5)] hover:scale-105 transition cursor-pointer"
        >
          <span>⚔️ 내 5장 덱 도전장 공유</span>
        </button>
      </div>

      <FtueOnboardingModal
        isOpen={showFtue}
        onClose={() => setShowFtue(false)}
        onCompleteReward={handleRewardGranted}
        onNavigate={onNavigateTab}
      />

      <InstantChallengeBattleModal
        challengeData={challengeData}
        onClose={clearChallengeQueryParam}
        onClaimReward={handleRewardGranted}
        onOpenShareMyDeck={() => setShowShareModal(true)}
      />

      <ViralDeckShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        nickname={userNickname}
        myDeck={userDeck}
      />
    </>
  );
};
