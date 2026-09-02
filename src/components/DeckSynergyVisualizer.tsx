import React from 'react';
import { Sparkles, Zap, Shield, Wand2, Layers } from 'lucide-react';
import { CardData } from '../types';
import { analyzeDeckSynergy, SynergyBonus } from '../lib/deckSynergyEngine';

interface DeckSynergyVisualizerProps {
  deck: CardData[];
  language?: string;
  onAutoFillOptimalSynergy?: () => void;
  className?: string;
}

export const DeckSynergyVisualizer: React.FC<DeckSynergyVisualizerProps> = ({
  deck,
  language = 'ko',
  onAutoFillOptimalSynergy,
  className = '',
}) => {
  const analysis = analyzeDeckSynergy(deck);

  return (
    <div
      className={`w-full bg-[#14121d] border border-white/10 rounded-sm p-3 sm:p-4 text-white font-mono ${className}`}
    >
      {/* Header & Score Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-amber-400" />
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            {language === 'ko' ? '[ 덱 속성 시너지 엔진 ]' : '[ DECK SYNERGY ENGINE ]'}
          </span>
          {analysis.activeSynergies.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-xs text-[9px] font-black bg-emerald-950/80 border border-emerald-500 text-emerald-300">
              {analysis.activeSynergies.length} {language === 'ko' ? '종 결속 발동' : 'Active Bonds'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] bg-black/50 px-2 py-1 rounded-xs border border-white/10">
            <span className="text-slate-400">{language === 'ko' ? '전술 보너스:' : 'Tactical Bonus:'}</span>
            <span className="text-rose-400 font-black">+{analysis.totalBonusPower} PWR</span>
            <span className="text-slate-600">|</span>
            <span className="text-cyan-400 font-black">+{analysis.totalBonusHp} HP</span>
          </div>

          {onAutoFillOptimalSynergy && (
            <button
              onClick={onAutoFillOptimalSynergy}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] rounded-xs border border-amber-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs"
              title={language === 'ko' ? '보유 카드 중 가장 강력한 속성 시너지 덱을 자동으로 편성합니다.' : 'Automatically builds the highest synergy deck from your inventory.'}
            >
              <Wand2 size={12} />
              <span>{language === 'ko' ? '1탭 시너지 추천' : 'Auto Synergy Deck'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Synergy Badges */}
      {analysis.activeSynergies.length === 0 ? (
        <div className="py-2 text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-slate-500" />
          <span>
            {language === 'ko'
              ? '동일 속성 카드를 2장 이상 배치하면 고유 세트 결속 보너스가 점등됩니다.'
              : 'Place 2 or more cards of the same element to trigger set synergy bonuses.'}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {analysis.activeSynergies.map((syn) => (
            <div
              key={syn.element}
              className={`p-2 rounded-xs border flex items-center justify-between gap-2 shadow-xs transition-all ${syn.badgeStyle}`}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black">
                    {language === 'ko' ? syn.nameKo : syn.nameEn}
                  </span>
                  <span className="text-[9px] font-black px-1 rounded-xs bg-black/40 border border-white/20">
                    {syn.count} CARDS
                  </span>
                </div>
                <span className="text-[9px] text-white/80 mt-0.5">
                  {language === 'ko' ? syn.descriptionKo : syn.descriptionEn}
                </span>
              </div>
              <Zap size={14} className="shrink-0 text-amber-300 animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
