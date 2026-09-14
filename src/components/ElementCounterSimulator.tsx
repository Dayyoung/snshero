/**
 * ElementCounterSimulator.tsx
 * 카드 상세 내 속성 상성 시뮬레이터 (Counter Damage Preview) 인터랙티브 위젯
 * (구글 스프레드시트 Row 1049 / ID 312 요구사항 구현)
 */

import React, { useState } from 'react';
import { Droplets, Flame, Mountain, Wind, ShieldAlert, Sparkles } from 'lucide-react';
import { playBattleSfx } from '../lib/AudioSpriteService';

export type ElementType = 'WATER' | 'FIRE' | 'EARTH' | 'WIND';

interface ElementCounterSimulatorProps {
  cardElement: string;
  baseStats: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  language?: string;
  className?: string;
}

export const ElementCounterSimulator: React.FC<ElementCounterSimulatorProps> = ({
  cardElement,
  baseStats,
  language = 'ko',
  className = '',
}) => {
  const isKo = language === 'ko';
  const myEl = cardElement.toUpperCase() as ElementType;
  const [targetElement, setTargetElement] = useState<ElementType>('FIRE');

  // 상성 보정치 계산: +2 (우세), -2 (열세), 0 (동등)
  const calculateModifier = (my: string, target: ElementType): number => {
    switch (my) {
      case 'WATER':
        if (target === 'FIRE') return +2;
        if (target === 'WIND') return -2;
        return 0;
      case 'FIRE':
        if (target === 'EARTH') return +2;
        if (target === 'WATER') return -2;
        return 0;
      case 'EARTH':
        if (target === 'WIND') return +2;
        if (target === 'FIRE') return -2;
        return 0;
      case 'WIND':
        if (target === 'WATER') return +2;
        if (target === 'EARTH') return -2;
        return 0;
      default:
        return 0;
    }
  };

  const modifier = calculateModifier(myEl, targetElement);

  const elements: { type: ElementType; labelKo: string; labelEn: string; icon: React.ReactNode; color: string }[] = [
    { type: 'WATER', labelKo: '수(Water)', labelEn: 'Water', icon: <Droplets size={12} />, color: 'text-cyan-600 border-cyan-300' },
    { type: 'FIRE', labelKo: '화(Fire)', labelEn: 'Fire', icon: <Flame size={12} />, color: 'text-rose-600 border-rose-300' },
    { type: 'EARTH', labelKo: '지(Earth)', labelEn: 'Earth', icon: <Mountain size={12} />, color: 'text-amber-700 border-amber-300' },
    { type: 'WIND', labelKo: '풍(Wind)', labelEn: 'Wind', icon: <Wind size={12} />, color: 'text-emerald-600 border-emerald-300' },
  ];

  const handleSelectElement = (el: ElementType) => {
    setTargetElement(el);
    playBattleSfx('click');
  };

  const getEffectiveStat = (base: number) => {
    const val = base + modifier;
    return Math.max(1, val);
  };

  return (
    <div className={`p-3 bg-[#f8f7f5] border border-[rgba(15,0,0,0.12)] font-mono text-xs ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-[#201d1d] flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-600" />
          {isKo ? '상성 시뮬레이터 (Counter Preview)' : 'Element Matchup Preview'}
        </span>
        <span className="text-[10px] text-stone-500 uppercase">
          {myEl || 'NEUTRAL'} vs {targetElement}
        </span>
      </div>

      {/* 상대 속성 선택 버튼 세트 */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {elements.map((el) => {
          const isSelected = targetElement === el.type;
          return (
            <button
              key={el.type}
              type="button"
              onClick={() => handleSelectElement(el.type)}
              className={`py-1 px-1 flex items-center justify-center gap-1 text-[11px] font-bold border transition-all ${
                isSelected
                  ? 'bg-[#201d1d] text-[#fdfcfc] border-[#201d1d] shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
              }`}
            >
              {el.icon}
              <span>{isKo ? el.labelKo.slice(0, 1) : el.labelEn.slice(0, 1)}</span>
            </button>
          );
        })}
      </div>

      {/* 4방향 스탯 실시간 보정치 매트릭스 */}
      <div className="flex items-center justify-between bg-white p-2.5 border border-stone-200 mb-2">
        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-24 h-24 text-center items-center justify-center mx-auto text-xs font-bold">
          <div className="col-start-2 row-start-1 bg-stone-50 border p-1 rounded-sm">
            <span className={modifier > 0 ? 'text-emerald-600' : modifier < 0 ? 'text-rose-600' : 'text-stone-700'}>
              {getEffectiveStat(baseStats.top)}
            </span>
          </div>
          <div className="col-start-1 row-start-2 bg-stone-50 border p-1 rounded-sm">
            <span className={modifier > 0 ? 'text-emerald-600' : modifier < 0 ? 'text-rose-600' : 'text-stone-700'}>
              {getEffectiveStat(baseStats.left)}
            </span>
          </div>
          <div className="col-start-2 row-start-2 bg-stone-200 text-[10px] text-stone-500 flex items-center justify-center">
            {modifier > 0 ? '+2' : modifier < 0 ? '-2' : '0'}
          </div>
          <div className="col-start-3 row-start-2 bg-stone-50 border p-1 rounded-sm">
            <span className={modifier > 0 ? 'text-emerald-600' : modifier < 0 ? 'text-rose-600' : 'text-stone-700'}>
              {getEffectiveStat(baseStats.right)}
            </span>
          </div>
          <div className="col-start-2 row-start-3 bg-stone-50 border p-1 rounded-sm">
            <span className={modifier > 0 ? 'text-emerald-600' : modifier < 0 ? 'text-rose-600' : 'text-stone-700'}>
              {getEffectiveStat(baseStats.bottom)}
            </span>
          </div>
        </div>

        {/* 상성 결과 배지 & 설명 */}
        <div className="flex-1 pl-3 text-[11px] leading-snug">
          {modifier > 0 ? (
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-sm">
              <span className="font-bold block text-emerald-700 mb-0.5">
                {isKo ? '★ 속성 우세 (+2 ATK)' : '★ Advantage (+2 ATK)'}
              </span>
              <span>
                {isKo
                  ? `${myEl} 속성이 ${targetElement} 속성을 압도하여 전투력 +2 보정을 받습니다.`
                  : `${myEl} counters ${targetElement} with +2 stat bonus.`}
              </span>
            </div>
          ) : modifier < 0 ? (
            <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-sm">
              <span className="font-bold block text-rose-700 mb-0.5 flex items-center gap-1">
                <ShieldAlert size={12} />
                {isKo ? '▼ 속성 열세 (-2 ATK)' : '▼ Disadvantage (-2 ATK)'}
              </span>
              <span>
                {isKo
                  ? `${targetElement} 속성에 밀려 전투 시 공격력이 2 감소합니다.`
                  : `${myEl} is weak against ${targetElement} (-2 penalty).`}
              </span>
            </div>
          ) : (
            <div className="p-2 bg-stone-100 border border-stone-200 text-stone-600 rounded-sm">
              <span className="font-bold block text-stone-700 mb-0.5">
                {isKo ? '○ 상성 동등 (보정 없음)' : '○ Neutral Matchup'}
              </span>
              <span>
                {isKo
                  ? '기본 공격력 수치 그대로 캡처 대결이 진행됩니다.'
                  : 'Standard stat comparison applies.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
