import React, { useState, useMemo } from 'react';
import { Sparkles, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Language } from '../types';

interface ElementCounterSimulatorProps {
  cardElement?: string;
  baseStats: [number, number, number, number]; // [N, E, S, W]
  language: Language;
}

type OpponentElement = 'water' | 'fire' | 'earth' | 'wind';

export const ElementCounterSimulator: React.FC<ElementCounterSimulatorProps> = ({
  cardElement = 'neutral',
  baseStats,
  language,
}) => {
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentElement>('fire');

  // 상성 관계: water > fire > earth > wind > water
  const synergyResult = useMemo(() => {
    const myElem = cardElement.toLowerCase();
    const oppElem = selectedOpponent.toLowerCase();

    let diff = 0;
    let labelKo = '동등 상성 (보정 없음)';
    let labelEn = 'Neutral (No Modifier)';
    let type: 'advantage' | 'disadvantage' | 'neutral' = 'neutral';

    if (
      (myElem === 'water' && oppElem === 'fire') ||
      (myElem === 'fire' && oppElem === 'earth') ||
      (myElem === 'earth' && oppElem === 'wind') ||
      (myElem === 'wind' && oppElem === 'water')
    ) {
      diff = 2;
      type = 'advantage';
      labelKo = '상성 우위 (+2 파워 보정)';
      labelEn = 'Elemental Advantage (+2 Power)';
    } else if (
      (myElem === 'fire' && oppElem === 'water') ||
      (myElem === 'earth' && oppElem === 'fire') ||
      (myElem === 'wind' && oppElem === 'earth') ||
      (myElem === 'water' && oppElem === 'wind')
    ) {
      diff = -2;
      type = 'disadvantage';
      labelKo = '상성 열세 (-2 파워 페널티)';
      labelEn = 'Elemental Disadvantage (-2 Penalty)';
    }

    const modifiedStats = baseStats.map((val) => Math.max(1, val + diff)) as [number, number, number, number];

    return {
      diff,
      type,
      label: language === 'ko' ? labelKo : labelEn,
      modifiedStats,
    };
  }, [cardElement, selectedOpponent, baseStats, language]);

  const elementButtons: Array<{ id: OpponentElement; labelKo: string; labelEn: string; icon: string; bg: string }> = [
    { id: 'water', labelKo: '수(水)', labelEn: 'Water', icon: '💧', bg: 'hover:border-cyan-500' },
    { id: 'fire', labelKo: '화(火)', labelEn: 'Fire', icon: '🔥', bg: 'hover:border-rose-500' },
    { id: 'earth', labelKo: '지(地)', labelEn: 'Earth', icon: '⛰️', bg: 'hover:border-amber-500' },
    { id: 'wind', labelKo: '풍(風)', labelEn: 'Wind', icon: '🌪️', bg: 'hover:border-emerald-500' },
  ];

  return (
    <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 shadow-sm space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
        <span className="font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          {language === 'ko' ? '속성 상성 시뮬레이터' : 'Counter Damage Preview'}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
          synergyResult.type === 'advantage'
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
            : synergyResult.type === 'disadvantage'
            ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
            : 'bg-zinc-500/15 border-zinc-500/40 text-zinc-600 dark:text-zinc-400'
        }`}>
          {synergyResult.type === 'advantage' && <ArrowUpRight size={12} />}
          {synergyResult.type === 'disadvantage' && <ArrowDownRight size={12} />}
          {synergyResult.type === 'neutral' && <Minus size={12} />}
          {synergyResult.label}
        </span>
      </div>

      {/* Opponent Element Switcher Buttons */}
      <div className="space-y-1">
        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
          {language === 'ko' ? '대결 상대 카드 속성 선택:' : 'Select Opponent Element:'}
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {elementButtons.map((btn) => {
            const isSelected = selectedOpponent === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setSelectedOpponent(btn.id)}
                className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white font-black shadow-xs'
                    : `bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 ${btn.bg}`
                }`}
              >
                <span>{btn.icon}</span>
                <span className="text-[11px]">{language === 'ko' ? btn.labelKo : btn.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modified 4-way Power Stat Grid */}
      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
        <div className="text-[10px] text-zinc-500 text-center mb-1.5 font-bold">
          {language === 'ko' ? '상성 적용 후 4방향 파워 수치' : 'Calculated 4-Directional Power'}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {['N', 'E', 'S', 'W'].map((dir, idx) => {
            const base = baseStats[idx];
            const mod = synergyResult.modifiedStats[idx];
            const diff = mod - base;

            return (
              <div key={dir} className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 shadow-2xs">
                <span className="text-[9px] text-zinc-400 block font-black">{dir}</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">{mod}</span>
                  {diff !== 0 && (
                    <span className={`text-[9px] font-black ${diff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
