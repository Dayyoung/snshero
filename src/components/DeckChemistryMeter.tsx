import React, { useMemo } from 'react';
import { Sparkles, Shield, Flame, Activity, Zap } from 'lucide-react';
import { CardData, Language } from '../types';

interface DeckChemistryMeterProps {
  deck: CardData[];
  language: Language;
}

export const DeckChemistryMeter: React.FC<DeckChemistryMeterProps> = ({
  deck,
  language,
}) => {
  const { score, grade, synergies } = useMemo(() => {
    if (!deck || deck.length === 0) {
      return { score: 0, grade: 'C', synergies: [] };
    }

    const elementCounts: Record<string, number> = {};
    deck.forEach((card) => {
      const elem = (card.element || 'neutral').toLowerCase();
      elementCounts[elem] = (elementCounts[elem] || 0) + 1;
    });

    // 1. 단일 속성 집중도 (최대 5장 = 40점)
    const maxElemCount = Math.max(0, ...Object.values(elementCounts));
    const monoScore = Math.min(40, (maxElemCount / 5) * 40);

    // 2. 카드 5장 편성 여부 (최대 5장 = 40점)
    const countScore = Math.min(40, (deck.length / 5) * 40);

    // 3. 카드 평균 레벨/파워 밸런스 (최대 20점)
    const totalPower = deck.reduce((acc, c) => acc + (c.power || 0), 0);
    const avgPower = deck.length > 0 ? totalPower / deck.length : 0;
    const balanceScore = Math.min(20, (avgPower / 10) * 20);

    const totalScore = Math.min(100, Math.round(monoScore + countScore + balanceScore));

    let g = 'C';
    if (totalScore >= 85) g = 'S';
    else if (totalScore >= 70) g = 'A';
    else if (totalScore >= 50) g = 'B';

    // 활성 패시브 시너지 태그 생성
    const synList: Array<{ label: string; icon: any; color: string }> = [];

    if (maxElemCount >= 3) {
      synList.push({
        label: language === 'ko' ? '원소 집중 연계: ATK +6%' : 'Elemental Focus: ATK +6%',
        icon: Flame,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      });
    }

    if (deck.length === 5) {
      synList.push({
        label: language === 'ko' ? '5인 결전 편대: DEF +5%' : 'Full Vanguard: DEF +5%',
        icon: Shield,
        color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      });
    }

    if (Object.keys(elementCounts).length >= 4) {
      synList.push({
        label: language === 'ko' ? '다원소 조화: CRIT +4%' : 'Prismatic Balance: CRIT +4%',
        icon: Zap,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      });
    }

    return { score: totalScore, grade: g, synergies: synList };
  }, [deck, language]);

  return (
    <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-100 font-mono shadow-md space-y-2">
      {/* Header & Gauge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-300">
          <Activity size={14} className="text-indigo-400" />
          <span>{language === 'ko' ? '덱 완성도 (Deck Chemistry)' : 'Deck Chemistry Meter'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${
            grade === 'S'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : grade === 'A'
              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}>
            Rank {grade}
          </span>
          <span className="text-sm font-black text-indigo-400">{score}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden p-0.5 border border-zinc-700/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 transition-all duration-500"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Active Synergy Passive Tags */}
      {synergies.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {synergies.map((s, idx) => {
            const Icon = s.icon;
            return (
              <span
                key={idx}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.color}`}
              >
                <Icon size={11} />
                <span>{s.label}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
