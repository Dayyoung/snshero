/**
 * DeckSynergyBuilder.tsx
 * 마이덱 덱빌딩 '영웅 카드 인연(Bond) 시너지 프리뷰 & 콤보 덱 빌더' 실시간 패널
 * (design.md Monospace 플랫 가이드 준수)
 * (구글 스프레드시트 Row 1005 / ID 553 요구사항 구현)
 */

import React from 'react';
import { Sparkles, Shield, Swords, Zap } from 'lucide-react';
import { CardData, Language } from '../types';
import { DeckSynergyCalculator } from '../lib/deckSynergyCalculator';
import { DeckSynergyAuraEngine } from '../lib/deckSynergyAuraEngine';

interface DeckSynergyBuilderProps {
  deck: (CardData | null | undefined)[];
  language?: Language;
}

export const DeckSynergyBuilder: React.FC<DeckSynergyBuilderProps> = ({
  deck,
  language = 'ko',
}) => {
  const isKo = language === 'ko';

  const synergy = DeckSynergyCalculator.getInstance().calculateSynergy(deck);
  const heroBond = DeckSynergyAuraEngine.getInstance().detectHeroBond(deck);

  return (
    <div className="w-full bg-[#fdfcfc] dark:bg-[#181616] border border-[rgba(15,0,0,0.12)] dark:border-[rgba(255,255,255,0.12)] rounded-none p-3 font-mono select-none text-[#201d1d] dark:text-[#fdfcfc] flex flex-col gap-2.5">
      {/* 헤더 및 스탯 요약 */}
      <div className="flex items-center justify-between border-b border-[rgba(15,0,0,0.1)] dark:border-[rgba(255,255,255,0.1)] pb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={15} className="text-amber-500 fill-amber-500" />
          <span className="text-xs font-black tracking-tight">
            {isKo ? '실시간 덱 시너지 프리뷰' : 'Deck Synergy Preview'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400">
            <Swords size={12} /> +{synergy.netAtkModifierPct}%
          </span>
          <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
            <Shield size={12} /> +{synergy.netHpModifierPct}%
          </span>
        </div>
      </div>

      {/* 영웅 인연(Hero Bond) 특수 오라 배너 */}
      {heroBond && (
        <div className="p-2 bg-amber-500/10 border border-amber-400 rounded-sm flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-amber-900 dark:text-amber-200">
              {heroBond.bondNameKo}
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
            ATK +{heroBond.attackBonusPct}% / DEF +{heroBond.defenseBonusPct}%
          </span>
        </div>
      )}

      {/* 활성 배지 리스트 */}
      <div className="flex flex-wrap gap-1.5">
        {synergy.activeBadges.length === 0 ? (
          <div className="w-full text-center py-2 text-[10px] text-[#888] border border-dashed border-neutral-300 dark:border-neutral-700">
            {isKo
              ? '동일 속성 3장 또는 서로 다른 5원소를 조합하여 시너지를 발동하세요!'
              : 'Match 3 same elements or 5 unique elements to trigger synergies!'}
          </div>
        ) : (
          synergy.activeBadges.map((badge) => (
            <div
              key={badge.id}
              className={`px-2 py-1 border rounded-sm flex items-center gap-1.5 text-[10px] font-bold bg-white dark:bg-[#201d1d] ${badge.glowEffect}`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: badge.color }} />
              <span>{isKo ? badge.nameKo : badge.nameEn}</span>
              <span className="text-[#666] dark:text-[#aaa] font-normal">({badge.buffDesc})</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
