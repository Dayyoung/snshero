/**
 * ElementalTempestWidget.tsx
 * 미니게임 보스 전리품 연계 3x3 전장 원소 폭풍 연쇄 스펠 위젯 (RSI-024)
 * DESIGN.md: 100% font-mono, 0px frame, 4px buttons, 1px border, zero gradient, [—] minimal collapse toggle, 44px+ touch targets
 */

import React, { useState, useEffect } from 'react';
import { Flame, Droplets, Shield, Wind, Sparkles, ChevronDown, ChevronUp, Zap, Check } from 'lucide-react';
import {
  getElementalCores,
  TEMPEST_SPELLS,
  TempestSpellInfo,
  castTempestSpell,
  ElementalCoreInventory
} from '../../utils/elementalTempestStore';
import { triggerHaptic } from '../../lib/haptic';

interface ElementalTempestWidgetProps {
  onCastSpell?: (spell: TempestSpellInfo) => void;
  language?: string;
  isBattleActive?: boolean;
}

export const ElementalTempestWidget: React.FC<ElementalTempestWidgetProps> = ({
  onCastSpell,
  language = 'ko',
  isBattleActive = true
}) => {
  const [cores, setCores] = useState<ElementalCoreInventory>(getElementalCores());
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true); // 기본 접힘 (사용자 시야 확보)
  const [activeSpellFeedback, setActiveSpellFeedback] = useState<string | null>(null);

  const isKo = language === 'ko';

  useEffect(() => {
    setCores(getElementalCores());
  }, []);

  const handleCast = (spell: TempestSpellInfo) => {
    triggerHaptic('heavy');
    const success = castTempestSpell(spell);
    if (success) {
      setCores(getElementalCores());
      setActiveSpellFeedback(spell.type);
      if (onCastSpell) {
        onCastSpell(spell);
      }
      setTimeout(() => setActiveSpellFeedback(null), 2500);
    }
  };

  // 배틀 중이 아니면 렌더링 생략
  if (!isBattleActive) return null;

  return (
    <aside
      aria-label="Elemental Tempest Tactical Dock"
      className="fixed bottom-20 left-3 z-[9000] font-mono select-none"
    >
      <div className="bg-[#fdfcfc] dark:bg-[#181616] border border-[#201d1d]/20 dark:border-white/20 rounded-none text-[#201d1d] dark:text-[#fdfcfc] w-[270px] sm:w-[290px] overflow-hidden">
        {/* Header Bar with Minimize Toggle */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#201d1d]/5 dark:bg-white/5 border-b border-[#201d1d]/10 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-amber-500" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              {isKo ? '원소 폭풍 연쇄 스펠' : 'TEMPEST SPELL'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Core Summary */}
            <div className="flex items-center gap-1 text-[9px] font-bold text-stone-600 dark:text-stone-400 mr-1">
              <span className="text-red-500">F:{cores.flameCores}</span>
              <span className="text-blue-500">W:{cores.waterCores}</span>
            </div>

            <button
              onClick={() => {
                triggerHaptic('tap');
                setIsCollapsed(prev => !prev);
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1 hover:bg-[#201d1d]/10 dark:hover:bg-white/10 text-xs font-bold cursor-pointer"
              title={isCollapsed ? '펼치기' : '접기'}
            >
              {isCollapsed ? '[+]' : '[—]'}
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {activeSpellFeedback && (
          <div className="px-3 py-1.5 bg-amber-500 text-stone-950 text-[10px] font-black flex items-center gap-1 border-b border-amber-600">
            <Check size={12} />
            <span>{isKo ? '원소 폭풍 연쇄 발동 성공!' : 'Tempest Spell Activated!'}</span>
          </div>
        )}

        {/* Body (Expanded View) */}
        {!isCollapsed && (
          <div className="p-2.5 space-y-2">
            {/* Core Inventory Bar */}
            <div className="grid grid-cols-4 gap-1 p-1.5 bg-[#201d1d]/5 dark:bg-white/5 border border-[#201d1d]/10 dark:border-white/10 text-center text-[10px]">
              <div>
                <span className="text-[9px] text-red-500 font-bold flex items-center justify-center gap-0.5">
                  <Flame size={10} /> FIRE
                </span>
                <span className="font-black text-xs">{cores.flameCores}</span>
              </div>
              <div>
                <span className="text-[9px] text-blue-500 font-bold flex items-center justify-center gap-0.5">
                  <Droplets size={10} /> WATER
                </span>
                <span className="font-black text-xs">{cores.waterCores}</span>
              </div>
              <div>
                <span className="text-[9px] text-amber-600 font-bold flex items-center justify-center gap-0.5">
                  <Shield size={10} /> EARTH
                </span>
                <span className="font-black text-xs">{cores.earthCores}</span>
              </div>
              <div>
                <span className="text-[9px] text-emerald-500 font-bold flex items-center justify-center gap-0.5">
                  <Wind size={10} /> WIND
                </span>
                <span className="font-black text-xs">{cores.windCores}</span>
              </div>
            </div>

            {/* Spell List */}
            <div className="space-y-1.5">
              {TEMPEST_SPELLS.map(spell => {
                const canCast =
                  (spell.costElement === 'FIRE' && cores.flameCores >= spell.costAmount) ||
                  (spell.costElement === 'WATER' && cores.waterCores >= spell.costAmount) ||
                  (spell.costElement === 'EARTH' && cores.earthCores >= spell.costAmount) ||
                  (spell.costElement === 'WIND' && cores.windCores >= spell.costAmount);

                return (
                  <div
                    key={spell.type}
                    className="p-1.5 border border-[#201d1d]/10 dark:border-white/10 bg-[#201d1d]/5 dark:bg-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="pr-1 overflow-hidden">
                      <div className="font-bold text-[10px] truncate">
                        {isKo ? spell.nameKo : spell.nameEn}
                      </div>
                      <div className="text-[8px] opacity-75 truncate">
                        {isKo ? spell.effectKo : spell.effectEn}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCast(spell)}
                      disabled={!canCast}
                      className={`min-h-[44px] px-2.5 py-1 text-[10px] font-black rounded-sm border cursor-pointer active:scale-95 flex items-center gap-1 shrink-0 ${
                        canCast
                          ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-600'
                          : 'bg-stone-300 dark:bg-stone-800 text-stone-500 border-stone-400 dark:border-stone-700 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles size={11} />
                      <span>{isKo ? '격발' : 'CAST'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="text-[8px] text-stone-500 text-center">
              {isKo ? '* 미니게임 보스 처치 시 원소 핵 획득' : '* Defeat mini-game bosses to loot cores'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
