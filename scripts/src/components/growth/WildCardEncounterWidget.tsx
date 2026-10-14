// src/components/growth/WildCardEncounterWidget.tsx
import React, { useState, useEffect } from 'react';
import { FTUE_STARTER_SSR_CARDS, trackGrowthEvent } from './growthTypes';
import type { GrowthHeroCard, GrowthRewardPayload } from './growthTypes';
import { HeroClassEmblem, IconClose, IconRadar } from './GrowthIcons';

interface WildCardEncounterWidgetProps {
  onClaimLoot: (reward: GrowthRewardPayload) => void;
  onStartTrialBattle?: (rentalCard: GrowthHeroCard) => void;
}

export const WildCardEncounterWidget: React.FC<WildCardEncounterWidgetProps> = ({
  onClaimLoot,
  onStartTrialBattle,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [encounterCard, setEncounterCard] = useState<GrowthHeroCard>(
    FTUE_STARTER_SSR_CARDS[0]
  );
  const [contextLabel, setContextLabel] = useState<string>('SIGNAL DETECTED // SSR FRAGMENT');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname.toLowerCase();
    const randomCard =
      FTUE_STARTER_SSR_CARDS[Math.floor(Math.random() * FTUE_STARTER_SSR_CARDS.length)];
    setEncounterCard(randomCard);

    if (path.includes('/news') || path.includes('/r/')) {
      setContextLabel('NEWSROOM ARCHIVE // HIDDEN UNIT');
    } else if (
      path.includes('webtoon') ||
      path.includes('novel') ||
      path.includes('movie') ||
      path.includes('lore')
    ) {
      setContextLabel('LORE SYNCHRONIZATION // +15% ATK');
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const handleClaimAndPlay = () => {
    if (isClaimed) return;
    setIsClaimed(true);

    const rentalData = {
      card: encounterCard,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      synergyBuff: 15,
    };
    localStorage.setItem('snshero_rental_card', JSON.stringify(rentalData));

    trackGrowthEvent('ftue_hero_selected', {
      source: 'contextual_loot_drop',
      hero_id: encounterCard.id,
    });

    onClaimLoot({
      snsPoints: 300,
      freeTickets: 2,
      rewardCard: encounterCard,
      source: 'CHALLENGE_PARTICIPATE',
    });

    onStartTrialBattle?.(encounterCard);
  };

  return (
    <div className="fixed bottom-5 left-5 z-[9990] max-w-xs">
      <div className="relative overflow-hidden rounded-xl border border-white/15 bg-[#090d16]/95 p-4 text-white shadow-2xl backdrop-blur-xl">
        <div className="h-[1px] w-full bg-gradient-to-r from-sky-400/60 to-transparent mb-3" />

        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-3 right-3 text-slate-500 hover:text-white cursor-pointer"
          aria-label="Close"
        >
          <IconClose className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-sky-400/30 bg-sky-400/10 text-sky-400">
            <HeroClassEmblem attribute={encounterCard.attribute} className="w-7 h-7" />
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-sky-400 uppercase">
              <IconRadar className="w-3 h-3" />
              <span>{contextLabel}</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-0.5">
              [{encounterCard.grade}] {encounterCard.name}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              24시간 덱 편성권 및 <strong className="text-sky-300">+300 SNS</strong> 즉시 승인
            </p>
          </div>
        </div>

        <button
          onClick={handleClaimAndPlay}
          disabled={isClaimed}
          className={
            'mt-3 w-full rounded-lg py-2 px-3 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer ' +
            (isClaimed
              ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
              : 'bg-sky-400 text-slate-950 hover:bg-sky-300')
          }
        >
          {isClaimed ? 'UNIT SYNCED (+300 SNS)' : '유닛 동기화 및 시뮬레이션 개시'}
        </button>
      </div>
    </div>
  );
};
