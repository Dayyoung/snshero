/**
 * DeckChemistryMeter.tsx
 * 마이덱 덱 완성도 & 케미스트리(Deck Chemistry Meter) 시각화 위젯
 * (구글 스프레드시트 Row 1059 / ID 322 요구사항 구현)
 */

import React from 'react';
import { Sparkles, Award, Zap, Shield } from 'lucide-react';
import { CardData } from '../types';

interface DeckChemistryMeterProps {
  deck: CardData[];
  language?: string;
  className?: string;
}

interface SynergyTrait {
  nameKo: string;
  nameEn: string;
  effectKo: string;
  effectEn: string;
  icon: 'zap' | 'shield' | 'award';
}

export const DeckChemistryMeter: React.FC<DeckChemistryMeterProps> = ({
  deck,
  language = 'ko',
  className = '',
}) => {
  const isKo = language === 'ko';

  // 덱이 비어있으면 0점
  if (!deck || deck.length === 0) return null;

  // 1. 속성 분포 계산
  const elementCounts: Record<string, number> = {};
  const factionCounts: Record<string, number> = {};

  deck.forEach((card) => {
    const el = (card.element || 'NEUTRAL').toUpperCase();
    elementCounts[el] = (elementCounts[el] || 0) + 1;

    const faction = ((card as unknown as { faction?: string }).faction || 'NEUTRAL').toUpperCase();
    factionCounts[faction] = (factionCounts[faction] || 0) + 1;
  });

  const maxElementCount = Math.max(...Object.values(elementCounts), 0);
  const maxFactionCount = Math.max(...Object.values(factionCounts), 0);

  // 2. 케미스트리 점수 계산 (0~100)
  // - 카드 5장 편성 시 기본 40점
  // - 속성 집중도 (최대 35점): 5장 동일 속성 35점, 4장 28점, 3장 20점
  // - 팩션 집중도 (최대 25점): 5장 동일 팩션 25점, 3장 이상 15점
  let chemistryScore = Math.min(100, Math.floor((deck.length / 5) * 40));

  if (maxElementCount >= 5) chemistryScore += 35;
  else if (maxElementCount === 4) chemistryScore += 28;
  else if (maxElementCount === 3) chemistryScore += 20;
  else if (maxElementCount === 2) chemistryScore += 10;

  if (maxFactionCount >= 5) chemistryScore += 25;
  else if (maxFactionCount >= 3) chemistryScore += 18;
  else if (maxFactionCount === 2) chemistryScore += 8;

  chemistryScore = Math.min(100, chemistryScore);

  // 3. 활성 패시브 특성 도출
  const activeTraits: SynergyTrait[] = [];

  if (maxElementCount >= 4) {
    activeTraits.push({
      nameKo: '순수 원소 결속',
      nameEn: 'Pure Elemental Bond',
      effectKo: '원소 스탯 보정 +10%',
      effectEn: 'Element Stat +10%',
      icon: 'zap',
    });
  } else if (maxElementCount === 3) {
    activeTraits.push({
      nameKo: '삼원소 공명',
      nameEn: 'Tri-Element Resonance',
      effectKo: '공격력 +5%',
      effectEn: 'ATK +5%',
      icon: 'zap',
    });
  }

  if (maxFactionCount >= 3) {
    activeTraits.push({
      nameKo: '혈맹의 서약',
      nameEn: 'Faction Covenant',
      effectKo: '방어력 +6% & 치명타 저항',
      effectEn: 'DEF +6% & Crit Resist',
      icon: 'shield',
    });
  }

  if (deck.length === 5 && activeTraits.length === 0) {
    activeTraits.push({
      nameKo: '다채로운 조화',
      nameEn: 'Prismatic Harmony',
      effectKo: '상성 변수 대응력 +4%',
      effectEn: 'Flexibility +4%',
      icon: 'award',
    });
  }

  return (
    <div className={`p-3 bg-[#fdfcfc] border border-[rgba(15,0,0,0.12)] font-mono ${className}`}>
      {/* 상단 헤더 & 게이지 바 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          <span className="text-xs font-bold text-[#201d1d]">
            {isKo ? '덱 케미스트리 (Deck Chemistry)' : 'Deck Chemistry Meter'}
          </span>
        </div>
        <span className="text-xs font-black text-[#201d1d]">
          {chemistryScore}% <span className="text-[10px] font-normal text-stone-500">/ 100%</span>
        </span>
      </div>

      {/* 프로그레스 게이지 바 */}
      <div className="w-full h-2 bg-stone-200 overflow-hidden mb-2.5">
        <div
          className={`h-full transition-all duration-500 ${
            chemistryScore >= 80
              ? 'bg-emerald-500'
              : chemistryScore >= 50
              ? 'bg-amber-500'
              : 'bg-stone-500'
          }`}
          style={{ width: `${chemistryScore}%` }}
        />
      </div>

      {/* 활성 패시브 시너지 태그 칩 */}
      <div className="flex flex-wrap gap-1.5">
        {activeTraits.map((trait, idx) => (
          <div
            key={idx}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f1eeee] border border-[rgba(15,0,0,0.08)] text-[10px] text-[#201d1d] rounded-sm"
          >
            {trait.icon === 'zap' && <Zap size={11} className="text-amber-600" />}
            {trait.icon === 'shield' && <Shield size={11} className="text-blue-600" />}
            {trait.icon === 'award' && <Award size={11} className="text-emerald-600" />}
            <span className="font-bold">{isKo ? trait.nameKo : trait.nameEn}:</span>
            <span className="text-stone-600">{isKo ? trait.effectKo : trait.effectEn}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
