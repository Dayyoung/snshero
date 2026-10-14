// src/components/growth/SNSHeroGrowthManager.tsx
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { decodeChallengeDeck } from './growthTypes';
import type {
  ChallengePayload,
  GrowthHeroCard,
  GrowthRewardPayload,
} from './growthTypes';
import { FtueOnboardingModal } from './FtueOnboardingModal';
import {
  InstantChallengeBattleModal,
  ViralDeckShareModal,
} from './DeckChallengeSystem';
import { WildCardEncounterWidget } from './WildCardEncounterWidget';
import { DailyRetentionAndArcadeLoop } from './DailyRetentionAndArcadeLoop';
import { IconShare, IconSpark } from './GrowthIcons';

interface SNSHeroGrowthManagerProps {
  userNickname?: string;
  userDeck?: GrowthHeroCard[];
  onGrantReward?: (reward: GrowthRewardPayload) => void;
  onNavigateTab?: (tab: 'card-shop' | 'my-deck' | 'battle-arena') => void;
}

export const SNSHeroGrowthManager: React.FC<SNSHeroGrowthManagerProps> = ({
  userNickname = 'COMMANDER',
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
    (window as any).__SNSHERO_GROWTH_MOUNTED__ = true;

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
      'REWARD CREDITED // +' +
        reward.snsPoints.toLocaleString() +
        ' SNS & +' +
        reward.freeTickets +
        ' VOUCHERS'
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
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] rounded-lg border border-sky-400/50 bg-[#090d16]/95 px-5 py-2.5 font-mono text-xs font-bold text-sky-300 shadow-2xl">
          {toastMessage}
        </div>
      )}

      <DailyRetentionAndArcadeLoop onClaimDailyReward={handleRewardGranted} />

      <WildCardEncounterWidget
        onClaimLoot={handleRewardGranted}
        onStartTrialBattle={() => setShowFtue(true)}
      />

      <div className="fixed bottom-5 right-5 z-[9990] flex flex-col gap-2 items-end">
        <button
          onClick={() => {
            localStorage.removeItem('snshero_ftue_completed');
            setShowFtue(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#090d16]/90 px-3.5 py-2 font-mono text-[11px] font-semibold text-slate-300 shadow-lg backdrop-blur-md hover:border-sky-400/50 hover:text-white transition cursor-pointer"
        >
          <IconSpark className="w-3.5 h-3.5 text-sky-400" />
          <span>FTUE SIMULATION</span>
        </button>
        <button
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-sky-400/50 bg-sky-400 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:bg-sky-300 transition cursor-pointer"
        >
          <IconShare className="w-3.5 h-3.5" />
          <span>DECK CHALLENGE LINK</span>
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

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  setTimeout(() => {
    if (!(window as any).__SNSHERO_GROWTH_MOUNTED__) {
      let portalEl = document.getElementById('snshero-growth-portal-root');
      if (!portalEl) {
        portalEl = document.createElement('div');
        portalEl.id = 'snshero-growth-portal-root';
        document.body.appendChild(portalEl);
        const root = createRoot(portalEl);
        root.render(<SNSHeroGrowthManager />);
      }
    }
  }, 500);
}
