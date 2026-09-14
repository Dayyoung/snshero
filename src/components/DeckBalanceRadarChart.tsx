/**
 * DeckBalanceRadarChart.tsx
 * ID 357: 마이덱 편성 시 카드 속성/방향 밸런스 레이더 차트 미니 뷰
 * ID 382: 마이덱 편집 시 카드 방향별 스탯 편중 요약 인포 위젯
 * ID 407: 마이덱 편성 시 카드 파워 총합 및 덱 경쟁력 벤치마크 지표
 * ID 397: 마이덱 편집 화면 내 속성 시너지 달성 조건 실시간 게이지
 */

import React from 'react';
import { Shield, Sparkles, TrendingUp, AlertTriangle, Compass } from 'lucide-react';
import { CardData, Language } from '../types';

interface DeckBalanceRadarChartProps {
  deck: CardData[];
  language: Language;
  className?: string;
}

export const DeckBalanceRadarChart: React.FC<DeckBalanceRadarChartProps> = ({
  deck,
  language,
  className = '',
}) => {
  if (deck.length === 0) return null;

  // 1. 방향별 스탯 합산 & 평균 (ID 382)
  let sumUp = 0;
  let sumDown = 0;
  let sumLeft = 0;
  let sumRight = 0;
  let totalPower = 0;

  // 2. 속성 카운트 (ID 397)
  const elementCounts: Record<string, number> = {
    FIRE: 0,
    WATER: 0,
    EARTH: 0,
    LIGHT: 0,
  };

  deck.forEach((card) => {
    const u = card.stats?.up || card.stats?.[0] || 0;
    const r = card.stats?.right || card.stats?.[1] || 0;
    const d = card.stats?.down || card.stats?.[2] || 0;
    const l = card.stats?.left || card.stats?.[3] || 0;

    sumUp += u;
    sumRight += r;
    sumDown += d;
    sumLeft += l;
    totalPower += (u + r + d + l);

    const el = card.element?.toUpperCase() || 'NEUTRAL';
    if (el in elementCounts) {
      elementCounts[el]++;
    }
  });

  const cardCount = Math.max(1, deck.length);
  const avgUp = (sumUp / cardCount).toFixed(1);
  const avgDown = (sumDown / cardCount).toFixed(1);
  const avgLeft = (sumLeft / cardCount).toFixed(1);
  const avgRight = (sumRight / cardCount).toFixed(1);
  const avgPower = (totalPower / (cardCount * 4)).toFixed(1);

  // 방향 편중 진단
  const biasTags: string[] = [];
  if (sumUp >= sumDown + 5) biasTags.push(language === 'ko' ? '상단 돌파형' : 'Top-Heavy');
  if (sumDown >= sumUp + 5) biasTags.push(language === 'ko' ? '하단 수비형' : 'Bottom-Heavy');
  if (sumLeft >= sumRight + 5) biasTags.push(language === 'ko' ? '좌측 특화' : 'Left-Heavy');
  if (sumRight >= sumLeft + 5) biasTags.push(language === 'ko' ? '우측 특화' : 'Right-Heavy');
  if (biasTags.length === 0) biasTags.push(language === 'ko' ? '균형 밸런스형' : 'Balanced');

  // ID 407: 전투력 및 벤치마크
  const combatRating = Math.round(totalPower * 15 + deck.length * 20);
  let percentile = 'Top 25% in Silver';
  if (combatRating >= 800) percentile = language === 'ko' ? '다이아 티어 상위 5%' : 'Top 5% in Diamond';
  else if (combatRating >= 650) percentile = language === 'ko' ? '골드 티어 상위 15%' : 'Top 15% in Gold';
  else if (combatRating >= 500) percentile = language === 'ko' ? '실버 티어 상위 35%' : 'Top 35% in Silver';

  // ID 357: 4방향 SVG 레이더 차트 (Center 50,50, Radius 35)
  // Max directional average = 10
  const maxStat = 10;
  const cx = 50;
  const cy = 50;
  const r = 35;

  const pUp = { x: cx, y: cy - (Math.min(maxStat, sumUp / cardCount) / maxStat) * r };
  const pRight = { x: cx + (Math.min(maxStat, sumRight / cardCount) / maxStat) * r, y: cy };
  const pDown = { x: cx, y: cy + (Math.min(maxStat, sumDown / cardCount) / maxStat) * r };
  const pLeft = { x: cx - (Math.min(maxStat, sumLeft / cardCount) / maxStat) * r, y: cy };

  const radarPoints = `${pUp.x},${pUp.y} ${pRight.x},${pRight.y} ${pDown.x},${pDown.y} ${pLeft.x},${pLeft.y}`;

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-sm p-3 font-mono space-y-3 ${className}`}>
      {/* Header: Combat Rating & Benchmark (ID 407) */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={14} className="text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            {language === 'ko' ? '덱 전투력:' : 'Combat Rating:'} {combatRating}
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 rounded-xs">
          {percentile}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 items-center">
        {/* 4-Axis SVG Radar Chart (ID 357) */}
        <div className="relative flex flex-col items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-24 h-24">
            {/* Background Grid */}
            <circle cx="50" cy="50" r="35" fill="none" stroke="#334155" strokeWidth="1" opacity="0.4" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />
            <line x1="50" y1="15" x2="50" y2="85" stroke="#334155" strokeWidth="1" opacity="0.5" />
            <line x1="15" y1="50" x2="85" y2="50" stroke="#334155" strokeWidth="1" opacity="0.5" />

            {/* Radar Polygon */}
            <polygon
              points={radarPoints}
              fill="rgba(99, 102, 241, 0.3)"
              stroke="#818cf8"
              strokeWidth="1.5"
            />

            {/* Axis Labels */}
            <text x="50" y="10" textAnchor="middle" fill="#94a3b8" fontSize="6">▲ {avgUp}</text>
            <text x="94" y="52" textAnchor="start" fill="#94a3b8" fontSize="6">▶ {avgRight}</text>
            <text x="50" y="96" textAnchor="middle" fill="#94a3b8" fontSize="6">▼ {avgDown}</text>
            <text x="6" y="52" textAnchor="end" fill="#94a3b8" fontSize="6">◀ {avgLeft}</text>
          </svg>
          <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
            <Compass size={10} className="text-slate-500" />
            {language === 'ko' ? '방향별 커버리지' : 'Coverage Radar'}
          </span>
        </div>

        {/* Directional Power Bias & Tags (ID 382) */}
        <div className="space-y-2 text-[11px]">
          <div>
            <span className="text-slate-400">{language === 'ko' ? '평균 공격력:' : 'Avg Power:'} </span>
            <span className="font-bold text-amber-300">{avgPower}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {biasTags.map((tag, idx) => (
              <span key={idx} className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded-xs">
                {tag}
              </span>
            ))}
          </div>

          {/* ID 397: 속성 시너지 게이지 */}
          <div className="pt-1 space-y-1">
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Sparkles size={10} className="text-indigo-400" />
              <span>{language === 'ko' ? '속성 시너지 (3장 달성 시 보너스):' : 'Synergy Thresholds:'}</span>
            </div>
            <div className="flex gap-1.5 text-[9px]">
              {Object.entries(elementCounts).map(([el, cnt]) => {
                const isMet = cnt >= 3;
                let name = '화';
                if (el === 'WATER') name = '수';
                if (el === 'EARTH') name = '지';
                if (el === 'LIGHT') name = '광';

                return (
                  <span
                    key={el}
                    className={`px-1 py-0.2 rounded-xs border ${
                      isMet
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {name} {cnt}/3
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
