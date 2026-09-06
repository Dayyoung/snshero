/**
 * DeckSynergyVisualizer.tsx
 * 마이덱 & 카드 보관함 내 '종족/속성 시너지 콤보 실시간 프리뷰 & 추천 덱 프리셋' 모달
 * (구글 스프레드시트 Row 925 / ID 553 요구사항 구현)
 */

import React from 'react';
import { Sparkles, X, Shield, Swords } from 'lucide-react';
import { CardData, Language } from '../types';
import { CrossElementalSynergy } from '../lib/crossElementalSynergy';
import { DeckSynergyLinkEngine } from '../lib/deckSynergyLinkEngine';

interface DeckSynergyVisualizerProps {
  deck: (CardData | null | undefined)[];
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const DeckSynergyVisualizer: React.FC<DeckSynergyVisualizerProps> = ({
  deck,
  isOpen,
  onClose,
  language = 'ko',
}) => {
  const isKo = language === 'ko';

  if (!isOpen) return null;

  const crossHarmony = CrossElementalSynergy.getInstance().evaluateHarmony(deck);
  const linkSynergy = DeckSynergyLinkEngine.getInstance().evaluateDeckSynergy(deck);

  const RECOMMENDED_PRESETS = [
    {
      name: isKo ? '화염 연소 폭풍 덱' : 'Inferno Burst Deck',
      desc: isKo ? '화염 3장 + 바람 2장 조합: 공격속도 +20%, 지속 화염 번 피해 극대화' : 'Fire x3 + Wind x2: +20% ASPD & Max Burn DoT',
      badge: '[초고화력 공격형]',
    },
    {
      name: isKo ? '수류 대지 철벽 덱' : 'Mud Quake Fortress',
      desc: isKo ? '수류 3장 + 대지 2장 조합: 방어력 +25%, 적 공격속도/이동속도 둔화' : 'Water x3 + Earth x2: +25% DEF & Enemy Slow',
      badge: '[철통 방어 카운터형]',
    },
    {
      name: isKo ? '프리즈마틱 무지개 덱' : 'Prismatic Rainbow Deck',
      desc: isKo ? '서로 다른 4개 이상 원소 조합: 전 스탯 +15% 및 무지개 하모니 오라 발동' : '4+ Unique Elements: +15% All Stats & Rainbow Aura',
      badge: '[올라운드 밸런스형]',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/65 backdrop-blur-xs font-mono select-none">
      <div className="w-full max-w-md bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d] dark:border-white rounded-none p-4 text-[#201d1d] dark:text-[#fdfcfc] flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] pb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-black">
              {isKo ? '덱 시너지 & 하모니 비주얼라이저' : 'Deck Synergy Visualizer'}
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

        {/* 현재 덱 하모니 랭크 */}
        <div className="flex items-center justify-between p-3 bg-[rgba(15,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)] border border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] rounded-sm">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#777] dark:text-[#aaa]">HARMONY RANK</span>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">
              GRADE {crossHarmony.harmonyRating}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="flex items-center gap-0.5 text-rose-600">
              <Swords size={13} /> +{crossHarmony.totalAttackBonusPct}%
            </span>
            <span className="flex items-center gap-0.5 text-blue-600">
              <Shield size={13} /> +{crossHarmony.totalDefenseBonusPct}%
            </span>
          </div>
        </div>

        {/* 활성 시너지 목록 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-[#555] dark:text-[#ccc]">
            {isKo ? '현재 활성 복합 시너지' : 'Active Synergies'}
          </span>
          {crossHarmony.hybridSynergies.length === 0 ? (
            <div className="p-2 text-[11px] text-center text-[#888] border border-dashed border-neutral-300 dark:border-neutral-700">
              {isKo ? '활성화된 복합 속성 시너지가 없습니다. 다른 원소를 조합해보세요!' : 'No active synergies. Try mixing elements!'}
            </div>
          ) : (
            crossHarmony.hybridSynergies.map((s) => (
              <div
                key={s.id}
                className="p-2 border border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] bg-white dark:bg-[#201d1d] rounded-sm flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#201d1d] dark:text-white">
                    {isKo ? s.nameKo : s.nameEn}
                  </span>
                  <span className="text-[9px] px-1 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold rounded-sm">
                    {s.bannerAscii}
                  </span>
                </div>
                <p className="text-[10px] text-[#666] dark:text-[#bbb] leading-tight">
                  {isKo ? s.descriptionKo : s.descriptionEn}
                </p>
              </div>
            ))
          )}
        </div>

        {/* 추천 덱 프리셋 가이드 */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)]">
          <span className="text-[11px] font-bold text-[#555] dark:text-[#ccc]">
            {isKo ? '추천 덱 아키타입' : 'Recommended Deck Presets'}
          </span>
          {RECOMMENDED_PRESETS.map((p, idx) => (
            <div
              key={idx}
              className="p-2 border border-[rgba(15,0,0,0.08)] dark:border-[rgba(255,255,255,0.08)] rounded-sm flex flex-col gap-0.5 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{p.name}</span>
                <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {p.badge}
                </span>
              </div>
              <p className="text-[10px] text-[#777] dark:text-[#aaa]">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="w-full py-2 text-xs font-black bg-[#201d1d] text-[#fdfcfc] dark:bg-[#fdfcfc] dark:text-[#201d1d] rounded-sm active:scale-98 cursor-pointer mt-1"
        >
          {isKo ? '확인 및 덱 편집 계속' : 'Close & Continue Editing'}
        </button>
      </div>
    </div>
  );
};

export interface Synergy3SetEffect {
  type: 'element' | 'faction';
  key: string;
  nameKo: string;
  nameEn: string;
  buffKo: string;
  buffEn: string;
  auraClass: string;
}

export function evaluate3CardDeckSynergy(deck: (CardData | null | undefined)[]): {
  activeSet: Synergy3SetEffect | null;
  progressHint: string;
} {
  const cards = deck.filter((c): c is CardData => !!c);
  const elementCounts: Record<string, number> = {};
  const factionCounts: Record<string, number> = {};

  cards.forEach((c) => {
    if (c.element) {
      elementCounts[c.element] = (elementCounts[c.element] || 0) + 1;
    }
    if (c.faction) {
      factionCounts[c.faction] = (factionCounts[c.faction] || 0) + 1;
    }
  });

  const SYNERGY_MAP: Record<string, Synergy3SetEffect> = {
    fire: {
      type: 'element',
      key: 'fire',
      nameKo: '화염 3세트',
      nameEn: 'Fire 3-Set',
      buffKo: '공격력 +20%',
      buffEn: 'ATK +20%',
      auraClass: 'ring-2 ring-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse',
    },
    water: {
      type: 'element',
      key: 'water',
      nameKo: '수류 3세트',
      nameEn: 'Water 3-Set',
      buffKo: '방어력 +20%',
      buffEn: 'DEF +20%',
      auraClass: 'ring-2 ring-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse',
    },
    wind: {
      type: 'element',
      key: 'wind',
      nameKo: '바람 3세트',
      nameEn: 'Wind 3-Set',
      buffKo: '공격속도 +20%',
      buffEn: 'ASPD +20%',
      auraClass: 'ring-2 ring-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-pulse',
    },
    earth: {
      type: 'element',
      key: 'earth',
      nameKo: '대지 3세트',
      nameEn: 'Earth 3-Set',
      buffKo: '실드 +25%',
      buffEn: 'SHIELD +25%',
      auraClass: 'ring-2 ring-yellow-600 shadow-[0_0_12px_rgba(202,138,4,0.6)] animate-pulse',
    },
    undead: {
      type: 'faction',
      key: 'undead',
      nameKo: '언데드 3세트',
      nameEn: 'Undead 3-Set',
      buffKo: '흡혈 15%',
      buffEn: 'LIFESTEAL +15%',
      auraClass: 'ring-2 ring-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.6)] animate-pulse',
    },
    human: {
      type: 'faction',
      key: 'human',
      nameKo: '인간연합 3세트',
      nameEn: 'Human 3-Set',
      buffKo: 'HP재생 초당 5%',
      buffEn: 'HP REGEN +5%/s',
      auraClass: 'ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse',
    },
    mecha: {
      type: 'faction',
      key: 'mecha',
      nameKo: '기계혁명 3세트',
      nameEn: 'Mecha 3-Set',
      buffKo: '치명타율 +20%',
      buffEn: 'CRIT +20%',
      auraClass: 'ring-2 ring-zinc-400 shadow-[0_0_12px_rgba(161,161,170,0.6)] animate-pulse',
    },
  };

  // 1. 완성된 3세트 확인
  for (const [key, count] of Object.entries(elementCounts)) {
    if (count >= 3 && SYNERGY_MAP[key]) {
      return { activeSet: SYNERGY_MAP[key], progressHint: '' };
    }
  }
  for (const [key, count] of Object.entries(factionCounts)) {
    if (count >= 3 && SYNERGY_MAP[key]) {
      return { activeSet: SYNERGY_MAP[key], progressHint: '' };
    }
  }

  // 2. 2장 편성 시 힌트 제공
  for (const [key, count] of Object.entries(elementCounts)) {
    if (count === 2 && SYNERGY_MAP[key]) {
      return {
        activeSet: null,
        progressHint: `${SYNERGY_MAP[key].nameKo} (2/3) - 1장 추가 시 ${SYNERGY_MAP[key].buffKo}`,
      };
    }
  }
  for (const [key, count] of Object.entries(factionCounts)) {
    if (count === 2 && SYNERGY_MAP[key]) {
      return {
        activeSet: null,
        progressHint: `${SYNERGY_MAP[key].nameKo} (2/3) - 1장 추가 시 ${SYNERGY_MAP[key].buffKo}`,
      };
    }
  }

  return { activeSet: null, progressHint: '' };
}

export function getDeckSynergyAuraClass(
  card: CardData | null | undefined,
  deck: (CardData | null | undefined)[]
): string {
  if (!card) return '';
  const { activeSet } = evaluate3CardDeckSynergy(deck);
  if (!activeSet) return '';
  if (activeSet.type === 'element' && card.element === activeSet.key) {
    return activeSet.auraClass;
  }
  if (activeSet.type === 'faction' && card.faction === activeSet.key) {
    return activeSet.auraClass;
  }
  return '';
}

export const DeckSynergyBadge: React.FC<{
  deck: (CardData | null | undefined)[];
  language?: string;
  className?: string;
  onClick?: () => void;
}> = ({ deck, language = 'ko', className = '', onClick }) => {
  const isKo = language === 'ko';
  const { activeSet, progressHint } = evaluate3CardDeckSynergy(deck);

  if (!activeSet && !progressHint) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-1.5 font-mono text-[11px] rounded-sm border transition-all cursor-pointer select-none ${
        activeSet
          ? 'bg-purple-950/20 dark:bg-purple-900/30 border-purple-500/50 text-purple-900 dark:text-purple-200'
          : 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
      } ${className}`}
    >
      <div className="flex items-center gap-1.5 font-bold">
        <Sparkles size={13} className={activeSet ? 'text-purple-500 animate-spin' : 'text-amber-500'} />
        <span>
          {activeSet
            ? `[${isKo ? activeSet.nameKo : activeSet.nameEn}] 발동`
            : `[시너지 조합 팁]`}
        </span>
      </div>
      <div className="text-[10px] font-black">
        {activeSet ? (
          <span className="text-emerald-600 dark:text-emerald-400">
            {isKo ? activeSet.buffKo : activeSet.buffEn}
          </span>
        ) : (
          <span className="text-[#666] dark:text-[#aaa]">{progressHint}</span>
        )}
      </div>
    </button>
  );
};

