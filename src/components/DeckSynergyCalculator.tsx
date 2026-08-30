import React, { useState, useMemo } from 'react';
import { CardData, InventoryRecord, Language } from '../types';
import { CARD_DATABASE } from '../cardDatabase';
import { getCharacterIpProfile } from '../content/characterIpUtils';
import { syncCardWithDatabase } from '../constants';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Shield, Flame, Sparkles, Scale, ChevronDown, ChevronUp, Check, Info } from 'lucide-react';

export interface SynergyItem {
  id: string;
  name: string;
  icon: string;
  count: number;
  maxCount: number;
  active: boolean;
  tier: number;
  bonusText: string;
  description: string;
}

export interface SynergyScoreResult {
  score: number;
  grade: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C';
  gradeColor: string;
  activeSynergies: SynergyItem[];
  elementDominance: { element: string; count: number; icon: string; name: string } | null;
  atkBonusPct: number;
  defBonusPct: number;
  powerBonusPct: number;
}

export interface DeckSynergyCalculatorProps {
  currentDeck: CardData[];
  ownedCards: CardData[];
  inventory: Record<number, InventoryRecord>;
  language: Language;
  updateDeck: (newDeck: CardData[]) => void;
  playSfx?: (url: string) => void;
  className?: string;
}

const ELEMENT_META: Record<string, { ko: string; en: string; icon: string; color: string }> = {
  FIRE: { ko: '화염', en: 'Fire', icon: '🔥', color: 'text-red-600 bg-red-50 border-red-200' },
  WATER: { ko: '물', en: 'Water', icon: '💧', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  EARTH: { ko: '대지', en: 'Earth', icon: '🌿', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  WIND: { ko: '바람', en: 'Wind', icon: '⚡', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  LIGHT: { ko: '빛', en: 'Light', icon: '✨', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  DARK: { ko: '어둠', en: 'Dark', icon: '🌑', color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

export const calculateDeckSynergies = (
  deck: CardData[],
  language: Language
): SynergyScoreResult => {
  const elementCounts: Record<string, number> = {};
  const factionCounts: Record<string, number> = {};
  let urCount = 0;
  let ssrCount = 0;
  let atkCount = 0;
  let defCount = 0;
  let balanceCount = 0;

  deck.forEach((card) => {
    if (!card) return;
    const dbCard = CARD_DATABASE[card.imageIndex || 0] || card;
    const elem = (card.element || dbCard.element || 'FIRE').toUpperCase();
    elementCounts[elem] = (elementCounts[elem] || 0) + 1;

    const rarity = (dbCard.rarity || card.rarity || 'N').toUpperCase();
    if (rarity === 'UR' || rarity === 'LR') urCount++;
    if (rarity === 'SSR') ssrCount++;

    // IP faction
    const profile = getCharacterIpProfile(card.imageIndex || 0);
    if (profile?.faction) {
      factionCounts[profile.faction] = (factionCounts[profile.faction] || 0) + 1;
    }

    // Role classification
    const top = card.stats?.[0] ?? 5;
    const right = card.stats?.[1] ?? 5;
    const bottom = card.stats?.[2] ?? 5;
    const left = card.stats?.[3] ?? 5;
    const atkBias = (top + right) - (bottom + left);
    if (atkBias >= 2) atkCount++;
    else if (atkBias <= -2) defCount++;
    else balanceCount++;
  });

  const synergies: SynergyItem[] = [];
  let atkBonusPct = 0;
  let defBonusPct = 0;
  let powerBonusPct = 0;
  let rawScore = 0;

  // 1. Element Resonance
  let dominantElement: { element: string; count: number; icon: string; name: string } | null = null;
  let maxElemCount = 0;

  Object.entries(elementCounts).forEach(([elem, count]) => {
    const meta = ELEMENT_META[elem] || { ko: elem, en: elem, icon: '🔮', color: 'text-slate-700 bg-slate-50 border-slate-200' };
    const elemName = language === 'ko' ? meta.ko : meta.en;

    if (count > maxElemCount) {
      maxElemCount = count;
      dominantElement = { element: elem, count, icon: meta.icon, name: elemName };
    }

    if (count >= 2) {
      let tier = 1;
      let bonusText = language === 'ko' ? '+5% 공격력' : '+5% ATK';
      let desc = language === 'ko' ? `동일 속성 ${count}장 배치로 기본 공격력 상승` : `${count} matching elements boost ATK`;
      
      if (count === 2) {
        tier = 1;
        atkBonusPct += 5;
        rawScore += 18;
      } else if (count === 3) {
        tier = 2;
        bonusText = language === 'ko' ? '+10% 종합 전력' : '+10% Power';
        desc = language === 'ko' ? `3중 공명으로 덱 종합 전투력 대폭 강화` : `Tri-resonance grants +10% Total Power`;
        powerBonusPct += 10;
        rawScore += 35;
      } else if (count === 4) {
        tier = 3;
        bonusText = language === 'ko' ? '+18% 전력 + 속성보호막' : '+18% Power + Shield';
        desc = language === 'ko' ? `4중 공명으로 전력 증폭 및 방어 보호막 형성` : `Quad-resonance grants +18% Power & Barrier`;
        powerBonusPct += 18;
        defBonusPct += 10;
        rawScore += 55;
      } else if (count >= 5) {
        tier = 4;
        bonusText = language === 'ko' ? '+25% 전력 + 신격 공명' : '+25% Power + Godly';
        desc = language === 'ko' ? `5장 단일속성 완성: 절대 공명 보너스 발동!` : `Mono-element full resonance activated!`;
        powerBonusPct += 25;
        atkBonusPct += 15;
        defBonusPct += 15;
        rawScore += 80;
      }

      synergies.push({
        id: `elem-${elem}`,
        name: language === 'ko' ? `${elemName} 공명` : `${elemName} Resonance`,
        icon: meta.icon,
        count,
        maxCount: 5,
        active: true,
        tier,
        bonusText,
        description: desc,
      });
    }
  });

  // 2. Rarity Apex Synergy
  if (urCount >= 2) {
    rawScore += 25;
    atkBonusPct += 8;
    synergies.push({
      id: 'rarity-ur',
      name: language === 'ko' ? 'UR 정점 각성' : 'UR Apex Awakening',
      icon: '👑',
      count: urCount,
      maxCount: 5,
      active: true,
      tier: 3,
      bonusText: language === 'ko' ? '+8% 치명타율' : '+8% Crit Rate',
      description: language === 'ko' ? `UR 최고등급 카드 2장 이상 배치 효과` : `2+ UR cards grant crit synergy`,
    });
  } else if (urCount + ssrCount >= 3) {
    rawScore += 15;
    powerBonusPct += 6;
    synergies.push({
      id: 'rarity-high',
      name: language === 'ko' ? '고등급 황금 진형' : 'Golden Vanguard',
      icon: '🌟',
      count: urCount + ssrCount,
      maxCount: 5,
      active: true,
      tier: 2,
      bonusText: language === 'ko' ? '+6% 종합 전력' : '+6% Power',
      description: language === 'ko' ? `SSR/UR 카드 3장 이상 편대 보너스` : `3+ SSR/UR cards assembled`,
    });
  }

  // 3. Faction Bond Synergy
  Object.entries(factionCounts).forEach(([faction, count]) => {
    if (count >= 2) {
      rawScore += count >= 3 ? 24 : 12;
      powerBonusPct += count >= 3 ? 12 : 6;
      synergies.push({
        id: `faction-${faction}`,
        name: language === 'ko' ? `${faction} 유대 연계` : `${faction} Bond`,
        icon: '🛡️',
        count,
        maxCount: 5,
        active: true,
        tier: count >= 3 ? 3 : 2,
        bonusText: language === 'ko' ? `+${count >= 3 ? 12 : 6}% 유대 보너스` : `+${count >= 3 ? 12 : 6}% Bond Power`,
        description: language === 'ko' ? `동일 세력 ${count}장 출전으로 연계 공격 활성화` : `${count} cards from same faction`,
      });
    }
  });

  // 4. Tactical Formation Synergy
  if (atkCount >= 3) {
    rawScore += 14;
    atkBonusPct += 10;
    synergies.push({
      id: 'formation-blitz',
      name: language === 'ko' ? '돌격 섬멸 진형' : 'Assault Blitz',
      icon: '⚔️',
      count: atkCount,
      maxCount: 5,
      active: true,
      tier: 2,
      bonusText: language === 'ko' ? '+10% 돌파 공격' : '+10% Breach ATK',
      description: language === 'ko' ? `공격 특화 카드 3장 이상 배치` : `3+ Assault cards in vanguard`,
    });
  } else if (defCount >= 3) {
    rawScore += 14;
    defBonusPct += 12;
    synergies.push({
      id: 'formation-aegis',
      name: language === 'ko' ? '철벽 방진 수호' : 'Iron Aegis',
      icon: '🏰',
      count: defCount,
      maxCount: 5,
      active: true,
      tier: 2,
      bonusText: language === 'ko' ? '+12% 방어 저항' : '+12% Damage Resist',
      description: language === 'ko' ? `수호 특화 카드 3장 이상 배치` : `3+ Defensive cards deployed`,
    });
  } else if (atkCount >= 1 && defCount >= 1 && balanceCount >= 1) {
    rawScore += 12;
    powerBonusPct += 5;
    synergies.push({
      id: 'formation-balance',
      name: language === 'ko' ? '완전체 밸런스 전술' : 'Tri-Balanced Stance',
      icon: '⚖️',
      count: 5,
      maxCount: 5,
      active: true,
      tier: 1,
      bonusText: language === 'ko' ? '+5% 전방위 스탯' : '+5% All Stats',
      description: language === 'ko' ? `공격/방어/지원 조화로운 황금 분할` : `Balanced offensive and defensive harmony`,
    });
  }

  // Calculate final score 0 - 100
  const normalizedScore = Math.min(100, Math.max(10, Math.round(rawScore)));
  let grade: 'SSS' | 'SS' | 'S' | 'A' | 'B' | 'C' = 'C';
  let gradeColor = 'text-slate-600 border-slate-300 bg-slate-100';

  if (normalizedScore >= 90) {
    grade = 'SSS';
    gradeColor = 'text-purple-700 border-purple-400 bg-purple-50';
  } else if (normalizedScore >= 80) {
    grade = 'SS';
    gradeColor = 'text-amber-700 border-amber-400 bg-amber-50';
  } else if (normalizedScore >= 65) {
    grade = 'S';
    gradeColor = 'text-blue-700 border-blue-400 bg-blue-50';
  } else if (normalizedScore >= 45) {
    grade = 'A';
    gradeColor = 'text-emerald-700 border-emerald-400 bg-emerald-50';
  } else if (normalizedScore >= 25) {
    grade = 'B';
    gradeColor = 'text-teal-700 border-teal-400 bg-teal-50';
  }

  return {
    score: normalizedScore,
    grade,
    gradeColor,
    activeSynergies: synergies,
    elementDominance: dominantElement,
    atkBonusPct,
    defBonusPct,
    powerBonusPct,
  };
};

export const DeckSynergyCalculator: React.FC<DeckSynergyCalculatorProps> = ({
  currentDeck,
  ownedCards,
  inventory,
  language,
  updateDeck,
  playSfx,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [presetToast, setPresetToast] = useState<string | null>(null);

  const synergyResult = useMemo(() => {
    return calculateDeckSynergies(currentDeck, language);
  }, [currentDeck, language]);

  const showToast = (message: string) => {
    setPresetToast(message);
    window.setTimeout(() => {
      setPresetToast((prev) => (prev === message ? null : prev));
    }, 2800);
  };

  // Smart 1-Click Auto Preset Generation Algorithm
  const handleApplyPreset = (type: 'atk' | 'def' | 'element' | 'balance') => {
    // Collect all candidate cards from ownedCards + CARD_DATABASE
    const cardPool = Object.values(CARD_DATABASE).map((dbCard) => {
      const invData = inventory[dbCard.id];
      return syncCardWithDatabase({
        ...dbCard,
        id: `card-${dbCard.id}-${Date.now()}`,
        imageIndex: dbCard.id,
        owner: null,
        growth: invData?.growth || 0,
        hunger: invData?.hunger || 100,
        happiness: invData?.happiness || 100,
        lastInteraction: invData?.lastInteraction,
      }, inventory);
    });

    let selectedCards: CardData[] = [];
    let presetLabel = '';

    if (type === 'atk') {
      // Sort by top + right attack stats and Fire/Wind elements
      selectedCards = [...cardPool]
        .sort((a, b) => {
          const aTop = a.stats?.[0] ?? 0;
          const aRight = a.stats?.[1] ?? 0;
          const bTop = b.stats?.[0] ?? 0;
          const bRight = b.stats?.[1] ?? 0;
          const aAtk = aTop + aRight;
          const bAtk = bTop + bRight;
          const aElem = String(a.element || '').toLowerCase();
          const bElem = String(b.element || '').toLowerCase();
          const aElemBonus = (aElem === 'fire' || aElem === 'wind' || aElem === 'air') ? 2 : 0;
          const bElemBonus = (bElem === 'fire' || bElem === 'wind' || bElem === 'air') ? 2 : 0;
          return (bAtk + bElemBonus) - (aAtk + aElemBonus);
        })
        .slice(0, 5);
      presetLabel = language === 'ko' ? '🔥 공격형 극딜 덱이 자동 편성되었습니다!' : '🔥 Aggressive Attack Preset applied!';
    } else if (type === 'def') {
      // Sort by bottom + left defense stats and Earth/Water elements
      selectedCards = [...cardPool]
        .sort((a, b) => {
          const aBottom = a.stats?.[2] ?? 0;
          const aLeft = a.stats?.[3] ?? 0;
          const bBottom = b.stats?.[2] ?? 0;
          const bLeft = b.stats?.[3] ?? 0;
          const aDef = aBottom + aLeft;
          const bDef = bBottom + bLeft;
          const aElem = String(a.element || '').toLowerCase();
          const bElem = String(b.element || '').toLowerCase();
          const aElemBonus = (aElem === 'earth' || aElem === 'water' || aElem === 'land') ? 2 : 0;
          const bElemBonus = (bElem === 'earth' || bElem === 'water' || bElem === 'land') ? 2 : 0;
          return (bDef + bElemBonus) - (aDef + aElemBonus);
        })
        .slice(0, 5);
      presetLabel = language === 'ko' ? '🛡️ 방어형 철벽 덱이 자동 편성되었습니다!' : '🛡️ Defensive Wall Preset applied!';
    } else if (type === 'element') {
      // Find the element with the highest total power in inventory
      const elemCounts: Record<string, { cards: CardData[]; totalPower: number }> = {};
      cardPool.forEach((c) => {
        const elem = (c.element || 'FIRE').toUpperCase();
        if (!elemCounts[elem]) elemCounts[elem] = { cards: [], totalPower: 0 };
        elemCounts[elem].cards.push(c);
        elemCounts[elem].totalPower += (c.power || 10);
      });

      let bestElem = 'FIRE';
      let maxPower = 0;
      Object.entries(elemCounts).forEach(([elem, data]) => {
        if (data.cards.length >= 5 && data.totalPower > maxPower) {
          maxPower = data.totalPower;
          bestElem = elem;
        }
      });

      selectedCards = elemCounts[bestElem]?.cards
        .sort((a, b) => (b.power || 0) - (a.power || 0))
        .slice(0, 5) || cardPool.slice(0, 5);
      
      const elemName = ELEMENT_META[bestElem] ? (language === 'ko' ? ELEMENT_META[bestElem].ko : ELEMENT_META[bestElem].en) : bestElem;
      presetLabel = language === 'ko' ? `⚡ ${elemName} 5중 단일속성 공명 덱이 완성되었습니다!` : `⚡ ${elemName} 5x Resonance Preset applied!`;
    } else {
      // Balanced: Top power with UR/SSR priorities
      selectedCards = [...cardPool]
        .sort((a, b) => {
          const aRarityRank = a.rarity === 'UR' ? 4 : a.rarity === 'SSR' ? 3 : a.rarity === 'SR' ? 2 : 1;
          const bRarityRank = b.rarity === 'UR' ? 4 : b.rarity === 'SSR' ? 3 : b.rarity === 'SR' ? 2 : 1;
          return (bRarityRank * 100 + (b.power || 0)) - (aRarityRank * 100 + (a.power || 0));
        })
        .slice(0, 5);
      presetLabel = language === 'ko' ? '⚖️ 최적 밸런스 황금 덱이 완성되었습니다!' : '⚖️ Optimal Balanced Preset applied!';
    }

    if (selectedCards.length === 5) {
      updateDeck(selectedCards);
      playSfx?.('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3');
      showToast(presetLabel);
    }
  };

  return (
    <div
      id="deck-synergy-calculator"
      className={cn(
        "w-full bg-[#fdfcfc] border border-black/15 rounded-none font-mono text-[#201d1d] select-none shadow-none",
        className
      )}
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {presetToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-2.5 bg-[#201d1d] text-[#fdfcfc] text-xs font-bold flex items-center justify-between border-b border-black/20"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-400 shrink-0 animate-spin" />
              <span>{presetToast}</span>
            </div>
            <button
              onClick={() => setPresetToast(null)}
              className="text-white/60 hover:text-white text-[10px] uppercase font-bold cursor-pointer"
            >
              [X]
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header / Score Bar */}
      <div className="p-3 sm:p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Synergy Score Badge */}
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "px-2.5 py-1 text-xs font-black uppercase tracking-wider border rounded-sm flex items-center gap-1.5",
              synergyResult.gradeColor
            )}>
              <span>[SYNERGY]</span>
              <span className="text-sm font-black underline">{synergyResult.grade}</span>
              <span className="text-[11px] opacity-75">({synergyResult.score}P)</span>
            </div>

            <div className="text-xs font-bold text-black/70 flex items-center gap-2">
              {synergyResult.powerBonusPct > 0 && (
                <span className="text-blue-700 font-bold">+{synergyResult.powerBonusPct}% PWR</span>
              )}
              {synergyResult.atkBonusPct > 0 && (
                <span className="text-red-700 font-bold">+{synergyResult.atkBonusPct}% ATK</span>
              )}
              {synergyResult.defBonusPct > 0 && (
                <span className="text-emerald-700 font-bold">+{synergyResult.defBonusPct}% DEF</span>
              )}
              {synergyResult.activeSynergies.length === 0 && (
                <span className="text-black/40 italic">
                  {language === 'ko' ? '시너지 효과 없음 (카드를 배치하세요)' : 'No active synergy'}
                </span>
              )}
            </div>
          </div>

          {/* Toggle Details Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-[11px] font-bold text-black/80 hover:text-black border border-black/20 hover:border-black/40 rounded-sm bg-white active:scale-98 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>{isExpanded ? (language === 'ko' ? '[- 접기]' : '[- Hide]') : (language === 'ko' ? '[+ 상세 시너지]' : '[+ Details]')}</span>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>

        {/* 1-Click Smart Preset Buttons (Row 655 Requirement) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1 border-t border-black/10">
          <button
            onClick={() => handleApplyPreset('atk')}
            className="px-2.5 py-2 text-left bg-red-50/70 hover:bg-red-100/80 border border-red-200 text-red-900 rounded-sm active:scale-98 transition-all cursor-pointer flex items-center justify-between"
            title={language === 'ko' ? '공격력 및 돌파 스탯 극대화 덱 편성' : 'Optimize for high ATK and breach stats'}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Flame size={14} className="text-red-600 shrink-0" />
              <span className="text-xs font-bold truncate">
                {language === 'ko' ? '공격형 완성' : 'ATK Preset'}
              </span>
            </div>
            <span className="text-[10px] font-bold opacity-60 shrink-0">[1-TAP]</span>
          </button>

          <button
            onClick={() => handleApplyPreset('def')}
            className="px-2.5 py-2 text-left bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 rounded-sm active:scale-98 transition-all cursor-pointer flex items-center justify-between"
            title={language === 'ko' ? '방어력 및 수호 벽 스탯 극대화 덱 편성' : 'Optimize for high DEF and guard stats'}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Shield size={14} className="text-emerald-700 shrink-0" />
              <span className="text-xs font-bold truncate">
                {language === 'ko' ? '방어형 완성' : 'DEF Preset'}
              </span>
            </div>
            <span className="text-[10px] font-bold opacity-60 shrink-0">[1-TAP]</span>
          </button>

          <button
            onClick={() => handleApplyPreset('element')}
            className="px-2.5 py-2 text-left bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-sm active:scale-98 transition-all cursor-pointer flex items-center justify-between"
            title={language === 'ko' ? '보유 카드 중 가장 강력한 단일 속성 5장 공명 덱 편성' : 'Optimize for maximum mono-element resonance'}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Zap size={14} className="text-amber-600 shrink-0" />
              <span className="text-xs font-bold truncate">
                {language === 'ko' ? '속성공명 완성' : 'Element Preset'}
              </span>
            </div>
            <span className="text-[10px] font-bold opacity-60 shrink-0">[1-TAP]</span>
          </button>

          <button
            onClick={() => handleApplyPreset('balance')}
            className="px-2.5 py-2 text-left bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 text-blue-900 rounded-sm active:scale-98 transition-all cursor-pointer flex items-center justify-between"
            title={language === 'ko' ? '최고 전투력 및 희귀도 조화 황금 덱 편성' : 'Optimize for highest total CP & rarity harmony'}
          >
            <div className="flex items-center gap-1.5 truncate">
              <Scale size={14} className="text-blue-700 shrink-0" />
              <span className="text-xs font-bold truncate">
                {language === 'ko' ? '밸런스 완성' : 'Balance Preset'}
              </span>
            </div>
            <span className="text-[10px] font-bold opacity-60 shrink-0">[1-TAP]</span>
          </button>
        </div>

        {/* Active Synergies Chips (Compact View) */}
        {synergyResult.activeSynergies.length > 0 && !isExpanded && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {synergyResult.activeSynergies.map((syn) => (
              <div
                key={syn.id}
                className="px-2 py-0.5 bg-white border border-black/15 text-[11px] font-bold flex items-center gap-1 rounded-sm"
              >
                <span>{syn.icon}</span>
                <span className="text-black/80">{syn.name}</span>
                <span className="text-blue-700 font-bold">({syn.bonusText})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expandable Detailed Breakdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-black/15 bg-white/60 p-3 sm:p-4 space-y-3"
          >
            <div className="flex items-center justify-between text-xs font-bold text-black/60 border-b border-black/10 pb-1.5">
              <span>{language === 'ko' ? '[현재 활성화된 덱 시너지 목록]' : '[ACTIVE DECK SYNERGIES]'}</span>
              <span>{synergyResult.activeSynergies.length} {language === 'ko' ? '개 발동 중' : 'active'}</span>
            </div>

            {synergyResult.activeSynergies.length === 0 ? (
              <div className="p-4 text-center text-xs font-bold text-black/40 bg-white border border-black/10 rounded-none">
                {language === 'ko'
                  ? '같은 속성 카드 2장 이상, 또는 상단 AI 추천 프리셋을 눌러 시너지를 활성화하세요.'
                  : 'Assemble 2+ matching element cards or use smart presets to trigger synergies.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {synergyResult.activeSynergies.map((syn) => (
                  <div
                    key={syn.id}
                    className="p-2.5 bg-white border border-black/15 rounded-none flex items-start gap-2.5"
                  >
                    <div className="text-xl p-1 bg-black/5 rounded-sm shrink-0">
                      {syn.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#201d1d] truncate">
                          {syn.name}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.2 bg-black/10 rounded-sm">
                          Lv.{syn.tier}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-blue-700 mt-0.5">
                        {syn.bonusText}
                      </p>
                      <p className="text-[10px] text-black/60 leading-tight mt-0.5">
                        {syn.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Synergy Bonus Rules Infographic */}
            <div className="p-2.5 bg-black/5 border border-black/10 text-[10px] font-bold text-black/70 space-y-1">
              <div className="flex items-center gap-1 text-black/90 uppercase">
                <Info size={12} />
                <span>{language === 'ko' ? '시너지 효과 가이드' : 'Synergy Rule Guide'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[9px] text-black/60 pt-1">
                <div>• 2장 일치: +5% ATK</div>
                <div>• 3장 공명: +10% PWR</div>
                <div>• 4장 공명: +18% PWR + 쉴드</div>
                <div>• 5장 단일: +25% PWR + 신격</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
