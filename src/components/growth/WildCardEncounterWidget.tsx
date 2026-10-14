import React, { useState, useEffect } from 'react';
import {
  FTUE_STARTER_SSR_CARDS,
  type GrowthHeroCard,
  type GrowthRewardPayload,
  trackGrowthEvent,
} from './growthTypes';

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
  const [contextLabel, setContextLabel] = useState<string>('실시간 뉴스룸 탐색 보상');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const path = window.location.pathname.toLowerCase();
    const randomCard =
      FTUE_STARTER_SSR_CARDS[Math.floor(Math.random() * FTUE_STARTER_SSR_CARDS.length)];
    setEncounterCard(randomCard);

    if (path.includes('/news') || path.includes('/r/')) {
      setContextLabel('📰 뉴스룸 숨겨진 히어로 발견!');
    } else if (
      path.includes('webtoon') ||
      path.includes('novel') ||
      path.includes('movie') ||
      path.includes('lore')
    ) {
      setContextLabel('🎬 세계관 미디어 감상 특별 버프 (+15% 공격력)');
    } else {
      setContextLabel('⚡ 야생의 SSR 히어로 시너지 신호 감지!');
    }

    const handleScroll = () => {
      if (window.scrollY > 180) {
        setIsVisible(true);
      }
    };

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
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
    <div className="fixed bottom-5 left-5 z-40 max-w-sm">
      <div className="relative overflow-hidden rounded-2xl border border-amber-400/50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white shadow-[0_0_35px_rgba(245,158,11,0.3)]">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2.5 right-2.5 text-xs text-slate-400 hover:text-white"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="flex items-start gap-3.5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-slate-950 text-3xl shadow-inner">
            {encounterCard.avatarEmoji}
          </div>

          <div className="flex-1 pr-4">
            <span className="inline-block rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 mb-1">
              {contextLabel}
            </span>
            <h4 className="text-xs md:text-sm font-black text-white leading-snug">
              [{encounterCard.grade}] {encounterCard.name} 카드 조각 출현!
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              지금 획득하면 <strong className="text-cyan-300">+300 SNS</strong>와 함께 24시간 내 덱에 즉시 편성됩니다.
            </p>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={handleClaimAndPlay}
            disabled={isClaimed}
            className={`w-full rounded-xl py-2 px-3 text-xs font-extrabold transition cursor-pointer ${
              isClaimed
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:from-amber-300 hover:to-orange-400 shadow-md'
            }`}
          >
            {isClaimed
              ? '✅ 덱 대여 & +300 SNS 지급 완료!'
              : '⚡ 즉시 획득하고 10초 실전 배틀 체험하기'}
          </button>
        </div>
      </div>
    </div>
  );
};
