/**
 * deckSynergyCalculator.ts
 * 마이덱 1탭 드래그 앤 드롭 카드 편성 & 실시간 속성 시너지 프리뷰 연산 엔진
 * (구글 스프레드시트 Row 703 / ID 552 요구사항 구현)
 */

import { CardData } from '../types';

export interface SynergyBonus {
  element: string;
  name_ko: string;
  name_en: string;
  count: number;
  bonusPower: number;
  bonusPercent: number;
  color: string;
  badge: string;
}

export interface DeckSynergySummary {
  bonuses: SynergyBonus[];
  totalBonusPower: number;
  primarySynergy?: SynergyBonus;
  dominanceRatio: number; // 0.0 ~ 1.0
}

const ELEMENT_LABELS: Record<string, { ko: string; en: string; color: string; badge: string }> = {
  fire: { ko: '화염(Fire)', en: 'Fire', color: 'text-rose-400 border-rose-500/50 bg-rose-950/60', badge: '🔥' },
  water: { ko: '물(Water)', en: 'Water', color: 'text-blue-400 border-blue-500/50 bg-blue-950/60', badge: '💧' },
  wind: { ko: '바람(Wind)', en: 'Wind', color: 'text-emerald-400 border-emerald-500/50 bg-emerald-950/60', badge: '🌪️' },
  earth: { ko: '대지(Earth)', en: 'Earth', color: 'text-amber-500 border-amber-500/50 bg-amber-950/60', badge: '🌱' },
  land: { ko: '대지(Earth)', en: 'Earth', color: 'text-amber-500 border-amber-500/50 bg-amber-950/60', badge: '🌱' },
  light: { ko: '빛(Light)', en: 'Light', color: 'text-yellow-300 border-yellow-500/50 bg-yellow-950/60', badge: '✨' },
  dark: { ko: '어둠(Dark)', en: 'Dark', color: 'text-purple-400 border-purple-500/50 bg-purple-950/60', badge: '🔮' },
  human: { ko: '인간(Human)', en: 'Human', color: 'text-sky-400 border-sky-500/50 bg-sky-950/60', badge: '👤' },
  undead: { ko: '언데드(Undead)', en: 'Undead', color: 'text-fuchsia-400 border-fuchsia-500/50 bg-fuchsia-950/60', badge: '💀' },
  elf: { ko: '엘프(Elf)', en: 'Elf', color: 'text-green-400 border-green-500/50 bg-green-950/60', badge: '🍃' },
  dwarf: { ko: '드워프(Dwarf)', en: 'Dwarf', color: 'text-zinc-400 border-zinc-500/50 bg-zinc-950/60', badge: '🔨' },
  monster: { ko: '몬스터(Monster)', en: 'Monster', color: 'text-orange-400 border-orange-500/50 bg-orange-950/60', badge: '👹' },
  robot: { ko: '로봇(Mecha)', en: 'Robot', color: 'text-slate-400 border-slate-500/50 bg-slate-900/60', badge: '🤖' },
  dragon: { ko: '드래곤(Dragon)', en: 'Dragon', color: 'text-red-400 border-red-500/50 bg-red-950/60', badge: '🐉' }
};

/**
 * 덱 내 카드들의 속성/타입을 분석하여 실시간 시너지 보너스를 산출합니다.
 */
export function calculateDeckSynergies(cards: CardData[]): DeckSynergySummary {
  if (!cards || cards.length === 0) {
    return {
      bonuses: [],
      totalBonusPower: 0,
      dominanceRatio: 0
    };
  }

  const counts: Record<string, number> = {};
  for (const card of cards) {
    const rawEl = card.element || (card as { type?: string }).type || 'fire';
    const norm = String(rawEl).toLowerCase();
    counts[norm] = (counts[norm] || 0) + 1;
  }

  const totalCards = cards.length;
  const bonuses: SynergyBonus[] = [];
  let totalBonusPower = 0;

  for (const [elem, count] of Object.entries(counts)) {
    if (count >= 2) {
      // 2장 이상 동일 속성 보유 시 시너지 발동
      const meta = ELEMENT_LABELS[elem] || {
        ko: elem.toUpperCase(),
        en: elem.toUpperCase(),
        color: 'text-slate-300 border-slate-700 bg-slate-900/60',
        badge: '⚡'
      };

      // 시너지 계산식: 2장: +40 (5%), 3장: +90 (10%), 4장: +150 (18%), 5장(올인): +250 (30%)
      let bonusPower = 0;
      let bonusPercent = 0;
      if (count === 2) {
        bonusPower = 40;
        bonusPercent = 5;
      } else if (count === 3) {
        bonusPower = 90;
        bonusPercent = 10;
      } else if (count === 4) {
        bonusPower = 150;
        bonusPercent = 18;
      } else if (count >= 5) {
        bonusPower = 250;
        bonusPercent = 30;
      }

      totalBonusPower += bonusPower;

      bonuses.push({
        element: elem,
        name_ko: meta.ko,
        name_en: meta.en,
        count,
        bonusPower,
        bonusPercent,
        color: meta.color,
        badge: meta.badge
      });
    }
  }

  // 보너스 수치 순 정렬
  bonuses.sort((a, b) => b.bonusPower - a.bonusPower);

  const primarySynergy = bonuses[0];
  const maxCount = primarySynergy ? primarySynergy.count : 0;
  const dominanceRatio = totalCards > 0 ? maxCount / totalCards : 0;

  return {
    bonuses,
    totalBonusPower,
    primarySynergy,
    dominanceRatio
  };
}
